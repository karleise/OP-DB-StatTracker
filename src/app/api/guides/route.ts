import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { guideSchema } from "@/lib/validators";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const colorId      = url.searchParams.get("colorId");
  const difficultyId = url.searchParams.get("difficultyId");
  const playStyleId  = url.searchParams.get("playStyleId");
  const q            = url.searchParams.get("q")?.trim();

  const guides = await prisma.guide.findMany({
    where: {
      ...(colorId      ? { colors:     { some: { colorId:     Number(colorId)     } } } : {}),
      ...(difficultyId ? { difficultyId: Number(difficultyId) } : {}),
      ...(playStyleId  ? { playStyles: { some: { playStyleId: Number(playStyleId) } } } : {}),
      ...(q
        ? {
            OR: [
              { leader: { name: { contains: q } } },
              { leader: { id:   { contains: q } } },
            ],
          }
        : {}),
    },
    include: {
      leader:     { include: { colors: { include: { color: true } } } },
      colors:     { include: { color: true } },
      difficulty: true,
      playStyles: { include: { playStyle: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(guides);
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch (r) {
    return r as Response;
  }
  const body = await req.json().catch(() => null);
  const parsed = guideSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { leaderId, body: text, colorIds, difficultyId, playStyleIds, goodMatchups, badMatchups } = parsed.data;

  const guide = await prisma.$transaction(async (tx) => {
    const created = await tx.guide.create({
      data: {
        leaderId, body: text, difficultyId,
        colors:     { create: colorIds.map((cid)     => ({ colorId:     cid })) },
        playStyles: { create: playStyleIds.map((pid) => ({ playStyleId: pid })) },
      },
    });
    const matchupData = [
      ...goodMatchups.map((id) => ({ guideId: created.id, leaderId: id, kind: "GOOD" as const })),
      ...badMatchups.map((id)  => ({ guideId: created.id, leaderId: id, kind: "BAD"  as const })),
    ];
    if (matchupData.length) await tx.guideMatchup.createMany({ data: matchupData });
    return created;
  });

  return NextResponse.json(guide, { status: 201 });
}
