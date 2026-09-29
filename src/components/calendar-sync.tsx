import { CalendarCheck, Download, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { buildIcs, GCAL_IMPORT_URL, saveIcs, SESSION_REMINDER_MIN } from "@/lib/gcal";
import { ALL_OCCURRENCES } from "@/lib/schedule";
import { LECTURER } from "@/lib/schedule-data";
import { usePlanner } from "@/lib/store";

export function CalendarSync({ today }: { today: string }) {
  const filter = usePlanner((s) => s.campusFilter);
  const [busy, setBusy] = useState(false);

  async function onExport() {
    setBusy(true);
    try {
      const { todos, sessionNotes } = usePlanner.getState();
      const sessions = ALL_OCCURRENCES.filter(
        (o) => filter === "all" || o.campus === filter,
      );
      const ics = buildIcs(sessions, todos, sessionNotes, today);
      await saveIcs(ics, `mon-avenir-${today}.ics`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-clay bg-clay-surface p-4 shadow-clay-sm">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-clay-xs bg-clay-accent text-accent-fg shadow-clay-sm">
          <CalendarCheck className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-lg leading-tight tracking-tight">
            Google Calendar
          </h2>
          <p className="truncate text-sm text-muted">{LECTURER.calendarEmail}</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-ink-soft">
        Xuất lịch giảng từ hôm nay, việc chưa xong và ghi chú thành file .ics, rồi
        nhập vào Google Calendar. Buổi dạy nhắc trước {SESSION_REMINDER_MIN} phút;
        việc có giờ nhắc đúng giờ, việc không giờ nhắc lúc 7g sáng. Nhập lại lần
        sau sẽ cập nhật sự kiện cũ, không tạo trùng.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" onClick={onExport} disabled={busy}>
          <Download className="size-4" />
          Xuất file .ics
        </Button>
        <a
          href={GCAL_IMPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center gap-2 rounded-clay-xs bg-clay-surface px-4 text-sm font-medium text-ink shadow-clay-sm transition-all hover:-translate-y-0.5 hover:shadow-clay"
        >
          <ExternalLink className="size-4" />
          Mở trang nhập lịch
        </a>
      </div>
      <p className="mt-2 text-xs text-subtle">
        Từng việc hoặc buổi dạy cũng có nút “Google Calendar” để thêm riêng lẻ.
      </p>
    </section>
  );
}
