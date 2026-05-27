import { cookies } from "next/headers";
import type { Game } from "@prisma/client";

const COOKIE_NAME = "game";
const ONE_YEAR    = 60 * 60 * 24 * 365;

export const GAMES = [
  { code: "OP", label: "One Piece",   short: "OP" },
  { code: "DB", label: "Dragon Ball", short: "DB" },
] as const;

export type GameCode = (typeof GAMES)[number]["code"];

export async function getCurrentGame(): Promise<Game> {
  const c = await cookies();
  const v = c.get(COOKIE_NAME)?.value;
  return v === "DB" ? "DB" : "OP";
}

export async function setGameCookie(game: GameCode) {
  const c = await cookies();
  c.set(COOKIE_NAME, game, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR,
  });
}
