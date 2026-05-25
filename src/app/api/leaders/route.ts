import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const withGuide = url.searchParams.get("withGuide") === "1";
  const q = url.searchParams.get("q")?.trim() ?? "";

  const leaders = await prisma.leader.findMany({
    where: {
      ...(withGuide ? { guide: { isNot: null } } : {}),
      ...(q
        ? { OR: [{ id: { contains: q } }, { name: { contains: q } }] }
        : {}),
    },
    include: { colors: { include: { color: true } } },
    orderBy: { id: "asc" },
  });
  return NextResponse.json(leaders);
}
