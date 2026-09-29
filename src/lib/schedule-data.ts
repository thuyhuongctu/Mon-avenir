export type CampusId = "vlute" | "ctu";
export type SessionKind = "lecture" | "practice" | "online" | "advising" | "thesis";
export type Role = "gv" | "tg" | "cvht";

export type Course = {
  id: string;
  campus: CampusId;
  code: string;
  name: string;
  role: Role;
};

export type Slot = {
  id: string;
  courseId: string;
  groupCode: string;
  groupLabel: string;
  students: number;
  kind: SessionKind;
  weekday: number; // 0 CN … 6 T7
  periods: number[];
  start: string;
  end: string;
  room: string;
  roomNote?: string;
  weeks?: number[];
  dates?: string[];
  mode: "offline" | "online" | "consult";
};

export const LECTURER = {
  name: "Đỗ Thùy Hương",
  shortName: "Thùy Hương",
  title: "Giảng viên",
  /** Dòng phụ dưới tên app ở header. */
  tagline: "Je m'appelle Hương",
  /** Tài khoản Google Calendar nhận nhắc việc & lịch giảng. */
  calendarEmail: "huongdt@vlute.edu.vn",
};

export const CAMPUSES: Record<
  CampusId,
  { id: CampusId; short: string; name: string; role: string }
> = {
  vlute: {
    id: "vlute",
    short: "VLUTE",
    name: "Trường ĐH Sư phạm Kỹ thuật Vĩnh Long",
    role: "Giảng viên",
  },
  ctu: {
    id: "ctu",
    short: "CTU",
    name: "Đại học Cần Thơ",
    role: "Trợ giảng",
  },
};

/** CTU HK1 2026–2027 starts Monday 07/09/2026 (ISO week 37). */
export const CTU_WEEK1 = "2026-09-07";
export const CTU_TEACHING_WEEKS = 12;
export const CTU_OFFICIAL_PERIODS = 135;
export const ACADEMIC_YEAR = "2026 – 2027";
export const SEMESTER = "Học kỳ 1";

export const CTU_PERIODS: Record<number, { start: string; end: string }> = {
  1: { start: "07:00", end: "07:50" },
  2: { start: "07:50", end: "08:40" },
  3: { start: "08:50", end: "09:40" },
  4: { start: "09:50", end: "10:40" },
  5: { start: "10:40", end: "11:30" },
  6: { start: "13:00", end: "13:50" },
  7: { start: "13:50", end: "14:40" },
  8: { start: "14:50", end: "15:40" },
  9: { start: "15:50", end: "16:40" },
  10: { start: "16:40", end: "17:30" },
  11: { start: "18:15", end: "19:05" },
  12: { start: "19:05", end: "19:55" },
  13: { start: "20:05", end: "20:55" },
};

export const COURSES: Course[] = [
  {
    id: "ec1602",
    campus: "vlute",
    code: "EC1602",
    name: "Khóa luận tốt nghiệp",
    role: "gv",
  },
  {
    id: "ec1601",
    campus: "vlute",
    code: "EC1601",
    name: "Thực tập tốt nghiệp",
    role: "gv",
  },
  {
    id: "ec1606",
    campus: "vlute",
    code: "EC1606",
    name: "Khởi sự doanh nghiệp",
    role: "gv",
  },
  {
    id: "ec1103",
    campus: "vlute",
    code: "EC1103",
    name: "Kỹ năng giao tiếp và soạn thảo văn bản",
    role: "gv",
  },
  {
    id: "kt330h",
    campus: "ctu",
    code: "KT330H",
    name: "Khởi sự doanh nghiệp",
    role: "tg",
  },
  {
    id: "kt338",
    campus: "ctu",
    code: "KT338",
    name: "Đầu tư quốc tế",
    role: "tg",
  },
];

const W12 = Array.from({ length: 12 }, (_, i) => i + 1);

