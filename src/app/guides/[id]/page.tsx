import { notFound } from "next/navigation";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { prisma } from "@/lib/prisma";
import LeaderCard from "@/components/leaders/LeaderCard";
import { COLOR_HEX } from "@/lib/utils";
import { leaderImageSrc } from "@/lib/leader-image";

type Ctx = { params: Promise<{ id: string }> };

export default async function GuideDetailPage({ params }: Ctx) {
  const { id } = await params;
  const guide = await prisma.guide.findUnique({
    where: { id },
    include: {
      leader: { include: { colors: { include: { color: true } } } },
      color: true,
      difficulty: true,
      playStyle: true,
      matchups: {
        include: { leader: { include: { colors: { include: { color: true } } } } },
      },
    },
  });
  if (!guide) notFound();

  const good = guide.matchups.filter((m) => m.kind === "GOOD");
  const bad  = guide.matchups.filter((m) => m.kind === "BAD");
  const accent = guide.color.hex || COLOR_HEX[guide.color.name] || "#d83a3a";

  return (
    <article className="max-w-6xl mx-auto px-4 py-10">
      <header className="grid md:grid-cols-[320px_1fr] gap-6 mb-8">
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: accent }}>
          <Image
            src={leaderImageSrc(guide.leader)}
            alt={guide.leader.name}
            width={320}
            height={448}
            className="w-full h-auto"
            unoptimized
          />
        </div>
        <div>
          <div className="flex flex-wrap gap-2 mb-2">
            <span className="tag" style={{ background: accent, color: "#fff" }}>{guide.color.name}</span>
            <span className="tag bg-surface-2 border border-border">{guide.difficulty.name}</span>
            <span className="tag bg-surface-2 border border-border">{guide.playStyle.name}</span>
          </div>
          <h1 className="heading-display text-5xl">{guide.title}</h1>
          <div className="mt-1 text-muted">{guide.leader.name} · <span className="font-mono">{guide.leader.id}</span></div>
        </div>
      </header>

      <section className="surface rounded-xl p-6 mb-12 leading-relaxed text-foreground/95 [&_h2]:heading-display [&_h2]:text-2xl [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:font-bold [&_h3]:text-lg [&_h3]:mt-3 [&_h3]:mb-1 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3 [&_strong]:font-bold [&_strong]:text-accent [&_a]:underline [&_a]:text-accent-blue">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{guide.body}</ReactMarkdown>
      </section>

      <section className="grid md:grid-cols-2 gap-8 mb-8">
        <Block title="Matchups buenos" accent="#3aa760" items={good.map((m) => m.leader)} />
        <Block title="Matchups malos"  accent="#d83a3a" items={bad.map((m) => m.leader)} />
      </section>
    </article>
  );
}

function Block({
  title, accent, items,
}: { title: string; accent: string; items: { id: string; name: string; imageUrl: string; colors: { color: { name: string } }[] }[] }) {
  return (
    <div className="rounded-xl border bg-surface p-4">
      <div className="heading-display text-2xl mb-4" style={{ color: accent }}>{title}</div>
      {items.length === 0 ? (
        <div className="text-muted text-sm">Sin entradas</div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {items.map((leader) => (
            <LeaderCard key={leader.id} leader={leader} size="sm" />
          ))}
        </div>
      )}
    </div>
  );
}
