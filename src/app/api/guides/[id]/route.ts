import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { guideSchema } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const guide = await prisma.guide.findUnique({
    where: { id },
    include: {
      leader: { include: { colors: { include: { color: true } } } },
      colors: { include: { color: true } },
      difficulty: true,
      playStyles: { include: { playStyle: true } },
      matchups: {
        include: { leader: { include: { colors: { include: { color: true } } } } },
      },
    },
  });
  if (!guide) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(guide);
}

export async function PATCH(req: Request, { params }: Ctx) {
  try { await requireAdmin(); } catch (r) { return r as Response; }
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = guideSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { leaderId, body: text, colorIds, difficultyId, playStyleIds, goodMatchups, badMatchups } = parsed.data;

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.guide.update({
      where: { id },
      data: { leaderId, body: text, difficultyId },
    });
    await tx.guideColor.deleteMany({ where: { guideId: id } });
    await tx.guideColor.createMany({ data: colorIds.map((cid) => ({ guideId: id, colorId: cid })) });

    await tx.guidePlayStyle.deleteMany({ where: { guideId: id } });
    await tx.guidePlayStyle.createMany({ data: playStyleIds.map((pid) => ({ guideId: id, playStyleId: pid })) });

    await tx.guideMatchup.deleteMany({ where: { guideId: id } });
    const matchupData = [
      ...goodMatchups.map((lid) => ({ guideId: id, leaderId: lid, kind: "GOOD" as const })),
      ...badMatchups.map((lid)  => ({ guideId: id, leaderId: lid, kind: "BAD"  as const })),
    ];
    if (matchupData.length) await tx.guideMatchup.createMany({ data: matchupData });
    return u;
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try { await requireAdmin(); } catch (r) { return r as Response; }
  const { id } = await params;
  await prisma.guide.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
