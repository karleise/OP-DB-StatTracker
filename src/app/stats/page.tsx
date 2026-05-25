import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { getGlobalStats, getPersonalStats } from "@/lib/stats";
import { leaderImageSrc } from "@/lib/leader-image";

type SearchParams = Promise<{ tab?: string }>;

export default async function StatsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const session = await auth();
  const tab = sp.tab === "mine" || sp.tab === "global" ? sp.tab : (session?.user ? "mine" : "global");

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="heading-display text-4xl">Estadísticas</h1>
        {session?.user && (
          <Link href="/stats/new" className="btn btn-primary">+ Registrar partida</Link>
        )}
      </div>

      <div className="flex gap-1 mb-6 border-b border-border">
        <TabLink href="/stats?tab=mine"   active={tab === "mine"}  disabled={!session?.user}>Mis stats</TabLink>
        <TabLink href="/stats?tab=global" active={tab === "global"}>Global</TabLink>
      </div>

      {tab === "mine"   && session?.user && <MineTab userId={session.user.id} />}
      {tab === "mine"   && !session?.user && <div className="text-muted">Inicia sesión para ver tus stats.</div>}
      {tab === "global" && <GlobalTab />}
    </div>
  );
}

function TabLink({ href, active, disabled, children }: { href: string; active: boolean; disabled?: boolean; children: React.ReactNode }) {
  if (disabled) return <span className="px-4 py-2 text-muted cursor-not-allowed">{children}</span>;
  return (
    <Link href={href} className={`px-4 py-2 -mb-px border-b-2 ${active ? "border-accent text-accent" : "border-transparent hover:text-accent"}`}>
      {children}
    </Link>
  );
}

async function MineTab({ userId }: { userId: string }) {
  const s = await getPersonalStats(userId);
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Big label="Partidas" v={s.totalMatches} />
        <Big label="Victorias" v={s.wins} accent="#3aa760" />
        <Big label="Derrotas" v={s.losses} accent="#d83a3a" />
        <Big label="Winrate %" v={s.winrate} accent="#e6c43a" />
      </div>

      {s.favoriteDeck && (
        <div className="rounded-xl border bg-surface p-4 mb-6 flex items-center gap-4">
          <Image src={leaderImageSrc(s.favoriteDeck)} alt={s.favoriteDeck.name} width={80} height={112} className="rounded-md" unoptimized />
          <div>
            <div className="text-xs uppercase tracking-wide text-muted">Mazo favorito</div>
            <div className="heading-display text-2xl">{s.favoriteDeck.name}</div>
            <div className="text-xs font-mono text-muted">{s.favoriteDeck.id}</div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Section title="Winrate por mazo mío">
          <DeckTable rows={s.byDeck} />
        </Section>
        <Section title="Resultado contra leader rival">
          <DeckTable rows={s.byRivalLeader} />
        </Section>
      </div>

      <Section title="Últimas partidas">
        {s.recentMatches.length === 0 && <div className="text-muted text-sm">Sin partidas aún.</div>}
        <div className="rounded-xl border bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left uppercase tracking-wide text-xs text-muted">
              <tr>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Mi mazo</th>
                <th className="px-3 py-2">Rival</th>
                <th className="px-3 py-2">Mazo rival</th>
                <th className="px-3 py-2">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {s.recentMatches.map((m) => (
                <tr key={m.id}>
                  <td className="px-3 py-2 text-xs text-muted">{m.playedAt.toISOString().slice(0, 10)}</td>
                  <td className="px-3 py-2">{m.playerLeader.name}</td>
                  <td className="px-3 py-2">{m.rivalName}</td>
                  <td className="px-3 py-2">{m.rivalLeader.name}</td>
                  <td className="px-3 py-2">
                    <span className={`tag ${m.result === "WIN" ? "bg-emerald-700" : "bg-red-700"} text-white`}>{m.result}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

async function GlobalTab() {
  const rows = await getGlobalStats();
  return (
    <div>
      <div className="rounded-xl border bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left uppercase tracking-wide text-xs text-muted">
            <tr>
              <th className="px-3 py-2">Jugador</th>
              <th className="px-3 py-2">Mazo favorito</th>
              <th className="px-3 py-2 text-right">Partidas</th>
              <th className="px-3 py-2 text-right">W</th>
              <th className="px-3 py-2 text-right">L</th>
              <th className="px-3 py-2 text-right">Winrate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-muted">Sin datos aún.</td></tr>}
            {rows.map((r) => (
              <tr key={r.userId}>
                <td className="px-3 py-2 font-semibold">@{r.username}</td>
                <td className="px-3 py-2">{r.favoriteDeck ? r.favoriteDeck.name : "—"}</td>
                <td className="px-3 py-2 text-right">{r.total}</td>
                <td className="px-3 py-2 text-right text-emerald-400">{r.wins}</td>
                <td className="px-3 py-2 text-right text-red-400">{r.losses}</td>
                <td className="px-3 py-2 text-right font-mono">{r.winrate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Big({ label, v, accent }: { label: string; v: number; accent?: string }) {
  return (
    <div className="rounded-xl border bg-surface p-4">
      <div className="heading-display text-4xl" style={{ color: accent ?? "var(--foreground)" }}>{v}</div>
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="heading-display text-xl mb-2">{title}</div>
      {children}
    </div>
  );
}

function DeckTable({ rows }: { rows: { leader: { id: string; name: string; imageUrl: string }; wins: number; losses: number; total: number; winrate: number }[] }) {
  if (!rows.length) return <div className="text-muted text-sm">Sin partidas.</div>;
  return (
    <div className="rounded-xl border bg-surface overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-surface-2 text-left uppercase tracking-wide text-xs text-muted">
          <tr>
            <th className="px-3 py-2">Leader</th>
            <th className="px-3 py-2 text-right">Total</th>
            <th className="px-3 py-2 text-right">W</th>
            <th className="px-3 py-2 text-right">L</th>
            <th className="px-3 py-2 text-right">WR</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.leader.id}>
              <td className="px-3 py-2">{r.leader.name}</td>
              <td className="px-3 py-2 text-right">{r.total}</td>
              <td className="px-3 py-2 text-right text-emerald-400">{r.wins}</td>
              <td className="px-3 py-2 text-right text-red-400">{r.losses}</td>
              <td className="px-3 py-2 text-right font-mono">{r.winrate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
