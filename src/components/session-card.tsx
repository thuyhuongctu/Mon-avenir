import {
  Check,
  Clock3,
  MapPin,
  Monitor,
  Users,
  TriangleAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  autoStatus,
  campusOf,
  kindLabel,
  periodLabel,
  roleLabel,
  type Occurrence,
} from "@/lib/schedule";
import { rangeLabel } from "@/lib/time";
import { cn } from "@/lib/utils";

export function isDone(
  occ: Occurrence,
  today: string,
  nowMin: number,
  sessionOverride: Record<string, boolean>,
  dayOverride: Record<string, boolean>,
): boolean {
  if (sessionOverride[occ.id] !== undefined) return sessionOverride[occ.id];
  if (dayOverride[occ.date] === true) return true;
  return autoStatus(occ, today, nowMin) === "past";
}

export function SessionCard({
  occ,
  today,
  nowMin,
  done,
  conflicts,
  onToggle,
}: {
  occ: Occurrence;
  today: string;
  nowMin: number;
  done: boolean;
  conflicts: Occurrence[];
  onToggle: () => void;
}) {
  const st = autoStatus(occ, today, nowMin);
  const live = st === "live" && !done;
  const campus = campusOf(occ.campus);
  const progress =
    live && occ.endMin > occ.startMin
      ? Math.min(1, Math.max(0, (nowMin - occ.startMin) / (occ.endMin - occ.startMin)))
      : 0;

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-clay bg-surface p-4 shadow-clay-sm transition-[opacity,box-shadow,transform] duration-200",
        done && "opacity-70",
        live && "shadow-clay",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-3 left-0 w-1 rounded-full",
          occ.campus === "ctu" ? "bg-ctu" : "bg-vlute",
        )}
      />
      {live && (
        <span
          className="absolute inset-x-0 bottom-0 h-0.5 bg-live-soft"
          aria-hidden
        >
          <span
            className="block h-full bg-live transition-[width] duration-500"
            style={{ width: `${progress * 100}%` }}
          />
        </span>
      )}

      <div className="flex gap-3 pl-2">
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={done}
          aria-label={done ? "Bỏ đánh dấu hoàn thành" : "Đánh dấu hoàn thành"}
          className={cn(
            "relative mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-clay-xs transition-[background-color,color,transform,box-shadow] duration-150 ease-out active:scale-[0.96]",
            done
              ? "bg-accent text-accent-fg shadow-clay-sm"
              : "bg-paper-2 text-subtle shadow-clay-inset hover:text-ink",
          )}
        >
          {done ? (
            <Check className="size-5" strokeWidth={2.4} />
          ) : live ? (
            <span className="size-2.5 rounded-full bg-live live-dot" />
          ) : (
            <span className="size-4 rounded-full border-2 border-current/40" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-sm font-medium tabular-nums text-ink">
              {rangeLabel(occ.start, occ.end)}
            </span>
            <Badge tone={occ.campus === "ctu" ? "ctu" : "vlute"}>
              {campus.short}
            </Badge>
            <Badge tone="muted">{periodLabel(occ)}</Badge>
            {live && (
              <Badge tone="live">
                <span className="size-1.5 rounded-full bg-live live-dot" />
                Đang dạy
              </Badge>
            )}
            {done && !live && <Badge tone="done">Xong</Badge>}
            {conflicts.length > 0 && <Badge tone="warn">Trùng giờ</Badge>}
          </div>

          <h3
            className={cn(
              "mt-1 font-display text-lg leading-snug tracking-tight text-ink",
              done && "line-through decoration-ink/30",
            )}
          >
            {occ.code} · {occ.name}
          </h3>

          <p className="mt-0.5 text-sm text-muted">
            {roleLabel(occ.role)} · {kindLabel(occ.kind)} · {occ.groupLabel}
          </p>

          <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-subtle">
            <span className="inline-flex items-center gap-1">
              {occ.mode === "online" ? (
                <Monitor className="size-3.5" />
              ) : (
                <MapPin className="size-3.5" />
              )}
              {occ.room}
              {occ.roomNote ? ` · ${occ.roomNote}` : ""}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" />
              {occ.students} SV
            </span>
            {occ.week != null && (
              <span className="inline-flex items-center gap-1">
                <Clock3 className="size-3.5" />
                Tuần {occ.week}
              </span>
            )}
          </div>

          {conflicts.length > 0 && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-warn">
              <TriangleAlert className="mt-px size-3.5 shrink-0" />
              Trùng với{" "}
              {conflicts.map((c) => `${c.code} (${c.groupCode})`).join(", ")}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
