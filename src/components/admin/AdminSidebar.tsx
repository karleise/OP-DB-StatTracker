"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Palette,
  Gauge,
  Swords,
  Shield,
  Menu,
  X,
} from "lucide-react";

type Item = {
  href: string;
  label: string;
  Icon: typeof LayoutDashboard;
  exact?: boolean;
};

const items: Item[] = [
  { href: "/admin",                       label: "Dashboard",    Icon: LayoutDashboard, exact: true },
  { href: "/admin/guides",                label: "Mazos",        Icon: BookOpen },
  { href: "/admin/catalogs/colors",       label: "Colores",      Icon: Palette },
  { href: "/admin/catalogs/difficulties", label: "Dificultades", Icon: Gauge },
  { href: "/admin/catalogs/playstyles",   label: "Estilos",      Icon: Swords },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const isActive = (item: Item) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");

  return (
    <>
      <div className="md:hidden mb-4">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setOpen(true)}
        >
          <Menu className="w-4 h-4" />
          <span>Admin</span>
        </button>
      </div>

      <div
        className={
          "md:hidden fixed inset-0 z-40 bg-black/40 transition-opacity " +
          (open ? "opacity-100" : "opacity-0 pointer-events-none")
        }
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />

      <aside
        className={
          "fixed left-0 top-14 bottom-0 w-64 z-50 flex flex-col " +
          "border-r border-border " +
          "bg-[linear-gradient(180deg,rgba(255,251,240,0.92),rgba(248,238,217,0.92))] " +
          "backdrop-blur-md shadow-[2px_0_24px_rgba(40,28,18,0.07)] " +
          "transform transition-transform duration-200 " +
          (open ? "translate-x-0" : "-translate-x-full") +
          " md:translate-x-0 md:z-30"
        }
      >
        <div className="flex items-center gap-2 px-5 py-5 border-b border-border">
          <Shield className="w-6 h-6 text-accent" strokeWidth={2.25} />
          <span className="heading-display text-2xl tracking-wider uppercase text-foreground">
            Admin
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="md:hidden ml-auto p-1.5 rounded hover:bg-surface-2"
            aria-label="Cerrar menú admin"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
          {items.map((it) => {
            const active = isActive(it);
            return (
              <Link
                key={it.href}
                href={it.href}
                className={
                  "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors " +
                  (active
                    ? "bg-accent/10 text-accent"
                    : "text-foreground/80 hover:bg-surface-2 hover:text-accent")
                }
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-accent" />
                )}
                <it.Icon
                  className={
                    "w-5 h-5 shrink-0 transition-transform group-hover:scale-110 " +
                    (active ? "text-accent" : "text-muted group-hover:text-accent")
                  }
                  strokeWidth={2.25}
                />
                <span className="uppercase tracking-wide">{it.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-3 border-t border-border text-[10px] uppercase tracking-widest text-muted">
          Panel · v0.1
        </div>
      </aside>
    </>
  );
}
