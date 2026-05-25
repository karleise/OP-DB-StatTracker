import { prisma } from "@/lib/prisma";
import GuideCard from "@/components/guides/GuideCard";
import GuideFilters from "@/components/guides/GuideFilters";

type SearchParams = Promise<{ q?: string; colorId?: string; difficultyId?: string; playStyleId?: string }>;

export default async function GuidesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;

  const [guides, colors, difficulties, playStyles] = await Promise.all([
    prisma.guide.findMany({
      where: {
        ...(sp.colorId      ? { colorId:      Number(sp.colorId)      } : {}),
        ...(sp.difficultyId ? { difficultyId: Number(sp.difficultyId) } : {}),
        ...(sp.playStyleId  ? { playStyleId:  Number(sp.playStyleId)  } : {}),
        ...(sp.q
          ? {
              OR: [
                { title: { contains: sp.q } },
                { leader: { name: { contains: sp.q } } },
              ],
            }
          : {}),
      },
      include: {
        leader:     { include: { colors: { include: { color: true } } } },
        color:      true,
        difficulty: true,
        playStyle:  true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.color.findMany({ orderBy: { name: "asc" } }),
    prisma.difficulty.findMany({ orderBy: { order: "asc" } }),
    prisma.playStyle.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="heading-display text-4xl mb-6">Guías de mazo</h1>
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <GuideFilters colors={colors} difficulties={difficulties} playStyles={playStyles} />
        <div>
          {guides.length === 0 ? (
            <div className="rounded-xl border bg-surface p-12 text-center text-muted">
              <div className="heading-display text-2xl mb-2">Sin guías</div>
              <p>Aún no hay guías que coincidan con estos filtros.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {guides.map((g) => <GuideCard key={g.id} guide={g} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
