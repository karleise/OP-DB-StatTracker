import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

export default async function Header() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--border)] bg-[color:var(--background)]/85 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 heading-display text-xl">
          <span className="inline-block w-2 h-6 bg-[color:var(--accent)]" />
          OP-DB-StatTracker
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <NavLink href="/guides">Guías</NavLink>
          <NavLink href="/randomizer">Randomizer</NavLink>
          <NavLink href="/stats">Stats</NavLink>
          {user?.role === "ADMIN" && <NavLink href="/admin">Admin</NavLink>}
          {user ? (
            <>
              <span className="px-3 py-1 text-[color:var(--muted)] hidden sm:inline">
                @{user.username}
              </span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
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
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 rounded-md font-semibold uppercase tracking-wide text-[color:var(--foreground)] hover:text-[color:var(--accent)] hover:bg-[color:var(--surface)] transition"
    >
      {children}
    </Link>
  );
}
