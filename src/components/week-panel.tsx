import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { SessionCard, isDone } from "@/components/session-card";
import { Button } from "@/components/ui/button";
import {
  conflictsFor,
  occurrencesInRange,
  occurrencesOn,
  type Occurrence,
} from "@/lib/schedule";
import { usePlanner } from "@/lib/store";
import {
  addDaysISO,
  dateKey,
  minutesNow,
  mondayOf,
  prettyDate,
  weekdayShort,
} from "@/lib/time";
import { cn } from "@/lib/utils";

const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
const GRID_START = 7 * 60;
const GRID_END = 19 * 60 + 30;
const GRID_SPAN = GRID_END - GRID_START;

export function WeekPanel({ now }: { now: Date }) {
  const today = dateKey(now);
  const nowMin = minutesNow(now);
  const thisMonday = mondayOf(today);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected] = useState(today);
  const filter = usePlanner((s) => s.campusFilter);
  const sessionOverride = usePlanner((s) => s.sessionOverride);
  const dayOverride = usePlanner((s) => s.dayOverride);
  const toggleSession = usePlanner((s) => s.toggleSession);

  const anchor = addDaysISO(thisMonday, weekOffset * 7);
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDaysISO(anchor, i)),
    [anchor],
  );
  const weekOcc = occurrencesInRange(days[0], days[6]).filter(
    (o) => filter === "all" || o.campus === filter,
  );
  const byDay = useMemo(() => {
    const m = new Map<string, Occurrence[]>();
    for (const d of days) m.set(d, []);
    for (const o of weekOcc) m.get(o.date)?.push(o);
    return m;
  }, [days, weekOcc]);

  const selectedList = (byDay.get(selected) ?? []).length
    ? (byDay.get(selected) ?? [])
    : occurrencesOn(selected).filter((o) => filter === "all" || o.campus === filter);
  const allSelected = occurrencesOn(selected);

  function jump(delta: number) {
    setWeekOffset((w) => w + delta);
    setSelected((s) => addDaysISO(s, delta * 7));
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 pb-28 pt-4 sm:px-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-subtle">
            Tuần giảng
          </p>
          <h1 className="mt-1 font-display text-[1.75rem] leading-tight tracking-tight text-ink">
            {prettyDate(days[0], { weekday: false })} –{" "}
            {prettyDate(days[6], { weekday: false })}
          </h1>
        </div>
        <div className="flex gap-1">
          <Button variant="secondary" size="icon-sm" onClick={() => jump(-1)} aria-label="Tuần trước">
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setWeekOffset(0);
              setSelected(today);
            }}
          >
            Hôm nay
          </Button>
          <Button variant="secondary" size="icon-sm" onClick={() => jump(1)} aria-label="Tuần sau">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((d) => {
          const list = byDay.get(d) ?? [];
          const isToday = d === today;
          const isSel = d === selected;
          const allDone =
            list.length > 0 &&
            list.every((o) => isDone(o, today, nowMin, sessionOverride, dayOverride));
          return (
            <button
              key={d}
              type="button"
              onClick={() => setSelected(d)}
              className={cn(
                "flex min-h-16 flex-col items-center gap-1 rounded-clay-xs px-1 py-2 text-center transition-all duration-150",
                isSel ? "bg-accent text-accent-fg shadow-clay-sm" : "bg-surface shadow-clay-sm hover:-translate-y-0.5",
              )}
            >
              <span className={cn("text-[11px] font-medium", isSel ? "text-accent-fg/80" : "text-subtle")}>
                {weekdayShort(d)}
              </span>
              <span className="font-display text-lg tabular-nums leading-none">
                {d.slice(8)}
              </span>
              <span className="flex h-2 items-center gap-0.5">
                {list.slice(0, 4).map((o) => (
                  <span
                    key={o.id}
                    className={cn(
                      "size-1.5 rounded-full",
                      isSel
                        ? "bg-accent-fg/80"
                        : allDone
                          ? "bg-done"
                          : o.campus === "ctu"
                            ? "bg-ctu"
                            : "bg-vlute",
                    )}
                  />
                ))}
              </span>
              {isToday && !isSel && (
                <span className="text-[9px] font-medium uppercase tracking-wider text-accent">
                  Nay
                </span>
              )}
            </button>
          );
        })}
      </div>

      <WeekGrid
        days={days}
        byDay={byDay}
        today={today}
        nowMin={nowMin}
        selected={selected}
        onSelect={setSelected}
      />

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl tracking-tight">
          {prettyDate(selected)}
        </h2>
        {selectedList.length === 0 ? (
          <p className="rounded-clay bg-surface px-4 py-6 text-sm text-muted shadow-clay-sm">
            Không có buổi nào.
          </p>
        ) : (
          selectedList.map((occ) => (
            <SessionCard
              key={occ.id}
              occ={occ}
              today={today}
              nowMin={nowMin}
              done={isDone(occ, today, nowMin, sessionOverride, dayOverride)}
              conflicts={conflictsFor(occ, allSelected)}
              onToggle={() =>
                toggleSession(
                  occ.id,
                  !isDone(occ, today, nowMin, sessionOverride, dayOverride),
                )
              }
            />
          ))
        )}
      </section>
    </div>
  );
}

