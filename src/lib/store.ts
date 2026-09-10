import { create } from "zustand";
import { persist } from "zustand/middleware";
import { uid } from "./utils";
import type { CampusId } from "./schedule-data";

export type Todo = {
  id: string;
  text: string;
  done: boolean;
};

export type CampusFilter = CampusId | "all";

export const EMPTY_TODOS: Todo[] = [];

type PlannerState = {
  sessionOverride: Record<string, boolean>;
  dayOverride: Record<string, boolean>;
  todos: Record<string, Todo[]>;
  seeded: Record<string, boolean>;
  campusFilter: CampusFilter;
  toggleSession: (id: string, next: boolean) => void;
  clearSession: (id: string) => void;
  markDay: (date: string, done: boolean) => void;
  clearDay: (date: string) => void;
  addTodo: (date: string, text: string) => void;
  toggleTodo: (date: string, id: string) => void;
  removeTodo: (date: string, id: string) => void;
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
