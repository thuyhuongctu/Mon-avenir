import {
  CTU_PERIODS,
  type CampusId,
  type Course,
  type Role,
  type SessionKind,
  type Slot,
} from "./schedule-data";
import { addDaysISO, formatMinutes, parseMinutes } from "./time";

/** Một lần nhập lịch từ file, lưu trong store. */
export type ImportedSchedule = {
  id: string;
  name: string;
  campus: CampusId;
  importedAt: string;
  courses: Course[];
  slots: Slot[];
};

/** Cách hiểu cột "Tuần" trong CSV. */
export type WeekMode =
  /** Tuần học: tuần 1 bắt đầu thứ Hai `week1` (kiểu TKB CTU). */
  | { kind: "school"; week1: string }
  /** Tuần trong năm theo ISO (kiểu TKB VLUTE: 38, 39, … 52, 53, 1, 2). */
  | { kind: "iso"; startYear: number };

export type ImportOptions = {
  campus: CampusId;
  role: Role;
  weekMode: WeekMode;
};

export type ParseResult = {
  courses: Course[];
  slots: Slot[];
  errors: string[];
  warnings: string[];
};

/**
 * Khung giờ tiết VLUTE suy từ TKB (tiết 1–2 = 07:00–08:20, tiết 1–3 = 07:00–09:20,
 * tiết 11 = 18:30–19:10). Tiết khác cần ghi giờ ở cột Bắt đầu/Kết thúc.
 */
const VLUTE_PERIODS: Record<number, { start: string; end: string }> = {
  1: { start: "07:00", end: "07:40" },
  2: { start: "07:40", end: "08:20" },
  3: { start: "08:40", end: "09:20" },
  11: { start: "18:30", end: "19:10" },
};

const PERIODS: Record<CampusId, Record<number, { start: string; end: string }>> = {
  ctu: CTU_PERIODS,
  vlute: VLUTE_PERIODS,
};

/** Năm bắt đầu năm học chứa ngày hôm nay (tháng 7 trở đi tính là năm học mới). */
export function academicStartYear(today: string): number {
  const [y, m] = today.split("-").map(Number);
  return m >= 7 ? y : y - 1;
}

const pad = (n: number) => String(n).padStart(2, "0");

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slug(s: string) {
  return normalize(s).replace(/ /g, "-").slice(0, 40) || "hp";
}

/* ---------------- CSV ---------------- */

