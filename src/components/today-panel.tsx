import { CheckCheck, ListPlus, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { usePlannerHydrated } from "@/lib/hooks";
import { SessionCard, isDone } from "@/components/session-card";
import { Button } from "@/components/ui/button";
import {
  conflictsFor,
  nextOccurrence,
  occurrencesOn,
  suggestedTodos,
} from "@/lib/schedule";
import { usePlanner, EMPTY_TODOS } from "@/lib/store";
import {
  dateKey,
  formatDuration,
  greeting,
  minutesNow,
  prettyDateLong,
  vnTime,
} from "@/lib/time";
import { TodoList } from "@/components/todo-list";

export function TodayPanel({ now }: { now: Date }) {
  const persistReady = usePlannerHydrated();
  const today = dateKey(now);
  const nowMin = minutesNow(now);
  const filter = usePlanner((s) => s.campusFilter);
  const sessionOverride = usePlanner((s) => s.sessionOverride);
  const dayOverride = usePlanner((s) => s.dayOverride);
  const todos = usePlanner((s) => s.todos[today]) ?? EMPTY_TODOS;
  const seeded = usePlanner((s) => s.seeded[today]);
  const toggleSession = usePlanner((s) => s.toggleSession);
  const markDay = usePlanner((s) => s.markDay);
  const completeDayTodos = usePlanner((s) => s.completeDayTodos);
  const seedTodos = usePlanner((s) => s.seedTodos);

  const allToday = occurrencesOn(today);
  const sessions = allToday.filter((o) => filter === "all" || o.campus === filter);
  const next = nextOccurrence(today, nowMin, filter);

  const doneCount = sessions.filter((o) =>
    isDone(o, today, nowMin, sessionOverride, dayOverride),
  ).length;
  const allSessionsDone = sessions.length > 0 && doneCount === sessions.length;
  const todosDone = todos.length === 0 || todos.every((t) => t.done);
  const dayComplete = allSessionsDone && todosDone;

  const sessionIds = sessions.map((s) => s.id).join("|");
  useEffect(() => {
    if (!persistReady) return;
    if (!seeded && sessions.length > 0) {
      seedTodos(today, suggestedTodos(sessions));
    }
    // sessions identity changes every render; key off ids
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistReady, seeded, sessionIds, today, seedTodos]);

  const upcoming = sessions.find(
    (o) =>
      !isDone(o, today, nowMin, sessionOverride, dayOverride) &&
      o.endMin > nowMin,
  );

  let statusLine = "Không có lịch hôm nay";
  if (sessions.length === 0 && todos.length > 0) {
    statusLine = "Ngày trống lịch — còn việc cần làm";
  } else if (dayComplete && sessions.length > 0) {
    statusLine = "Đã hoàn thành ngày";
  } else if (upcoming) {
    const live = upcoming.startMin <= nowMin && nowMin < upcoming.endMin;
    if (live) {
      statusLine = `Đang dạy ${upcoming.code} · còn ${formatDuration(upcoming.endMin - nowMin)}`;
    } else {
      statusLine = `Sắp tới ${upcoming.code} lúc ${upcoming.start.replace(":", "g")} · còn ${formatDuration(upcoming.startMin - nowMin)}`;
    }
  } else if (sessions.length > 0) {
    statusLine = "Hết lịch hôm nay";
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-28 pt-4 sm:px-6">
      <header className="rise-in lg:col-span-2">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-subtle">
          {greeting(now)} · {vnTime(now)}
        </p>
        <h1 className="mt-1 font-display text-[2rem] leading-tight tracking-tight text-ink sm:text-4xl">
          {prettyDateLong(today)}
        </h1>
        <p className="mt-2 text-sm text-muted">{statusLine}</p>

        {sessions.length > 0 && (
          <div className="mt-4 flex items-center gap-3">
            <div
              className="h-2 flex-1 overflow-hidden rounded-full bg-clay-inset shadow-clay-inset"
              role="progressbar"
              aria-valuenow={doneCount}
              aria-valuemax={sessions.length}
            >
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
                style={{ width: `${(doneCount / sessions.length) * 100}%` }}
              />
            </div>
            <span className="font-mono text-xs tabular-nums text-muted">
              {doneCount}/{sessions.length} buổi
            </span>
          </div>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      {sessions.length === 0 ? (
        <EmptyDay nextDate={next?.date} nextLabel={next ? `${next.code} · ${next.name}` : undefined} />
      ) : (
        <section className="flex flex-col gap-3">
          {sessions.map((occ) => (
            <div key={occ.id} className="rise-in">
              <SessionCard
                occ={occ}
                today={today}
                nowMin={nowMin}
                done={isDone(occ, today, nowMin, sessionOverride, dayOverride)}
                conflicts={conflictsFor(occ, allToday)}
                onToggle={() =>
                  toggleSession(
                    occ.id,
                    !isDone(occ, today, nowMin, sessionOverride, dayOverride),
                  )
                }
              />
            </div>
          ))}
        </section>
      )}

      <section className="rise-in">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl tracking-tight text-ink">Việc cần làm</h2>
            <p className="text-xs text-muted">Tự tick khi hết ngày · có thể đánh dấu sớm</p>
          </div>
          {sessions.length > 0 && (
            <Button
              size="sm"
              variant={dayComplete ? "secondary" : "default"}
              onClick={() => {
                const nextDone = !dayComplete;
                markDay(today, nextDone);
                completeDayTodos(today, nextDone);
              }}
            >
              <CheckCheck className="size-4" />
              {dayComplete ? "Mở lại ngày" : "Xong cả ngày"}
            </Button>
          )}
        </div>
        <TodoList date={today} suggestions={suggestedTodos(sessions)} />
      </section>
      </div>
    </div>
  );
}

function EmptyDay({
  nextDate,
  nextLabel,
}: {
  nextDate?: string;
  nextLabel?: string;
}) {
  return (
    <div className="rounded-clay bg-clay-surface px-5 py-8 text-center shadow-clay-sm">
      <Sparkles className="mx-auto size-6 text-subtle" />
      <p className="mt-3 font-display text-lg text-ink">Trống lịch giảng</p>
      <p className="mt-1 text-sm text-muted">
        {nextLabel && nextDate
          ? `Buổi kế: ${nextLabel}`
          : "Không còn buổi nào trong học kỳ này."}
      </p>
      <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-subtle">
        <ListPlus className="size-3.5" />
        Thêm việc bên dưới nếu cần soạn bài hay chấm điểm
      </p>
    </div>
  );
}
