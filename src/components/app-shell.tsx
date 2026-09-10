import type { ReactNode } from "react";
import {
  BookOpen,
  CalendarDays,
  CheckSquare,
  Sun,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HuongAiBadge } from "@/components/huong-ai-badge";
import { CAMPUSES, LECTURER } from "@/lib/schedule-data";
import { usePlanner, type CampusFilter } from "@/lib/store";
import { cn } from "@/lib/utils";

export type TabId = "today" | "week" | "todos" | "courses";

const TABS: { id: TabId; label: string; icon: typeof Sun }[] = [
  { id: "today", label: "Hôm nay", icon: Sun },
  { id: "week", label: "Tuần", icon: CalendarDays },
  { id: "todos", label: "Việc", icon: CheckSquare },
  { id: "courses", label: "Môn", icon: BookOpen },
];

const FILTERS: { id: CampusFilter; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "vlute", label: "VLUTE" },
  { id: "ctu", label: "CTU" },
];

export function AppShell({
  tab,
  onTab,
  children,
}: {
  tab: TabId;
  onTab: (t: TabId) => void;
  children: ReactNode;
}) {
  const filter = usePlanner((s) => s.campusFilter);
  const setFilter = usePlanner((s) => s.setCampusFilter);

  return (
    <div className="paper-bg min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-black/5 bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg leading-none tracking-tight text-ink italic">
              Mon Avenir
            </p>
            <p className="mt-1 truncate text-xs text-muted">
              {LECTURER.title} {LECTURER.name}
            </p>
          </div>
          <HuongAiBadge />
          <div className="hidden items-center gap-1 sm:flex">
            <Badge tone="vlute">{CAMPUSES.vlute.role}</Badge>
            <Badge tone="ctu">{CAMPUSES.ctu.role}</Badge>
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl gap-2 px-4 pb-3 sm:px-6">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150",
                filter === f.id
                  ? "bg-ink text-paper shadow-clay-sm"
                  : "bg-paper-2 text-muted hover:text-ink",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      <main className="min-h-0">{children}</main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-md items-center justify-around gap-1 rounded-clay bg-clay-surface px-2 py-2 shadow-clay sm:bottom-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2"
        aria-label="Điều hướng chính"
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = id === tab;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTab(id)}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-clay-xs px-3 py-1.5 text-[11px] font-medium transition-all duration-150 sm:flex-none sm:px-4",
                active
                  ? "bg-clay-accent-inset text-accent-fg shadow-clay-inset"
                  : "text-subtle hover:text-ink",
              )}
            >
              <Icon className="size-5" strokeWidth={active ? 2.2 : 1.8} />
              {label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
