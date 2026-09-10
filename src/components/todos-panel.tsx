import { useMemo, useState } from "react";
import { TodoList } from "@/components/todo-list";
import { occurrencesOn, suggestedTodos } from "@/lib/schedule";
import { usePlanner } from "@/lib/store";
import { addDaysISO, dateKey, prettyDate, weekdayShort } from "@/lib/time";
import { cn } from "@/lib/utils";

export function TodosPanel({ now }: { now: Date }) {
  const today = dateKey(now);
  const [selected, setSelected] = useState(today);
  const todosMap = usePlanner((s) => s.todos);
  const filter = usePlanner((s) => s.campusFilter);

  const days = useMemo(
    () => Array.from({ length: 14 }, (_, i) => addDaysISO(today, i)),
    [today],
  );

  const sessions = occurrencesOn(selected).filter(
    (o) => filter === "all" || o.campus === filter,
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 pb-28 pt-4 sm:px-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-subtle">
          Việc cần làm
        </p>
        <h1 className="mt-1 font-display text-[1.75rem] leading-tight tracking-tight text-ink">
          Mỗi ngày một danh sách
        </h1>
        <p className="mt-2 text-sm text-muted">
          Việc gắn với ngày. Lịch giảng tự gợi ý soạn bài và điểm danh.
        </p>
      </header>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {days.map((d) => {
          const list = todosMap[d] ?? [];
          const done = list.filter((t) => t.done).length;
          const hasClass = occurrencesOn(d).length > 0;
          const isSel = d === selected;
          return (
            <button
              key={d}
              type="button"
              onClick={() => setSelected(d)}
              className={cn(
                "flex w-[4.5rem] shrink-0 flex-col items-center rounded-clay-xs px-2 py-2 text-center transition-all duration-150",
                isSel ? "bg-accent text-accent-fg shadow-clay-sm" : "bg-surface shadow-clay-sm",
              )}
            >
              <span className={cn("text-[11px]", isSel ? "text-accent-fg/75" : "text-subtle")}>
                {d === today ? "Nay" : weekdayShort(d)}
              </span>
              <span className="font-display text-lg tabular-nums">{d.slice(8)}</span>
              <span className={cn("text-[10px] tabular-nums", isSel ? "text-accent-fg/75" : "text-subtle")}>
                {list.length ? `${done}/${list.length}` : hasClass ? "lịch" : "—"}
              </span>
            </button>
          );
        })}
      </div>

      <div>
        <h2 className="mb-3 font-display text-xl tracking-tight">{prettyDate(selected)}</h2>
        <TodoList date={selected} suggestions={suggestedTodos(sessions)} />
      </div>
    </div>
  );
}
