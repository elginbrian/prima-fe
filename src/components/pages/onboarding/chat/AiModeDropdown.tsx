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
} from "lucide-react";
import {
  useIntegrationConfig,
  getCustomAiStatus,
} from "@/lib/query/hooks/settings/useIntegrations";

interface AiModeDropdownProps {
  compact?: boolean;
  direction?: "up" | "down";
}

const DEFAULT_AI_MODES = [
  {
    id: "cekatan",
    label: "Cekatan",
    description: "Gemini 3.x Flash-lite",
    availableWhenDefault: true,
    icon: Zap,
  },
  {
    id: "cermat",
    label: "Cermat",
    description: "Gemini 3.x Flash",
    availableWhenDefault: false,
    icon: ShieldCheck,
  },
  {
    id: "cerdas",
    label: "Cerdas",
    description: "Gemini 4 Hydrogen",
    availableWhenDefault: false,
    icon: BrainCircuit,
  },
] as const;

export function AiModeDropdown({
  compact = false,
  direction = "down",
}: AiModeDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: integrationData } = useIntegrationConfig();
  const { isCustomChat, customModelName } = getCustomAiStatus(
    integrationData?.config
  );

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
          isCustomChat
            ? `Mode Custom Aktif (${customModelName}) — Tanpa fallback ke default`
            : "Pilih Mode AI (Saat ini tersedia: Mode Cekatan)"
        }
      >
        {isCustomChat ? (
          <Cpu size={10} className="shrink-0" />
        ) : (
          <Zap size={10} className="shrink-0" />
        )}
        <span>{isCustomChat ? "Custom" : "Cekatan"}</span>
        <ChevronDown
          size={11}
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className={`absolute right-0 z-50 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ${
            direction === "up" ? "bottom-full mb-1.5" : "top-full mt-1.5"
          }`}
        >
          <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Mode Penalaran AI
          </div>
          <div className="space-y-0.5">
            {/* Custom Mode Row */}
            {isCustomChat ? (
              <button
                type="button"
                onClick={() => setOpen(false)}
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
                      Atur di Pengaturan → Integrasi
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Default Modes (All disabled when Custom is active) */}
            {DEFAULT_AI_MODES.map((m) => {
              const Icon = m.icon;
              const isAvailable = !isCustomChat && m.availableWhenDefault;
              if (isAvailable) {
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex w-full items-start justify-between gap-2 rounded-lg bg-[#e8f2fc] px-2.5 py-2 text-left text-[#0a4d8c]"
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <Icon size={14} className="mt-0.5 shrink-0 text-[#0a4d8c]" />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900">
                          {m.label}
                        </div>
                        <div className="text-[10px] text-slate-600">
                          {m.description}
                        </div>
                      </div>
                    </div>
                    <Check size={13} className="mt-0.5 shrink-0 text-[#0a4d8c]" />
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
          {isCustomChat && (
            <div className="mt-1 border-t border-slate-100 px-2.5 pt-1.5 pb-0.5 text-[10px] text-slate-500">
              Mode default dinonaktifkan (tanpa fallback ke default).
            </div>
          )}
        </div>
      )}
    </div>
  );
}
