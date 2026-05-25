import { prisma } from "@/lib/prisma";
import GuideForm from "@/components/guides/GuideForm";

export default async function NewGuidePage() {
  const [leaders, colors, difficulties, playStyles] = await Promise.all([
    prisma.leader.findMany({ orderBy: { id: "asc" }, select: { id: true, name: true, imageUrl: true } }),
    prisma.color.findMany({ orderBy: { name: "asc" } }),
    prisma.difficulty.findMany({ orderBy: { order: "asc" } }),
    prisma.playStyle.findMany({ orderBy: { name: "asc" } }),
  ]);

  const leadersWithoutGuide = await prisma.leader.findMany({
    where: { guide: { is: null } },
    orderBy: { id: "asc" },
    select: { id: true, name: true, imageUrl: true },
  });

  return (
    <div>
      <h1 className="heading-display text-3xl mb-4">Nueva guía</h1>
      <GuideForm
        leaders={leaders}
        leadersWithoutGuide={leadersWithoutGuide}
        colors={colors}
        difficulties={difficulties}
        playStyles={playStyles}
      />
    </div>
  );
}
