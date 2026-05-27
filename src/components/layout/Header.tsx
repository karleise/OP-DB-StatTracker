import Link from "next/link";
import Image from "next/image";
import { auth, signOut } from "@/lib/auth";
import { getCurrentGame, GAMES } from "@/lib/game";
import HeaderNav from "./HeaderNav";

export default async function Header() {
  const session = await auth();
  const user = session?.user
    ? { username: session.user.username, role: session.user.role }
    : null;
  const game = await getCurrentGame();

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-[rgba(255,251,240,0.78)] backdrop-blur-md shadow-[0_2px_18px_rgba(40,28,18,0.08)]">
      <div className="relative w-full px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 heading-display text-base sm:text-xl">
          <Image
            src="/logo.webp"
            alt="StatTracker"
            width={32}
            height={32}
            priority
            className="w-7 h-7 sm:w-8 sm:h-8 rounded"
          />
          <span className="text-foreground">StatTracker</span>
        </Link>
        <HeaderNav user={user} game={game} games={GAMES} signOutAction={signOutAction} />
      </div>
      <div className="h-[3px] bg-accent transition-colors duration-200" aria-hidden />
    </header>
  );
}
