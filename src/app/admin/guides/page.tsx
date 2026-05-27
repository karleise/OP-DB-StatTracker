import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { COLOR_HEX } from "@/lib/utils";
import { getCurrentGame } from "@/lib/game";

export default async function AdminGuidesPage() {
  const game = await getCurrentGame();
  const guides = await prisma.guide.findMany({
    where: { leader: { game } },
    include: {
      leader: true,
      colors: { include: { color: true } },
      difficulty: true,
      playStyles: { include: { playStyle: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <h1 className="heading-display text-2xl sm:text-3xl">Mazos</h1>
        <Link href="/admin/guides/new" className="btn btn-primary">+ Nuevo mazo</Link>
      </div>
      <div className="rounded-xl border bg-surface overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="bg-surface-2 text-left uppercase tracking-wide text-xs text-muted">
            <tr>
              <th className="px-3 py-2">Leader</th>
              <th className="px-3 py-2">Colores</th>
              <th className="px-3 py-2">Dif.</th>
              <th className="px-3 py-2">Estilo</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {guides.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-muted">Sin mazos aún. Crea el primero.</td></tr>
            )}
            {guides.map((g) => (
              <tr key={g.id} className="hover:bg-surface-2">
                <td className="px-3 py-2">{g.leader.name} <span className="font-mono text-xs text-muted">{g.leader.id}</span></td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    {g.colors.map((c) => {
                      const hex = c.color.hex || COLOR_HEX[c.color.name] || "#888";
                      return (
                        <span
                          key={c.color.id}
                          title={c.color.name}
                          className="inline-block w-4 h-4 rounded-full ring-1 ring-black/20"
                          style={{ background: hex }}
                        />
                      );
                    })}
                  </div>
                </td>
                <td className="px-3 py-2">{g.difficulty.name}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {g.playStyles.map((p) => (
                      <span key={p.playStyleId} className="tag bg-surface-2 border border-border text-[10px]">
                        {p.playStyle.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2 text-right">
                  <Link href={`/admin/guides/${g.id}/edit`} className="text-accent underline">Editar</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
