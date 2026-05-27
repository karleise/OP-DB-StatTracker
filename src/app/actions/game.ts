"use server";

import { revalidatePath } from "next/cache";
import { setGameCookie, type GameCode } from "@/lib/game";

export async function switchGame(game: GameCode) {
  await setGameCookie(game);
  revalidatePath("/", "layout");
}
