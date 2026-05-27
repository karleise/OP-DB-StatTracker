import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import GuideForm from "@/components/guides/GuideForm";

type Ctx = { params: Promise<{ id: string }> };

export default async function EditGuidePage({ params }: Ctx) {
  const { id } = await params;

  const guide = await prisma.guide.findUnique({
    where: { id },
    include: { matchups: true, colors: true, playStyles: true, leader: { select: { game: true } } },
  });
  if (!guide) notFound();

  const game = guide.leader.game;

  const [leaders, colors, difficulties, playStyles] = await Promise.all([
    prisma.leader.findMany({ where: { game }, orderBy: { id: "asc" }, select: { id: true, name: true, imageUrl: true } }),
    prisma.color.findMany({
      where: game === "DB" ? { name: { not: "Purple" } } : undefined,
      orderBy: { name: "asc" },
    }),
    prisma.difficulty.findMany({ orderBy: { order: "asc" } }),
    prisma.playStyle.findMany({ orderBy: { name: "asc" } }),
  ]);

  const initial = {
    id: guide.id,
    leaderId:     guide.leaderId,
    body:         guide.body,
    colorIds:     guide.colors.map((c) => c.colorId),
    difficultyId: guide.difficultyId,
    playStyleIds: guide.playStyles.map((p) => p.playStyleId),
    goodMatchups: guide.matchups.filter((m) => m.kind === "GOOD").map((m) => m.leaderId),
    badMatchups:  guide.matchups.filter((m) => m.kind === "BAD").map((m) => m.leaderId),
  };

  return (
    <div>
      <h1 className="heading-display text-2xl sm:text-3xl mb-4">Editar mazo</h1>
      <GuideForm
        initial={initial}
        leaders={leaders}
        leadersWithoutGuide={leaders}
        colors={colors}
        difficulties={difficulties}
        playStyles={playStyles}
        maxColors={game === "DB" ? 1 : 2}
      />
    </div>
  );
}
