"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  SlidersHorizontal,
  Search,
  Palette,
  Gauge,
  Swords,
  Eraser,
  Circle,
  Layers2,
  ArrowUpDown,
  Menu,
  X,
} from "lucide-react";
import { COLOR_HEX } from "@/lib/utils";

type Item = { id: number; name: string };
type ColorItem = { id: number; name: string; hex: string | null };
type Mode = "mono" | "bi" | null;

export default function GuideFilters({
  colors, difficulties, playStyles, allowBiColor = true,
}: { colors: ColorItem[]; difficulties: Item[]; playStyles: Item[]; allowBiColor?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rawMode = (params.get("mode") as Mode) ?? null;
  const mode: Mode = !allowBiColor && rawMode === "bi" ? "mono" : rawMode;
  const selectedColors = useMemo(() => params.getAll("c").map(Number), [params]);
  const maxColors = mode === "bi" ? 2 : mode === "mono" ? 1 : 0;
  const sortValue = params.get("sort") || "collection";

  // Close drawer on route change
  useEffect(() => setOpen(false), [pathname]);

  // Lock body scroll when drawer open (mobile only)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  function push(next: URLSearchParams) {
    start(() => router.push(`/guides${next.toString() ? `?${next}` : ""}`));
  }

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value); else next.delete(key);
    push(next);
  }

  function setMode(next: Mode) {
    const sp = new URLSearchParams(params.toString());
    if (next === null) {
      sp.delete("mode"); sp.delete("c");
    } else {
      sp.set("mode", next);
      const max = next === "bi" ? 2 : 1;
      const trimmed = sp.getAll("c").slice(0, max);
      sp.delete("c");
      trimmed.forEach((v) => sp.append("c", v));
    }
    push(sp);
  }

  function toggleColor(id: number) {
    if (!mode) return;
    const sp = new URLSearchParams(params.toString());
    const cur = sp.getAll("c").map(Number);
    sp.delete("c");
    if (cur.includes(id)) {
      cur.filter((v) => v !== id).forEach((v) => sp.append("c", String(v)));
    } else if (cur.length < maxColors) {
      [...cur, id].forEach((v) => sp.append("c", String(v)));
    } else {
      cur.forEach((v) => sp.append("c", String(v)));
    }
    push(sp);
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q === (params.get("q") ?? "")) return;
    debounceRef.current = setTimeout(() => setParam("q", q || null), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function clearAll() {
    setQ("");
    start(() => router.push("/guides"));
  }

  return (
    <>
      <div className="md:hidden mb-4">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setOpen(true)}
        >
          <Menu className="w-4 h-4" />
          <span>Filtros</span>
          {pending && <span className="text-[10px] uppercase tracking-widest text-muted animate-pulse">…</span>}
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
          "fixed left-0 top-14 bottom-0 w-72 z-50 flex flex-col " +
          "border-r border-border " +
          "bg-[linear-gradient(180deg,rgba(255,251,240,0.94),rgba(248,238,217,0.94))] " +
          "backdrop-blur-md shadow-[2px_0_24px_rgba(40,28,18,0.07)] " +
          "transform transition-transform duration-200 " +
          (open ? "translate-x-0" : "-translate-x-full") +
          " md:translate-x-0 md:z-30"
        }
      >
        <div className="flex items-center gap-2 px-5 py-5 border-b border-border">
          <SlidersHorizontal className="w-6 h-6 text-accent" strokeWidth={2.25} />
          <span className="heading-display text-2xl tracking-wider uppercase text-foreground">
            Filtros
          </span>
          {pending && <span className="ml-auto text-[10px] uppercase tracking-widest text-muted animate-pulse">…</span>}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="md:hidden ml-auto p-1.5 rounded hover:bg-surface-2"
            aria-label="Cerrar filtros"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <section>
            <Heading icon={<Search className="w-4 h-4" />}>Buscar</Heading>
            <div className="relative">
              <input
                className="input pr-8"
                placeholder="Nombre o ID de leader..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-surface-2 text-muted"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </section>

          <section>
            <Heading icon={<ArrowUpDown className="w-4 h-4" />}>Ordenar por</Heading>
            <select
              className="select"
              value={sortValue}
              onChange={(e) => {
                const v = e.target.value;
                setParam("sort", v === "collection" ? null : v);
              }}
            >
              <option value="collection">Colección</option>
              <option value="name">Nombre (A-Z)</option>
              <option value="color">Color</option>
            </select>
          </section>

          <section>
            <Heading icon={<Palette className="w-4 h-4" />}>Color</Heading>
            <div className={(allowBiColor ? "grid-cols-2" : "grid-cols-1") + " grid gap-2 mb-3"}>
              <ModeBtn
                active={mode === "mono"}
                onClick={() => setMode(mode === "mono" ? null : "mono")}
                icon={<Circle className="w-3.5 h-3.5" />}
                label="Mono-color"
              />
              {allowBiColor && (
                <ModeBtn
                  active={mode === "bi"}
                  onClick={() => setMode(mode === "bi" ? null : "bi")}
                  icon={<Layers2 className="w-3.5 h-3.5" />}
                  label="Bi-color"
                />
              )}
            </div>
            <div className={mode ? "" : "opacity-50 pointer-events-none select-none"}>
              <div className="text-[10px] uppercase tracking-widest text-muted mb-2">
                {mode === "mono" && "Elige 1 color"}
                {mode === "bi"   && `Elige hasta 2 colores (${selectedColors.length}/2)`}
                {!mode           && "Selecciona un modo primero"}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {colors.map((c) => {
                  const sel = selectedColors.includes(c.id);
                  const hex = c.hex || COLOR_HEX[c.name] || "#888";
                  const disabled = !sel && selectedColors.length >= maxColors;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleColor(c.id)}
                      disabled={disabled}
                      aria-pressed={sel}
                      title={c.name}
                      className={
                        "group relative flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition " +
                        (sel
                          ? "shadow-md scale-[1.02]"
                          : "border-border hover:border-accent/40 hover:scale-[1.02]") +
                        (disabled ? " opacity-30 cursor-not-allowed hover:border-border hover:scale-100" : "")
                      }
                      style={sel ? { borderColor: hex, background: `${hex}1a` } : undefined}
                    >
                      <span
                        className="w-6 h-6 rounded-full ring-2 ring-white/80 shadow-inner"
                        style={{ background: hex }}
                      />
                      <span
                        className="text-[10px] font-bold uppercase tracking-wide"
                        style={{ color: sel ? hex : undefined }}
                      >
                        {c.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section>
            <Heading icon={<Gauge className="w-4 h-4" />}>Dificultad</Heading>
            <select
              className="select"
              value={params.get("difficultyId") ?? ""}
              onChange={(e) => setParam("difficultyId", e.target.value || null)}
            >
              <option value="">Todas</option>
              {difficulties.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
            </select>
          </section>

          <section>
            <Heading icon={<Swords className="w-4 h-4" />}>Estilo</Heading>
            <select
              className="select"
              value={params.get("playStyleId") ?? ""}
              onChange={(e) => setParam("playStyleId", e.target.value || null)}
            >
              <option value="">Todos</option>
              {playStyles.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
            </select>
          </section>
        </div>

        <div className="border-t border-border p-3">
          <button
            type="button"
            className="btn btn-ghost w-full flex items-center justify-center gap-2"
            onClick={clearAll}
          >
            <Eraser className="w-4 h-4" /> Limpiar filtros
          </button>
        </div>
      </aside>
    </>
  );
}

function Heading({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2 text-accent">
      {icon}
      <span className="heading-display text-sm tracking-wider uppercase">{children}</span>
    </div>
  );
}

function ModeBtn({
  active, onClick, icon, label,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "flex items-center justify-center gap-1.5 px-2 py-2 rounded-md border-2 text-xs font-bold uppercase tracking-wide transition " +
        (active
          ? "bg-accent/15 text-accent border-accent shadow-sm"
          : "bg-surface text-foreground/70 border-border hover:border-accent/40 hover:text-accent")
      }
    >
      {icon}
      {label}
    </button>
  );
}
