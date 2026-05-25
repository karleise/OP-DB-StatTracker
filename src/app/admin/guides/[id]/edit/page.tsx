import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import GuideForm from "@/components/guides/GuideForm";

type Ctx = { params: Promise<{ id: string }> };

export default async function EditGuidePage({ params }: Ctx) {
  const { id } = await params;

  const [guide, leaders, colors, difficulties, playStyles] = await Promise.all([
    prisma.guide.findUnique({
      where: { id },
      include: { matchups: true },
    }),
    prisma.leader.findMany({ orderBy: { id: "asc" }, select: { id: true, name: true, imageUrl: true } }),
    prisma.color.findMany({ orderBy: { name: "asc" } }),
    prisma.difficulty.findMany({ orderBy: { order: "asc" } }),
    prisma.playStyle.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!guide) notFound();

  const initial = {
    id: guide.id,
    leaderId:     guide.leaderId,
    title:        guide.title,
    body:         guide.body,
    colorId:      guide.colorId,
    difficultyId: guide.difficultyId,
    playStyleId:  guide.playStyleId,
    goodMatchups: guide.matchups.filter((m) => m.kind === "GOOD").map((m) => m.leaderId),
    badMatchups:  guide.matchups.filter((m) => m.kind === "BAD").map((m) => m.leaderId),
  };

  return (
    <div>
      <h1 className="heading-display text-3xl mb-4">Editar guía</h1>
      <GuideForm
        initial={initial}
        leaders={leaders}
        leadersWithoutGuide={leaders}
        colors={colors}
        difficulties={difficulties}
        playStyles={playStyles}
      />
    </div>
  );
}
