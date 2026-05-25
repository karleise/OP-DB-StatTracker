import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const { username, password } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return NextResponse.json({ error: "Usuario ya existe" }, { status: 409 });

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, password: hash, role: "USER" },
    select: { id: true, username: true, role: true },
  });
  return NextResponse.json(user, { status: 201 });
}
