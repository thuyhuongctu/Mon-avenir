import { cn } from "@/lib/utils";

/** Đường dẫn file trong public/, đúng cả trên GitHub Pages (/Mon-avenir/) lẫn Android. */
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export type MascotName =
  | "rong-hoc-gia"
  | "rong-co-vu"
  | "rong-ngac-nhien"
  | "rong-suy-nghi"
  | "rong-yeu-thuong"
  | "rong-cup"
  | "rong-sen"
  | "huong-aodai";

const ALT: Record<MascotName, string> = {
  "rong-hoc-gia": "Rồng đất sét đeo kính, bên cuộn giấy và chậu sen",
  "rong-co-vu": "Rồng đất sét vẫy cờ vàng",
  "rong-ngac-nhien": "Rồng đất sét ngạc nhiên",
  "rong-suy-nghi": "Rồng đất sét đang suy nghĩ",
  "rong-yeu-thuong": "Rồng đất sét thả tim",
  "rong-cup": "Rồng đất sét ôm cúp vàng",
  "rong-sen": "Rồng đất sét ôm hoa sen hồng",
  "huong-aodai": "Thùy Hương mặc áo dài trắng cầm hoa sen",
};

export function Mascot({
  name,
  className,
  float = true,
}: {
  name: MascotName;
  className?: string;
  float?: boolean;
}) {
  return (
    <img
      src={asset(`brand/${name}.webp`)}
      alt={ALT[name]}
      loading="lazy"
      draggable={false}
      className={cn("clay-figure pointer-events-none select-none", float && "clay-float", className)}
    />
  );
}
