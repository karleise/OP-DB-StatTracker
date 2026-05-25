"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

type Row = { id: number; name: string; hex?: string | null; order?: number | null };

export default function CatalogEditor({
  type, title, hasHex, hasOrder,
}: { type: "colors" | "difficulties" | "playstyles"; title: string; hasHex?: boolean; hasOrder?: boolean }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [draft, setDraft] = useState<Row>({ id: 0, name: "", hex: "", order: 0 });
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch(`/api/catalogs/${type}`);
    setRows(await res.json());
  }
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function create() {
    if (!draft.name.trim()) return;
    setBusy(true);
    const res = await fetch(`/api/catalogs/${type}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: draft.name, hex: draft.hex, order: draft.order }),
    });
    setBusy(false);
    if (!res.ok) return toast.error("Error creando");
    setDraft({ id: 0, name: "", hex: "", order: 0 });
    await load();
  }

  async function save(row: Row) {
    setBusy(true);
    const res = await fetch(`/api/catalogs/${type}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
    });
    setBusy(false);
    if (!res.ok) return toast.error("Error guardando");
    await load();
  }

  async function remove(id: number) {
    if (!confirm("¿Eliminar?")) return;
    setBusy(true);
    const res = await fetch(`/api/catalogs/${type}?id=${id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) return toast.error("Error eliminando (¿en uso por guías?)");
    await load();
  }

  return (
    <div>
      <h1 className="heading-display text-3xl mb-6">{title}</h1>

      <div className="rounded-xl border bg-surface p-4 mb-6">
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="label">Nombre</label>
            <input className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>
          {hasHex && (
            <div className="w-32">
              <label className="label">Hex</label>
              <input className="input" value={draft.hex ?? ""} onChange={(e) => setDraft({ ...draft, hex: e.target.value })} placeholder="#ff0000" />
            </div>
          )}
          {hasOrder && (
            <div className="w-24">
              <label className="label">Orden</label>
              <input type="number" className="input" value={draft.order ?? 0} onChange={(e) => setDraft({ ...draft, order: Number(e.target.value) })} />
            </div>
          )}
          <button className="btn btn-primary" onClick={create} disabled={busy}>Añadir</button>
        </div>
      </div>

      <div className="rounded-xl border bg-surface overflow-hidden">
        <table className="w-full text-sm">
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
