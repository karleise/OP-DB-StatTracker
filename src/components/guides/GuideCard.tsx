import Image from "next/image";
import Link from "next/link";
import { COLOR_HEX } from "@/lib/utils";
import { leaderImageSrc } from "@/lib/leader-image";

type GuideForCard = {
  id: string;
  leader: {
    id: string;
    name: string;
    imageUrl: string;
  };
  colors:     { color: { id: number; name: string; hex: string | null } }[];
  difficulty: { name: string };
  playStyles: { playStyle: { id: number; name: string } }[];
};

export default function GuideCard({ guide }: { guide: GuideForCard }) {
  const guideColors = guide.colors.map((c) => c.color);
  const c0 = guideColors[0]?.hex || COLOR_HEX[guideColors[0]?.name ?? ""] || "#444";
  const c1 = guideColors[1]?.hex || COLOR_HEX[guideColors[1]?.name ?? ""] || c0;
  const frameBackground =
    guideColors.length >= 2
      ? `linear-gradient(135deg, ${c0} 0% 50%, ${c1} 50% 100%)`
      : c0;

  return (
    <Link
      href={`/guides/${guide.id}`}
      className="group block rounded-xl p-[3px] hover:-translate-y-0.5 transition shadow-sm hover:shadow-lg"
      style={{ background: frameBackground }}
    >
      <div className="rounded-[9px] overflow-hidden bg-surface card-shine">
        <div className="relative aspect-[5/7] w-full">
          <Image
            src={leaderImageSrc(guide.leader)}
            alt={guide.leader.name}
            fill
            className="object-cover"
            sizes="(min-width: 1536px) 20vw, (min-width: 1280px) 25vw, (min-width: 640px) 33vw, 50vw"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 p-2 text-[10px]">
          {guideColors.map((c) => {
            const hex = c.hex || COLOR_HEX[c.name] || "#444";
            return (
              <span key={c.id} className="tag flex items-center gap-1" style={{ background: hex, color: "#fff" }}>
                <span className="inline-block w-2 h-2 rounded-full bg-white/80" />
                {c.name}
              </span>
            );
          })}
          <span className="tag bg-surface-2 text-foreground border border-border">{guide.difficulty.name}</span>
          {guide.playStyles.map((p) => (
            <span key={p.playStyle.id} className="tag bg-surface-2 text-foreground border border-border">
              {p.playStyle.name}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
