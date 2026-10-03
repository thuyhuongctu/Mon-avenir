import type { ReactNode } from "react";
import {
  BookOpen,
  CalendarDays,
  CheckSquare,
  Music,
  Sun,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HuongAiBadge } from "@/components/huong-ai-badge";
import { CAMPUSES, LECTURER } from "@/lib/schedule-data";
import { useRelax } from "@/lib/relax-audio";
import { usePlanner, type CampusFilter } from "@/lib/store";
import { cn } from "@/lib/utils";

export type TabId = "today" | "week" | "todos" | "courses" | "loans" | "relax";

const TABS: { id: TabId; label: string; icon: typeof Sun }[] = [
  { id: "today", label: "Hôm nay", icon: Sun },
  { id: "week", label: "Tuần", icon: CalendarDays },
  { id: "todos", label: "Việc", icon: CheckSquare },
  { id: "courses", label: "Môn", icon: BookOpen },
  { id: "loans", label: "Nợ vay", icon: Wallet },
  { id: "relax", label: "Thư giãn", icon: Music },
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
  const playing = useRelax((s) => s.playing);
  const stopMusic = useRelax((s) => s.stop);

  return (
    <div className="paper-bg min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-black/5 bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg leading-none tracking-tight text-ink italic">
              Mon Avenir
            </p>
            <p className="mt-1 truncate text-xs text-muted">
              {LECTURER.tagline}
            </p>
          </div>
          {playing && (
            <button
              type="button"
              onClick={stopMusic}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-accent-soft px-3 text-xs font-medium text-accent shadow-clay-sm"
              aria-label="Tắt nhạc thư giãn"
            >
              <Music className="live-dot size-3.5" />
              Tắt
            </button>
          )}
          <HuongAiBadge />
          <div className="hidden items-center gap-1 sm:flex">
            <Badge tone="vlute">{CAMPUSES.vlute.role}</Badge>
            <Badge tone="ctu">{CAMPUSES.ctu.role}</Badge>
          </div>
        </div>
        {tab !== "loans" && tab !== "relax" && (
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
        )}
      </header>

      <main className="min-h-0">{children}</main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-lg items-center justify-around gap-0.5 rounded-clay bg-clay-surface px-2 py-2 shadow-clay sm:bottom-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2"
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
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 whitespace-nowrap rounded-clay-xs px-1 py-1.5 text-[10.5px] font-medium transition-all duration-150 sm:flex-none sm:px-4 sm:text-[11px]",
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