function WeekGrid({
  days,
  byDay,
  today,
  nowMin,
  selected,
  onSelect,
}: {
  days: string[];
  byDay: Map<string, Occurrence[]>;
  today: string;
  nowMin: number;
  selected: string;
  onSelect: (d: string) => void;
}) {
  return (
    <div className="hidden overflow-x-auto rounded-clay bg-surface shadow-clay-sm lg:block">
      <div className="grid min-w-[880px] grid-cols-[56px_repeat(7,1fr)]">
        <div className="border-b border-black/5" />
        {days.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => onSelect(d)}
            className={cn(
              "border-b border-l border-black/5 px-2 py-2 text-left text-xs",
              d === selected && "bg-accent-soft",
              d === today && "font-medium text-accent",
            )}
          >
            <span className="text-subtle">{weekdayShort(d)}</span>
            <span className="ml-1 font-display text-base text-ink">{d.slice(8)}</span>
          </button>
        ))}
        <div className="relative" style={{ height: 640 }}>
          {HOURS.map((h) => (
            <div
              key={h}
              className="absolute right-2 -translate-y-1/2 font-mono text-[10px] tabular-nums text-subtle"
              style={{ top: ((h * 60 - GRID_START) / GRID_SPAN) * 640 }}
            >
              {String(h).padStart(2, "0")}g
            </div>
          ))}
        </div>
        {days.map((d) => (
          <div
            key={d}
            className="relative border-l border-black/5"
            style={{ height: 640 }}
          >
            {HOURS.map((h) => (
              <div
                key={h}
                className="absolute inset-x-0 border-t border-black/5"
                style={{ top: ((h * 60 - GRID_START) / GRID_SPAN) * 640 }}
              />
            ))}
            {d === today && nowMin >= GRID_START && nowMin <= GRID_END && (
              <div
                className="absolute inset-x-0 z-20 h-px bg-live"
                style={{ top: ((nowMin - GRID_START) / GRID_SPAN) * 640 }}
              />
            )}
            {(byDay.get(d) ?? []).map((o) => {
              const siblings = (byDay.get(d) ?? []).filter(
                (other) =>
                  other.id !== o.id &&
                  other.startMin < o.endMin &&
                  o.startMin < other.endMin,
              );
              const split = siblings.length > 0;
              const second = split && o.campus === "vlute";
              const top = ((o.startMin - GRID_START) / GRID_SPAN) * 640;
              const height = Math.max(28, ((o.endMin - o.startMin) / GRID_SPAN) * 640);
              return (
                <div
                  key={o.id}
                  className={cn(
                    "absolute z-10 overflow-hidden rounded-clay-xs px-1.5 py-1 text-[11px] leading-tight",
                    o.campus === "ctu"
                      ? "bg-ctu-soft text-ctu"
                      : "bg-vlute-soft text-vlute",
                  )}
                  style={{
                    top,
                    height,
                    left: split && second ? "50%" : 4,
                    right: split && !second ? "50%" : 4,
                  }}
                  title={`${o.code} ${o.start}–${o.end}`}
                >
                  <div className="truncate font-medium">{o.code}</div>
                  {height > 36 && (
                    <div className="truncate opacity-80">
                      {o.start.replace(":", "g")} · {o.room}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