export const SLOTS: Slot[] = [
  {
    id: "vlute-kl-t3",
    courseId: "ec1602",
    groupCode: "261_EC1602_3_ngoaigio",
    groupLabel: "Ngoài giờ · 2 SV",
    students: 2,
    kind: "thesis",
    weekday: 2,
    periods: [11],
    start: "18:30",
    end: "19:10",
    room: "SV liên hệ GV hướng dẫn",
    mode: "consult",
    dates: ["2026-09-15"],
  },
  {
    id: "vlute-tttn-cn",
    courseId: "ec1601",
    groupCode: "261_EC1601_2_ngoaigio",
    groupLabel: "Ngoài giờ · 14 SV",
    students: 14,
    kind: "thesis",
    weekday: 0,
    periods: [11],
    start: "18:30",
    end: "19:10",
    room: "SV liên hệ GV hướng dẫn",
    mode: "consult",
    dates: ["2026-09-20"],
  },
  {
    id: "vlute-ksdn-t4",
    courseId: "ec1606",
    groupCode: "261a_EC1606_1_online",
    groupLabel: "Lớp online · 84 SV",
    students: 84,
    kind: "online",
    weekday: 3,
    periods: [1, 2],
    start: "07:00",
    end: "08:20",
    room: "E-LEARNING – 01",
    mode: "online",
    dates: [
      "2026-09-16",
      "2026-09-23",
      "2026-09-30",
      "2026-10-07",
      "2026-10-14",
      "2026-10-21",
      "2026-10-28",
      "2026-11-04",
    ],
  },
  {
    id: "vlute-ksdn-t6",
    courseId: "ec1606",
    groupCode: "261a_EC1606_1_online",
    groupLabel: "Lớp online · 84 SV",
    students: 84,
    kind: "online",
    weekday: 5,
    periods: [1, 2],
    start: "07:00",
    end: "08:20",
    room: "E-LEARNING – 01",
    mode: "online",
    dates: [
      "2026-09-18",
      "2026-09-25",
      "2026-10-02",
      "2026-10-09",
      "2026-10-16",
      "2026-10-23",
      "2026-10-30",
    ],
  },
  {
    id: "vlute-kn-t7-lt",
    courseId: "ec1103",
    groupCode: "261b_EC1103_2_tructiep",
    groupLabel: "Lý thuyết · 29 SV",
    students: 29,
    kind: "lecture",
    weekday: 6,
    periods: [1, 2, 3],
    start: "07:00",
    end: "09:20",
    room: "C0105",
    mode: "offline",
    dates: [
      "2026-12-05",
      "2026-12-12",
      "2026-12-19",
      "2026-12-26",
      "2027-01-02",
    ],
  },
  {
    id: "vlute-kn-t7-bt",
    courseId: "ec1103",
    groupCode: "261b_EC1103_(BT)_5_tructiep",
    groupLabel: "Bài tập · 30 SV",
    students: 30,
    kind: "practice",
    weekday: 6,
    periods: [0],
    start: "12:30",
    end: "17:30",
    room: "A0105",
    roomNote: "Mô phỏng Kinh tế",
    mode: "offline",
    dates: [
      "2026-12-26",
      "2027-01-02",
      "2027-01-09",
      "2027-01-16",
      "2027-01-23",
    ],
  },
  {
    id: "vlute-kn-cn",
    courseId: "ec1103",
    groupCode: "261b_EC1103_2_tructiep",
    groupLabel: "Lý thuyết · 29 SV",
    students: 29,
    kind: "lecture",
    weekday: 0,
    periods: [1, 2, 3],
    start: "07:00",
    end: "09:20",
    room: "C0105",
    mode: "offline",
    dates: [
      "2026-12-06",
      "2026-12-13",
      "2026-12-20",
      "2026-12-27",
      "2027-01-03",
    ],
  },
  {
    id: "ctu-kt338-t3",
    courseId: "kt338",
    groupCode: "KT33801",
    groupLabel: "Nhóm 01 · 26 SV",
    students: 26,
    kind: "lecture",
    weekday: 2,
    periods: [1, 2, 3],
    start: CTU_PERIODS[1].start,
    end: CTU_PERIODS[3].end,
    room: "301/MT",
    mode: "offline",
    weeks: W12,
  },
  {
    id: "ctu-kt330h-m01-t3",
    courseId: "kt330h",
    groupCode: "KT2322F1",
    groupLabel: "M01 · 37 SV",
    students: 37,
    kind: "lecture",
    weekday: 2,
    periods: [6, 7, 8],
    start: CTU_PERIODS[6].start,
    end: CTU_PERIODS[8].end,
    room: "104/KT",
    mode: "offline",
    weeks: W12,
  },
  {
    id: "ctu-kt330h-m02-t4",
    courseId: "kt330h",
    groupCode: "KT2322F2",
    groupLabel: "M02 · 41 SV",
    students: 41,
    kind: "lecture",
    weekday: 3,
    periods: [1, 2, 3],
    start: CTU_PERIODS[1].start,
    end: CTU_PERIODS[3].end,
    room: "105/KT",
    mode: "offline",
    weeks: W12,
  },
  {
    id: "ctu-kt330h-m01-t5",
    courseId: "kt330h",
    groupCode: "KT2322F1",
    groupLabel: "M01 · 37 SV",
    students: 37,
    kind: "lecture",
    weekday: 4,
    periods: [1, 2, 3],
    start: CTU_PERIODS[1].start,
    end: CTU_PERIODS[3].end,
    room: "103/KT",
    mode: "offline",
    weeks: W12,
  },
  {
    id: "ctu-kt338-t5",
    courseId: "kt338",
    groupCode: "KT33801",
    groupLabel: "Nhóm 01 · 26 SV",
    students: 26,
    kind: "lecture",
    weekday: 4,
    periods: [4, 5],
    start: CTU_PERIODS[4].start,
    end: CTU_PERIODS[5].end,
    room: "301/MT",
    mode: "offline",
    weeks: W12,
  },
  {
    id: "ctu-kt330h-m02-t6",
    courseId: "kt330h",
    groupCode: "KT2322F2",
    groupLabel: "M02 · 41 SV",
    students: 41,
    kind: "lecture",
    weekday: 5,
    periods: [1, 2, 3],
    start: CTU_PERIODS[1].start,
    end: CTU_PERIODS[3].end,
    room: "202/KT",
    mode: "offline",
    weeks: W12,
  },
];

export const KIND_LABEL: Record<SessionKind, string> = {
  lecture: "Lý thuyết",
  practice: "Bài tập",
  online: "Trực tuyến",
  advising: "Sinh hoạt lớp",
  thesis: "Hướng dẫn",
};

export const ROLE_LABEL: Record<Role, string> = {
  gv: "Giảng viên",
  tg: "Trợ giảng",
  cvht: "Cố vấn HT",
};
