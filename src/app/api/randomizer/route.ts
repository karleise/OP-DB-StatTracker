import { NextResponse } from "next/server";
import { pickPair } from "@/lib/randomizer";
import { randomizerSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = randomizerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const pair = await pickPair(parsed.data);
  if (!pair) return NextResponse.json({ error: "Not enough leaders" }, { status: 404 });
  return NextResponse.json(pair);
}
