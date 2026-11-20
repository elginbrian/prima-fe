"use client";

import { useState, useRef, useEffect } from "react";
import {
  Zap,
  Sparkles,
  Brain,
  Cpu,
  ChevronDown,
  Check,
  Lock,
} from "lucide-react";
import {
  useIntegrationConfig,
  getCustomAiStatus,
} from "@/lib/query/hooks/settings/useIntegrations";
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
  custom: { label: "Custom", badgeText: "Mode Custom" },
  external: { label: "Custom", badgeText: "Mode Custom" },
  mcp_takeover: { label: "Custom", badgeText: "Agent Takeover" },
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
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: integrationData } = useIntegrationConfig();
  const { isCustomAnalysis, customModelName } = getCustomAiStatus(
    integrationData?.config
  );

  // Sync parent state to "custom" when custom AI analysis brain is active
  useEffect(() => {
    if (isCustomAnalysis && value !== "custom") {
      onChange("custom");
    } else if (!isCustomAnalysis && value === "custom") {
      onChange("cekatan");
    }
  }, [isCustomAnalysis, value, onChange]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const effectiveTier: AiTier = isCustomAnalysis
    ? "custom"
    : value === "custom"
    ? "cekatan"
    : value;

  const activeDefaultMeta =
    AI_TIER_OPTIONS.find((o) => o.value === effectiveTier) ?? AI_TIER_OPTIONS[0];

  const getIcon = (tier: AiTier, iconSize = 14) => {
    if (tier === "custom") return <Cpu size={iconSize} />;
    if (tier === "cekatan") return <Zap size={iconSize} />;
    if (tier === "cermat") return <Sparkles size={iconSize} />;
    return <Brain size={iconSize} />;
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${size === "sm" ? "space-y-1" : "space-y-1.5"}`}
    >
      {label && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            {label}
          </span>
          {showHint && (
            <span className="text-[11px] font-normal text-slate-500">
              {isCustomAnalysis ? customModelName : activeDefaultMeta.modelSummary}
            </span>
          )}
        </div>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white text-left transition hover:border-[#0a4d8c]/50 focus:border-[#0a4d8c] focus:outline-none disabled:opacity-55 ${
          size === "sm" ? "px-3 py-2" : "px-3.5 py-2.5"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#e8f2fc] text-[#0a4d8c]">
            {getIcon(effectiveTier, size === "sm" ? 13 : 14)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-900">
                {isCustomAnalysis ? "Custom" : activeDefaultMeta.label}
              </span>
              <span className="rounded-full border border-[#0a4d8c]/20 bg-[#e8f2fc] px-1.5 py-0.2 text-[9px] font-semibold text-[#0a4d8c]">
                {isCustomAnalysis ? "Model Eksternal" : activeDefaultMeta.shortDesc}
              </span>
            </div>
            <div className="truncate text-[11px] text-slate-500">
              {isCustomAnalysis ? customModelName : activeDefaultMeta.modelSummary}
            </div>
          </div>
        </div>

        <ChevronDown
          size={14}
          className={`shrink-0 text-slate-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
          <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Pilih Mode Model AI Analisis
          </div>
          <div className="space-y-0.5">
            {/* Custom Mode Row */}
            {isCustomAnalysis ? (
              <button
                type="button"
                onClick={() => {
                  onChange("custom");
                  setOpen(false);
                }}
                className="flex w-full items-start justify-between gap-2 rounded-lg bg-[#e8f2fc] px-2.5 py-2 text-left text-[#0a4d8c]"
              >
                <div className="flex items-start gap-2 min-w-0">
                  <Cpu size={14} className="mt-0.5 shrink-0 text-[#0a4d8c]" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900">
                      Custom
                    </div>
                    <div className="truncate text-[10px] font-medium text-[#0a4d8c]">
                      {customModelName}
                    </div>
                  </div>
                </div>
                <Check size={13} className="mt-0.5 shrink-0 text-[#0a4d8c]" />
              </button>
            ) : (
              <div
                aria-disabled="true"
                className="flex w-full items-start justify-between gap-2 rounded-lg px-2.5 py-2 text-left opacity-55 cursor-not-allowed select-none"
              >
                <div className="flex items-start gap-2 min-w-0">
                  <Cpu size={14} className="mt-0.5 shrink-0 text-slate-400" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-slate-600">
                        Custom
                      </span>
                      <span className="inline-flex items-center gap-0.5 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.2 text-[9px] font-medium text-slate-500">
                        <Lock size={8} />
                        Tidak Tersedia
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Aktifkan di Pengaturan → Integrasi
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Default Tiers (Disabled when Custom AI is active) */}
            {AI_TIER_OPTIONS.map((opt) => {
              const isSelected = !isCustomAnalysis && effectiveTier === opt.value;
              if (isCustomAnalysis) {
                return (
                  <div
                    key={opt.value}
                    aria-disabled="true"
                    className="flex w-full items-start justify-between gap-2 rounded-lg px-2.5 py-2 text-left opacity-55 cursor-not-allowed select-none"
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <span className="mt-0.5 shrink-0 text-slate-400">
                        {getIcon(opt.value, 14)}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-slate-600">
                            {opt.label}
                          </span>
                          <span className="inline-flex items-center gap-0.5 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.2 text-[9px] font-medium text-slate-500">
                            <Lock size={8} />
                            Tidak Tersedia
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {opt.modelSummary}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-start justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition ${
                    isSelected
                      ? "bg-[#e8f2fc] text-[#0a4d8c]"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <span
                      className={`mt-0.5 shrink-0 ${
                        isSelected ? "text-[#0a4d8c]" : "text-slate-500"
                      }`}
                    >
                      {getIcon(opt.value, 14)}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-900">
                          {opt.label}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          · {opt.shortDesc}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {opt.modelSummary}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <Check size={13} className="mt-0.5 shrink-0 text-[#0a4d8c]" />
                  )}
                </button>
              );
            })}
          </div>
          {isCustomAnalysis && (
            <div className="mt-1 border-t border-slate-100 px-2.5 pt-1.5 pb-0.5 text-[10px] text-slate-500">
              Mode default dinonaktifkan (tanpa fallback ke default).
            </div>
          )}
        </div>
      )}
    </div>
  );
}
