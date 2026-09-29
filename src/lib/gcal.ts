import { LECTURER } from "./schedule-data";
import { campusOf, kindLabel, roleLabel, type Occurrence } from "./schedule";
import type { Todo } from "./store";
import { addDaysISO, formatMinutes, parseMinutes, rangeLabel, TZ } from "./time";

/** Nhắc trước buổi dạy (phút). */
export const SESSION_REMINDER_MIN = 30;
/** Việc không có giờ: nhắc lúc 07:00 sáng hôm đó. */
const ALL_DAY_REMINDER = "07:00";
const TODO_DURATION_MIN = 30;

const compact = (date: string) => date.replace(/-/g, "");
const stamp = (date: string, hhmm: string) =>
  `${compact(date)}T${hhmm.replace(":", "")}00`;

type EventInput = {
  title: string;
  date: string;
  start?: string;
  end?: string;
  details?: string;
  location?: string;
};

/**
 * Link "tạo sự kiện" của Google Calendar, mở sẵn trên tài khoản
 * {@link LECTURER.calendarEmail}. Không cần OAuth: người dùng chỉ bấm Lưu.
 */
export function gcalUrl(ev: EventInput): string {
  const dates = ev.start
    ? `${stamp(ev.date, ev.start)}/${stamp(ev.date, ev.end ?? ev.start)}`
    : `${compact(ev.date)}/${compact(addDaysISO(ev.date, 1))}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.title,
    dates,
    ctz: TZ,
    authuser: LECTURER.calendarEmail,
  });
  if (ev.details) params.set("details", ev.details);
  if (ev.location) params.set("location", ev.location);
  return `https://calendar.google.com/calendar/render?${params}`;
}

/** Trang nhập lịch (Cài đặt → Nhập & xuất) của tài khoản VLUTE. */
export const GCAL_IMPORT_URL = `https://calendar.google.com/calendar/r/settings/export?authuser=${encodeURIComponent(LECTURER.calendarEmail)}`;

function sessionTitle(occ: Occurrence) {
  return `${occ.code} · ${occ.name} (${campusOf(occ.campus).short})`;
}

function sessionDetails(occ: Occurrence, note?: string) {
  const lines = [
    `${roleLabel(occ.role)} · ${kindLabel(occ.kind)} · ${occ.groupLabel}`,
    `Nhóm: ${occ.groupCode}`,
    `Giờ: ${rangeLabel(occ.start, occ.end)}`,
  ];
  if (occ.week != null) lines.push(`Tuần ${occ.week}`);
  if (note?.trim()) lines.push("", "Ghi chú:", note.trim());
  return lines.join("\n");
}

function sessionLocation(occ: Occurrence) {
  return occ.roomNote ? `${occ.room} · ${occ.roomNote}` : occ.room;
}

export function sessionGcalUrl(occ: Occurrence, note?: string) {
  return gcalUrl({
    title: sessionTitle(occ),
    date: occ.date,
    start: occ.start,
    end: occ.end,
    details: sessionDetails(occ, note),
    location: sessionLocation(occ),
  });
}

function todoEnd(time: string) {
  return formatMinutes(Math.min(parseMinutes(time) + TODO_DURATION_MIN, 23 * 60 + 59));
}

export function todoGcalUrl(date: string, todo: Todo) {
  return gcalUrl({
    title: todo.text,
    date,
    start: todo.time,
    end: todo.time ? todoEnd(todo.time) : undefined,
    details: todo.note?.trim() || undefined,
  });
}

/* ---------- iCalendar (.ics) ---------- */

function esc(text: string) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Gấp dòng ≤ 75 byte UTF-8 theo RFC 5545. */
function fold(line: string) {
  const enc = new TextEncoder();
  const out: string[] = [];
  let cur = "";
  let bytes = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    const limit = out.length === 0 ? 75 : 74;
    if (bytes + n > limit) {
      out.push(cur);
      cur = "";
      bytes = 0;
    }
    cur += ch;
    bytes += n;
  }
  out.push(cur);
  return out.join("\r\n ");
}

function alarm(trigger: string, text: string) {
  return [
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(text)}`,
    `TRIGGER${trigger}`,
    "END:VALARM",
  ];
}

export function buildIcs(
  sessions: Occurrence[],
  todos: Record<string, Todo[]>,
  sessionNotes: Record<string, string>,
  fromDate: string,
): string {
  const now = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Mon Avenir//Lich giang//VI",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Mon Avenir",
    `X-WR-TIMEZONE:${TZ}`,
    "BEGIN:VTIMEZONE",
    `TZID:${TZ}`,
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:+0700",
    "TZOFFSETTO:+0700",
    "TZNAME:+07",
    "END:STANDARD",
    "END:VTIMEZONE",
  ];

  for (const occ of sessions) {
    if (occ.date < fromDate) continue;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${occ.id}@mon-avenir`,
      `DTSTAMP:${now}`,
      `DTSTART;TZID=${TZ}:${stamp(occ.date, occ.start)}`,
      `DTEND;TZID=${TZ}:${stamp(occ.date, occ.end)}`,
      `SUMMARY:${esc(sessionTitle(occ))}`,
      `LOCATION:${esc(sessionLocation(occ))}`,
      `DESCRIPTION:${esc(sessionDetails(occ, sessionNotes[occ.id]))}`,
      ...alarm(`:-PT${SESSION_REMINDER_MIN}M`, sessionTitle(occ)),
      "END:VEVENT",
    );
  }

  for (const [date, list] of Object.entries(todos)) {
    if (date < fromDate) continue;
    for (const todo of list) {
      if (todo.done) continue;
      const when = todo.time
        ? [
            `DTSTART;TZID=${TZ}:${stamp(date, todo.time)}`,
            `DTEND;TZID=${TZ}:${stamp(date, todoEnd(todo.time))}`,
          ]
        : [
            `DTSTART;VALUE=DATE:${compact(date)}`,
            `DTEND;VALUE=DATE:${compact(addDaysISO(date, 1))}`,
          ];
      const trigger = todo.time
        ? ":PT0M"
        : `;RELATED=START:PT${ALL_DAY_REMINDER.slice(0, 2)}H`;
      lines.push(
        "BEGIN:VEVENT",
        `UID:todo-${todo.id}@mon-avenir`,
        `DTSTAMP:${now}`,
        ...when,
        `SUMMARY:${esc(`☐ ${todo.text}`)}`,
        ...(todo.note?.trim() ? [`DESCRIPTION:${esc(todo.note.trim())}`] : []),
        ...alarm(trigger, todo.text),
        "END:VEVENT",
      );
    }
  }

  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

/** Tải hoặc chia sẻ file .ics (Android WebView không hỗ trợ tải blob). */
export function saveIcs(content: string, filename: string) {
  return saveFile(content, filename, "text/calendar");
}

export async function saveFile(content: string, filename: string, type: string) {
  const file = new File([content], filename, { type });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return;
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") return;
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
