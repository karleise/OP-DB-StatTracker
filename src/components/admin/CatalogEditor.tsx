"use client";

import { useEffect, useState } from "react";
import { notifySuccess, notifyError, confirmDanger } from "@/lib/notify";

type Row = { id: number; name: string; hex?: string | null; order?: number | null };

const SINGULAR: Record<string, string> = {
  colors:       "color",
  difficulties: "dificultad",
  playstyles:   "estilo",
};

export default function CatalogEditor({
  type, title, hasHex, hasOrder,
}: { type: "colors" | "difficulties" | "playstyles"; title: string; hasHex?: boolean; hasOrder?: boolean }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [draft, setDraft] = useState<Row>({ id: 0, name: "", hex: "", order: 0 });
  const [busy, setBusy] = useState(false);

  const noun = SINGULAR[type] ?? "elemento";

  async function load() {
    const res = await fetch(`/api/catalogs/${type}`);
    setRows(await res.json());
  }
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function create() {
    if (!draft.name.trim()) return notifyError("Falta el nombre");
    setBusy(true);
    const res = await fetch(`/api/catalogs/${type}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: draft.name, hex: draft.hex, order: draft.order }),
    });
    setBusy(false);
    if (!res.ok) return notifyError(`Error creando ${noun}`);
    setDraft({ id: 0, name: "", hex: "", order: 0 });
    await load();
    notifySuccess(`${noun.charAt(0).toUpperCase() + noun.slice(1)} creado`);
  }

  async function save(row: Row) {
    setBusy(true);
    const res = await fetch(`/api/catalogs/${type}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
    });
    setBusy(false);
    if (!res.ok) return notifyError(`Error guardando ${noun}`);
    await load();
    notifySuccess("Cambios guardados");
  }

  async function remove(id: number) {
    const row = rows.find((r) => r.id === id);
    const ok = await confirmDanger({
      title: `¿Eliminar ${noun}?`,
      text: row?.name ? `"${row.name}" no se podrá recuperar.` : undefined,
    });
    if (!ok) return;
    setBusy(true);
    const res = await fetch(`/api/catalogs/${type}?id=${id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return notifyError(data?.error ?? `Error eliminando ${noun}`);
    }
    await load();
    notifySuccess(`${noun.charAt(0).toUpperCase() + noun.slice(1)} eliminado`);
  }

  return (
    <div>
      <h1 className="heading-display text-2xl sm:text-3xl mb-6">{title}</h1>

      <div className="rounded-xl border bg-surface p-4 mb-6">
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 w-full sm:w-auto sm:min-w-[200px]">
            <label className="label">Nombre</label>
            <input className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>
          {hasHex && (
            <div className="w-full sm:w-32">
              <label className="label">Hex</label>
              <input className="input" value={draft.hex ?? ""} onChange={(e) => setDraft({ ...draft, hex: e.target.value })} placeholder="#ff0000" />
            </div>
          )}
          {hasOrder && (
            <div className="w-full sm:w-24">
              <label className="label">Orden</label>
              <input type="number" className="input" value={draft.order ?? 0} onChange={(e) => setDraft({ ...draft, order: Number(e.target.value) })} />
            </div>
          )}
          <button className="btn btn-primary w-full sm:w-auto" onClick={create} disabled={busy}>Añadir</button>
        </div>
      </div>

      <div className="rounded-xl border bg-surface overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="bg-surface-2 text-left uppercase tracking-wide text-xs text-muted">
            <tr>
              <th className="px-3 py-2">Nombre</th>
              {hasHex   && <th className="px-3 py-2 w-32">Hex</th>}
              {hasOrder && <th className="px-3 py-2 w-24">Orden</th>}
              <th className="px-3 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 && (
              <tr><td colSpan={4} className="px-3 py-6 text-center text-muted">Sin entradas</td></tr>
            )}
            {rows.map((r) => (
              <RowEditor key={r.id} row={r} hasHex={hasHex} hasOrder={hasOrder} onSave={save} onDelete={() => remove(r.id)} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RowEditor({
  row, hasHex, hasOrder, onSave, onDelete,
}: { row: Row; hasHex?: boolean; hasOrder?: boolean; onSave: (r: Row) => void; onDelete: () => void }) {
  const [r, setR] = useState(row);
  useEffect(() => setR(row), [row]);
  return (
    <tr>
      <td className="px-3 py-2"><input className="input" value={r.name} onChange={(e) => setR({ ...r, name: e.target.value })} /></td>
      {hasHex && (
        <td className="px-3 py-2 flex items-center gap-2">
          <input className="input" value={r.hex ?? ""} onChange={(e) => setR({ ...r, hex: e.target.value })} />
          <span className="w-5 h-5 rounded border border-border" style={{ background: r.hex || "transparent" }} />
        </td>
      )}
      {hasOrder && (
        <td className="px-3 py-2">
          <input type="number" className="input" value={r.order ?? 0} onChange={(e) => setR({ ...r, order: Number(e.target.value) })} />
        </td>
      )}
      <td className="px-3 py-2 text-right space-x-2">
        <button className="btn btn-ghost text-xs" onClick={() => onSave(r)}>Guardar</button>
        <button className="btn btn-ghost text-xs text-accent" onClick={onDelete}>Eliminar</button>
      </td>
    </tr>
  );
}
