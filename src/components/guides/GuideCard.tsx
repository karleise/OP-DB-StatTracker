import Image from "next/image";
import Link from "next/link";
import { COLOR_HEX } from "@/lib/utils";
import { leaderImageSrc } from "@/lib/leader-image";

type GuideForCard = {
  id: string;
  title: string;
  leader: {
    id: string;
    name: string;
    imageUrl: string;
    colors: { color: { name: string } }[];
  };
  color:      { name: string; hex: string | null };
  difficulty: { name: string };
  playStyle:  { name: string };
};

export default function GuideCard({ guide }: { guide: GuideForCard }) {
  const colorName = guide.leader.colors[0]?.color.name ?? guide.color.name;
  const hex = guide.color.hex || COLOR_HEX[colorName] || "#444";

  return (
    <Link
      href={`/guides/${guide.id}`}
      className="group block rounded-xl overflow-hidden border bg-surface hover:-translate-y-0.5 transition card-shine"
      style={{ borderColor: hex }}
    >
      <div className="relative aspect-[5/7] w-full">
        <Image
          src={leaderImageSrc(guide.leader)}
          alt={guide.leader.name}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          unoptimized
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-3 text-white">
          <div className="heading-display text-xl leading-tight">{guide.title}</div>
          <div className="text-xs text-white/80">{guide.leader.name}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 p-2 text-[10px]">
        <span className="tag" style={{ background: hex, color: "#fff" }}>{guide.color.name}</span>
        <span className="tag bg-surface-2 text-foreground border border-border">{guide.difficulty.name}</span>
        <span className="tag bg-surface-2 text-foreground border border-border">{guide.playStyle.name}</span>
      </div>
    </Link>
  );
}
