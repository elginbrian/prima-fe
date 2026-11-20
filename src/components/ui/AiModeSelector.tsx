"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Zap,
  Sparkles,
  Brain,
  Cpu,
  ChevronDown,
  Check,
  Webhook,
  Search,
  X,
} from "lucide-react";
import {
  useIntegrationConfig,
  getAnalysisCustomModels,
  resolveAiSelectionMeta,
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
  gemma: { label: "Cadangan", badgeText: "Mode Cadangan" },
  custom: { label: "Custom", badgeText: "Mode Custom" },
  external: { label: "Custom", badgeText: "Mode Custom" },
  mcp_takeover: { label: "Custom", badgeText: "Mode Custom" },
};

export function getAiTierDisplayLabel(tier?: string | null): string {
  if (!tier) return "Cekatan";
  if (tier.startsWith("custom")) return "Custom";
  return AI_TIER_META[tier]?.label ?? tier;
}

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
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const hasAutoInitRef = useRef(false);
  const { data: integrationData } = useIntegrationConfig();
  const config = integrationData?.config;
  const analysisCustomModels = getAnalysisCustomModels(config);

  // Initialize once to active_custom_model_id if configured for analysis, while still allowing switching back to Cekatan/Cermat/Cerdas anytime
  useEffect(() => {
    if (!config || hasAutoInitRef.current) return;
    hasAutoInitRef.current = true;
    const defaultId = config.active_custom_model_id;
    if (
      defaultId &&
      analysisCustomModels.some((m) => m.id === defaultId) &&
      value === "cekatan"
    ) {
      onChange(`custom:${defaultId}`);
    }
  }, [config, analysisCustomModels, value, onChange]);

  // If currently selected custom model was deleted from Settings, revert to Cekatan
  useEffect(() => {
    if (config && typeof value === "string" && value.startsWith("custom:")) {
      const id = value.slice("custom:".length);
      if (!analysisCustomModels.some((m) => m.id === id)) {
        onChange("cekatan");
      }
    }
  }, [config, analysisCustomModels, value, onChange]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => searchInputRef.current?.focus());
    } else {
      setSearchQuery("");
    }
  }, [open]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredDefaultOptions = useMemo(() => {
    if (!normalizedQuery) return AI_TIER_OPTIONS;
    return AI_TIER_OPTIONS.filter((opt) =>
      `${opt.label} ${opt.shortDesc} ${opt.modelSummary} internal gemini default`
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [normalizedQuery]);

  const filteredCustomModels = useMemo(() => {
    if (!normalizedQuery) return analysisCustomModels;
    return analysisCustomModels.filter((cm) => {
      const kindText =
        cm.provider_kind === "external_webhook" ? "webhook" : "api";
      return `${cm.display_name} ${cm.model_name || ""} ${cm.provider_name || ""} ${cm.base_url || ""} custom external ${kindText}`
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [analysisCustomModels, normalizedQuery]);

  const selectedMeta = resolveAiSelectionMeta(config, value);
  const activeDefaultOpt =
    AI_TIER_OPTIONS.find((o) => o.value === selectedMeta.selection) ??
    AI_TIER_OPTIONS[0];

  const getIcon = (tier: string, iconSize = 14) => {
    if (tier.startsWith("custom")) return <Cpu size={iconSize} />;
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
              {selectedMeta.modelName}
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
            {getIcon(selectedMeta.selection, size === "sm" ? 13 : 14)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-xs font-semibold text-slate-900">
                {selectedMeta.isCustom
                  ? `${selectedMeta.label}`
                  : activeDefaultOpt.label}
              </span>
            </div>
            <div className="truncate text-[11px] text-slate-500">
              {selectedMeta.modelName}
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
          {/* Search Bar */}
          <div className="mb-1.5 border-b border-slate-100 pb-1.5">
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1.5 focus-within:border-[#0a4d8c] focus-within:bg-white">
              <Search size={12} className="shrink-0 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari model AI..."
                className="w-full bg-transparent text-[11px] text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="shrink-0 rounded p-0.5 text-slate-400 hover:text-slate-700"
                  aria-label="Hapus pencarian"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable List: ~3 models visible at a time before scrolling */}
          <div className="max-h-[164px] overflow-y-auto overscroll-contain space-y-1.5 pr-0.5 scrollbar-thin">
            {filteredDefaultOptions.length === 0 &&
            filteredCustomModels.length === 0 ? (
              <div className="px-2.5 py-4 text-center text-[11px] text-slate-400">
                Tidak ada model AI yang cocok dengan &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              <>
                {/* Group 1: Internal via Gemini */}
                {filteredDefaultOptions.length > 0 && (
                  <div>
                    <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Model Internal via Gemini
                    </div>
                    <div className="space-y-0.5">
                      {filteredDefaultOptions.map((opt) => {
                        const isSelected = selectedMeta.selection === opt.value;
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
                                  isSelected
                                    ? "text-[#0a4d8c]"
                                    : "text-slate-500"
                                }`}
                              >
                                {getIcon(opt.value, 14)}
                              </span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 leading-4">
                                  <span className="text-xs font-semibold text-slate-900">
                                    {opt.label}
                                  </span>
                                  <span className="text-[10px] text-slate-500">
                                    · {opt.shortDesc}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-500 leading-[14px]">
                                  {opt.modelSummary}
                                </div>
                              </div>
                            </div>
                            {isSelected && (
                              <Check
                                size={13}
                                className="mt-0.5 shrink-0 text-[#0a4d8c]"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Group 2: Saved Custom Models */}
                {(filteredCustomModels.length > 0 || !normalizedQuery) && (
                  <div
                    className={
                      filteredDefaultOptions.length > 0
                        ? "border-t border-slate-100 pt-1.5"
                        : ""
                    }
                  >
                    <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Model Eksternal ({filteredCustomModels.length})
                    </div>

                    {filteredCustomModels.length === 0 ? (
                      <div className="px-2.5 py-2 text-[11px] text-slate-400">
                        Belum ada Model Custom API/Webhook. Tambah di Pengaturan → Integrasi.
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        {filteredCustomModels.map((cm) => {
                          const optionKey: AiTier = `custom:${cm.id}`;
                          const isSelected = selectedMeta.selection === optionKey;
                          const isWebhook =
                            cm.provider_kind === "external_webhook";
                          return (
                            <button
                              key={cm.id}
                              type="button"
                              onClick={() => {
                                onChange(optionKey);
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
                                    isSelected
                                      ? "text-[#0a4d8c]"
                                      : "text-slate-500"
                                  }`}
                                >
                                  {isWebhook ? (
                                    <Webhook size={14} />
                                  ) : (
                                    <Cpu size={14} />
                                  )}
                                </span>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 leading-4">
                                    <span className="truncate text-xs font-semibold text-slate-900">
                                      {cm.display_name}
                                    </span>
                                    <span className="shrink-0 rounded border border-slate-200 bg-slate-100 px-1 py-0.2 text-[9px] font-medium text-slate-600">
                                      {isWebhook ? "Webhook" : "API"}
                                    </span>
                                  </div>
                                  <div className="truncate text-[10px] text-[#0a4d8c] leading-[14px]">
                                    {cm.model_name ||
                                      cm.base_url ||
                                      "Custom Model"}
                                  </div>
                                </div>
                              </div>
                              {isSelected && (
                                <Check
                                  size={13}
                                  className="mt-0.5 shrink-0 text-[#0a4d8c]"
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
