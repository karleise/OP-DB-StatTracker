import Image from "next/image";
import Link from "next/link";
import { COLOR_HEX } from "@/lib/utils";

type Props = {
  leader: {
    id: string;
    name: string;
    imageUrl: string;
    colors?: Array<{ color: { name: string } } | { name: string }>;
  };
  size?: "sm" | "md" | "lg";
  href?: string;
  caption?: string;
};

export default function LeaderCard({ leader, size = "md", href, caption }: Props) {
  const first = leader.colors?.[0] as { color?: { name: string }; name?: string } | undefined;
  const colorName = first?.color?.name ?? first?.name ?? null;
  const colorHex = (colorName && COLOR_HEX[colorName]) || "#444";

  const dims =
    size === "sm" ? { w: 130, h: 182 } :
    size === "lg" ? { w: 320, h: 448 } :
                    { w: 220, h: 308 };

  const inner = (
    <div
      className="group rounded-xl overflow-hidden border bg-surface card-shine transition hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
      style={{ borderColor: colorHex }}
    >
      <div className="relative" style={{ width: dims.w, height: dims.h }}>
        <Image
          src={leader.imageUrl}
          alt={leader.name}
          width={dims.w}
          height={dims.h}
          className="object-cover w-full h-full"
          unoptimized
        />
      </div>
      <div className="p-2 text-xs uppercase tracking-wide font-bold flex items-center justify-between">
        <span className="truncate">{caption ?? leader.name}</span>
        <span className="text-muted font-mono text-[10px]">{leader.id}</span>
      </div>
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}
