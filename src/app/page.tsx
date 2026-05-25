import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const [guides, matches, leaders] = await Promise.all([
    prisma.guide.count().catch(() => 0),
    prisma.match.count().catch(() => 0),
    prisma.leader.count().catch(() => 0),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <section className="text-center mb-16">
        <h1 className="heading-display text-5xl sm:text-7xl">
          ONE PIECE CARD GAME
          <br />
          <span className="text-[color:var(--accent)]">guías &amp; stats</span>
        </h1>
        <p className="mt-4 text-[color:var(--muted)] max-w-2xl mx-auto">
          Construye tu base de conocimiento de mazos, encuentra matchups y registra
          cada partida para entender tu juego.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/guides"     className="btn btn-primary">Ver guías</Link>
          <Link href="/randomizer" className="btn btn-yellow">Emparejador</Link>
          <Link href="/stats"      className="btn btn-ghost">Estadísticas</Link>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Leaders" value={leaders} />
        <Stat label="Guías"   value={guides} />
        <Stat label="Partidas registradas" value={matches} />
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 text-center">
      <div className="heading-display text-5xl text-[color:var(--accent-yellow)]">{value}</div>
      <div className="mt-2 text-sm uppercase tracking-wide text-[color:var(--muted)]">{label}</div>
    </div>
  );
}
