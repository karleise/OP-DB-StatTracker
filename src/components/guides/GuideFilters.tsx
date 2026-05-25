"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

type Item = { id: number; name: string };

export default function GuideFilters({
  colors, difficulties, playStyles,
}: { colors: Item[]; difficulties: Item[]; playStyles: Item[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value); else next.delete(key);
    start(() => router.push(`/guides?${next.toString()}`));
  }

  // Debounce query input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q === (params.get("q") ?? "")) return;
    debounceRef.current = setTimeout(() => setParam("q", q), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <aside className="rounded-xl border bg-surface p-4 space-y-4 h-fit sticky top-16 backdrop-blur-md">
      <div>
        <div className="heading-display text-sm text-accent mb-2">Buscar</div>
        <input
          className="input"
          placeholder="Título o leader..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <Select label="Color"      items={colors}       value={params.get("colorId")} onChange={(v) => setParam("colorId", v)} />
      <Select label="Dificultad" items={difficulties} value={params.get("difficultyId")} onChange={(v) => setParam("difficultyId", v)} />
      <Select label="Estilo"     items={playStyles}   value={params.get("playStyleId")} onChange={(v) => setParam("playStyleId", v)} />

      <button
        type="button"
        className="btn btn-ghost w-full"
        onClick={() => { setQ(""); start(() => router.push("/guides")); }}
      >
        Limpiar
      </button>
      {pending && <div className="text-xs text-muted">Actualizando...</div>}
    </aside>
  );
}

function Select({
  label, items, value, onChange,
}: { label: string; items: Item[]; value: string | null; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <select className="select" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
        <option value="">Todos</option>
        {items.map((it) => (
          <option key={it.id} value={it.id}>{it.name}</option>
        ))}
      </select>
    </div>
  );
}
