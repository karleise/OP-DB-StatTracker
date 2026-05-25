"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

type Item = { id: number; name: string };

export default function GuideFilters({
  colors, difficulties, playStyles,
}: { colors: Item[]; difficulties: Item[]; playStyles: Item[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value); else next.delete(key);
    start(() => router.push(`/guides?${next.toString()}`));
  }

  return (
    <aside className="rounded-xl border bg-surface p-4 space-y-4 h-fit sticky top-16">
      <div>
        <div className="heading-display text-sm text-accent mb-2">Buscar</div>
        <input
          className="input"
          placeholder="Título o leader..."
          defaultValue={params.get("q") ?? ""}
          onChange={(e) => setParam("q", e.target.value)}
        />
      </div>

      <Select label="Color"      param="colorId"      items={colors}       value={params.get("colorId")} onChange={(v) => setParam("colorId", v)} />
      <Select label="Dificultad" param="difficultyId" items={difficulties} value={params.get("difficultyId")} onChange={(v) => setParam("difficultyId", v)} />
      <Select label="Estilo"     param="playStyleId"  items={playStyles}   value={params.get("playStyleId")} onChange={(v) => setParam("playStyleId", v)} />

      <button
        type="button"
        className="btn btn-ghost w-full"
        onClick={() => start(() => router.push("/guides"))}
      >
        Limpiar
      </button>
      {pending && <div className="text-xs text-muted">Actualizando...</div>}
    </aside>
  );
}

function Select({
  label, items, value, onChange,
}: { label: string; param: string; items: Item[]; value: string | null; onChange: (v: string) => void }) {
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
