"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Skull, User, UserPlus, Save, Swords, Shield } from "lucide-react";
import LeaderPicker from "./LeaderPicker";
import { notifySuccess, notifyError } from "@/lib/notify";

type Leader = { id: string; name: string; imageUrl: string };
type User = { id: string; username: string };

const ACCENT_WIN  = "#2f9d5a";
const ACCENT_LOSS = "#d83a3a";
const ACCENT_ME   = "#1e6fbb";

export default function MatchForm({
  myLeaders, allLeaders, users,
}: { myLeaders: Leader[]; allLeaders: Leader[]; users: User[] }) {
  const router = useRouter();
  const [playerLeaderId, setPlayerLeaderId] = useState("");
  const [rivalLeaderId,  setRivalLeaderId]  = useState("");
  const [rivalMode, setRivalMode] = useState<"user" | "free">("user");
  const [rivalId,   setRivalId]   = useState("");
  const [rivalName, setRivalName] = useState("");
  const [result, setResult] = useState<"WIN" | "LOSS" | null>(null);
  const [turnOrder, setTurnOrder] = useState<"FIRST" | "SECOND" | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!playerLeaderId) return notifyError("Selecciona tu mazo");
    if (!rivalLeaderId)  return notifyError("Selecciona el mazo rival");
    if (!result)         return notifyError("Marca victoria o derrota");

    setSaving(true);
    const res = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerLeaderId,
        rivalId:       rivalMode === "user" ? (rivalId || null) : null,
        rivalName:     rivalMode === "free" ? (rivalName || null) : null,
        rivalLeaderId,
        result,
        turnOrder,
      }),
    });
    setSaving(false);
    if (!res.ok) return notifyError("Error guardando");
    notifySuccess("Partida registrada");
    router.push("/stats");
    router.refresh();
  }

  const rivalAccent = result === "WIN" ? ACCENT_LOSS : result === "LOSS" ? ACCENT_WIN : ACCENT_LOSS;
  const meAccent    = result === "WIN" ? ACCENT_WIN  : result === "LOSS" ? ACCENT_LOSS : ACCENT_ME;

  return (
    <div className="space-y-8">
      {myLeaders.length === 0 && (
        <div className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm">
          Aún no hay leaders con mazo. Pide al admin que cree un mazo para poder elegirlo.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-6 items-stretch">
        <div className="flex flex-col gap-2">
          <div className="text-[11px] uppercase tracking-widest text-muted">Mi mazo</div>
          <LeaderPicker
            leaders={myLeaders}
            value={playerLeaderId}
            onChange={setPlayerLeaderId}
            accent={meAccent}
            placeholder="Elige tu leader"
            emptyMessage="Sin mazos disponibles"
          />
        </div>

        <div className="hidden md:flex flex-col items-center justify-center px-2">
          <div className="heading-display text-6xl text-accent leading-none">VS</div>
        </div>
        <div className="md:hidden flex items-center gap-3 my-2">
          <div className="flex-1 h-px bg-border" />
          <div className="heading-display text-2xl text-accent">VS</div>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-[11px] uppercase tracking-widest text-muted">Rival</div>
          <LeaderPicker
            leaders={allLeaders}
            value={rivalLeaderId}
            onChange={setRivalLeaderId}
            accent={rivalAccent}
            placeholder="Elige su leader"
          />
        </div>
      </div>

      <div className="rounded-xl border bg-surface p-4">
        <div className="text-[11px] uppercase tracking-widest text-muted mb-3">Quién es el rival</div>
        <div className="flex gap-2 mb-3">
          <TabBtn
            active={rivalMode === "user"}
            onClick={() => setRivalMode("user")}
            icon={<User className="w-4 h-4" />}
            label="Usuario registrado"
          />
          <TabBtn
            active={rivalMode === "free"}
            onClick={() => setRivalMode("free")}
            icon={<UserPlus className="w-4 h-4" />}
            label="Nombre libre"
          />
        </div>
        {rivalMode === "user" ? (
          <select className="select" value={rivalId} onChange={(e) => setRivalId(e.target.value)}>
            <option value="">— Anónimo —</option>
            {users.map((u) => <option key={u.id} value={u.id}>@{u.username}</option>)}
          </select>
        ) : (
          <input
            className="input"
            value={rivalName}
            onChange={(e) => setRivalName(e.target.value)}
            placeholder="Nombre del rival"
          />
        )}
      </div>

      <div>
        <div className="text-[11px] uppercase tracking-widest text-muted mb-3">Resultado</div>
        <div className="grid grid-cols-2 gap-3">
          <ResultBtn
            active={result === "WIN"}
            onClick={() => setResult("WIN")}
            color={ACCENT_WIN}
            icon={<Trophy className="w-7 h-7" strokeWidth={2.25} />}
            label="Victoria"
          />
          <ResultBtn
            active={result === "LOSS"}
            onClick={() => setResult("LOSS")}
            color={ACCENT_LOSS}
            icon={<Skull className="w-7 h-7" strokeWidth={2.25} />}
            label="Derrota"
          />
        </div>
      </div>

      <div>
        <div className="text-[11px] uppercase tracking-widest text-muted mb-3">Turno (opcional)</div>
        <div className="grid grid-cols-2 gap-3">
          <TurnBtn
            active={turnOrder === "FIRST"}
            onClick={() => setTurnOrder(turnOrder === "FIRST" ? null : "FIRST")}
            icon={<Swords className="w-5 h-5" strokeWidth={2.25} />}
            label="Salí primero"
          />
          <TurnBtn
            active={turnOrder === "SECOND"}
            onClick={() => setTurnOrder(turnOrder === "SECOND" ? null : "SECOND")}
            icon={<Shield className="w-5 h-5" strokeWidth={2.25} />}
            label="Salí segundo"
          />
        </div>
      </div>

      <button
        className="btn btn-primary w-full sm:w-auto sm:min-w-[260px] text-base py-3"
        onClick={submit}
        disabled={saving}
      >
        <Save className="w-5 h-5" />
        {saving ? "Guardando..." : "Registrar partida"}
      </button>
    </div>
  );
}

function TabBtn({
  active, onClick, icon, label,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-md border-2 text-xs font-bold uppercase tracking-wide transition cursor-pointer " +
        (active
          ? "bg-accent/15 text-accent border-accent"
          : "bg-surface text-foreground/70 border-border hover:border-accent/40 hover:text-accent")
      }
    >
      {icon}
      {label}
    </button>
  );
}

function TurnBtn({
  active, onClick, icon, label,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "flex items-center justify-center gap-2 px-3 py-3 rounded-lg border-2 text-sm font-bold uppercase tracking-wide transition cursor-pointer " +
        (active
          ? "bg-accent/15 text-accent border-accent shadow-sm"
          : "bg-surface text-foreground/70 border-border hover:border-accent/40 hover:text-accent")
      }
    >
      {icon}
      {label}
    </button>
  );
}

function ResultBtn({
  active, onClick, color, icon, label,
}: { active: boolean; onClick: () => void; color: string; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="group relative flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 transition cursor-pointer hover:scale-[1.02]"
      style={{
        borderColor: active ? color : "var(--border)",
        background:  active ? color : "var(--surface)",
        color:       active ? "#fff" : "var(--foreground)",
        boxShadow:   active ? `0 8px 24px ${color}55` : undefined,
      }}
    >
      {icon}
      <span className="heading-display text-xl tracking-wider">{label}</span>
    </button>
  );
}
