"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ChevronDown, Gamepad2, Check } from "lucide-react";
import type { Game } from "@prisma/client";
import { switchGame } from "@/app/actions/game";

type Option = { code: Game; label: string; short: string };

export default function GameSwitcher({
  current,
  options,
}: {
  current: Game;
  options: readonly Option[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const active = options.find((o) => o.code === current) ?? options[0];

  function pick(code: Game) {
    if (code === current) { setOpen(false); return; }
    start(async () => { await switchGame(code); setOpen(false); });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md border-2 border-accent bg-accent/10 text-accent hover:bg-accent/20 transition cursor-pointer text-sm font-bold uppercase tracking-wide"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Gamepad2 className="w-4 h-4" strokeWidth={2.25} />
        <span>{active.short}</span>
        <ChevronDown className={"w-3.5 h-3.5 transition-transform " + (open ? "rotate-180" : "")} />
        {pending && <span className="text-[10px] uppercase tracking-widest animate-pulse ml-1">…</span>}
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 mt-1 min-w-[180px] rounded-lg border border-border bg-[rgba(255,251,240,0.98)] shadow-lg overflow-hidden z-50"
        >
          {options.map((o) => {
            const sel = o.code === current;
            return (
              <li key={o.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={sel}
                  onClick={() => pick(o.code)}
                  className={
                    "w-full flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition " +
                    (sel ? "bg-accent/10 text-accent" : "hover:bg-surface-2 hover:text-accent")
                  }
                >
                  <span className="text-[10px] font-mono w-7 opacity-70">{o.short}</span>
                  <span className="font-semibold flex-1 text-left">{o.label}</span>
                  {sel && <Check className="w-4 h-4" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
