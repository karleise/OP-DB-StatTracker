import { prisma } from "@/lib/prisma";
import GuideForm from "@/components/guides/GuideForm";
import { getCurrentGame } from "@/lib/game";

export default async function NewGuidePage() {
  const game = await getCurrentGame();
  const [leaders, colors, difficulties, playStyles] = await Promise.all([
    prisma.leader.findMany({ where: { game }, orderBy: { id: "asc" }, select: { id: true, name: true, imageUrl: true } }),
    prisma.color.findMany({
      where: game === "DB" ? { name: { not: "Purple" } } : undefined,
      orderBy: { name: "asc" },
    }),
    prisma.difficulty.findMany({ orderBy: { order: "asc" } }),
    prisma.playStyle.findMany({ orderBy: { name: "asc" } }),
  ]);

  const leadersWithoutGuide = await prisma.leader.findMany({
    where: { game, guide: { is: null } },
    orderBy: { id: "asc" },
    select: { id: true, name: true, imageUrl: true },
  });

  return (
    <div>
      <h1 className="heading-display text-2xl sm:text-3xl mb-4">Nuevo mazo</h1>
      <GuideForm
        leaders={leaders}
        leadersWithoutGuide={leadersWithoutGuide}
        colors={colors}
        difficulties={difficulties}
        playStyles={playStyles}
        maxColors={game === "DB" ? 1 : 2}
      />
    </div>
  );
}
