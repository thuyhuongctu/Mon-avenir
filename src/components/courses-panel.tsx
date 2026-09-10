import { useMemo, useState } from "react";
import { ChevronDown, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  ALL_OCCURRENCES,
  COURSES,
  campusOf,
  periodLabel,
  remainingFrom,
  roleLabel,
} from "@/lib/schedule";
import { usePlanner } from "@/lib/store";
import { dateKey, prettyDate, weekdayShort } from "@/lib/time";
import { cn } from "@/lib/utils";

export function CoursesPanel({ now }: { now: Date }) {
  const today = dateKey(now);
  const filter = usePlanner((s) => s.campusFilter);
  const courses = COURSES.filter((c) => filter === "all" || c.campus === filter);

  const remaining = remainingFrom(today, filter);
  const remainingByCourse = useMemo(() => {
    const m = new Map<string, number>();
    for (const o of remaining) m.set(o.courseId, (m.get(o.courseId) ?? 0) + 1);
    return m;
  }, [remaining]);

  const totalLeft = remaining.length;
  const vluteLeft = remaining.filter((o) => o.campus === "vlute").length;
  const ctuLeft = remaining.filter((o) => o.campus === "ctu").length;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 pb-28 pt-4 sm:px-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-subtle">
          Năm học 2026 – 2027 · HK1
        </p>
        <h1 className="mt-1 font-display text-[1.75rem] leading-tight tracking-tight text-ink">
          Môn giảng dạy
        </h1>
        <p className="mt-2 text-sm text-muted">
          Còn {totalLeft} buổi · VLUTE {vluteLeft} · CTU {ctuLeft}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat label="Buổi còn lại" value={String(totalLeft)} />
        <Stat label="VLUTE" value={String(vluteLeft)} hint="Giảng viên" />
        <Stat label="CTU" value={String(ctuLeft)} hint="Trợ giảng · định mức 135 tiết" />
      </div>

      <div className="flex flex-col gap-3">
        {courses.map((course) => {
          const occs = ALL_OCCURRENCES.filter((o) => o.courseId === course.id);
          const left = remainingByCourse.get(course.id) ?? 0;
          return (
            <CourseBlock
              key={course.id}
              code={course.code}
              name={course.name}
              campus={course.campus}
              role={roleLabel(course.role)}
              left={left}
              total={occs.length}
              occs={occs}
              today={today}
            />
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-clay bg-clay-surface px-3 py-3 shadow-clay-sm">
      <p className="text-[11px] font-medium uppercase tracking-wider text-subtle">{label}</p>
      <p className="mt-1 font-display text-2xl tabular-nums leading-none text-ink">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-subtle">{hint}</p>}
    </div>
  );
}

function CourseBlock({
  code,
  name,
  campus,
  role,
  left,
  total,
  occs,
  today,
}: {
  code: string;
  name: string;
  campus: "vlute" | "ctu";
  role: string;
  left: number;
  total: number;
  occs: ReturnType<typeof remainingFrom>;
  today: string;
}) {
  const [open, setOpen] = useState(false);
  const groups = [...new Set(occs.map((o) => o.groupCode))];
  const camp = campusOf(campus);

  return (
    <article className="rounded-clay bg-clay-surface shadow-clay-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <span
          className={cn(
            "mt-1 flex size-9 shrink-0 items-center justify-center rounded-clay-xs",
            campus === "ctu" ? "bg-ctu-soft text-ctu" : "bg-vlute-soft text-vlute",
          )}
        >
          <GraduationCap className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-xs font-medium text-muted">{code}</span>
            <Badge tone={campus === "ctu" ? "ctu" : "vlute"}>{camp.short}</Badge>
            <Badge tone="muted">{role}</Badge>
          </div>
          <h2 className="mt-0.5 font-display text-lg leading-snug tracking-tight">{name}</h2>
          <p className="mt-1 text-xs text-subtle">
            {groups.join(" · ")} · còn {left}/{total} buổi
          </p>
        </div>
        <ChevronDown
          className={cn(
            "mt-2 size-4 shrink-0 text-subtle transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <ul className="border-t border-black/5 px-3 pb-3 pt-1">
          {occs.map((o) => {
            const past = o.date < today;
            return (
              <li
                key={o.id}
                className={cn(
                  "flex items-baseline justify-between gap-3 border-b border-black/5 py-2 text-sm last:border-0",
                  past && "text-subtle",
                )}
              >
                <span className="min-w-0">
                  <span className="font-medium text-ink">{prettyDate(o.date)}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted">
                    {periodLabel(o)} · {o.start.replace(":", "g")}–{o.end.replace(":", "g")} · {o.room} · {o.groupCode}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-[11px] text-subtle">
                  {weekdayShort(o.date)}
                  {past ? " · xong" : ""}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}
