import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentGame, GAMES } from "@/lib/game";

export default async function HomePage() {
  const game = await getCurrentGame();
  const gameLabel = (GAMES.find((g) => g.code === game)?.label ?? "One Piece") + " Card Game";
  const [guides, matches, leaders] = await Promise.all([
    prisma.guide.count({ where: { leader: { game } } }).catch(() => 0),
    prisma.match.count({ where: { playerLeader: { game } } }).catch(() => 0),
    prisma.leader.count({ where: { game } }).catch(() => 0),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <section className="text-center mb-12 sm:mb-16">
        <h1 className="heading-display text-4xl sm:text-6xl md:text-7xl">
          {gameLabel.toUpperCase()}
          <br />
          <span className="text-[color:var(--accent)]">mazos &amp; stats</span>
        </h1>
        <p className="mt-4 text-[color:var(--muted)] max-w-2xl mx-auto">
          Construye tu base de conocimiento de mazos, encuentra matchups y registra
          cada partida para entender tu juego.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/guides"     className="btn btn-primary">Ver mazos</Link>
          <Link href="/randomizer" className="btn btn-yellow">Emparejador</Link>
          <Link href="/stats"      className="btn btn-ghost">Estadísticas</Link>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Leaders" value={leaders} />
        <Stat label="Mazos"   value={guides} />
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
