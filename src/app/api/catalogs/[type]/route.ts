import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { catalogItemSchema } from "@/lib/validators";

type CatalogType = "colors" | "difficulties" | "playstyles";
type Ctx = { params: Promise<{ type: string }> };

function isValid(t: string): t is CatalogType {
  return t === "colors" || t === "difficulties" || t === "playstyles";
}

const LABEL: Record<CatalogType, string> = {
  colors:       "color",
  difficulties: "dificultad",
  playstyles:   "estilo",
};

async function countUsage(type: CatalogType, id: number): Promise<number> {
  if (type === "difficulties") return prisma.guide.count({ where: { difficultyId: id } });
  if (type === "playstyles")   return prisma.guidePlayStyle.count({ where: { playStyleId: id } });
  const [g, l] = await Promise.all([
    prisma.guideColor.count({ where: { colorId: id } }),
    prisma.leaderColor.count({ where: { colorId: id } }),
  ]);
  return g + l;
}

async function listFor(type: CatalogType) {
  if (type === "colors")       return prisma.color.findMany({ orderBy: { name: "asc" } });
  if (type === "difficulties") return prisma.difficulty.findMany({ orderBy: { order: "asc" } });
  return prisma.playStyle.findMany({ orderBy: { name: "asc" } });
}

export async function GET(_req: Request, { params }: Ctx) {
  const { type } = await params;
  if (!isValid(type)) return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  return NextResponse.json(await listFor(type));
}

export async function POST(req: Request, { params }: Ctx) {
  try { await requireAdmin(); } catch (r) { return r as Response; }
  const { type } = await params;
  if (!isValid(type)) return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  const body = await req.json().catch(() => null);
  const parsed = catalogItemSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { name, hex, order } = parsed.data;

  if (type === "colors") {
    return NextResponse.json(await prisma.color.create({ data: { name, hex: hex ?? null } }));
  }
  if (type === "difficulties") {
    return NextResponse.json(await prisma.difficulty.create({ data: { name, order: order ?? 0 } }));
  }
  return NextResponse.json(await prisma.playStyle.create({ data: { name } }));
}

export async function PATCH(req: Request, { params }: Ctx) {
  try { await requireAdmin(); } catch (r) { return r as Response; }
  const { type } = await params;
  if (!isValid(type)) return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  const body = await req.json().catch(() => null) as { id?: number; name?: string; hex?: string | null; order?: number };
  if (!body?.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  if (type === "colors") {
    return NextResponse.json(await prisma.color.update({ where: { id: body.id }, data: { name: body.name, hex: body.hex ?? null } }));
  }
  if (type === "difficulties") {
    return NextResponse.json(await prisma.difficulty.update({ where: { id: body.id }, data: { name: body.name, order: body.order } }));
  }
  return NextResponse.json(await prisma.playStyle.update({ where: { id: body.id }, data: { name: body.name } }));
}

export async function DELETE(req: Request, { params }: Ctx) {
  try { await requireAdmin(); } catch (r) { return r as Response; }
  const { type } = await params;
  if (!isValid(type)) return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    if (type === "colors")            await prisma.color.delete({ where: { id } });
    else if (type === "difficulties") await prisma.difficulty.delete({ where: { id } });
    else                              await prisma.playStyle.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      const inUse = await countUsage(type, id);
      const noun = LABEL[type];
      return NextResponse.json(
        {
          error: `No se puede eliminar este ${noun}: ${inUse} mazo${inUse === 1 ? "" : "s"} lo usa${inUse === 1 ? "" : "n"}.`,
          inUse,
        },
        { status: 409 },
      );
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    throw e;
  }
}
