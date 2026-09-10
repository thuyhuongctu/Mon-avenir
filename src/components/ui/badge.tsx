import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Tone = "muted" | "accent" | "ctu" | "vlute" | "live" | "done" | "warn";

const TONE: Record<Tone, string> = {
  muted: "bg-paper-2 text-muted",
  accent: "bg-accent-soft text-accent",
  ctu: "bg-ctu-soft text-ctu",
  vlute: "bg-vlute-soft text-vlute",
  live: "bg-live-soft text-live",
  done: "bg-accent-soft text-done",
  warn: "bg-live-soft text-warn",
};

export function Badge({
  className,
  tone = "muted",
  ...props
}: ComponentProps<"span"> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide",
        TONE[tone],
        className,
      )}
      {...props}
    />
  );
}
