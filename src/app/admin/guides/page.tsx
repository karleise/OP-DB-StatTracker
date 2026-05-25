import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminGuidesPage() {
  const guides = await prisma.guide.findMany({
    include: { leader: true, color: true, difficulty: true, playStyle: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="heading-display text-3xl">Guías</h1>
        <Link href="/admin/guides/new" className="btn btn-primary">+ Nueva guía</Link>
      </div>
      <div className="rounded-xl border bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left uppercase tracking-wide text-xs text-muted">
            <tr>
              <th className="px-3 py-2">Leader</th>
              <th className="px-3 py-2">Título</th>
              <th className="px-3 py-2">Color</th>
              <th className="px-3 py-2">Dif.</th>
              <th className="px-3 py-2">Estilo</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {guides.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-muted">Sin guías aún. Crea la primera.</td></tr>
            )}
            {guides.map((g) => (
              <tr key={g.id} className="hover:bg-surface-2">
                <td className="px-3 py-2">{g.leader.name} <span className="font-mono text-xs text-muted">{g.leader.id}</span></td>
                <td className="px-3 py-2">{g.title}</td>
                <td className="px-3 py-2">{g.color.name}</td>
                <td className="px-3 py-2">{g.difficulty.name}</td>
                <td className="px-3 py-2">{g.playStyle.name}</td>
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
