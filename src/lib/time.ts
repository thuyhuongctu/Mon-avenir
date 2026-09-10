export const TZ = "Asia/Ho_Chi_Minh";

const WEEKDAY_FULL = [
  "Chủ nhật",
  "Thứ hai",
  "Thứ ba",
  "Thứ tư",
  "Thứ năm",
  "Thứ sáu",
  "Thứ bảy",
] as const;

const WEEKDAY_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"] as const;

const MONTHS = [
  "tháng 1",
  "tháng 2",
  "tháng 3",
  "tháng 4",
  "tháng 5",
  "tháng 6",
  "tháng 7",
  "tháng 8",
  "tháng 9",
  "tháng 10",
  "tháng 11",
  "tháng 12",
] as const;

export function parseMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Ngày dương lịch tại Việt Nam theo dạng YYYY-MM-DD. */
export function dateKey(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function vnTime(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export function splitISO(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}

export function addDaysISO(iso: string, n: number): string {
  const { y, m, d } = splitISO(iso);
  const utc = Date.UTC(y, m - 1, d + n);
  const dt = new Date(utc);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function weekdayIndexISO(iso: string): number {
  const { y, m, d } = splitISO(iso);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function weekdayFull(iso: string): string {
  return WEEKDAY_FULL[weekdayIndexISO(iso)];
}

export function weekdayShort(iso: string): string {
  return WEEKDAY_SHORT[weekdayIndexISO(iso)];
}

export function prettyDate(iso: string, opts?: { weekday?: boolean }): string {
  const { d, m } = splitISO(iso);
  const wd = weekdayFull(iso);
  if (opts?.weekday === false) return `${d} ${MONTHS[m - 1]}`;
  return `${wd}, ${d} ${MONTHS[m - 1]}`;
}

export function prettyDateLong(iso: string): string {
  const { y, m, d } = splitISO(iso);
  return `${weekdayFull(iso)}, ${d} ${MONTHS[m - 1]} ${y}`;
}

export function mondayOf(iso: string): string {
  const wd = weekdayIndexISO(iso);
  const offset = wd === 0 ? -6 : 1 - wd;
  return addDaysISO(iso, offset);
}

export function compareISO(a: string, b: string): number {
  return a.localeCompare(b);
}

export function minutesNow(d: Date = new Date()): number {
  return parseMinutes(vnTime(d));
}

export function greeting(d: Date = new Date()): string {
  const h = Math.floor(minutesNow(d) / 60);
  if (h < 11) return "Chào buổi sáng";
  if (h < 13) return "Chào buổi trưa";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

export function formatDuration(mins: number): string {
  if (mins < 1) return "vài giây";
  if (mins < 60) return `${mins} phút`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0) return `${h} giờ`;
  return `${h} giờ ${m} phút`;
}

export function rangeLabel(start: string, end: string): string {
  return `${start.replace(":", "g")} – ${end.replace(":", "g")}`;
}
