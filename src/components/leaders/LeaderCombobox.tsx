"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ChevronDown, Search, X } from "lucide-react";
import { leaderImageSrc } from "@/lib/leader-image";

type Leader = { id: string; name: string; imageUrl: string };

export default function LeaderCombobox({
  leaders,
  value,
  onChange,
  disabled = false,
  placeholder = "— Seleccionar líder —",
}: {
  leaders: Leader[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(() => leaders.find((l) => l.id === value), [leaders, value]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return leaders;
    return leaders.filter(
      (l) => l.id.toLowerCase().includes(term) || l.name.toLowerCase().includes(term),
    );
  }, [leaders, q]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setQ("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  function choose(id: string) {
    onChange(id);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="input flex items-center gap-3 text-left disabled:opacity-60 disabled:cursor-not-allowed"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected ? (
          <>
            <Image
              src={leaderImageSrc(selected)}
              alt={selected.name}
              width={32}
              height={45}
              className="rounded-sm shrink-0"
              unoptimized
              loading="lazy"
              decoding="async"
            />
            <span className="flex-1 truncate">
              <span className="font-mono text-xs text-muted mr-2">{selected.id}</span>
              {selected.name}
            </span>
          </>
        ) : (
          <span className="flex-1 truncate text-muted">{placeholder}</span>
        )}
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-40 mt-2 w-full rounded-lg border border-border bg-surface shadow-2xl overflow-hidden">
          <div className="relative border-b border-border bg-surface-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              ref={inputRef}
              className="w-full bg-transparent pl-9 pr-9 py-2.5 text-sm outline-none"
              placeholder="Buscar por nombre o ID..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-surface text-muted"
                aria-label="Limpiar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-4 text-sm text-muted text-center">Sin resultados</div>
            ) : (
              filtered.slice(0, 100).map((l) => {
                const isSel = l.id === value;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => choose(l.id)}
                    className={
                      "w-full flex items-center gap-3 px-3 py-2 text-left text-sm border-b border-border/40 last:border-0 transition " +
                      (isSel ? "bg-accent/15" : "hover:bg-surface-2")
                    }
                  >
                    <Image
                      src={leaderImageSrc(l)}
                      alt={l.name}
                      width={36}
                      height={50}
                      className="rounded-sm shrink-0"
                      unoptimized
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-semibold">{l.name}</div>
                      <div className="text-[10px] font-mono text-muted">{l.id}</div>
                    </div>
                    {isSel && <span className="text-xs font-bold text-accent">✓</span>}
                  </button>
                );
              })
            )}
            {filtered.length > 100 && (
              <div className="px-3 py-2 text-[11px] text-muted text-center bg-surface-2/50">
                Mostrando 100 de {filtered.length}. Refina la búsqueda.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
