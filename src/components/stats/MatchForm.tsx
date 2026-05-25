"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Leader = { id: string; name: string; imageUrl: string };
type User = { id: string; username: string };

export default function MatchForm({
  myLeaders, allLeaders, users,
}: { myLeaders: Leader[]; allLeaders: Leader[]; users: User[] }) {
  const router = useRouter();
  const [playerLeaderId, setPlayerLeaderId] = useState("");
  const [rivalId,        setRivalId]        = useState("");
  const [rivalName,      setRivalName]      = useState("");
  const [rivalLeaderId,  setRivalLeaderId]  = useState("");
  const [result,         setResult]         = useState<"WIN" | "LOSS">("WIN");
  const [notes,          setNotes]          = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!playerLeaderId) return toast.error("Selecciona tu líder");
    if (!rivalLeaderId)  return toast.error("Selecciona el líder rival");
    setSaving(true);
    const res = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerLeaderId,
        rivalId: rivalId || null,
        rivalName: rivalName || null,
        rivalLeaderId,
        result,
        notes: notes || null,
      }),
    });
    setSaving(false);
    if (!res.ok) return toast.error("Error guardando");
    toast.success("Partida registrada");
    router.push("/stats");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {myLeaders.length === 0 && (
        <div className="rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-sm">
          Aún no hay leaders con guía. Pide al admin que cree una guía para poder elegir tu mazo.
        </div>
      )}

      <Field label="Mi mazo (leaders con guía)">
        <select className="select" value={playerLeaderId} onChange={(e) => setPlayerLeaderId(e.target.value)}>
          <option value="">— Seleccionar —</option>
          {myLeaders.map((l) => <option key={l.id} value={l.id}>{l.id} — {l.name}</option>)}
        </select>
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Rival (usuario)">
          <select className="select" value={rivalId} onChange={(e) => setRivalId(e.target.value)}>
            <option value="">— Anónimo —</option>
            {users.map((u) => <option key={u.id} value={u.id}>@{u.username}</option>)}
          </select>
        </Field>
        <Field label="Rival (nombre libre)">
          <input className="input" value={rivalName} onChange={(e) => setRivalName(e.target.value)} placeholder="Si no es un usuario registrado" />
        </Field>
      </div>

      <Field label="Mazo del rival">
        <select className="select" value={rivalLeaderId} onChange={(e) => setRivalLeaderId(e.target.value)}>
          <option value="">— Seleccionar —</option>
          {allLeaders.map((l) => <option key={l.id} value={l.id}>{l.id} — {l.name}</option>)}
        </select>
      </Field>

      <Field label="Resultado">
        <div className="flex gap-2">
          <button type="button" onClick={() => setResult("WIN")}  className={`btn ${result === "WIN"  ? "btn-primary" : "btn-ghost"}`}>Victoria</button>
          <button type="button" onClick={() => setResult("LOSS")} className={`btn ${result === "LOSS" ? "btn-primary" : "btn-ghost"}`}>Derrota</button>
        </div>
      </Field>

      <Field label="Notas">
        <textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      </Field>

      <button className="btn btn-primary" onClick={submit} disabled={saving}>
        {saving ? "Guardando..." : "Registrar partida"}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
