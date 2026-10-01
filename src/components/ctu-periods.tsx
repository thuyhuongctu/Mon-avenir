import { Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CTU_PERIODS } from "@/lib/schedule-data";
import { minutesNow, parseMinutes } from "@/lib/time";
import { cn } from "@/lib/utils";

const SESSIONS = [
  { label: "Buổi sáng", periods: [1, 2, 3, 4, 5] },
  { label: "Buổi chiều", periods: [6, 7, 8, 9, 10] },
  { label: "Buổi tối", periods: [11, 12, 13] },
];

const hm = (t: string) => t.replace(":", "g");

/** Bảng giờ tiết học CTU, tô đậm tiết đang diễn ra. */
export function CtuPeriodsCard({ now }: { now: Date }) {
  const nowMin = minutesNow(now);

  return (
    <section className="rounded-clay bg-clay-surface p-4 shadow-clay-sm">
      <div className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-clay-xs bg-ctu-soft text-ctu">
          <Clock3 className="size-4" />
        </span>
        <div>
          <h2 className="font-display text-lg leading-tight tracking-tight">Giờ tiết học CTU</h2>
          <p className="text-xs text-muted">Mỗi tiết 50 phút</p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {SESSIONS.map((s) => (
          <div key={s.label}>
            <h3 className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-subtle">
              {s.label}
            </h3>
            <ul className="flex flex-col gap-1">
              {s.periods.map((p, i) => {
                const { start, end } = CTU_PERIODS[p];
                const live = nowMin >= parseMinutes(start) && nowMin < parseMinutes(end);
                const nextP = s.periods[i + 1];
                const gap = nextP
                  ? parseMinutes(CTU_PERIODS[nextP].start) - parseMinutes(end)
                  : 0;
                return (
                  <li key={p}>
                    <div
                      className={cn(
                        "flex items-center justify-between gap-2 rounded-clay-xs px-3 py-1.5 text-sm",
                        live ? "bg-clay-accent text-accent-fg shadow-clay-sm" : "bg-paper-2/60 text-ink",
                      )}
                    >
                      <span className="font-medium">Tiết {p}</span>
                      <span className="font-mono text-xs tabular-nums">
                        {hm(start)} – {hm(end)}
                      </span>
                    </div>
                    {gap > 0 && (
                      <p className="py-0.5 pl-3 text-[11px] italic text-subtle">nghỉ {gap} phút</p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      {SESSIONS.some((s) =>
        s.periods.some((p) => {
          const { start, end } = CTU_PERIODS[p];
          return nowMin >= parseMinutes(start) && nowMin < parseMinutes(end);
        }),
      ) && (
        <p className="mt-3 text-xs text-muted">
          <Badge tone="live">Đang diễn ra</Badge> ô tô đậm là tiết hiện tại.
        </p>
      )}
    </section>
  );
}
