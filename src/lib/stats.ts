import { prisma } from "@/lib/prisma";

export type LeaderRef = { id: string; name: string; imageUrl: string };

export type PerDeckStat = {
  leader: LeaderRef;
  wins: number;
  losses: number;
  total: number;
  winrate: number;
};

export type PersonalStats = {
  totalMatches: number;
  wins: number;
  losses: number;
  winrate: number;
  favoriteDeck: LeaderRef | null;
  byDeck: PerDeckStat[];
  byRivalLeader: PerDeckStat[];
  recentMatches: {
    id: string;
    playedAt: Date;
    result: "WIN" | "LOSS";
    playerLeader: LeaderRef;
    rivalLeader: LeaderRef;
    rivalName: string;
  }[];
};

export type GlobalRow = {
  userId: string;
  username: string;
  wins: number;
  losses: number;
  total: number;
  winrate: number;
  favoriteDeck: LeaderRef | null;
};

function rate(wins: number, total: number) {
  if (!total) return 0;
  return Math.round((wins / total) * 1000) / 10;
}

export async function getPersonalStats(userId: string): Promise<PersonalStats> {
  const matches = await prisma.match.findMany({
    where: { playerId: userId },
    include: {
      playerLeader: { select: { id: true, name: true, imageUrl: true } },
      rivalLeader:  { select: { id: true, name: true, imageUrl: true } },
      rival:        { select: { username: true } },
    },
    orderBy: { playedAt: "desc" },
  });

  const wins = matches.filter((m) => m.result === "WIN").length;
  const losses = matches.length - wins;

  const byDeckMap = new Map<string, PerDeckStat>();
  for (const m of matches) {
    const key = m.playerLeader.id;
    const entry =
      byDeckMap.get(key) ?? {
        leader: m.playerLeader,
        wins: 0,
        losses: 0,
        total: 0,
        winrate: 0,
      };
    entry.total++;
    if (m.result === "WIN") entry.wins++;
    else entry.losses++;
    entry.winrate = rate(entry.wins, entry.total);
    byDeckMap.set(key, entry);
  }

  const byRivalMap = new Map<string, PerDeckStat>();
  for (const m of matches) {
    const key = m.rivalLeader.id;
    const entry =
      byRivalMap.get(key) ?? {
        leader: m.rivalLeader,
        wins: 0,
        losses: 0,
        total: 0,
        winrate: 0,
      };
    entry.total++;
    if (m.result === "WIN") entry.wins++;
    else entry.losses++;
    entry.winrate = rate(entry.wins, entry.total);
    byRivalMap.set(key, entry);
  }

  const byDeck = Array.from(byDeckMap.values()).sort((a, b) => b.total - a.total);
  const favoriteDeck = byDeck[0]?.leader ?? null;

  return {
    totalMatches: matches.length,
    wins,
    losses,
    winrate: rate(wins, matches.length),
    favoriteDeck,
    byDeck,
    byRivalLeader: Array.from(byRivalMap.values()).sort((a, b) => b.total - a.total),
    recentMatches: matches.slice(0, 15).map((m) => ({
      id: m.id,
      playedAt: m.playedAt,
      result: m.result,
      playerLeader: m.playerLeader,
      rivalLeader: m.rivalLeader,
      rivalName: m.rival?.username ?? m.rivalName ?? "Anonymous",
    })),
  };
}

export async function getGlobalStats(): Promise<GlobalRow[]> {
  const users = await prisma.user.findMany({
    include: {
      matchesAsPlayer: {
        include: { playerLeader: { select: { id: true, name: true, imageUrl: true } } },
      },
    },
  });

  return users
    .map((u) => {
      const total = u.matchesAsPlayer.length;
      if (!total) {
        return {
          userId: u.id,
          username: u.username,
          wins: 0,
          losses: 0,
          total: 0,
          winrate: 0,
          favoriteDeck: null,
        } satisfies GlobalRow;
      }
      const wins = u.matchesAsPlayer.filter((m) => m.result === "WIN").length;
      const losses = total - wins;
      const count = new Map<string, { leader: LeaderRef; n: number }>();
      for (const m of u.matchesAsPlayer) {
        const entry = count.get(m.playerLeader.id) ?? { leader: m.playerLeader, n: 0 };
        entry.n++;
        count.set(m.playerLeader.id, entry);
      }
      const favorite = Array.from(count.values()).sort((a, b) => b.n - a.n)[0]?.leader ?? null;
      return {
        userId: u.id,
        username: u.username,
        wins,
        losses,
        total,
        winrate: rate(wins, total),
        favoriteDeck: favorite,
      } satisfies GlobalRow;
    })
    .sort((a, b) => b.total - a.total);
}