function parseCsv(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, "");
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? "";
  const delim = [",", ";", "\t"]
    .map((d) => [d, firstLine.split(d).length] as const)
    .sort((a, b) => b[1] - a[1])[0][0];
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (quoted) {
      if (ch === '"' && clean[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && clean[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  row.push(cell);
  rows.push(row);
  return rows
    .map((r) => r.map((c) => c.trim()))
    .filter((r) => r.some((c) => c !== ""));
}

type Field =
  | "code"
  | "name"
  | "group"
  | "className"
  | "students"
  | "weekday"
  | "periods"
  | "start"
  | "end"
  | "room"
  | "weeks"
  | "dates"
  | "kind";

const ALIASES: Record<Field, string[]> = {
  code: ["ma hp", "ma hoc phan", "ma mon", "ma mon hoc", "code"],
  name: ["ten hoc phan", "ten hp", "ten mon", "ten mon hoc", "hoc phan", "mon hoc", "name"],
  group: ["nhom", "ma nh", "ma nhom", "nhom hoc", "group"],
  className: ["lop", "ma lop", "lop hoc phan", "class"],
  students: ["si so", "so sv", "so sinh vien", "students"],
  weekday: ["thu", "ngay trong tuan", "weekday", "day"],
  periods: ["tiet", "tiet hoc", "periods"],
  start: ["bat dau", "gio bat dau", "tu gio", "start"],
  end: ["ket thuc", "gio ket thuc", "den gio", "end"],
  room: ["phong", "ten phong", "phong hoc", "room"],
  weeks: ["tuan", "tuan hoc", "tuan day", "weeks"],
  dates: ["ngay", "cac ngay", "ngay hoc", "ngay day", "dates"],
  kind: ["loai", "hinh thuc", "kind", "type"],
};

function mapHeader(header: string[]): Partial<Record<Field, number>> {
  const out: Partial<Record<Field, number>> = {};
  header.forEach((h, i) => {
    const n = normalize(h);
    for (const [field, names] of Object.entries(ALIASES) as [Field, string[]][]) {
      if (out[field] === undefined && names.includes(n)) out[field] = i;
    }
  });
  return out;
}

function parseWeekday(raw: string): number | undefined {
  const n = normalize(raw);
  if (!n) return undefined;
  if (n.includes("cn") || n.includes("chu nhat") || n === "8") return 0;
  const d = n.match(/\d/);
  if (d) {
    const v = Number(d[0]);
    if (v >= 2 && v <= 7) return v - 1;
  }
  const words = ["hai", "ba", "tu", "nam", "sau", "bay"];
  const idx = words.findIndex((w) => n.split(" ").includes(w));
  return idx >= 0 ? idx + 1 : undefined;
}

/** "1-12", "1,5,9", "38-39-40-41", "52-53-1-2-3", "1-3, 6-8". */
function parseNumberList(raw: string): number[] {
  const out: number[] = [];
  for (const part of raw.split(/[,;/\s]+/).filter(Boolean)) {
    const nums = part.split(/[-–]/).map((x) => Number(x)).filter((x) => Number.isFinite(x));
    if (nums.length === 2 && nums[1] > nums[0] + 1) {
      for (let v = nums[0]; v <= nums[1]; v++) out.push(v);
    } else out.push(...nums);
  }
  return out;
}

function parseTime(raw: string): string | undefined {
  const m = raw.match(/(\d{1,2})\s*[:hg]\s*(\d{2})?/i);
  if (!m) return undefined;
  const h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  if (h > 23 || min > 59) return undefined;
  return `${pad(h)}:${pad(min)}`;
}

/** "16/09", "16/09/2026", "2026-09-16"; năm thiếu thì suy theo năm học. */
function parseDates(raw: string, startYear: number): string[] {
  const out: string[] = [];
  for (const m of raw.matchAll(/(\d{4})-(\d{1,2})-(\d{1,2})/g)) {
    out.push(`${m[1]}-${pad(Number(m[2]))}-${pad(Number(m[3]))}`);
  }
  for (const m of raw.matchAll(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/g)) {
    const d = Number(m[1]);
    const mo = Number(m[2]);
    let y = m[3] ? Number(m[3]) : mo >= 7 ? startYear : startYear + 1;
    if (y < 100) y += 2000;
    if (d >= 1 && d <= 31 && mo >= 1 && mo <= 12) out.push(`${y}-${pad(mo)}-${pad(d)}`);
  }
  return [...new Set(out)].sort();
}

/** Thứ Hai của tuần ISO `week` trong năm `year`. */
function isoWeekMonday(year: number, week: number): string {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dow = jan4.getUTCDay() || 7;
  const monday1 = new Date(Date.UTC(year, 0, 4 - (dow - 1)));
  const iso = monday1.toISOString().slice(0, 10);
  return addDaysISO(iso, (week - 1) * 7);
}

function weekToDate(week: number, weekday: number, mode: WeekMode): string {
  const offset = weekday === 0 ? 6 : weekday - 1;
  if (mode.kind === "school") {
    return addDaysISO(mode.week1, (week - 1) * 7 + offset);
  }
  const year = week >= 30 ? mode.startYear : mode.startYear + 1;
  return addDaysISO(isoWeekMonday(year, week), offset);
}

function guessKind(kindRaw: string, room: string, code: string): SessionKind {
  const k = normalize(`${kindRaw} ${room} ${code}`);
  if (/online|truc tuyen|e learning|elearning/.test(k)) return "online";
  if (/khoa luan|huong dan|thuc tap|ngoai ?gio/.test(k)) return "thesis";
  if (/\bbt\b|bai tap|thuc hanh|\bth\b/.test(k)) return "practice";
  return "lecture";
}

function modeFor(kind: SessionKind): Slot["mode"] {
  if (kind === "online") return "online";
  if (kind === "thesis") return "consult";
  return "offline";
}

function periodTimes(periods: number[], campus: CampusId) {
  const table = PERIODS[campus];
  const first = table[periods[0]];
  const last = table[periods[periods.length - 1]];
  if (!first || !last) return undefined;
  return { start: first.start, end: last.end };
}

type Builder = {
  courses: Map<string, Course>;
  slots: Map<string, Slot>;
};

function addSession(
  b: Builder,
  importId: string,
  opts: ImportOptions,
  s: {
    code: string;
    name: string;
    groupCode: string;
    groupLabel: string;
    students: number;
    weekday: number;
    periods: number[];
    start: string;
    end: string;
    room: string;
    kind: SessionKind;
    dates: string[];
  },
) {
  const courseId = `imp-${importId}-${slug(s.code || s.name)}`;
  if (!b.courses.has(courseId)) {
    b.courses.set(courseId, {
      id: courseId,
      campus: opts.campus,
      code: s.code || s.name.slice(0, 12),
      name: s.name || s.code,
      role: opts.role,
    });
  }
  const key = [courseId, s.groupCode, s.weekday, s.start, s.end, s.room].join("|");
  const existing = b.slots.get(key);
  if (existing) {
    existing.dates = [...new Set([...(existing.dates ?? []), ...s.dates])].sort();
    return;
  }
  b.slots.set(key, {
    id: `imp-${importId}-${b.slots.size + 1}`,
    courseId,
    groupCode: s.groupCode || s.code,
    groupLabel: s.groupLabel,
    students: s.students,
    kind: s.kind,
    weekday: s.weekday,
    periods: s.periods,
    start: s.start,
    end: s.end,
    room: s.room || "—",
    mode: modeFor(s.kind),
    dates: [...s.dates].sort(),
  });
}

function parseCsvSchedule(text: string, importId: string, opts: ImportOptions): ParseResult {
  const rows = parseCsv(text);
  const errors: string[] = [];
  const warnings: string[] = [];
  const b: Builder = { courses: new Map(), slots: new Map() };
  if (rows.length < 2) {
    return { courses: [], slots: [], errors: ["File không có dòng dữ liệu nào."], warnings };
  }
  const col = mapHeader(rows[0]);
  if (col.code === undefined && col.name === undefined) {
    errors.push("Không thấy cột “Mã HP” hoặc “Tên học phần” ở dòng tiêu đề.");
    return { courses: [], slots: [], errors, warnings };
  }
  const startYear =
    opts.weekMode.kind === "iso"
      ? opts.weekMode.startYear
      : academicStartYear(opts.weekMode.week1);
  const get = (r: string[], f: Field) => (col[f] === undefined ? "" : (r[col[f]!] ?? ""));

  rows.slice(1).forEach((r, i) => {
    const line = i + 2;
    const code = get(r, "code");
    const name = get(r, "name");
    if (!code && !name) return;
    const periods = parseNumberList(get(r, "periods"));
    let start = parseTime(get(r, "start"));
    let end = parseTime(get(r, "end"));
    if ((!start || !end) && periods.length) {
      const t = periodTimes(periods, opts.campus);
      start ??= t?.start;
      end ??= t?.end;
    }
    if (!start || !end) {
      errors.push(`Dòng ${line} (${code || name}): thiếu giờ — ghi cột Bắt đầu/Kết thúc hoặc Tiết.`);
      return;
    }
    if (parseMinutes(end) <= parseMinutes(start)) {
      errors.push(`Dòng ${line} (${code || name}): giờ kết thúc phải sau giờ bắt đầu.`);
      return;
    }
    let dates = parseDates(get(r, "dates"), startYear);
    const weekday = parseWeekday(get(r, "weekday"));
    if (!dates.length) {
      const weeks = parseNumberList(get(r, "weeks"));
      if (weekday === undefined || !weeks.length) {
        errors.push(`Dòng ${line} (${code || name}): cần cột Ngày, hoặc Thứ + Tuần.`);
        return;
      }
      dates = weeks.map((w) => weekToDate(w, weekday!, opts.weekMode));
    }
    const room = get(r, "room");
    const group = get(r, "group");
    const className = get(r, "className");
    const students = Number(get(r, "students").replace(/\D/g, "")) || 0;
    const kind = guessKind(get(r, "kind"), room, `${code} ${group} ${className}`);
    const groupCode = className || group || code;
    const labelHead = group && className ? `Nhóm ${group}` : groupCode;
    // Mỗi ngày có thể khác thứ (cột Ngày) → tách theo thứ thực tế.
    const byWeekday = new Map<number, string[]>();
    for (const d of dates) {
      const wd = new Date(`${d}T00:00:00Z`).getUTCDay();
      byWeekday.set(wd, [...(byWeekday.get(wd) ?? []), d]);
    }
    if (weekday !== undefined && byWeekday.size === 1 && !byWeekday.has(weekday)) {
      warnings.push(`Dòng ${line} (${code || name}): cột Thứ không khớp với ngày — dùng theo ngày.`);
    }
    for (const [wd, ds] of byWeekday) {
      addSession(b, importId, opts, {
        code,
        name,
        groupCode,
        groupLabel: students ? `${labelHead} · ${students} SV` : labelHead,
        students,
        weekday: wd,
        periods,
        start,
        end,
        room,
        kind,
        dates: ds,
      });
    }
  });

  return { courses: [...b.courses.values()], slots: [...b.slots.values()], errors, warnings };
}

/* ---------------- iCalendar ---------------- */

type IcsProp = { value: string; params: Record<string, string> };

function unescapeIcs(v: string) {
  return v.replace(/\\n/gi, "\n").replace(/\\([,;\\])/g, "$1");
}

/** DTSTART → {date, time} theo giờ Việt Nam (UTC+7). */
function icsDateTime(p: IcsProp): { date: string; time?: string } | undefined {
  const m = p.value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/);
  if (!m) return undefined;
  const date = `${m[1]}-${m[2]}-${m[3]}`;
  if (!m[4]) return { date };
  let mins = Number(m[4]) * 60 + Number(m[5]);
  let d = date;
  if (m[7]) {
    mins += 7 * 60;
    if (mins >= 24 * 60) {
      mins -= 24 * 60;
      d = addDaysISO(date, 1);
    }
  }
  return { date: d, time: formatMinutes(mins) };
}

function parseIcsSchedule(text: string, importId: string, opts: ImportOptions): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const b: Builder = { courses: new Map(), slots: new Map() };
  const lines = text.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
  const events: Record<string, IcsProp>[] = [];
  let cur: Record<string, IcsProp> | null = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") cur = {};
    else if (line === "END:VEVENT") {
      if (cur) events.push(cur);
      cur = null;
    } else if (cur) {
      const idx = line.indexOf(":");
      if (idx < 0) continue;
      const [nameRaw, ...paramParts] = line.slice(0, idx).split(";");
      const params: Record<string, string> = {};
      for (const pp of paramParts) {
        const [k, v] = pp.split("=");
        if (k) params[k.toUpperCase()] = v ?? "";
      }
      const name = nameRaw.toUpperCase();
      if (!cur[name]) cur[name] = { value: line.slice(idx + 1), params };
    }
  }
  if (!events.length) {
    return { courses: [], slots: [], errors: ["Không tìm thấy sự kiện (VEVENT) nào trong file."], warnings };
  }

  let skippedAllDay = 0;
  for (const ev of events) {
    const summary = unescapeIcs(ev.SUMMARY?.value ?? "").trim();
    if (!summary || summary.startsWith("☐")) continue; // việc cần làm do app xuất
    const s = ev.DTSTART && icsDateTime(ev.DTSTART);
    const e = ev.DTEND && icsDateTime(ev.DTEND);
    if (!s?.time) {
      skippedAllDay++;
      continue;
    }
    const start = s.time;
    const end = e?.time ?? formatMinutes(parseMinutes(start) + 90);

    let dates = [s.date];
    const rrule = ev.RRULE?.value;
    if (rrule) {
      const r = Object.fromEntries(rrule.split(";").map((kv) => kv.split("=")));
      if (r.FREQ === "WEEKLY") {
        const step = 7 * (Number(r.INTERVAL) || 1);
        const until = r.UNTIL ? icsDateTime({ value: r.UNTIL, params: {} })?.date : undefined;
        const count = Number(r.COUNT) || (until ? 200 : 16);
        dates = [];
        for (let i = 0, d = s.date; i < count; i++, d = addDaysISO(d, step)) {
          if (until && d > until) break;
          dates.push(d);
        }
      } else {
        warnings.push(`“${summary}”: chỉ hỗ trợ lặp hằng tuần — lấy buổi đầu tiên.`);
      }
    }
    const exdates = new Set(
      (ev.EXDATE?.value ?? "")
        .split(",")
        .map((v) => icsDateTime({ value: v.trim(), params: {} })?.date)
        .filter(Boolean),
    );
    dates = dates.filter((d) => !exdates.has(d));

    // "KT338 · Đầu tư quốc tế (CTU)" hoặc "KT338 - Đầu tư quốc tế"
    const cleaned = summary.replace(/\s*\((CTU|VLUTE)\)\s*$/i, "");
    const m = cleaned.match(/^([A-Z]{1,4}\d{2,5}[A-Z]?)\s*[·\-–:|]?\s*(.*)$/);
    const code = m?.[1] ?? "";
    const name = (m?.[2] || cleaned).trim();
    const desc = unescapeIcs(ev.DESCRIPTION?.value ?? "");
    const groupMatch = desc.match(/Nhóm:\s*(\S+)/);
    const room = unescapeIcs(ev.LOCATION?.value ?? "").split(" · ")[0];
    const kind = guessKind(desc, room, summary);
    const wd = new Date(`${s.date}T00:00:00Z`).getUTCDay();
    addSession(b, importId, opts, {
      code,
      name,
      groupCode: groupMatch?.[1] ?? code ?? name,
      groupLabel: groupMatch?.[1] ?? (code || name),
      students: Number(desc.match(/(\d+)\s*SV/)?.[1] ?? 0),
      weekday: wd,
      periods: [],
      start,
      end,
      room,
      kind,
      dates,
    });
  }
  if (skippedAllDay) warnings.push(`Bỏ qua ${skippedAllDay} sự kiện cả ngày (không có giờ).`);
  return { courses: [...b.courses.values()], slots: [...b.slots.values()], errors, warnings };
}

export function parseScheduleFile(
  fileName: string,
  text: string,
  importId: string,
  opts: ImportOptions,
): ParseResult {
  const isIcs = /\.ics$/i.test(fileName) || /BEGIN:VCALENDAR/.test(text.slice(0, 200));
  return isIcs
    ? parseIcsSchedule(text, importId, opts)
    : parseCsvSchedule(text, importId, opts);
}

export const CSV_TEMPLATE =
  "\uFEFF" +
  [
    "Mã HP,Tên học phần,Nhóm,Lớp,Sĩ số,Thứ,Tiết,Bắt đầu,Kết thúc,Phòng,Tuần,Ngày,Loại",
    "KT338,Đầu tư quốc tế,01,KT33801,26,3,1-3,,,301/MT,1-12,,Lý thuyết",
    "KT330H,Khởi sự doanh nghiệp,M01,KT2322F1,37,5,1-3,,,103/KT,\"1,2,3,4,5,6,7,8,9,10,11,12\",,",
    "EC1606,Khởi sự doanh nghiệp,1,261a_EC1606_1_online,84,4,1-2,07:00,08:20,E-LEARNING - 01,,\"16/09/2026, 23/09/2026, 30/09/2026\",Online",
  ].join("\r\n") +
  "\r\n";
