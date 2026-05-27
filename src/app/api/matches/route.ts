import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { matchSchema } from "@/lib/validators";

export async function POST(req: Request) {
  let user;
  try { user = await requireUser(); } catch (r) { return r as Response; }

  const body = await req.json().catch(() => null);
  const parsed = matchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { playerLeaderId, rivalId, rivalName, rivalLeaderId, result, turnOrder } = parsed.data;

  const match = await prisma.match.create({
    data: {
      playerId: user.id,
      playerLeaderId,
      rivalId: rivalId || null,
      rivalName: rivalName || null,
      rivalLeaderId,
      result,
      turnOrder: turnOrder || null,
    },
  });
  return NextResponse.json(match, { status: 201 });
}
