import { useState } from "react";
import { AppShell, type TabId } from "@/components/app-shell";
import { CoursesPanel } from "@/components/courses-panel";
import { TodayPanel } from "@/components/today-panel";
import { TodosPanel } from "@/components/todos-panel";
import { WeekPanel } from "@/components/week-panel";
import { useNow, usePlannerHydrated } from "@/lib/hooks";

export default function App() {
  const now = useNow(20000);
  const [tab, setTab] = useState<TabId>("today");
  usePlannerHydrated();

  return (
    <AppShell tab={tab} onTab={setTab}>
      {tab === "today" && <TodayPanel now={now} />}
      {tab === "week" && <WeekPanel now={now} />}
      {tab === "todos" && <TodosPanel now={now} />}
      {tab === "courses" && <CoursesPanel now={now} />}
    </AppShell>
  );
}
