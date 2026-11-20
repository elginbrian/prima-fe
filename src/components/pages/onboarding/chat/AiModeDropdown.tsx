"use client";

import { useState, useRef, useEffect, useMemo } from "react";
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
  Search,
  X,
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
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
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

  const getCustomKindMeta = (kind: string) => {
    if (kind === "external_mcp") return { badge: "MCP", Icon: Radio };
    if (kind === "external_webhook") return { badge: "Webhook", Icon: Webhook };
    return { badge: "API", Icon: Cpu };
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredDefaultModes = useMemo(() => {
    if (!normalizedQuery) return DEFAULT_AI_MODES;
    return DEFAULT_AI_MODES.filter((m) =>
      `${m.label} ${m.description} internal gemini default`
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [normalizedQuery]);

  const filteredCustomModels = useMemo(() => {
    if (!normalizedQuery) return chatCustomModels;
    return chatCustomModels.filter((cm) => {
      const kindText =
        cm.provider_kind === "external_mcp"
          ? "mcp takeover"
          : cm.provider_kind === "external_webhook"
          ? "webhook"
          : "api";
      return `${cm.display_name} ${cm.model_name || ""} ${cm.provider_name || ""} ${cm.base_url || ""} custom external ${kindText}`
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [chatCustomModels, normalizedQuery]);

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
            ? `Mode Custom: ${label} (${modelName}`
            : "Pilih Mode AI"
        }
      >
        {isCustom ? (
          <Cpu size={10} className="shrink-0" />
        ) : (
          <Zap size={10} className="shrink-0" />
        )}
        <span className="max-w-[110px] truncate">
          {isCustom ? (compact ? "Custom" : `${label}`) : "Cekatan"}
        </span>
        <ChevronDown
          size={11}
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute right-0 z-50 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ${
            direction === "up" ? "bottom-full mb-1.5" : "top-full mt-1.5"
          }`}
        >
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
            {filteredDefaultModes.length === 0 &&
            filteredCustomModels.length === 0 ? (
              <div className="px-2.5 py-4 text-center text-[11px] text-slate-400">
                Tidak ada model AI yang cocok dengan &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              <>
                {/* Group 1: Internal via Gemini */}
                {filteredDefaultModes.length > 0 && (
                  <div>
                    <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Model Internal via Gemini
                    </div>
                    <div className="space-y-0.5">
                      {filteredDefaultModes.map((m) => {
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
                                    isSelected
                                      ? "text-[#0a4d8c]"
                                      : "text-slate-500"
                                  }`}
                                />
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold text-slate-900 leading-4">
                                    {m.label}
                                  </div>
                                  <div className="text-[10px] text-slate-500 leading-[14px]">
                                    {m.description}
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
                        }

                        return (
                          <div
                            key={m.id}
                            aria-disabled="true"
                            className="flex w-full items-start justify-between gap-2 rounded-lg px-2.5 py-2 text-left opacity-55 cursor-not-allowed select-none"
                          >
                            <div className="flex items-start gap-2 min-w-0">
                              <Icon
                                size={14}
                                className="mt-0.5 shrink-0 text-slate-400"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 leading-4">
                                  <span className="text-xs font-medium text-slate-600">
                                    {m.label}
                                  </span>
                                  <span className="inline-flex items-center gap-0.5 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.2 text-[9px] font-medium text-slate-500">
                                    <Lock size={8} />
                                    Tidak Tersedia
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-400 leading-[14px]">
                                  {m.description}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Group 2: External / Saved Custom Models */}
                {(filteredCustomModels.length > 0 || !normalizedQuery) && (
                  <div
                    className={
                      filteredDefaultModes.length > 0
                        ? "border-t border-slate-100 pt-1.5"
                        : ""
                    }
                  >
                    <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Model External ({filteredCustomModels.length})
                    </div>

                    {filteredCustomModels.length === 0 ? (
                      <div className="px-2.5 py-2 text-[11px] text-slate-400">
                        Belum ada model custom. Tambahkan di Pengaturan → Integrasi.
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        {filteredCustomModels.map((cm) => {
                          const optionKey = `custom:${cm.id}`;
                          const isSelected = activeMode === optionKey;
                          const { badge, Icon } = getCustomKindMeta(
                            cm.provider_kind
                          );
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
                                    isSelected
                                      ? "text-[#0a4d8c]"
                                      : "text-slate-500"
                                  }`}
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 leading-4">
                                    <span className="truncate text-xs font-semibold text-slate-900">
                                      {cm.display_name}
                                    </span>
                                    <span className="shrink-0 rounded border border-slate-200 bg-slate-100 px-1 py-0.2 text-[9px] font-medium text-slate-600">
                                      {badge}
                                    </span>
                                  </div>
                                  <div className="truncate text-[10px] text-[#0a4d8c] leading-[14px]">
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
