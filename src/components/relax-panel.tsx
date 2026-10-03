import { useState } from "react";
import { Headphones, Pause, Play, Stethoscope, Timer } from "lucide-react";
import { Mascot } from "@/components/mascot";
import { useNow } from "@/lib/hooks";
import {
  AMBIENCE,
  presetOf,
  PRESETS,
  useRelax,
  type Ambience,
} from "@/lib/relax-audio";
import { cn } from "@/lib/utils";

const label = "text-[11px] font-medium uppercase tracking-wider text-subtle";
const chip = (on: boolean) =>
  cn(
    "rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150",
    on
      ? "bg-ink text-paper shadow-clay-sm"
      : "bg-paper-2 text-muted hover:text-ink",
  );

const TIMERS = [0, 15, 30, 60];

export function RelaxPanel() {
  // Cập nhật từng giây cho vòng thở và đồng hồ hẹn giờ.
  const now = useNow(1000);
  const {
    playing,
    presetId,
    ambience,
    volume,
    endsAt,
    timerMin,
    play,
    stop,
    setPreset,
    setAmbience,
    setVolume,
    setTimer,
  } = useRelax();
  const preset = presetOf(presetId);
  // Lệch pha cố định lúc mở tab để vòng thở khớp với chữ tính theo đồng hồ.
  const [breathDelay] = useState(() => `-${Date.now() % 10000}ms`);
  const inhale = now.getTime() % 10000 < 4000;
  const left = endsAt
    ? Math.max(0, Math.ceil((endsAt - now.getTime()) / 1000))
    : 0;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 pb-28 pt-4 sm:px-6">
      <header className="relative overflow-hidden rounded-clay bg-clay-surface p-5 pr-28 shadow-clay sm:pr-36">
        <Mascot
          name="rong-sen"
          float={playing}
          className="absolute right-3 top-3 w-24 sm:right-6 sm:w-28"
        />
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-subtle">
          Nhạc không lời
        </p>
        <h1 className="mt-1 font-display text-[1.75rem] leading-tight tracking-tight text-ink">
          Thư giãn
        </h1>
        <p className="mt-2 text-sm text-muted">
          {preset.name} · {preset.hz} Hz · {preset.wave}
        </p>
      </header>

      <section className="flex flex-col items-center gap-4 rounded-clay bg-clay-surface p-6 shadow-clay-sm">
        <div className="relative flex size-44 items-center justify-center">
          <span
            className={cn(
              "absolute inset-0 rounded-full bg-accent-soft shadow-clay-inset",
              playing && "breathe",
            )}
            style={{ animationDelay: breathDelay }}
            aria-hidden
          />
          <button
            type="button"
            onClick={() => (playing ? stop() : void play())}
            className="relative flex size-24 items-center justify-center rounded-full bg-clay-accent text-accent-fg shadow-clay transition-transform active:scale-95"
            aria-label={playing ? "Dừng" : "Phát"}
          >
            {playing ? (
              <Pause className="size-9" />
            ) : (
              <Play className="ml-1 size-9" />
            )}
          </button>
        </div>
        <p className="h-5 text-sm text-muted">
          {playing
            ? inhale
              ? "Hít vào… (4 giây)"
              : "Thở ra chậm… (6 giây)"
            : "Bấm để bắt đầu — nhạc lớn dần lúc mở"}
        </p>
        {endsAt && (
          <p className="flex items-center gap-1 text-xs text-subtle">
            <Timer className="size-3.5" />
            Tự tắt sau {Math.floor(left / 60)}:
            {String(left % 60).padStart(2, "0")}
          </p>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <span className={label}>Tần số</span>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPreset(p.id)}
              className={cn(
                "rounded-clay-sm p-3 text-left transition-all duration-150",
                p.calm && "col-span-2",
                p.id === presetId
                  ? "bg-clay-accent text-accent-fg shadow-clay"
                  : "bg-clay-surface shadow-clay-sm",
              )}
            >
              <span className="font-display text-2xl tabular-nums leading-none">
                {p.hz}
              </span>
              <span className="ml-1 text-xs opacity-70">Hz</span>
              <span className="mt-1 block text-sm font-medium">{p.name}</span>
              <span
                className={cn(
                  "block text-[11px]",
                  p.id === presetId ? "opacity-80" : "text-subtle",
                )}
              >
                {p.wave} · {p.hint}
              </span>
            </button>
          ))}
        </div>
      </section>

      {preset.id === "dau-rang" && <ToothacheTips />}

      <section className="flex flex-col gap-4 rounded-clay bg-clay-surface p-4 shadow-clay-sm">
        <div className="flex flex-col gap-2">
          <span className={label}>Âm thanh nền</span>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(AMBIENCE) as Ambience[]).map((a) => (
              <button
                key={a}
                type="button"
                className={chip(ambience === a)}
                onClick={() => setAmbience(a)}
              >
                {AMBIENCE[a]}
              </button>
            ))}
          </div>
        </div>
        <label className="flex flex-col gap-2">
          <span className={label}>Âm lượng · {Math.round(volume * 100)}%</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="accent-[var(--color-accent)]"
          />
        </label>
        <div className="flex flex-col gap-2">
          <span className={label}>Hẹn giờ tắt</span>
          <div className="flex flex-wrap gap-2">
            {TIMERS.map((m) => {
              const on = m === 0 ? !endsAt : timerMin === m && !!endsAt;
              return (
                <button
                  key={m}
                  type="button"
                  className={chip(on)}
                  onClick={() => setTimer(m)}
                >
                  {m === 0 ? "Không" : `${m} phút`}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <p className="flex gap-2 px-1 text-[11px] leading-relaxed text-subtle">
        <Headphones className="size-4 shrink-0" />
        Nhạc được tạo trực tiếp trong app. Đeo tai nghe để nghe rõ nhịp binaural
        (hai tai lệch vài Hz). Nhạc chỉ giúp thư giãn, không thay thế tư vấn hay
        điều trị y khoa; không nghe khi đang lái xe.
      </p>
    </div>
  );
}

/** Mẹo tạm thời khi đau răng, kèm dấu hiệu cần đi khám ngay. */
function ToothacheTips() {
  return (
    <section className="relative overflow-hidden rounded-clay bg-clay-surface p-4 pr-24 shadow-clay-sm">
      <Mascot
        name="rong-suy-nghi"
        float={false}
        className="absolute -bottom-1 right-2 w-20"
      />
      <h2 className="flex items-center gap-2 font-display text-lg tracking-tight">
        <Stethoscope className="size-4 text-accent" />
        Trong lúc chờ gặp nha sĩ
      </h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">
        <li>Súc miệng nhẹ bằng nước muối ấm.</li>
        <li>
          Chườm lạnh bên ngoài má (bọc khăn) khoảng 15 phút, nghỉ rồi lặp lại.
        </li>
        <li>
          Kê cao gối khi nằm; tránh nhai bên đau, tránh đồ quá nóng, quá lạnh,
          quá ngọt.
        </li>
        <li>
          Thuốc giảm đau không kê đơn chỉ dùng đúng liều trên hướng dẫn hoặc
          theo dược sĩ.
        </li>
        <li>Nghe nhạc, thở ra chậm hơn hít vào để cơ hàm và cổ thả lỏng.</li>
      </ul>
      <p className="mt-3 rounded-clay-xs bg-live-soft px-3 py-2 text-xs text-live">
        Đi khám ngay nếu sưng mặt hoặc nướu, sốt, khó nuốt hay khó thở, hoặc đau
        kéo dài quá 1–2 ngày.
      </p>
      <p className="mt-2 text-[11px] text-subtle">
        Nhạc giúp thư giãn và phân tán sự chú ý khỏi cơn đau, không chữa được
        nguyên nhân gây đau răng.
      </p>
    </section>
  );
}
