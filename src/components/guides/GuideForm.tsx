"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notifySuccess, notifyError, confirmDanger } from "@/lib/notify";
import { Check } from "lucide-react";
import LeaderPicker from "@/components/leaders/LeaderPicker";
import LeaderCombobox from "@/components/leaders/LeaderCombobox";
import ColorSwatchPicker from "@/components/colors/ColorSwatchPicker";

type Leader = { id: string; name: string; imageUrl: string };
type Item = { id: number; name: string };
type ColorItem = { id: number; name: string; hex: string | null };

const MAX_PLAYSTYLES = 4;

export type GuideInitial = {
  id?: string;
  leaderId: string;
  body: string;
  colorIds: number[];
  difficultyId: number;
  playStyleIds: number[];
  goodMatchups: string[];
  badMatchups: string[];
};

export default function GuideForm({
  initial, leaders, colors, difficulties, playStyles, leadersWithoutGuide, maxColors = 2,
}: {
  initial?: Partial<GuideInitial>;
  leaders: Leader[];
  leadersWithoutGuide: Leader[];
  colors: ColorItem[];
  difficulties: Item[];
  playStyles: Item[];
  maxColors?: number;
}) {
  const router = useRouter();
  const editing = !!initial?.id;
  const leaderOptions = editing ? leaders : leadersWithoutGuide;

  const [state, setState] = useState<GuideInitial>({
    leaderId:     initial?.leaderId     ?? "",
    body:         initial?.body         ?? "",
    colorIds:     initial?.colorIds     ?? [],
    difficultyId: Number(initial?.difficultyId ?? 0),
    playStyleIds: initial?.playStyleIds  ?? [],
    goodMatchups: initial?.goodMatchups ?? [],
    badMatchups:  initial?.badMatchups  ?? [],
  });
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!state.leaderId)                  return notifyError("Selecciona un líder");
    if (!state.body.trim())               return notifyError("Falta el cuerpo");
    if (state.colorIds.length === 0)      return notifyError("Selecciona al menos 1 color");
    if (!state.difficultyId)              return notifyError("Selecciona dificultad");
    if (state.playStyleIds.length === 0)  return notifyError("Selecciona al menos 1 estilo");
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
      notifyError("Error guardando: " + (err?.error ? JSON.stringify(err.error) : "desconocido"));
      return;
    }
    notifySuccess(editing ? "Mazo actualizado" : "Mazo creado");
    router.push("/admin/guides");
    router.refresh();
  }

  async function onDelete() {
    if (!editing) return;
    const ok = await confirmDanger({
      title: "¿Eliminar mazo?",
      text: "Se borrará junto con sus matchups y colores asociados.",
    });
    if (!ok) return;
    const res = await fetch(`/api/guides/${initial!.id}`, { method: "DELETE" });
    if (!res.ok) return notifyError("Error eliminando");
    notifySuccess("Mazo eliminado");
    router.push("/admin/guides");
    router.refresh();
  }

  function togglePlayStyle(id: number) {
    setState((s) => {
      if (s.playStyleIds.includes(id)) {
        return { ...s, playStyleIds: s.playStyleIds.filter((v) => v !== id) };
      }
      if (s.playStyleIds.length >= MAX_PLAYSTYLES) return s;
      return { ...s, playStyleIds: [...s.playStyleIds, id] };
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="label">Leader</label>
        <LeaderCombobox
          leaders={leaderOptions}
          value={state.leaderId}
          onChange={(id) => setState({ ...state, leaderId: id })}
          disabled={editing}
        />
        {editing && <div className="text-xs text-muted mt-1">El leader no se puede cambiar tras crear el mazo.</div>}
      </div>

      <ColorSwatchPicker
        label="Color del mazo"
        max={maxColors}
        colors={colors}
        value={state.colorIds}
        onChange={(v) => setState({ ...state, colorIds: v })}
      />

      <div>
        <div className="label flex items-center gap-2">
          <span>Estilo</span>
          <span className="text-muted normal-case font-normal tracking-normal text-[11px]">
            ({state.playStyleIds.length}/{MAX_PLAYSTYLES})
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {playStyles.map((ps) => {
            const sel = state.playStyleIds.includes(ps.id);
            const disabled = !sel && state.playStyleIds.length >= MAX_PLAYSTYLES;
            return (
              <button
                key={ps.id}
                type="button"
                onClick={() => togglePlayStyle(ps.id)}
                disabled={disabled}
                aria-pressed={sel}
                className={
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-sm font-semibold transition " +
                  (sel
                    ? "bg-accent/15 text-accent border-accent shadow-sm"
                    : "bg-surface text-foreground border-border hover:border-accent/60 hover:text-accent") +
                  (disabled ? " opacity-40 cursor-not-allowed hover:border-border hover:text-foreground" : "")
                }
              >
                {sel && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                {ps.name}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <SelectField
          label="Dificultad"
          items={difficulties}
          value={state.difficultyId}
          onChange={(v) => setState({ ...state, difficultyId: v })}
        />
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
          {saving ? "Guardando..." : (editing ? "Guardar cambios" : "Crear mazo")}
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
      <select
        className="select"
        value={value || ""}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        <option value="">— Seleccionar —</option>
        {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
      </select>
    </div>
  );
}
