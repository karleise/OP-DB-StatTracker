import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/prisma";

const DB_UPLOADS_DIR = "C:/Users/carlo/OneDrive/Escritorio/PROYECTOS/Decks/backend/uploads";

const CONTENT_TYPE: Record<string, string> = {
  ".webp": "image/webp",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
};

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id: raw } = await params;
  const id = decodeURIComponent(raw.replace(/\.(png|jpg|jpeg|webp)$/i, ""));

  const leader = await prisma.leader.findUnique({
    where: { id },
    select: { imageUrl: true, game: true },
  });
  if (!leader?.imageUrl) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (leader.game === "DB") {
    return serveLocal(leader.imageUrl);
  }

  return serveUpstream(leader.imageUrl);
}

async function serveLocal(relPath: string) {
  const cleaned = relPath.replace(/^\/+/, "").replace(/^uploads\//, "");
  const filePath = path.join(DB_UPLOADS_DIR, cleaned);
  const ext = path.extname(filePath).toLowerCase();
  if (!path.resolve(filePath).startsWith(path.resolve(DB_UPLOADS_DIR))) {
    return NextResponse.json({ error: "Bad path" }, { status: 400 });
  }
  try {
    const buf = await fs.readFile(filePath);
    return new Response(new Uint8Array(buf), {
      status: 200,
      headers: {
        "content-type": CONTENT_TYPE[ext] ?? "application/octet-stream",
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}

async function serveUpstream(url: string) {
  const upstream = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 OP-DB-StatTracker" },
    cache: "force-cache",
    next: { revalidate: 60 * 60 * 24 * 7 },
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
