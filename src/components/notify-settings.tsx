import { BellRing, BellOff, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { Mascot } from "@/components/mascot";
import { Button } from "@/components/ui/button";
import {
  exactAlarmGranted,
  isNative,
  openExactAlarmSettings,
  permissionState,
  requestPermission,
  sendTest,
  type Reminder,
} from "@/lib/notify";
import { usePlanner } from "@/lib/store";
import { cn } from "@/lib/utils";

const field =
  "h-9 rounded-clay-xs bg-clay-inset px-2 text-sm text-ink shadow-clay-inset outline-none";

export function NotifySettingsCard({
  scheduled,
  next,
}: {
  scheduled: number;
  next?: Reminder;
}) {
  const s = usePlanner((st) => st.notify);
  const setNotify = usePlanner((st) => st.setNotify);
  const [perm, setPerm] = useState<string>("prompt");
  const [exact, setExact] = useState(true);
  const [msg, setMsg] = useState("");
  const native = isNative();

  useEffect(() => {
    void permissionState().then(setPerm);
    void exactAlarmGranted().then(setExact);
  }, [s.enabled]);

  async function toggle() {
    setMsg("");
    if (s.enabled) {
      setNotify({ enabled: false });
      return;
    }
    const ok = await requestPermission();
    setPerm(ok ? "granted" : "denied");
    if (ok) setNotify({ enabled: true });
    else setMsg("Chưa được cấp quyền thông báo — mở Cài đặt của máy để cho phép Mon Avenir.");
  }

  const nextLabel = next
    ? new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(next.at)
    : "";

  return (
    <section className="rounded-clay bg-clay-surface p-4 shadow-clay-sm">
      <div className="flex items-start gap-3">
        <Mascot name="rong-co-vu" float={s.enabled} className="w-16 shrink-0" />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg leading-tight tracking-tight">Thông báo</h2>
          <p className="mt-1 text-sm text-muted">
            Nhắc trước giờ giảng, tóm tắt lịch mỗi sáng và việc có đặt giờ.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={s.enabled}
          aria-label="Bật thông báo"
          onClick={toggle}
          className={cn(
            "relative mt-1 h-8 w-14 shrink-0 rounded-full transition-colors",
            s.enabled ? "bg-clay-accent shadow-clay-sm" : "bg-clay-inset shadow-clay-inset",
          )}
        >
          <span
            className={cn(
              "absolute top-1 size-6 rounded-full bg-surface shadow-clay-sm transition-[left] duration-200",
              s.enabled ? "left-7" : "left-1",
            )}
          />
        </button>
      </div>

      {s.enabled && (
        <div className="mt-4 flex flex-col gap-3 text-sm text-ink">
          <label className="flex items-center justify-between gap-3">
            Nhắc trước giờ giảng
            <select
              value={s.leadMin}
              onChange={(e) => setNotify({ leadMin: Number(e.target.value) })}
              className={field}
            >
              {[5, 10, 15, 30, 45, 60, 90].map((m) => (
                <option key={m} value={m}>
                  {m} phút
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={s.morning}
                onChange={(e) => setNotify({ morning: e.target.checked })}
                className="size-4 accent-[var(--color-accent)]"
              />
              Tóm tắt lịch trong ngày lúc
            </span>
            <input
              type="time"
              value={s.morningTime}
              disabled={!s.morning}
              onChange={(e) => e.target.value && setNotify({ morningTime: e.target.value })}
              className={cn(field, !s.morning && "opacity-50")}
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={s.todos}
              onChange={(e) => setNotify({ todos: e.target.checked })}
              className="size-4 accent-[var(--color-accent)]"
            />
            Nhắc việc cần làm có đặt giờ
          </label>

          <p className="rounded-clay-xs bg-paper-2/60 px-3 py-2 text-xs text-ink-soft">
            {native
              ? `Đã hẹn ${scheduled} thông báo trong 14 ngày tới.`
              : `${scheduled} thông báo trong 14 ngày tới. Trên web, thông báo chỉ hiện khi app đang mở — cài bản Android để nhận cả khi tắt app.`}
            {next && (
              <>
                <br />
                Kế tiếp: {nextLabel} — {next.title}
              </>
            )}
          </p>

          {native && !exact && (
            <div className="rounded-clay-xs bg-live-soft px-3 py-2 text-xs text-live">
              Máy đang tắt “Báo thức chính xác” nên thông báo có thể trễ vài phút.
              <button
                type="button"
                onClick={async () => {
                  await openExactAlarmSettings();
                  setExact(await exactAlarmGranted());
                }}
                className="ml-1 font-medium underline"
              >
                Bật trong Cài đặt
              </button>
            </div>
          )}

          <div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={async () => {
                await sendTest();
                setMsg("Đã gửi — thông báo thử sẽ hiện sau 5 giây.");
              }}
            >
              <Send className="size-4" />
              Gửi thử
            </Button>
          </div>
        </div>
      )}

      {!s.enabled && perm === "denied" && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-danger">
          <BellOff className="size-3.5" />
          Máy đang chặn thông báo của app.
        </p>
      )}
      {msg && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-soft">
          <BellRing className="size-3.5" />
          {msg}
        </p>
      )}
    </section>
  );
}
