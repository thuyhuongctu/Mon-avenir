import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { ALL_OCCURRENCES, campusOf } from "./schedule";
import type { Todo } from "./store";
import { addDaysISO, formatMinutes, parseMinutes, weekdayFull } from "./time";

export type NotifySettings = {
  enabled: boolean;
  /** Nhắc trước giờ dạy (phút). */
  leadMin: number;
  /** Tóm tắt lịch trong ngày vào buổi sáng. */
  morning: boolean;
  morningTime: string;
  /** Nhắc việc cần làm có đặt giờ. */
  todos: boolean;
};

export const DEFAULT_NOTIFY: NotifySettings = {
  enabled: false,
  leadMin: 15,
  morning: true,
  morningTime: "06:30",
  todos: true,
};

export type Reminder = {
  id: number;
  at: Date;
  title: string;
  body: string;
};

/** Số ngày tới được hẹn trước (app mở lại sẽ hẹn tiếp). */
const HORIZON_DAYS = 14;
const MAX_NATIVE = 120;

export const isNative = () => Capacitor.isNativePlatform();

/** id số nguyên dương ổn định từ chuỗi khóa. */
function hashId(key: string) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (Math.imul(31, h) + key.charCodeAt(i)) | 0;
  return (h & 0x7fffffff) || 1;
}

const vnDate = (date: string, hhmm: string) => new Date(`${date}T${hhmm}:00+07:00`);
const hm = (hhmm: string) => hhmm.replace(":", "g");
const firstLine = (s?: string) => s?.trim().split("\n")[0] ?? "";

export function buildReminders(
  now: Date,
  today: string,
  settings: NotifySettings,
  todos: Record<string, Todo[]>,
  sessionNotes: Record<string, string>,
): Reminder[] {
  if (!settings.enabled) return [];
  const until = addDaysISO(today, HORIZON_DAYS);
  const out: Reminder[] = [];
  const push = (key: string, at: Date, title: string, body: string) => {
    if (at.getTime() > now.getTime()) out.push({ id: hashId(key), at, title, body });
  };

  const sessions = ALL_OCCURRENCES.filter((o) => o.date >= today && o.date < until);

  for (const o of sessions) {
    const at = vnDate(o.date, formatMinutes(Math.max(0, parseMinutes(o.start) - settings.leadMin)));
    const note = firstLine(sessionNotes[o.id]);
    push(
      `s:${o.id}:${settings.leadMin}`,
      at,
      `${hm(o.start)} · ${o.code} (${campusOf(o.campus).short})`,
      [`${o.name} · ${o.room} · ${o.groupCode}`, note && `Ghi chú: ${note}`]
        .filter(Boolean)
        .join("\n"),
    );
  }

  if (settings.morning) {
    for (let i = 0; i < HORIZON_DAYS; i++) {
      const date = addDaysISO(today, i);
      const day = sessions.filter((o) => o.date === date);
      const open = (todos[date] ?? []).filter((t) => !t.done).length;
      if (!day.length && !open) continue;
      const lines = day.map((o) => `${hm(o.start)} ${o.code} · ${o.room}`);
      if (open) lines.push(`${open} việc cần làm`);
      push(
        `m:${date}:${settings.morningTime}`,
        vnDate(date, settings.morningTime),
        day.length
          ? `${weekdayFull(date)}: ${day.length} buổi dạy`
          : `${weekdayFull(date)}: không có lịch dạy`,
        lines.join("\n"),
      );
    }
  }

  if (settings.todos) {
    for (const [date, list] of Object.entries(todos)) {
      if (date < today || date >= until) continue;
      for (const t of list) {
        if (t.done || !t.time) continue;
        push(`t:${t.id}:${t.time}`, vnDate(date, t.time), `Việc lúc ${hm(t.time)}`, [t.text, firstLine(t.note)].filter(Boolean).join("\n"));
      }
    }
  }

  return out.sort((a, b) => a.at.getTime() - b.at.getTime());
}

/* ---------- Quyền ---------- */

export async function requestPermission(): Promise<boolean> {
  if (isNative()) {
    const res = await LocalNotifications.requestPermissions();
    return res.display === "granted";
  }
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  return (await Notification.requestPermission()) === "granted";
}

export async function permissionState(): Promise<"granted" | "denied" | "prompt" | "unsupported"> {
  if (isNative()) {
    const res = await LocalNotifications.checkPermissions();
    return res.display === "granted" ? "granted" : res.display === "denied" ? "denied" : "prompt";
  }
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission === "default" ? "prompt" : Notification.permission;
}

/** Android 12+: báo đúng phút cần quyền "báo thức chính xác". */
export async function exactAlarmGranted(): Promise<boolean> {
  if (!isNative() || Capacitor.getPlatform() !== "android") return true;
  try {
    return (await LocalNotifications.checkExactNotificationSetting()).exact_alarm === "granted";
  } catch {
    return true;
  }
}

export async function openExactAlarmSettings() {
  if (isNative()) await LocalNotifications.changeExactNotificationSetting();
}

/* ---------- Hẹn thông báo ---------- */

let channelReady = false;

async function ensureChannel() {
  if (!channelReady && Capacitor.getPlatform() === "android") {
    await LocalNotifications.createChannel({
      id: "lich-giang",
      name: "Lịch giảng & việc cần làm",
      description: "Nhắc giờ dạy, tóm tắt lịch trong ngày và việc có giờ",
      importance: 4,
      visibility: 1,
    });
    channelReady = true;
  }
}

/** Android: thay toàn bộ thông báo đã hẹn bằng danh sách mới. */
export async function syncNative(reminders: Reminder[]): Promise<number> {
  if (!isNative()) return 0;
  await ensureChannel();
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length) {
    await LocalNotifications.cancel({
      notifications: pending.notifications.map((n) => ({ id: n.id })),
    });
  }
  const list = reminders.slice(0, MAX_NATIVE);
  if (!list.length) return 0;
  await LocalNotifications.schedule({
    notifications: list.map((r) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      largeBody: r.body,
      channelId: "lich-giang",
      schedule: { at: r.at, allowWhileIdle: true },
    })),
  });
  return list.length;
}

/** Web: chỉ hiện được khi app đang mở. */
export function showWeb(r: Pick<Reminder, "title" | "body">) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const icon = `${import.meta.env.BASE_URL}brand/rong-hoc-gia.webp`;
  try {
    new Notification(r.title, { body: r.body, icon, badge: icon });
  } catch {
    // Chrome Android không cho new Notification() ngoài service worker.
  }
}

export async function sendTest() {
  const r = {
    id: 1,
    at: new Date(Date.now() + 5000),
    title: "Mon Avenir · thử thông báo",
    body: "Thông báo đã hoạt động. Rồng xanh sẽ nhắc cô trước giờ dạy.",
  };
  if (isNative()) {
    await ensureChannel();
    await LocalNotifications.schedule({
      notifications: [{ ...r, channelId: "lich-giang", schedule: { at: r.at, allowWhileIdle: true } }],
    });
  } else {
    setTimeout(() => showWeb(r), 5000);
  }
}
