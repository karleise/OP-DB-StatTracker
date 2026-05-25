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
      ...(colorId      ? { colorId:      Number(colorId)      } : {}),
      ...(difficultyId ? { difficultyId: Number(difficultyId) } : {}),
      ...(playStyleId  ? { playStyleId:  Number(playStyleId)  } : {}),
      ...(q
        ? {
            OR: [
              { title:  { contains: q } },
              { leader: { name: { contains: q } } },
            ],
          }
        : {}),
    },
    include: {
      leader:     { include: { colors: { include: { color: true } } } },
      color:      true,
      difficulty: true,
      playStyle:  true,
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
  const { leaderId, title, body: text, colorId, difficultyId, playStyleId, goodMatchups, badMatchups } = parsed.data;

  const guide = await prisma.$transaction(async (tx) => {
    const created = await tx.guide.create({
      data: { leaderId, title, body: text, colorId, difficultyId, playStyleId },
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
