import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "secondary" | "ghost" | "danger";
type Size = "default" | "sm" | "lg" | "icon" | "icon-sm";

const VARIANT: Record<Variant, string> = {
  default: "bg-clay-accent text-accent-fg shadow-clay-sm hover:-translate-y-0.5 hover:shadow-clay",
  secondary: "bg-clay-surface text-ink shadow-clay-sm hover:-translate-y-0.5 hover:shadow-clay",
  ghost: "bg-transparent text-ink-soft hover:bg-paper-2",
  danger: "bg-danger text-accent-fg shadow-clay-sm hover:-translate-y-0.5 hover:shadow-clay",
};

const SIZE: Record<Size, string> = {
  default: "h-11 rounded-clay-xs px-4 text-sm",
  sm: "h-9 rounded-clay-xs px-3 text-sm",
  lg: "h-12 rounded-clay-sm px-5 text-base",
  icon: "size-11 rounded-clay-xs",
  "icon-sm": "size-9 rounded-clay-xs",
};

export function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[transform,background-color,color,box-shadow,opacity] duration-150 ease-out disabled:pointer-events-none disabled:opacity-40 active:not-disabled:scale-[0.96]",
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...props}
    />
  );
}
