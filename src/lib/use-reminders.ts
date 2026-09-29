import { useEffect, useMemo, useRef, useState } from "react";
import { buildReminders, isNative, showWeb, syncNative } from "./notify";
import { usePlanner } from "./store";
import { dateKey } from "./time";

/**
 * Hẹn thông báo theo lịch đang dùng. Android: hẹn sẵn trong hệ thống (nhận cả
 * khi tắt app). Web: kiểm tra mỗi lần `now` đổi và hiện khi app đang mở.
 */
export function useReminders(now: Date, scheduleKey: string, hydrated: boolean) {
  const settings = usePlanner((s) => s.notify);
  const todos = usePlanner((s) => s.todos);
  const sessionNotes = usePlanner((s) => s.sessionNotes);
  const today = dateKey(now);
  const [scheduled, setScheduled] = useState(0);
  const [error, setError] = useState("");

  // Chỉ dựng lại khi dữ liệu hoặc ngày đổi, không phải mỗi 20 giây.
  const reminders = useMemo(
    () => (hydrated ? buildReminders(new Date(), today, settings, todos, sessionNotes) : []),
    [hydrated, today, settings, todos, sessionNotes, scheduleKey],
  );

  useEffect(() => {
    if (!hydrated || !isNative()) return;
    const t = setTimeout(() => {
      syncNative(reminders)
        .then((n) => {
          setScheduled(n);
          setError("");
        })
        .catch((e: unknown) => {
          setScheduled(0);
          setError(e instanceof Error ? e.message : String(e));
        });
    }, 800);
    return () => clearTimeout(t);
  }, [hydrated, reminders]);

  const lastCheck = useRef(Date.now());
  useEffect(() => {
    if (isNative() || !settings.enabled) return;
    const t = now.getTime();
    for (const r of reminders) {
      const at = r.at.getTime();
      if (at > lastCheck.current && at <= t) {
        showWeb(r).catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
      }
    }
    lastCheck.current = t;
  }, [now, reminders, settings.enabled]);

  return { scheduled: isNative() ? scheduled : reminders.length, next: reminders[0], error };
}
