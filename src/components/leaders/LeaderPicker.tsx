"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

type Leader = { id: string; name: string; imageUrl: string };

export default function LeaderPicker({
  leaders, value, onChange, max = 3, label,
}: {
  leaders: Leader[];
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
  label?: string;
}) {
  const [q, setQ] = useState("");

  const selectedSet = useMemo(() => new Set(value), [value]);
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return leaders;
    return leaders.filter((l) =>
      l.id.toLowerCase().includes(term) || l.name.toLowerCase().includes(term)
    );
  }, [leaders, q]);

  function toggle(id: string) {
    if (selectedSet.has(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      if (value.length >= max) return;
      onChange([...value, id]);
    }
  }

  const selectedLeaders = value
    .map((id) => leaders.find((l) => l.id === id))
    .filter(Boolean) as Leader[];

  return (
    <div className="space-y-2">
      {label && <div className="label">{label} <span className="text-muted">({value.length}/{max})</span></div>}

      {selectedLeaders.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedLeaders.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => toggle(l.id)}
              className="flex items-center gap-2 bg-surface-2 border border-border rounded-md px-2 py-1 text-xs hover:border-accent"
            >
              <Image src={l.imageUrl} alt={l.name} width={20} height={28} className="rounded-sm" unoptimized />
              <span className="truncate max-w-[140px]">{l.name}</span>
              <span className="text-accent">×</span>
            </button>
          ))}
        </div>
      )}

      <input
        className="input"
        placeholder="Buscar leader..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="max-h-72 overflow-y-auto rounded-md border border-border bg-surface-2 divide-y divide-border/60">
        {filtered.length === 0 && <div className="p-3 text-sm text-muted">Sin resultados</div>}
        {filtered.slice(0, 60).map((l) => {
          const sel = selectedSet.has(l.id);
          const disabled = !sel && value.length >= max;
          return (
            <button
              key={l.id}
              type="button"
              disabled={disabled}
              onClick={() => toggle(l.id)}
              className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition
                ${sel ? "bg-accent/15" : "hover:bg-surface"} ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              <Image src={l.imageUrl} alt={l.name} width={32} height={45} className="rounded-sm" unoptimized />
              <div className="flex-1 min-w-0">
                <div className="truncate">{l.name}</div>
                <div className="text-[10px] text-muted font-mono">{l.id}</div>
              </div>
              {sel && <span className="text-accent text-xs font-bold">SELECCIONADO</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
