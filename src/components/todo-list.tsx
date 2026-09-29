import {
  Bell,
  CalendarPlus,
  Check,
  ChevronDown,
  Circle,
  NotebookPen,
  Plus,
  Trash2,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { todoGcalUrl } from "@/lib/gcal";
import { usePlanner, EMPTY_TODOS, type Todo } from "@/lib/store";
import { cn } from "@/lib/utils";

export function TodoList({
  date,
  suggestions = [],
}: {
  date: string;
  suggestions?: string[];
}) {
  const todos = usePlanner((s) => s.todos[date]) ?? EMPTY_TODOS;
  const addTodo = usePlanner((s) => s.addTodo);
  const [text, setText] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    addTodo(date, t);
    setText("");
  }

  const unused = suggestions.filter(
    (s) => !todos.some((t) => t.text === s),
  );

  return (
    <div className="rounded-clay bg-clay-surface p-3 shadow-clay-sm sm:p-4">
      {todos.length === 0 && (
        <p className="px-1 pb-3 text-sm text-muted">Chưa có việc cho ngày này.</p>
      )}
      <ul className="flex flex-col gap-0.5">
        {todos.map((todo) => (
          <TodoRow key={todo.id} date={date} todo={todo} />
        ))}
      </ul>

      <form onSubmit={onSubmit} className="mt-2 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Thêm việc…"
          className="h-11 min-w-0 flex-1 rounded-clay-xs bg-clay-inset px-3 text-sm text-ink shadow-clay-inset outline-none placeholder:text-subtle focus:shadow-clay-inset"
        />
        <Button type="submit" size="icon" aria-label="Thêm" disabled={!text.trim()}>
          <Plus className="size-5" />
        </Button>
      </form>

      {unused.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {unused.slice(0, 6).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTodo(date, s)}
              className="rounded-full bg-clay-paper2 px-2.5 py-1.5 text-left text-xs text-ink-soft shadow-clay-sm transition-all hover:-translate-y-0.5 hover:text-accent"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TodoRow({ date, todo }: { date: string; todo: Todo }) {
  const toggleTodo = usePlanner((s) => s.toggleTodo);
  const removeTodo = usePlanner((s) => s.removeTodo);
  const updateTodo = usePlanner((s) => s.updateTodo);
  const [open, setOpen] = useState(false);
  const hasNote = Boolean(todo.note?.trim());

  return (
    <li className="group rounded-clay-xs hover:bg-paper-2/60">
      <div className="flex items-center gap-1 pr-1">
        <button
          type="button"
          onClick={() => toggleTodo(date, todo.id)}
          className="flex min-h-11 min-w-0 flex-1 items-center gap-3 px-2 text-left"
          aria-pressed={todo.done}
        >
          <span
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full transition-colors",
              todo.done ? "bg-clay-accent text-accent-fg" : "bg-paper-2 text-subtle",
            )}
          >
            {todo.done ? (
              <Check className="size-3.5" strokeWidth={2.5} />
            ) : (
              <Circle className="size-3.5" />
            )}
          </span>
          <span className="min-w-0">
            <span
              className={cn(
                "block text-sm text-ink",
                todo.done && "text-muted line-through decoration-ink/25",
              )}
            >
              {todo.text}
            </span>
            {(todo.time || (hasNote && !open)) && (
              <span className="mt-0.5 flex items-center gap-2 text-xs text-subtle">
                {todo.time && (
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <Bell className="size-3" />
                    {todo.time.replace(":", "g")}
                  </span>
                )}
                {hasNote && !open && (
                  <span className="truncate italic">{todo.note}</span>
                )}
              </span>
            )}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex size-11 items-center justify-center rounded-clay-xs hover:text-ink",
            hasNote || open ? "text-accent" : "text-subtle",
          )}
          aria-expanded={open}
          aria-label="Ghi chú & nhắc lịch"
        >
          {open ? <ChevronDown className="size-4" /> : <NotebookPen className="size-4" />}
        </button>
        <button
          type="button"
          onClick={() => removeTodo(date, todo.id)}
          className="flex size-11 items-center justify-center rounded-clay-xs text-subtle opacity-70 hover:text-danger sm:opacity-0 sm:group-hover:opacity-100"
          aria-label="Xóa việc"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-2 px-2 pb-3 pl-11">
          <textarea
            value={todo.note ?? ""}
            onChange={(e) => updateTodo(date, todo.id, { note: e.target.value })}
            placeholder="Ghi chú…"
            rows={3}
            className="w-full resize-y rounded-clay-xs bg-clay-inset px-3 py-2 text-sm text-ink shadow-clay-inset outline-none placeholder:text-subtle"
          />
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-1.5 text-xs text-muted">
              <Bell className="size-3.5" />
              Nhắc lúc
              <input
                type="time"
                value={todo.time ?? ""}
                onChange={(e) =>
                  updateTodo(date, todo.id, { time: e.target.value || undefined })
                }
                className="h-9 rounded-clay-xs bg-clay-inset px-2 text-sm text-ink shadow-clay-inset outline-none"
              />
            </label>
            <a
              href={todoGcalUrl(date, todo)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-clay-xs bg-clay-surface px-3 text-xs font-medium text-ink shadow-clay-sm transition-all hover:-translate-y-0.5"
            >
              <CalendarPlus className="size-4" />
              Google Calendar
            </a>
          </div>
        </div>
      )}
    </li>
  );
}
