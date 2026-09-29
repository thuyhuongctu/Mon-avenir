import { create } from "zustand";
import { persist } from "zustand/middleware";
import { uid } from "./utils";
import type { CampusId } from "./schedule-data";
import type { ImportedSchedule } from "./import-schedule";

export type Todo = {
  id: string;
  text: string;
  done: boolean;
  /** Giờ nhắc (HH:MM); bỏ trống = nhắc cả ngày. */
  time?: string;
  /** Ghi chú tay của người dùng. */
  note?: string;
};

export type TodoPatch = Partial<Pick<Todo, "text" | "time" | "note">>;

export type CampusFilter = CampusId | "all";

export const EMPTY_TODOS: Todo[] = [];

type PlannerState = {
  sessionOverride: Record<string, boolean>;
  dayOverride: Record<string, boolean>;
  todos: Record<string, Todo[]>;
  seeded: Record<string, boolean>;
  /** Ghi chú tay theo từng buổi dạy (khóa = occurrence id). */
  sessionNotes: Record<string, string>;
  /** Lịch nhập từ file (CSV/ICS). */
  imports: ImportedSchedule[];
  /** Ẩn lịch có sẵn trong code (khi đã nhập lịch học kỳ mới). */
  hideBuiltin: boolean;
  campusFilter: CampusFilter;
  toggleSession: (id: string, next: boolean) => void;
  clearSession: (id: string) => void;
  markDay: (date: string, done: boolean) => void;
  clearDay: (date: string) => void;
  addTodo: (date: string, text: string) => void;
  toggleTodo: (date: string, id: string) => void;
  removeTodo: (date: string, id: string) => void;
  updateTodo: (date: string, id: string, patch: TodoPatch) => void;
  setSessionNote: (id: string, note: string) => void;
  addImport: (imp: ImportedSchedule) => void;
  removeImport: (id: string) => void;
  setHideBuiltin: (hide: boolean) => void;
  seedTodos: (date: string, texts: string[]) => void;
  setCampusFilter: (f: CampusFilter) => void;
  completeDayTodos: (date: string, done: boolean) => void;
};

export const usePlanner = create<PlannerState>()(
  persist(
    (set) => ({
      sessionOverride: {},
      dayOverride: {},
      todos: {},
      seeded: {},
      sessionNotes: {},
      imports: [],
      hideBuiltin: false,
      campusFilter: "all",
      toggleSession: (id, next) =>
        set((s) => ({
          sessionOverride: { ...s.sessionOverride, [id]: next },
        })),
      clearSession: (id) =>
        set((s) => {
          const sessionOverride = { ...s.sessionOverride };
          delete sessionOverride[id];
          return { sessionOverride };
        }),
      markDay: (date, done) =>
        set((s) => ({
          dayOverride: { ...s.dayOverride, [date]: done },
        })),
      clearDay: (date) =>
        set((s) => {
          const dayOverride = { ...s.dayOverride };
          delete dayOverride[date];
          return { dayOverride };
        }),
      addTodo: (date, text) =>
        set((s) => {
          const list = s.todos[date] ?? [];
          return {
            todos: {
              ...s.todos,
              [date]: [...list, { id: uid(), text: text.trim(), done: false }],
            },
          };
        }),
      toggleTodo: (date, id) =>
        set((s) => ({
          todos: {
            ...s.todos,
            [date]: (s.todos[date] ?? []).map((t) =>
              t.id === id ? { ...t, done: !t.done } : t,
            ),
          },
        })),
      removeTodo: (date, id) =>
        set((s) => ({
          todos: {
            ...s.todos,
            [date]: (s.todos[date] ?? []).filter((t) => t.id !== id),
          },
        })),
      updateTodo: (date, id, patch) =>
        set((s) => ({
          todos: {
            ...s.todos,
            [date]: (s.todos[date] ?? []).map((t) =>
              t.id === id ? { ...t, ...patch } : t,
            ),
          },
        })),
      setSessionNote: (id, note) =>
        set((s) => {
          const sessionNotes = { ...s.sessionNotes };
          if (note.trim()) sessionNotes[id] = note;
          else delete sessionNotes[id];
          return { sessionNotes };
        }),
      addImport: (imp) => set((s) => ({ imports: [...s.imports, imp] })),
      removeImport: (id) =>
        set((s) => ({ imports: s.imports.filter((i) => i.id !== id) })),
      setHideBuiltin: (hideBuiltin) => set({ hideBuiltin }),
      seedTodos: (date, texts) =>
        set((s) => {
          if (s.seeded[date]) return s;
          const existing = s.todos[date] ?? [];
          const have = new Set(existing.map((t) => t.text));
          const extra = texts
            .filter((t) => t && !have.has(t))
            .map((text) => ({ id: uid(), text, done: false }));
          return {
            todos: { ...s.todos, [date]: [...existing, ...extra] },
            seeded: { ...s.seeded, [date]: true },
          };
        }),
      completeDayTodos: (date, done) =>
        set((s) => ({
          todos: {
            ...s.todos,
            [date]: (s.todos[date] ?? []).map((t) => ({ ...t, done })),
          },
        })),
      setCampusFilter: (campusFilter) => set({ campusFilter }),
    }),
    { name: "mon-avenir-huong-v1", skipHydration: true },
  ),
);
