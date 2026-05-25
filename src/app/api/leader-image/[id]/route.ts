import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id: raw } = await params;
  const id = decodeURIComponent(raw.replace(/\.(png|jpg|jpeg|webp)$/i, ""));

  const leader = await prisma.leader.findUnique({
    where: { id },
    select: { imageUrl: true },
  });
  if (!leader?.imageUrl) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const upstream = await fetch(leader.imageUrl, {
    headers: { "User-Agent": "Mozilla/5.0 OP-DB-StatTracker" },
    cache: "force-cache",
    next: { revalidate: 60 * 60 * 24 * 7 }, // 7 days
  });
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Upstream failed" }, { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") ?? "image/png";
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
