"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import LeaderPicker from "@/components/leaders/LeaderPicker";

type Leader = { id: string; name: string; imageUrl: string };
type Item = { id: number; name: string };

export type GuideInitial = {
  id?: string;
  leaderId: string;
  title: string;
  body: string;
  colorId: number;
  difficultyId: number;
  playStyleId: number;
  goodMatchups: string[];
  badMatchups: string[];
};

export default function GuideForm({
  initial, leaders, colors, difficulties, playStyles, leadersWithoutGuide,
}: {
  initial?: Partial<GuideInitial>;
  leaders: Leader[];
  leadersWithoutGuide: Leader[];
  colors: Item[];
  difficulties: Item[];
  playStyles: Item[];
}) {
  const router = useRouter();
  const editing = !!initial?.id;
  const leaderOptions = editing ? leaders : leadersWithoutGuide;

  const [state, setState] = useState<GuideInitial>({
    leaderId:     initial?.leaderId     ?? "",
    title:        initial?.title        ?? "",
    body:         initial?.body         ?? "",
    colorId:      Number(initial?.colorId      ?? colors[0]?.id      ?? 0),
    difficultyId: Number(initial?.difficultyId ?? difficulties[0]?.id ?? 0),
    playStyleId:  Number(initial?.playStyleId  ?? playStyles[0]?.id   ?? 0),
    goodMatchups: initial?.goodMatchups ?? [],
    badMatchups:  initial?.badMatchups  ?? [],
  });
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!state.leaderId)         return toast.error("Selecciona un líder");
    if (!state.title.trim())     return toast.error("Falta el título");
    if (!state.body.trim())      return toast.error("Falta el cuerpo");
    setSaving(true);
    const url = editing ? `/api/guides/${initial!.id}` : "/api/guides";
    const method = editing ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
    setSaving(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error("Error guardando: " + JSON.stringify(err));
      return;
    }
    toast.success("Guardado");
    router.push("/admin/guides");
    router.refresh();
  }

  async function onDelete() {
    if (!editing) return;
    if (!confirm("¿Eliminar guía?")) return;
    const res = await fetch(`/api/guides/${initial!.id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Error eliminando");
    toast.success("Eliminada");
    router.push("/admin/guides");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Leader</label>
          <select
            className="select"
            value={state.leaderId}
            onChange={(e) => setState({ ...state, leaderId: e.target.value })}
            disabled={editing}
          >
            <option value="">— Seleccionar —</option>
            {leaderOptions.map((l) => (
              <option key={l.id} value={l.id}>{l.id} — {l.name}</option>
            ))}
          </select>
          {editing && <div className="text-xs text-muted mt-1">El leader no se puede cambiar tras crear la guía.</div>}
        </div>
        <div>
          <label className="label">Título</label>
          <input
            className="input"
            value={state.title}
            onChange={(e) => setState({ ...state, title: e.target.value })}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <SelectField label="Color"      items={colors}       value={state.colorId}      onChange={(v) => setState({ ...state, colorId: v })} />
        <SelectField label="Dificultad" items={difficulties} value={state.difficultyId} onChange={(v) => setState({ ...state, difficultyId: v })} />
        <SelectField label="Estilo"     items={playStyles}   value={state.playStyleId}  onChange={(v) => setState({ ...state, playStyleId: v })} />
      </div>

      <div>
        <label className="label">Cuerpo (Markdown)</label>
        <textarea
          className="textarea min-h-[260px]"
          value={state.body}
          onChange={(e) => setState({ ...state, body: e.target.value })}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <LeaderPicker
          label="Matchups buenos"
          max={3}
          leaders={leaders}
          value={state.goodMatchups}
          onChange={(v) => setState({ ...state, goodMatchups: v })}
        />
        <LeaderPicker
          label="Matchups malos"
          max={3}
          leaders={leaders}
          value={state.badMatchups}
          onChange={(v) => setState({ ...state, badMatchups: v })}
        />
      </div>

      <div className="flex gap-2">
        <button className="btn btn-primary" disabled={saving} onClick={submit}>
          {saving ? "Guardando..." : (editing ? "Guardar cambios" : "Crear guía")}
        </button>
        {editing && (
          <button className="btn btn-ghost text-accent" onClick={onDelete}>Eliminar</button>
        )}
      </div>
    </div>
  );
}

function SelectField({
  label, items, value, onChange,
}: { label: string; items: Item[]; value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <select className="select" value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
      </select>
    </div>
  );
}
