import { prisma } from "@/lib/prisma";
import type { Game } from "@prisma/client";
import { shuffle } from "@/lib/utils";

type PoolLeader = {
  id: string;
  name: string;
  imageUrl: string;
  badAgainstIds: Set<string>;
  hasGuide: boolean;
};

export type RandomPair = {
  leaderA: { id: string; name: string; imageUrl: string };
  leaderB: { id: string; name: string; imageUrl: string };
  respectedMatchups: boolean;
};

async function loadPool(useAllAvailable: boolean, game: Game): Promise<PoolLeader[]> {
  const leaders = await prisma.leader.findMany({
    where: {
      game,
      ...(useAllAvailable ? {} : { guide: { isNot: null } }),
    },
    include: {
      guide: {
        include: {
          matchups: { where: { kind: "BAD" }, select: { leaderId: true } },
        },
      },
    },
  });

  return leaders.map((l) => ({
    id: l.id,
    name: l.name,
    imageUrl: l.imageUrl,
    hasGuide: !!l.guide,
    badAgainstIds: new Set((l.guide?.matchups ?? []).map((m) => m.leaderId)),
  }));
}

function isBadPair(a: PoolLeader, b: PoolLeader): boolean {
  return a.badAgainstIds.has(b.id) || b.badAgainstIds.has(a.id);
}

export async function pickPair(opts: {
  considerMatchups: boolean;
  useAllAvailable: boolean;
  game: Game;
}): Promise<RandomPair | null> {
  const pool = await loadPool(opts.useAllAvailable, opts.game);
  if (pool.length < 2) return null;

  const MAX_ATTEMPTS = 50;
  let fallback: [PoolLeader, PoolLeader] | null = null;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const shuffled = shuffle(pool);
    const a = shuffled[0];
    const b = shuffled[1];
    if (!fallback) fallback = [a, b];
    if (!opts.considerMatchups) {
      return {
        leaderA: { id: a.id, name: a.name, imageUrl: a.imageUrl },
        leaderB: { id: b.id, name: b.name, imageUrl: b.imageUrl },
        respectedMatchups: false,
      };
    }
    if (!isBadPair(a, b)) {
      return {
        leaderA: { id: a.id, name: a.name, imageUrl: a.imageUrl },
        leaderB: { id: b.id, name: b.name, imageUrl: b.imageUrl },
        respectedMatchups: true,
      };
    }
  }

  if (!fallback) return null;
  const [a, b] = fallback;
  return {
    leaderA: { id: a.id, name: a.name, imageUrl: a.imageUrl },
    leaderB: { id: b.id, name: b.name, imageUrl: b.imageUrl },
    respectedMatchups: false,
  };
}
