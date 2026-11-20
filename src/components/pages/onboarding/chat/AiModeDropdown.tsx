"use client";

import { useState, useRef, useEffect } from "react";
import {
  Zap,
  ShieldCheck,
  BrainCircuit,
  Cpu,
  ChevronDown,
  Check,
  Lock,
  Radio,
  Webhook,
} from "lucide-react";
import { useChatAiMode } from "@/lib/query/hooks/settings/useIntegrations";

interface AiModeDropdownProps {
  compact?: boolean;
  direction?: "up" | "down";
}

const DEFAULT_AI_MODES = [
  {
    id: "cekatan",
    label: "Cekatan",
    description: "Gemini 3.x Flash-lite",
    available: true,
    icon: Zap,
  },
  {
    id: "cermat",
    label: "Cermat",
    description: "Gemini 3.x Flash",
    available: false,
    icon: ShieldCheck,
  },
  {
    id: "cerdas",
    label: "Cerdas",
    description: "Gemini 4 Hydrogen",
    available: false,
    icon: BrainCircuit,
  },
] as const;

export function AiModeDropdown({
  compact = false,
  direction = "down",
}: AiModeDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    chatCustomModels,
    activeMode,
    isCustom,
    label,
    modelName,
    selectMode,
  } = useChatAiMode();

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

  const getCustomKindMeta = (kind: string) => {
    if (kind === "external_mcp") return { badge: "MCP", Icon: Radio };
    if (kind === "external_webhook") return { badge: "Webhook", Icon: Webhook };
    return { badge: "API", Icon: Cpu };
  };

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className={`inline-flex items-center gap-1 rounded-lg border border-[#0a4d8c]/20 bg-[#e8f2fc] font-semibold text-[#0a4d8c] transition hover:bg-[#dcebfa] focus:outline-none ${
          compact ? "px-2 py-1 text-[10px]" : "px-2.5 py-1 text-[11px]"
        }`}
        title={
          isCustom
            ? `Mode Custom: ${label} (${modelName}) — Tanpa fallback ke default`
            : "Pilih Mode AI (Internal via Gemini: Cekatan)"
        }
      >
        {isCustom ? (
          <Cpu size={10} className="shrink-0" />
        ) : (
          <Zap size={10} className="shrink-0" />
        )}
        <span className="max-w-[110px] truncate">
          {isCustom ? (compact ? "Custom" : `Custom · ${label}`) : "Cekatan"}
        </span>
        <ChevronDown
          size={11}
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className={`absolute right-0 z-50 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ${
            direction === "up" ? "bottom-full mb-1.5" : "top-full mt-1.5"
          }`}
        >
          {/* Group 1: Internal via Gemini */}
          <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Internal via Gemini (Default)
          </div>
          <div className="space-y-0.5">
            {DEFAULT_AI_MODES.map((m) => {
              const Icon = m.icon;
              const isSelected = activeMode === m.id;
              if (m.available) {
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      selectMode("cekatan");
                      setOpen(false);
                    }}
                    className={`flex w-full items-start justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition ${
                      isSelected
                        ? "bg-[#e8f2fc] text-[#0a4d8c]"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <Icon
                        size={14}
                        className={`mt-0.5 shrink-0 ${
                          isSelected ? "text-[#0a4d8c]" : "text-slate-500"
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900">
                          {m.label}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {m.description}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <Check size={13} className="mt-0.5 shrink-0 text-[#0a4d8c]" />
                    )}
                  </button>
                );
              }

              return (
                <div
                  key={m.id}
                  aria-disabled="true"
                  className="flex w-full items-start justify-between gap-2 rounded-lg px-2.5 py-2 text-left opacity-55 cursor-not-allowed select-none"
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <Icon size={14} className="mt-0.5 shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-slate-600">
                          {m.label}
                        </span>
                        <span className="inline-flex items-center gap-0.5 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.2 text-[9px] font-medium text-slate-500">
                          <Lock size={8} />
                          Tidak Tersedia
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {m.description}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Group 2: Saved Custom Models */}
          <div className="mt-1.5 border-t border-slate-100 pt-1.5">
            <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Model Custom Tersimpan ({chatCustomModels.length})
            </div>

            {chatCustomModels.length === 0 ? (
              <div className="px-2.5 py-2 text-[11px] text-slate-400">
                Belum ada model custom. Tambahkan di Pengaturan → Integrasi.
              </div>
            ) : (
              <div className="max-h-52 space-y-0.5 overflow-y-auto scrollbar-thin">
                {chatCustomModels.map((cm) => {
                  const optionKey = `custom:${cm.id}`;
                  const isSelected = activeMode === optionKey;
                  const { badge, Icon } = getCustomKindMeta(cm.provider_kind);
                  const subtitle =
                    cm.provider_kind === "external_mcp"
                      ? "External via MCP"
                      : cm.model_name || cm.base_url || "Custom Model";

                  return (
                    <button
                      key={cm.id}
                      type="button"
                      onClick={() => {
                        selectMode(optionKey);
                        setOpen(false);
                      }}
                      className={`flex w-full items-start justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition ${
                        isSelected
                          ? "bg-[#e8f2fc] text-[#0a4d8c]"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <Icon
                          size={14}
                          className={`mt-0.5 shrink-0 ${
                            isSelected ? "text-[#0a4d8c]" : "text-slate-500"
                          }`}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-xs font-semibold text-slate-900">
                              Custom · {cm.display_name}
                            </span>
                            <span className="shrink-0 rounded border border-slate-200 bg-slate-100 px-1 py-0.2 text-[9px] font-medium text-slate-600">
                              {badge}
                            </span>
                          </div>
                          <div className="truncate text-[10px] text-[#0a4d8c]">
                            {subtitle}
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

            {isCustom && (
              <div className="mt-1 border-t border-slate-100 px-2.5 pt-1.5 pb-0.5 text-[10px] text-slate-500">
                Model custom tidak fallback ke default jika gagal.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
