import { useMemo, useState } from "react";
import { AppShell, type TabId } from "@/components/app-shell";
import { CoursesPanel } from "@/components/courses-panel";
import { LoansPanel } from "@/components/loans-panel";
import { TodayPanel } from "@/components/today-panel";
import { TodosPanel } from "@/components/todos-panel";
import { WeekPanel } from "@/components/week-panel";
import { useNow, usePlannerHydrated } from "@/lib/hooks";
import { setSchedule } from "@/lib/schedule";
import { COURSES, SLOTS } from "@/lib/schedule-data";
import { usePlanner } from "@/lib/store";
import { useReminders } from "@/lib/use-reminders";

export default function App() {
  const now = useNow(20000);
  const [tab, setTab] = useState<TabId>("today");
  const hydrated = usePlannerHydrated();
  const imports = usePlanner((s) => s.imports);
  const hideBuiltin = usePlanner((s) => s.hideBuiltin);

  // Dựng lại lịch đang dùng trước khi các tab render; key đổi để tab tính lại.
  const scheduleKey = useMemo(() => {
    setSchedule(
      [...(hideBuiltin ? [] : COURSES), ...imports.flatMap((i) => i.courses)],
      [...(hideBuiltin ? [] : SLOTS), ...imports.flatMap((i) => i.slots)],
    );
    return `${hideBuiltin}-${imports.map((i) => i.id).join(",")}`;
  }, [imports, hideBuiltin]);
  const reminders = useReminders(now, scheduleKey, hydrated);

  return (
    <AppShell tab={tab} onTab={setTab}>
      {tab === "today" && <TodayPanel key={scheduleKey} now={now} />}
      {tab === "week" && <WeekPanel key={scheduleKey} now={now} />}
      {tab === "todos" && <TodosPanel key={scheduleKey} now={now} reminders={reminders} />}
      {tab === "courses" && <CoursesPanel key={scheduleKey} now={now} />}
      {tab === "loans" && <LoansPanel now={now} />}
    </AppShell>
  );
}
