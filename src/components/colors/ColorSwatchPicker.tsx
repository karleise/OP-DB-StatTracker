"use client";

import { COLOR_HEX } from "@/lib/utils";

type ColorItem = { id: number; name: string; hex: string | null };

export default function ColorSwatchPicker({
  colors, value, onChange, max = 2, label,
}: {
  colors: ColorItem[];
  value: number[];
  onChange: (next: number[]) => void;
  max?: number;
  label?: string;
}) {
  const selectedSet = new Set(value);

  function toggle(id: number) {
    if (selectedSet.has(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      if (value.length >= max) return;
      onChange([...value, id]);
    }
  }

  return (
    <div>
      {label && (
        <div className="label flex items-center gap-2">
          <span>{label}</span>
          <span className="text-muted normal-case font-normal tracking-normal text-[11px]">
            ({value.length}/{max})
          </span>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {colors.map((c) => {
          const sel = selectedSet.has(c.id);
          const disabled = !sel && value.length >= max;
          const hex = c.hex || COLOR_HEX[c.name] || "#888";
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              disabled={disabled}
              aria-pressed={sel}
              className={`group flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border-2 transition
                ${sel ? "shadow-md scale-[1.02]" : "hover:scale-[1.02]"}
                ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
              `}
              style={{
                borderColor: sel ? hex : "var(--border)",
                background: sel ? `${hex}22` : "var(--surface)",
              }}
            >
              <span
                className="inline-block w-6 h-6 rounded-full ring-2 ring-white/70 shadow-inner"
                style={{ background: hex }}
                aria-hidden
              />
              <span className="font-bold text-sm" style={{ color: sel ? hex : "var(--foreground)" }}>
                {c.name}
              </span>
              {sel && (
                <span
                  className="ml-0.5 text-[10px] font-bold uppercase tracking-wide"
                  style={{ color: hex }}
                >
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
