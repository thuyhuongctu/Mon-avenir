/**
 * Huy hiệu thương hiệu "Hương AI" — nhân vật đồng hành của hệ sinh thái
 * «Je m'appelle Hương» (xem thuyhuongctu.github.io/Je-mappelle-Huong).
 * Chỉ mang tính thương hiệu/trang trí — không phải trợ lý chat thật.
 */
export function HuongAiBadge() {
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-clay-brand shadow-clay-sm sm:size-10">
        <img
          src="/brand/huong-ai.webp"
          alt="Hương AI"
          className="size-full rounded-full object-cover object-top"
        />
        <span
          className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-done shadow-clay-sm"
          aria-hidden
        />
      </span>
      <span className="hidden flex-col leading-none sm:flex">
        <span className="font-display text-xs italic text-brand">Hương AI</span>
        <span className="mt-0.5 text-[10px] text-subtle">đồng hành cùng bạn</span>
      </span>
    </div>
  );
}
