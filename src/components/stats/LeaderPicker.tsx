"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { leaderImageSrc } from "@/lib/leader-image";

type Leader = { id: string; name: string; imageUrl: string };

export default function LeaderPicker({
  leaders,
  value,
  onChange,
  accent,
  placeholder = "Selecciona un leader",
  emptyMessage,
}: {
  leaders: Leader[];
  value: string;
  onChange: (id: string) => void;
  accent: string;
  placeholder?: string;
  emptyMessage?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(() => leaders.find((l) => l.id === value), [leaders, value]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return leaders;
    return leaders.filter(
      (l) => l.name.toLowerCase().includes(q) || l.id.toLowerCase().includes(q),
    );
  }, [leaders, query]);

  return (
    <>
      <button
        type="button"
        onClick={() => leaders.length > 0 && setOpen(true)}
        disabled={leaders.length === 0}
        className="group w-full text-left rounded-xl border-2 transition overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ borderColor: selected ? accent : "var(--border)" }}
      >
        {selected ? (
          <div className="relative aspect-[5/7] w-full bg-surface-2">
            <Image
              src={leaderImageSrc(selected)}
              alt={selected.name}
              fill
              className="object-cover"
              sizes="(min-width: 768px) 30vw, 90vw"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-3 text-white">
              <div className="text-[10px] font-mono tracking-wider opacity-80">{selected.id}</div>
              <div className="heading-display text-lg sm:text-xl leading-tight">{selected.name}</div>
              <div className="text-[11px] mt-1 opacity-80 flex items-center gap-1">
                <ChevronDown className="w-3 h-3" /> Cambiar
              </div>
            </div>
          </div>
        ) : (
          <div className="aspect-[5/7] w-full bg-surface-2 flex flex-col items-center justify-center text-muted p-4 group-hover:bg-surface-2/70 transition">
            {leaders.length === 0 ? (
              <span className="text-sm text-center">{emptyMessage ?? "Sin leaders disponibles"}</span>
            ) : (
              <>
                <Search className="w-8 h-8 mb-2" strokeWidth={1.5} />
                <span className="text-sm font-semibold">{placeholder}</span>
                <span className="text-[10px] uppercase tracking-widest mt-1">Click para buscar</span>
              </>
            )}
          </div>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-3xl max-h-[85vh] rounded-2xl border border-border bg-[rgba(255,251,240,0.98)] shadow-2xl flex flex-col">
            <div className="flex items-center gap-2 p-3 border-b border-border">
              <Search className="w-5 h-5 text-muted shrink-0" />
              <input
                ref={inputRef}
                className="flex-1 bg-transparent outline-none text-base"
                placeholder="Buscar leader por nombre o ID..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded hover:bg-surface-2 text-muted"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {filtered.length === 0 ? (
                <div className="py-16 text-center text-muted">Sin coincidencias</div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {filtered.map((l) => {
                    const isSel = l.id === value;
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => { onChange(l.id); setOpen(false); setQuery(""); }}
                        className="group relative rounded-lg overflow-hidden border-2 transition hover:scale-[1.03] hover:shadow-lg"
                        style={{ borderColor: isSel ? accent : "var(--border)" }}
                        title={`${l.id} — ${l.name}`}
                      >
                        <div className="relative aspect-[5/7] w-full bg-surface-2">
                          <Image
                            src={leaderImageSrc(l)}
                            alt={l.name}
                            fill
                            className="object-cover"
                            sizes="(min-width: 768px) 20vw, 33vw"
                          />
                        </div>
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-1.5 text-white">
                          <div className="text-[9px] font-mono opacity-80 truncate">{l.id}</div>
                          <div className="text-[11px] font-bold leading-tight line-clamp-2">{l.name}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-3 py-2 border-t border-border text-[11px] uppercase tracking-widest text-muted">
              {filtered.length} / {leaders.length} leaders
            </div>
          </div>
        </div>
      )}
    </>
  );
}
