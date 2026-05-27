"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import type { Game } from "@prisma/client";
import GameSwitcher from "./GameSwitcher";

type UserInfo = { username: string; role: string } | null;
type GameOption = { code: Game; label: string; short: string };

export default function HeaderNav({
  user,
  game,
  games,
  signOutAction,
}: {
  user: UserInfo;
  game: Game;
  games: readonly GameOption[];
  signOutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  return (
    <>
      <nav className="hidden md:flex items-center gap-1 text-sm">
        <NavLink href="/guides">Mazos</NavLink>
        <NavLink href="/randomizer">Randomizer</NavLink>
        <NavLink href="/stats">Stats</NavLink>
        {user?.role === "ADMIN" && <NavLink href="/admin">Admin</NavLink>}
        <div className="mx-2">
          <GameSwitcher current={game} options={games} />
        </div>
        {user ? (
          <>
            <span className="px-3 py-1 text-muted hidden lg:inline font-semibold">
              @{user.username}
            </span>
            <form action={signOutAction}>
              <button type="submit" className="btn btn-ghost text-sm">Salir</button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login"    className="btn btn-ghost text-sm">Login</Link>
            <Link href="/register" className="btn btn-primary text-sm">Sign up</Link>
          </>
        )}
      </nav>

      <button
        type="button"
        className="md:hidden p-2 rounded hover:bg-surface-2"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <div
        className={
          "md:hidden fixed inset-0 top-14 z-40 bg-black/40 transition-opacity " +
          (open ? "opacity-100" : "opacity-0 pointer-events-none")
        }
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />

      <div
        className={
          "md:hidden absolute left-0 right-0 top-14 z-50 " +
          "border-b border-border bg-[rgba(255,251,240,0.96)] backdrop-blur-md " +
          "shadow-[0_8px_24px_rgba(40,28,18,0.12)] " +
          "transition-all duration-200 origin-top " +
          (open ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0 pointer-events-none")
        }
      >
        <div className="flex flex-col p-3 gap-1">
          <MobileLink href="/guides">Mazos</MobileLink>
          <MobileLink href="/randomizer">Randomizer</MobileLink>
          <MobileLink href="/stats">Stats</MobileLink>
          {user?.role === "ADMIN" && <MobileLink href="/admin">Admin</MobileLink>}

          <div className="border-t border-border mt-2 pt-2 px-3">
            <div className="text-[10px] uppercase tracking-widest text-muted mb-2">Juego</div>
            <GameSwitcher current={game} options={games} />
          </div>

          <div className="border-t border-border mt-2 pt-2 flex flex-col gap-2">
            {user ? (
              <>
                <span className="px-3 py-1 text-muted text-sm font-semibold">
                  @{user.username}
                </span>
                <form action={signOutAction}>
                  <button type="submit" className="btn btn-ghost w-full">Salir</button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login"    className="btn btn-ghost w-full text-center">Login</Link>
                <Link href="/register" className="btn btn-primary w-full text-center">Sign up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 rounded-md font-bold uppercase tracking-wide text-foreground hover:text-accent hover:bg-surface-2 transition"
    >
      {children}
    </Link>
  );
}

function MobileLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-2.5 rounded-md font-bold uppercase tracking-wide text-foreground hover:text-accent hover:bg-surface-2 transition"
    >
      {children}
    </Link>
  );
}
