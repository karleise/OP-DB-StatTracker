"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { leaderImageSrc } from "@/lib/leader-image";

type Pair = {
  leaderA: { id: string; name: string; imageUrl: string };
  leaderB: { id: string; name: string; imageUrl: string };
  respectedMatchups: boolean;
};

export default function RandomizerPage() {
  const [considerMatchups, setConsiderMatchups] = useState(true);
  const [useAllAvailable, setUseAllAvailable] = useState(false);
  const [pair, setPair] = useState<Pair | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    const res = await fetch("/api/randomizer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ considerMatchups, useAllAvailable }),
    });
    setLoading(false);
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      toast.error(err?.error ?? "No hay leaders suficientes");
      return;
    }
    const data = (await res.json()) as Pair;
    setPair(data);
    if (considerMatchups && !data.respectedMatchups) {
      toast.message("No se encontró un par sin matchup desventajoso, se devolvió uno aleatorio.");
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="heading-display text-4xl mb-2">Emparejador aleatorio</h1>
      <p className="text-muted mb-6">Genera un duelo entre dos líderes que tengan guía.</p>

      <div className="rounded-xl border bg-surface p-4 mb-8 flex flex-wrap gap-6 items-center">
        <Toggle
          checked={considerMatchups}
          onChange={setConsiderMatchups}
          label="Considerar matchups"
          hint="Evita parejas donde uno tenga al otro como mal matchup"
        />
        <Toggle
          checked={useAllAvailable}
          onChange={setUseAllAvailable}
          label="Usar todos los leaders disponibles"
          hint="Por defecto solo se usan los que tienen guía"
        />
        <button className="btn btn-primary ml-auto" disabled={loading} onClick={generate}>
          {loading ? "Generando..." : "Generar matchup"}
        </button>
      </div>

      {pair && (
        <div className="grid sm:grid-cols-[1fr_auto_1fr] items-center gap-6 animate-in fade-in">
          <LeaderSide leader={pair.leaderA} accent="#3b6fd6" />
          <div className="heading-display text-7xl text-accent">VS</div>
          <LeaderSide leader={pair.leaderB} accent="#d83a3a" reverse />
        </div>
      )}

      {!pair && (
        <div className="rounded-xl border bg-surface p-12 text-center text-muted">
          <div className="heading-display text-2xl mb-2">Pulsa &quot;Generar matchup&quot;</div>
          <p>El emparejador elige dos líderes al azar entre los que tienen guía.</p>
        </div>
      )}
    </div>
  );
}

function Toggle({
  checked, onChange, label, hint,
}: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <span className={`relative inline-block w-10 h-6 rounded-full ${checked ? "bg-accent" : "bg-surface-2 border border-border"}`}>
        <span className={`absolute top-0.5 ${checked ? "left-5" : "left-0.5"} w-5 h-5 bg-foreground rounded-full transition`} />
      </span>
      <span>
        <span className="font-semibold block">{label}</span>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </span>
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

function LeaderSide({
  leader, accent, reverse,
}: { leader: { id: string; name: string; imageUrl: string }; accent: string; reverse?: boolean }) {
  return (
    <div className={`flex flex-col items-center ${reverse ? "sm:items-end" : "sm:items-start"}`}>
      <div className="rounded-xl overflow-hidden border" style={{ borderColor: accent, boxShadow: `0 10px 50px ${accent}50` }}>
        <Image src={leaderImageSrc(leader)} alt={leader.name} width={280} height={392} unoptimized />
      </div>
      <div className="mt-3 heading-display text-2xl text-center">{leader.name}</div>
      <div className="text-xs font-mono text-muted">{leader.id}</div>
    </div>
  );
}
