import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentGame } from "@/lib/game";

export default async function AdminDashboard() {
  const game = await getCurrentGame();
  const [users, guides, leaders, matches] = await Promise.all([
    prisma.user.count(),
    prisma.guide.count({ where: { leader: { game } } }),
    prisma.leader.count({ where: { game } }),
    prisma.match.count({ where: { playerLeader: { game } } }),
  ]);
  return (
    <div>
      <h1 className="heading-display text-3xl sm:text-4xl mb-6">Admin</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Stat label="Usuarios" v={users} />
        <Stat label="Leaders"  v={leaders} />
        <Stat label="Mazos"    v={guides} />
        <Stat label="Partidas" v={matches} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/guides"     className="btn btn-primary">Gestionar mazos</Link>
        <Link href="/admin/catalogs/colors" className="btn btn-ghost">Catálogos</Link>
      </div>
    </div>
  );
}

function Stat({ label, v }: { label: string; v: number }) {
  return (
    <div className="rounded-xl border bg-surface p-4">
      <div className="heading-display text-3xl text-accent-yellow">{v}</div>
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
}
