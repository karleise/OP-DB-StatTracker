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
      colors: { include: { color: true } },
      difficulty: true,
      playStyles: { include: { playStyle: true } },
      matchups: {
        include: { leader: { include: { colors: { include: { color: true } } } } },
      },
    },
  });
  if (!guide) notFound();

  const good = guide.matchups.filter((m) => m.kind === "GOOD");
  const bad  = guide.matchups.filter((m) => m.kind === "BAD");
  const guideColors = guide.colors.map((c) => c.color);
  const primaryHex = guideColors[0]?.hex || COLOR_HEX[guideColors[0]?.name ?? ""] || "#d83a3a";

  return (
    <article className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-10">
      <header className="grid md:grid-cols-[320px_1fr] gap-6 mb-8">
        <div
          className="rounded-xl overflow-hidden border-[3px] w-full max-w-[260px] sm:max-w-[320px] mx-auto md:mx-0"
          style={{ borderColor: primaryHex }}
        >
          <Image
            src={leaderImageSrc(guide.leader)}
            alt={guide.leader.name}
            width={640}
            height={896}
            className="w-full h-auto"
          />
        </div>
        <div>
          <div className="flex flex-wrap gap-2 mb-3">
            {guideColors.map((c) => {
              const hex = c.hex || COLOR_HEX[c.name] || "#444";
              return (
                <span key={c.id} className="tag flex items-center gap-1.5 px-3 py-1 text-xs" style={{ background: hex, color: "#fff" }}>
                  <span className="inline-block w-2.5 h-2.5 rounded-full ring-2 ring-white/70" />
                  {c.name}
                </span>
              );
            })}
            <span className="tag bg-surface-2 border border-border px-3 py-1 text-xs">{guide.difficulty.name}</span>
            {guide.playStyles.map((p) => (
              <span key={p.playStyle.id} className="tag bg-surface-2 border border-border px-3 py-1 text-xs">
                {p.playStyle.name}
              </span>
            ))}
          </div>
          <h1 className="heading-display text-3xl sm:text-4xl md:text-5xl">{guide.leader.name}</h1>
          <div className="mt-1 text-muted font-mono">{guide.leader.id}</div>
        </div>
      </header>

      <section className="surface rounded-xl p-4 sm:p-6 mb-12 leading-relaxed text-foreground/95 [&_h2]:heading-display [&_h2]:text-2xl [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:font-bold [&_h3]:text-lg [&_h3]:mt-3 [&_h3]:mb-1 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3 [&_strong]:font-bold [&_strong]:text-accent [&_a]:underline [&_a]:text-accent-blue">
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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((leader) => (
            <LeaderCard key={leader.id} leader={leader} size="sm" />
          ))}
        </div>
      )}
    </div>
  );
}
