"use client";

import { Zap, Sparkles, Brain } from "lucide-react";
import type { AiTier } from "@/types/validation";

export interface AiTierInfo {
  value: AiTier;
  label: string;
  shortDesc: string;
  modelSummary: string;
}

export const AI_TIER_OPTIONS: AiTierInfo[] = [
  {
    value: "cekatan",
    label: "Cekatan",
    shortDesc: "Analisis Cepat",
    modelSummary: "Gemini 3.x Flash-lite",
  },
  {
    value: "cermat",
    label: "Cermat",
    shortDesc: "Analisis Seimbang",
    modelSummary: "Gemini 3.x Flash",
  },
  {
    value: "cerdas",
    label: "Cerdas",
    shortDesc: "Analisis Mendalam",
    modelSummary: "Gemini 4 Hydrogen",
  },
];

export const AI_TIER_META: Record<
  string,
  { label: string; badgeText: string }
> = {
  cekatan: { label: "Cekatan", badgeText: "Mode Cekatan" },
  cermat: { label: "Cermat", badgeText: "Mode Cermat" },
  cerdas: { label: "Cerdas", badgeText: "Mode Cerdas" },
  gemma: { label: "Gemma 4 31B", badgeText: "Mode Cadangan" },
};

interface AiModeSelectorProps {
  value: AiTier;
  onChange: (tier: AiTier) => void;
  size?: "sm" | "md";
  label?: string;
  showHint?: boolean;
  disabled?: boolean;
}

export function AiModeSelector({
  value,
  onChange,
  size = "md",
  label,
  showHint = true,
  disabled = false,
}: AiModeSelectorProps) {
  const activeMeta =
    AI_TIER_OPTIONS.find((o) => o.value === value) ?? AI_TIER_OPTIONS[0];

  const getIcon = (tier: AiTier) => {
    const iconSize = size === "sm" ? 11 : 13;
    if (tier === "cekatan") return <Zap size={iconSize} />;
    if (tier === "cermat") return <Sparkles size={iconSize} />;
    return <Brain size={iconSize} />;
  };

  return (
    <div className={size === "sm" ? "space-y-1" : "space-y-1.5"}>
      {label && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            {label}
          </span>
          {showHint && (
            <span className="text-[11px] font-normal text-slate-500">
              {activeMeta.modelSummary}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div
          role="radiogroup"
          aria-label={label || "Mode AI"}
          className={`inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50/80 ${
            size === "sm" ? "p-0.5" : "p-1"
          }`}
        >
          {AI_TIER_OPTIONS.map((opt) => {
            const isActive = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={isActive}
                disabled={disabled}
                onClick={() => onChange(opt.value)}
                title={`${opt.label} — ${opt.shortDesc} (${opt.modelSummary})`}
                className={`inline-flex items-center gap-1.5 rounded-full font-medium transition-all focus:outline-none disabled:opacity-50 ${
                  size === "sm"
                    ? "px-2.5 py-1 text-[11px]"
                    : "px-3 py-1.5 text-xs"
                } ${
                  isActive
                    ? "bg-[#0a4d8c] text-white shadow-2xs"
                    : "text-slate-600 hover:bg-[#eaf3ff] hover:text-[#0a4d8c]"
                }`}
              >
                {getIcon(opt.value)}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {!label && showHint && (
          <span className="text-[11px] font-normal text-slate-500">
            {activeMeta.shortDesc} · {activeMeta.modelSummary}
          </span>
        )}
      </div>
    </div>
  );
}
