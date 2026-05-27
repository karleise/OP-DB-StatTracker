import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import GuideCard from "@/components/guides/GuideCard";
import GuideFilters from "@/components/guides/GuideFilters";
import { getCurrentGame } from "@/lib/game";

type SearchParams = Promise<{
  q?: string;
  mode?: string;
  c?: string | string[];
  difficultyId?: string;
  playStyleId?: string;
  sort?: string;
}>;

export default async function GuidesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const game = await getCurrentGame();
  const allowBiColor = game === "OP";
  const rawMode = sp.mode === "mono" || sp.mode === "bi" ? sp.mode : null;
  const mode = !allowBiColor && rawMode === "bi" ? "mono" : rawMode;
  const colorIds = (Array.isArray(sp.c) ? sp.c : sp.c ? [sp.c] : [])
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0)
    .slice(0, mode === "bi" ? 2 : mode === "mono" ? 1 : 0);

  const where: Prisma.GuideWhereInput = {
    leader: { game },
    ...(sp.difficultyId ? { difficultyId: Number(sp.difficultyId) } : {}),
    ...(sp.playStyleId  ? { playStyles: { some: { playStyleId: Number(sp.playStyleId) } } } : {}),
    ...(sp.q
      ? {
          OR: [
            { leader: { name: { contains: sp.q }, game } },
            { leader: { id:   { contains: sp.q }, game } },
          ],
        }
      : {}),
  };

  if (mode === "mono" && colorIds.length === 1) {
    where.colors = { some: { colorId: colorIds[0] }, every: { colorId: colorIds[0] } };
  } else if (mode === "bi" && colorIds.length === 2) {
    where.AND = [
      { colors: { some: { colorId: colorIds[0] } } },
      { colors: { some: { colorId: colorIds[1] } } },
    ];
  } else if (mode === "bi" && colorIds.length === 1) {
    where.AND = [
      { colors: { some: { colorId: colorIds[0] } } },
      { colors: { some: { colorId: { not: colorIds[0] } } } },
    ];
  }

  const [rawGuides, colors, difficulties, playStyles] = await Promise.all([
    prisma.guide.findMany({
      where,
      include: {
        leader:     { select: { id: true, name: true, imageUrl: true } },
        colors:     { include: { color: true } },
        difficulty: { select: { name: true } },
        playStyles: { include: { playStyle: { select: { id: true, name: true } } } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.color.findMany({
      where: game === "DB" ? { name: { not: "Purple" } } : undefined,
      orderBy: { name: "asc" },
    }),
    prisma.difficulty.findMany({ orderBy: { order: "asc" } }),
    prisma.playStyle.findMany({ orderBy: { name: "asc" } }),
  ]);

  let guides = mode
    ? rawGuides.filter((g) => (mode === "mono" ? g.colors.length === 1 : g.colors.length === 2))
    : rawGuides;

  const sort = sp.sort || "collection";
  if (sort === "name") {
    guides = [...guides].sort((a, b) => a.leader.name.localeCompare(b.leader.name));
  } else if (sort === "color") {
    guides = [...guides].sort((a, b) => {
      const ac = a.colors[0]?.color.name ?? "";
      const bc = b.colors[0]?.color.name ?? "";
      return ac.localeCompare(bc) || a.leader.name.localeCompare(b.leader.name);
    });
  } else {
    guides = [...guides].sort((a, b) =>
      a.leader.id.localeCompare(b.leader.id) || a.leader.name.localeCompare(b.leader.name),
    );
  }

  return (
    <div className="md:pl-72">
      <div className="px-4 sm:px-6 lg:px-10 py-6 md:py-10">
        <GuideFilters colors={colors} difficulties={difficulties} playStyles={playStyles} allowBiColor={allowBiColor} />
        <h1 className="heading-display text-3xl sm:text-4xl mb-6">Mazos</h1>
        {guides.length === 0 ? (
          <div className="rounded-xl border bg-surface p-12 text-center text-muted">
            <div className="heading-display text-2xl mb-2">Sin mazos</div>
            <p>Aún no hay mazos que coincidan con estos filtros.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {guides.map((g) => <GuideCard key={g.id} guide={g} />)}
          </div>
        )}
      </div>
    </div>
  );
}
