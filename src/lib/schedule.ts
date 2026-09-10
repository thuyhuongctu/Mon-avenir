import {
  CAMPUSES,
  COURSES,
  CTU_WEEK1,
  KIND_LABEL,
  ROLE_LABEL,
  SLOTS,
  type CampusId,
  type Course,
  type SessionKind,
  type Slot,
} from "./schedule-data";
import { addDaysISO, compareISO, parseMinutes } from "./time";

export type Occurrence = {
  id: string;
  date: string;
  slotId: string;
  courseId: string;
  campus: CampusId;
  code: string;
  name: string;
  role: Course["role"];
  groupCode: string;
  groupLabel: string;
  students: number;
  kind: SessionKind;
  weekday: number;
  periods: number[];
  start: string;
  end: string;
  startMin: number;
  endMin: number;
  room: string;
  roomNote?: string;
  mode: Slot["mode"];
  week?: number;
};

const COURSE_MAP = Object.fromEntries(COURSES.map((c) => [c.id, c]));

function expandSlot(slot: Slot): Occurrence[] {
  const course = COURSE_MAP[slot.courseId];
  if (!course) return [];
  const dates: { date: string; week?: number }[] = [];
  if (slot.dates) {
    for (const date of slot.dates) dates.push({ date });
  } else if (slot.weeks) {
    const isoWeekday = slot.weekday === 0 ? 7 : slot.weekday;
    for (const week of slot.weeks) {
      const monday = addDaysISO(CTU_WEEK1, (week - 1) * 7);
      dates.push({ date: addDaysISO(monday, isoWeekday - 1), week });
    }
  }
  return dates.map(({ date, week }) => ({
    id: `${slot.id}__${date}`,
    date,
    slotId: slot.id,
    courseId: course.id,
    campus: course.campus,
    code: course.code,
    name: course.name,
    role: course.role,
    groupCode: slot.groupCode,
    groupLabel: slot.groupLabel,
    students: slot.students,
    kind: slot.kind,
    weekday: slot.weekday,
    periods: slot.periods,
    start: slot.start,
    end: slot.end,
    startMin: parseMinutes(slot.start),
    endMin: parseMinutes(slot.end),
    room: slot.room,
    roomNote: slot.roomNote,
    mode: slot.mode,
    week,
  }));
}

export const ALL_OCCURRENCES: Occurrence[] = SLOTS.flatMap(expandSlot).sort(
  (a, b) => compareISO(a.date, b.date) || a.startMin - b.startMin,
);

const BY_DATE = new Map<string, Occurrence[]>();
for (const occ of ALL_OCCURRENCES) {
  const list = BY_DATE.get(occ.date);
  if (list) list.push(occ);
  else BY_DATE.set(occ.date, [occ]);
}

export function occurrencesOn(date: string): Occurrence[] {
  return BY_DATE.get(date) ?? [];
}

export function occurrencesInRange(from: string, to: string): Occurrence[] {
  return ALL_OCCURRENCES.filter((o) => o.date >= from && o.date <= to);
}

export function nextOccurrence(
  afterDate: string,
  afterMin: number,
  campus?: CampusId | "all",
): Occurrence | undefined {
  return ALL_OCCURRENCES.find((o) => {
    if (campus && campus !== "all" && o.campus !== campus) return false;
    if (o.date > afterDate) return true;
    return o.date === afterDate && o.endMin > afterMin;
  });
}

export function overlaps(a: Occurrence, b: Occurrence): boolean {
  if (a.date !== b.date || a.id === b.id) return false;
  return a.startMin < b.endMin && b.startMin < a.endMin;
}

export function conflictsFor(occ: Occurrence, list: Occurrence[]): Occurrence[] {
  return list.filter((other) => overlaps(occ, other));
}

export function periodLabel(occ: Occurrence): string {
  if (occ.slotId === "vlute-kn-t7-bt") return "Ca 3 – 4";
  if (occ.periods.length === 1 && occ.periods[0] === 11) return "Tiết 11";
  if (occ.periods.length === 1) return `Tiết ${occ.periods[0]}`;
  const first = occ.periods[0];
  const last = occ.periods[occ.periods.length - 1];
  return `Tiết ${first} – ${last}`;
}

export function campusOf(id: CampusId) {
  return CAMPUSES[id];
}

export function courseOf(id: string) {
  return COURSE_MAP[id];
}

export function kindLabel(k: SessionKind) {
  return KIND_LABEL[k];
}

export function roleLabel(r: Course["role"]) {
  return ROLE_LABEL[r];
}

export function durationMin(occ: Occurrence): number {
  return occ.endMin - occ.startMin;
}

export function remainingFrom(
  date: string,
  campus?: CampusId | "all",
): Occurrence[] {
  return ALL_OCCURRENCES.filter((o) => {
    if (o.date < date) return false;
    if (campus && campus !== "all" && o.campus !== campus) return false;
    return true;
  });
}

export type SessionStatus = "upcoming" | "live" | "done-auto" | "done-manual" | "undone";

export function autoStatus(
  occ: Occurrence,
  today: string,
  nowMin: number,
): "upcoming" | "live" | "past" {
  if (occ.date < today) return "past";
  if (occ.date > today) return "upcoming";
  if (nowMin >= occ.endMin) return "past";
  if (nowMin >= occ.startMin) return "live";
  return "upcoming";
}

export function suggestedTodos(sessions: Occurrence[]): string[] {
  const items: string[] = [];
  const seen = new Set<string>();
  for (const s of sessions) {
    let text: string;
    if (s.kind === "advising") text = `Sinh hoạt lớp ${s.groupCode}`;
    else if (s.kind === "thesis") text = `Liên hệ SV khóa luận · ${s.groupCode}`;
    else if (s.role === "tg")
      text = `Hỗ trợ giảng ${s.code} · ${s.groupCode}`;
    else text = `Soạn bài ${s.code} · ${s.groupCode}`;
    if (!seen.has(text)) {
      seen.add(text);
      items.push(text);
    }
    const diemDanh = `Điểm danh ${s.groupCode} (${s.students} SV)`;
    if (!seen.has(diemDanh)) {
      seen.add(diemDanh);
      items.push(diemDanh);
    }
  }
  if (sessions.some((s) => s.mode === "online")) {
    items.push("Mở phòng E-Learning và kiểm tra link");
  }
  if (sessions.some((s) => s.campus === "ctu" && s.role === "tg")) {
    items.push("Gửi biên bản / ghi chú buổi trợ giảng");
  }
  return items;
}

export { COURSES, SLOTS, CAMPUSES };
