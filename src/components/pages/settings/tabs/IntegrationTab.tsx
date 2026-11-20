"use client";

import { useState, useEffect } from "react";
import {
  Blocks,
  KeyRound,
  Cpu,
  Terminal,
  Copy,
  Check,
  Play,
  Sparkles,
  RefreshCw,
  Radio,
  Webhook,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Zap,
  Brain,
} from "lucide-react";
import {
  useIntegrationConfig,
  useUpdateIntegrationConfig,
  useGenerateAgentToken,
  useExecuteMcpTool,
  getSavedCustomModels,
  getInternalModesConfig,
  DEFAULT_INTERNAL_MODES,
} from "@/lib/query/hooks/settings/useIntegrations";
import { API_ORIGIN } from "@/lib/api/client";
import { useToast } from "@/components/ui/Toast";
import { Spinner, Skeleton } from "@/components/ui";
import { getErrorMessage } from "@/lib/api/errors";
import type {
  CustomAiModelDto,
  CustomModelKind,
  ExternalProviderMode,
  InternalGeminiModesMap,
} from "@/lib/api";

const PROVIDER_KIND_CARDS: {
  value: ExternalProviderMode;
  title: string;
  subtitle: string;
  icon: typeof Sparkles;
}[] = [
  {
    value: "internal_gemini",
    title: "Internal via Gemini",
    subtitle: "Gemini 3.x & Gemini 4 bawaan PRIMA",
    icon: Sparkles,
  },
  {
    value: "external_mcp",
    title: "External via MCP",
    subtitle: "Agent Takeover (Antigravity / Claude / Codex)",
    icon: Radio,
  },
  {
    value: "external_api",
    title: "External via API",
    subtitle: "OpenAI, OpenRouter, Groq, Ollama",
    icon: Cpu,
  },
  {
    value: "external_webhook",
    title: "External via Webhook",
    subtitle: "Endpoint HTTP Agent Kustom",
    icon: Webhook,
  },
];

const PRESET_PROVIDERS = [
  {
    displayName: "ChatGPT (OpenAI)",
    providerName: "OpenAI (ChatGPT)",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
  },
  {
    displayName: "OpenRouter Free / Haiku",
    providerName: "OpenRouter (Claude / Gemini / DeepSeek)",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "anthropic/claude-3.5-haiku",
  },
  {
    displayName: "Groq Cloud Ultra-Fast",
    providerName: "Groq Cloud (Ultra-Fast)",
    baseUrl: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
  },
];

function getKindBadgeText(kind: CustomModelKind): string {
  if (kind === "external_mcp") return "External via MCP";
  if (kind === "external_webhook") return "External via Webhook";
  return "External via API";
}

export function IntegrationTab() {
  const toast = useToast();
  const { data: integrationData, isLoading } = useIntegrationConfig();
  const updateConfig = useUpdateIntegrationConfig();
  const generateToken = useGenerateAgentToken();
  const executeTool = useExecuteMcpTool();

  const [selectedKind, setSelectedKind] =
    useState<ExternalProviderMode>("internal_gemini");
  const [savedModels, setSavedModels] = useState<CustomAiModelDto[]>([]);
  const [activeCustomModelId, setActiveCustomModelId] = useState<string | null>(
    null
  );

  // Add / Edit Custom Model Form State
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [providerName, setProviderName] = useState("");
  const [baseUrl, setBaseUrl] = useState("https://api.openai.com/v1");
  const [apiKey, setApiKey] = useState("");
  const [modelName, setModelName] = useState("gpt-4o-mini");
  const [enableChat, setEnableChat] = useState(true);
  const [enableAnalysis, setEnableAnalysis] = useState(true);
  const [setAsDefaultOnSave, setSetAsDefaultOnSave] = useState(true);
  const [internalModes, setInternalModes] = useState<InternalGeminiModesMap>(
    DEFAULT_INTERNAL_MODES
  );

  const [tokenLabel, setTokenLabel] = useState("Antigravity & MCP Agent Key");
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [selectedTool, setSelectedTool] = useState(
    "prima_get_workspace_snapshot"
  );
  const [toolArgsJson, setToolArgsJson] = useState("{}");
  const [toolResultJson, setToolResultJson] = useState<string | null>(null);

  useEffect(() => {
    if (integrationData?.config) {
      const c = integrationData.config;
      const models = getSavedCustomModels(c);
      setSavedModels(models);
      setActiveCustomModelId(c.active_custom_model_id ?? null);
      setInternalModes(getInternalModesConfig(c));
    }
  }, [integrationData]);

  const handleCopy = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    toast.success("Berhasil disalin ke clipboard");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const resetCustomForm = (kind: CustomModelKind = "external_api") => {
    setEditingModelId(null);
    setDisplayName("");
    setProviderName("");
    setBaseUrl(
      kind === "external_webhook"
        ? "https://agent.perusahaan.id/webhook/ai"
        : "https://api.openai.com/v1"
    );
    setApiKey("");
    setModelName(
      kind === "external_mcp"
        ? "External Agent Takeover (MCP)"
        : "gpt-4o-mini"
    );
    setEnableChat(true);
    setEnableAnalysis(kind !== "external_mcp");
    setSetAsDefaultOnSave(true);
  };

  const persistRegistry = async (
    nextModels: CustomAiModelDto[],
    nextActiveId: string | null,
    successMessage: string
  ) => {
    try {
      const activeModel = nextModels.find((m) => m.id === nextActiveId);
      await updateConfig.mutateAsync({
        provider_mode: activeModel ? activeModel.provider_kind : "internal_gemini",
        provider_name: activeModel
          ? activeModel.display_name
          : "PRIMA Internal (Google Gemini)",
        active_custom_model_id: nextActiveId,
        custom_models: nextModels,
        internal_modes: internalModes,
      });
      setSavedModels(nextModels);
      setActiveCustomModelId(nextActiveId);
      toast.success(successMessage);
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal menyimpan konfigurasi model AI"));
    }
  };

  const handleSetInternalGeminiDefault = async () => {
    await persistRegistry(
      savedModels,
      null,
      "Internal via Gemini ditetapkan sebagai mode AI default (Model Custom tetap tersimpan)."
    );
  };

  const handleToggleInternalMode = async (
    tier: "cekatan" | "cermat" | "cerdas",
    channel: "enable_chat" | "enable_analysis"
  ) => {
    const nextVal = !internalModes[tier][channel];
    const nextModes: InternalGeminiModesMap = {
      ...internalModes,
      [tier]: {
        ...internalModes[tier],
        [channel]: nextVal,
      },
    };

    const anyInternalLeft = (["cekatan", "cermat", "cerdas"] as const).some(
      (k) => nextModes[k][channel]
    );
    const anyCustomLeft = savedModels.some((m) =>
      channel === "enable_chat"
        ? m.enable_chat
        : m.provider_kind !== "external_mcp" && m.enable_analysis
    );
    if (!anyInternalLeft && !anyCustomLeft) {
      toast.warning(
        channel === "enable_chat"
          ? "Minimal harus ada 1 model AI yang aktif untuk Chat."
          : "Minimal harus ada 1 model AI yang aktif untuk Analisis Dokumen."
      );
      return;
    }

    const prevModes = internalModes;
    setInternalModes(nextModes);
    try {
      const activeModel = savedModels.find((m) => m.id === activeCustomModelId);
      await updateConfig.mutateAsync({
        provider_mode: activeModel ? activeModel.provider_kind : "internal_gemini",
        provider_name: activeModel
          ? activeModel.display_name
          : "PRIMA Internal (Google Gemini)",
        active_custom_model_id: activeCustomModelId,
        custom_models: savedModels,
        internal_modes: nextModes,
      });
      const tierTitle =
        tier === "cekatan" ? "Cekatan" : tier === "cermat" ? "Cermat" : "Cerdas";
      const channelTitle =
        channel === "enable_chat" ? "Chat" : "Analisis Dokumen";
      toast.success(
        `Mode ${tierTitle} ${nextVal ? "diaktifkan" : "dinonaktifkan"} untuk ${channelTitle}.`
      );
    } catch (err) {
      setInternalModes(prevModes);
      toast.error(getErrorMessage(err, "Gagal memperbarui pengaturan model internal"));
    }
  };

  const handleSaveCustomModel = async () => {
    const kind: CustomModelKind =
      selectedKind === "external_mcp" ||
      selectedKind === "external_webhook" ||
      selectedKind === "external_api"
        ? selectedKind
        : "external_api";

    const cleanName =
      displayName.trim() ||
      (kind === "external_mcp"
        ? "External Agent Takeover (MCP)"
        : modelName.trim());

    if (!cleanName) {
      toast.warning("Nama model custom wajib diisi.");
      return;
    }

    if (kind !== "external_mcp" && (!baseUrl.trim() || !modelName.trim())) {
      toast.warning("Base URL dan Nama Model Teknis wajib diisi.");
      return;
    }

    const newId =
      editingModelId ||
      `CUST-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;

    const entry: CustomAiModelDto = {
      id: newId,
      display_name: cleanName,
      provider_kind: kind,
      provider_name: providerName.trim() || getKindBadgeText(kind),
      base_url: kind === "external_mcp" ? "" : baseUrl.trim(),
      api_key: kind === "external_mcp" ? "" : apiKey,
      model_name:
        kind === "external_mcp"
          ? "External Agent Takeover (MCP)"
          : modelName.trim(),
      enable_chat: enableChat,
      enable_analysis: kind === "external_mcp" ? false : enableAnalysis,
    };

    const exists = savedModels.some((m) => m.id === newId);
    const nextModels = exists
      ? savedModels.map((m) => (m.id === newId ? entry : m))
      : [...savedModels, entry];

    const nextActiveId = setAsDefaultOnSave ? newId : activeCustomModelId;

    await persistRegistry(
      nextModels,
      nextActiveId,
      exists
        ? `Model custom '${cleanName}' berhasil diperbarui.`
        : `Model custom '${cleanName}' berhasil ditambahkan.`
    );
    resetCustomForm(kind);
  };

  const handleStartEditModel = (m: CustomAiModelDto) => {
    setSelectedKind(m.provider_kind);
    setEditingModelId(m.id);
    setDisplayName(m.display_name);
    setProviderName(m.provider_name || "");
    setBaseUrl(m.base_url || "https://api.openai.com/v1");
    setApiKey(m.api_key || "");
    setModelName(m.model_name || "");
    setEnableChat(m.enable_chat);
    setEnableAnalysis(m.enable_analysis);
    setSetAsDefaultOnSave(activeCustomModelId === m.id);
  };

  const handleDeleteCustomModel = async (id: string) => {
    const target = savedModels.find((m) => m.id === id);
    const nextModels = savedModels.filter((m) => m.id !== id);
    const nextActiveId =
      activeCustomModelId === id ? null : activeCustomModelId;
    if (editingModelId === id) {
      resetCustomForm("external_api");
    }
    await persistRegistry(
      nextModels,
      nextActiveId,
      `Model custom '${target?.display_name || id}' berhasil dihapus.`
    );
  };

  const handleSetCustomDefault = async (id: string) => {
    const target = savedModels.find((m) => m.id === id);
    await persistRegistry(
      savedModels,
      id,
      `'${target?.display_name || id}' dijadikan model default baru.`
    );
  };

  const handleGenerateToken = async () => {
    try {
      const res = await generateToken.mutateAsync({
        label: tokenLabel || "Antigravity & MCP Agent Key",
        expiresDays: 365,
      });
      setGeneratedToken(res.token);
      toast.success("Token akses MCP / External AI berhasil dibuat!");
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal membuat token akses"));
    }
  };

  const handleRunPlaygroundTool = async () => {
    let parsedArgs: Record<string, unknown> = {};
    try {
      parsedArgs = toolArgsJson.trim() ? JSON.parse(toolArgsJson) : {};
    } catch {
      toast.warning("Format JSON parameter tool tidak valid.");
      return;
    }

    try {
      const res = await executeTool.mutateAsync({
        toolName: selectedTool,
        args: parsedArgs,
      });
      setToolResultJson(JSON.stringify(res.result, null, 2));
      toast.success(`Tool '${selectedTool}' berhasil dieksekusi.`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal menjalankan tool MCP"));
    }
  };

  const handleSelectToolTemplate = (name: string) => {
    setSelectedTool(name);
    setToolResultJson(null);
    if (name === "prima_get_workspace_snapshot") {
      setToolArgsJson("{}");
    } else if (name === "prima_create_procurement") {
      setToolArgsJson(
        JSON.stringify(
          {
            title: "Pengadaan Lisensi Cloud & Security via MCP Agent",
            amount: 275000000,
            department_name: "IT Infrastructure",
            procurement_method: "Tender Terbuka",
            is_urgent: false,
          },
          null,
          2
        )
      );
    } else if (name === "prima_ask_or_command") {
      setToolArgsJson(
        JSON.stringify(
          {
            query: "Ringkas pekerjaan aktif dan status SLA saat ini",
          },
          null,
          2
        )
      );
    } else if (name === "prima_create_custom_method") {
      setToolArgsJson(
        JSON.stringify(
          {
            method_name: "Tender Kilat AI (Fast Track)",
            stages: [
              {
                step_name: "Verifikasi KAK & HPS",
                stage_group: "Persiapan",
                default_sla_days: 2,
              },
              {
                step_name: "Evaluasi & Klarifikasi Cepat",
                stage_group: "Evaluasi",
                default_sla_days: 3,
              },
              {
                step_name: "Penunjukan Pemenang",
                stage_group: "Contracting",
                default_sla_days: 2,
              },
            ],
          },
          null,
          2
        )
      );
    } else if (name === "prima_submit_external_document_analysis") {
      setToolArgsJson(
        JSON.stringify(
          {
            document_name: "KAK_Audit_Eksternal_Antigravity.pdf",
            overall_score: 92.5,
            compliance_status: "Lulus Verifikasi",
            external_model_name: "Antigravity / External Agent",
            executive_summary:
              "Dokumen memenuhi seluruh persyaratan ruang lingkup teknis, HPS, dan SLA.",
            recommendations: [
              "Lanjutkan ke tahapan Pengumuman Pengadaan",
            ],
          },
          null,
          2
        )
      );
    } else if (name === "prima_manage_procurement_full") {
      setToolArgsJson(
        JSON.stringify(
          {
            action: "UPDATE_DETAILS",
            request_id: "REQ-BD3BE5A9",
            is_urgent: true,
          },
          null,
          2
        )
      );
    } else if (name === "prima_manage_guarantee") {
      setToolArgsJson(
        JSON.stringify(
          {
            action: "CREATE",
            request_id: "REQ-BD3BE5A9",
            reference_no: "BG-MANDIRI-2026-9901",
            type: "Jaminan Pelaksanaan",
            value: 322500000,
            issuer: "PT Bank Mandiri (Persero) Tbk",
            issuer_type: "Bank",
            vendor_name: "PT Telkom Industrial Telemetry",
            expiry_date: "2027-06-30",
          },
          null,
          2
        )
      );
    } else if (name === "prima_manage_validation_template") {
      setToolArgsJson(
        JSON.stringify(
          {
            action: "LIST",
          },
          null,
          2
        )
      );
    } else if (name === "prima_manage_workflow_stages") {
      setToolArgsJson(
        JSON.stringify(
          {
            action: "LIST",
            procurement_method: "Tender Terbuka",
          },
          null,
          2
        )
      );
    } else if (name === "prima_manage_document_and_validation") {
      setToolArgsJson(
        JSON.stringify(
          {
            action: "GET_DETAIL_OR_FILE_URL",
            id: "VAL-12345678",
          },
          null,
          2
        )
      );
    } else if (name === "prima_manage_users_notifications_settings") {
      setToolArgsJson(
        JSON.stringify(
          {
            action: "LIST_USERS",
          },
          null,
          2
        )
      );
    } else if (name === "prima_get_pending_chat_takeover") {
      setToolArgsJson(
        JSON.stringify(
          {
            include_workspace_snapshot: true,
          },
          null,
          2
        )
      );
    } else if (name === "prima_reply_chat_takeover") {
      setToolArgsJson(
        JSON.stringify(
          {
            ticket_id: "LATEST",
            agent_name: "Antigravity External Agent",
            answer:
              "Halo! Pesan ini dijawab langsung oleh Antigravity External Agent melalui jembatan MCP Takeover PRIMA.",
            highlights: [
              "Mode External Agent Takeover aktif",
              "Terhubung real-time ke bubble chat Diskusi AI PRIMA",
            ],
            suggested_followups: [
              "Tampilkan daftar SLA yang sedang terlambat",
            ],
          },
          null,
          2
        )
      );
    } else {
      setToolArgsJson("{}");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  const mcpEndpointUrl = `${API_ORIGIN}/api/v1/integrations/mcp`;
  const openapiEndpointUrl = `${API_ORIGIN}/openapi.json`;
  const tokenPlaceholder = generatedToken || "<GENERATE_TOKEN_DI_ATAS>";

  const mcpClientConfigJson = JSON.stringify(
    {
      mcpServers: {
        "prima-pertamina": {
          url: mcpEndpointUrl,
          headers: {
            Authorization: `Bearer ${tokenPlaceholder}`,
          },
        },
      },
    },
    null,
    2
  );

  const toolsList = integrationData?.mcp_tools || [];

  const activeDefaultModel = savedModels.find(
    (m) => m.id === activeCustomModelId
  );

  return (
    <div className="space-y-7">
      {/* SECTION 1: PLUGGABLE AI BRAIN & MULTI CUSTOM MODEL REGISTRY */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e8f2fc] text-[#0a4d8c]">
              <Cpu size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Pluggable AI Brain &amp; Daftar Model Custom
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Simpan beberapa model AI eksternal bernama dan pilih langsung dari dropdown Chat maupun Analisis Dokumen. Model bawaan Gemini tetap selalu tersedia, sementara model custom tidak pernah fallback ke default.
              </p>
            </div>
          </div>

          <span className="rounded-full border border-[#0a4d8c]/20 bg-[#e8f2fc] px-3 py-1 text-[11px] font-semibold text-[#0a4d8c]">
            {activeDefaultModel
              ? `Default: Custom · ${activeDefaultModel.display_name}`
              : "Default: Internal via Gemini"}
          </span>
        </div>

        {/* 1A. 4-Option AI Kind Selector */}
        <div className="space-y-2">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600">
            Jenis Model AI
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {PROVIDER_KIND_CARDS.map((card) => {
              const Icon = card.icon;
              const isSelected = selectedKind === card.value;
              return (
                <button
                  key={card.value}
                  type="button"
                  onClick={() => {
                    setSelectedKind(card.value);
                    if (
                      card.value === "external_mcp" ||
                      card.value === "external_api" ||
                      card.value === "external_webhook"
                    ) {
                      if (!editingModelId) {
                        resetCustomForm(card.value);
                      } else {
                        setEnableAnalysis(card.value !== "external_mcp");
                      }
                    }
                  }}
                  className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition ${
                    isSelected
                      ? "border-[#0a4d8c] bg-[#f4f8fd] ring-2 ring-[#0a4d8c]/15"
                      : "border-slate-200 bg-white hover:border-[#0a4d8c]/40 hover:bg-slate-50/70"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      isSelected
                        ? "bg-[#0a4d8c] text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Icon size={15} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900">
                      {card.title}
                    </div>
                    <div className="mt-0.5 text-[10px] leading-snug text-slate-500">
                      {card.subtitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 1B. Configurator Panel for Selected Kind */}
        {selectedKind === "internal_gemini" ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1 text-xs text-slate-700">
                <div className="font-semibold text-slate-900">
                  Internal via Gemini (Bawaan PRIMA)
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Atur mode mana saja yang dapat dipilih pada dropdown <strong>Chat (Diskusi AI &amp; Omni-Search)</strong> maupun <strong>Analisis Dokumen &amp; OCR</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSetInternalGeminiDefault}
                disabled={updateConfig.isPending || !activeCustomModelId}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-[#0a4d8c] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#083b6c] disabled:opacity-50"
              >
                {activeCustomModelId ? (
                  <>
                    <CheckCircle2 size={13} />
                    <span>Jadikan Internal Gemini Default</span>
                  </>
                ) : (
                  <>
                    <Check size={13} />
                    <span>Sudah Menjadi Default</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2">
              {(
                [
                  {
                    key: "cekatan" as const,
                    label: "Cekatan",
                    model: "Gemini 3.x Flash-lite",
                    desc: "Respons sangat cepat & efisien",
                    Icon: Zap,
                  },
                  {
                    key: "cermat" as const,
                    label: "Cermat",
                    model: "Gemini 3.x Flash",
                    desc: "Analisis seimbang & terperinci",
                    Icon: Sparkles,
                  },
                  {
                    key: "cerdas" as const,
                    label: "Cerdas",
                    model: "Gemini 4 Hydrogen",
                    desc: "Penalaran mendalam untuk kasus kompleks",
                    Icon: Brain,
                  },
                ] as const
              ).map(({ key, label, model, desc, Icon }) => {
                const modeCfg = internalModes[key];
                return (
                  <div
                    key={key}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e8f2fc] text-[#0a4d8c]">
                        <Icon size={15} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-900">
                            Mode {label}
                          </span>
                          <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.2 font-mono text-[10px] text-slate-600">
                            {model}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{desc}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-5 shrink-0">
                      {/* Switch: Enable in Chat */}
                      <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={modeCfg.enable_chat}
                          disabled={updateConfig.isPending}
                          onClick={() =>
                            handleToggleInternalMode(key, "enable_chat")
                          }
                          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#0a4d8c]/30 disabled:opacity-60 ${
                            modeCfg.enable_chat
                              ? "bg-[#0a4d8c]"
                              : "bg-slate-200"
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-2xs transition-transform ${
                              modeCfg.enable_chat
                                ? "translate-x-[18px]"
                                : "translate-x-[3px]"
                            }`}
                          />
                        </button>
                        <span className="text-xs font-medium text-slate-700">
                          Chat
                        </span>
                      </label>

                      {/* Switch: Enable in Document Analysis */}
                      <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={modeCfg.enable_analysis}
                          disabled={updateConfig.isPending}
                          onClick={() =>
                            handleToggleInternalMode(key, "enable_analysis")
                          }
                          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#0a4d8c]/30 disabled:opacity-60 ${
                            modeCfg.enable_analysis
                              ? "bg-[#0a4d8c]"
                              : "bg-slate-200"
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-2xs transition-transform ${
                              modeCfg.enable_analysis
                                ? "translate-x-[18px]"
                                : "translate-x-[3px]"
                            }`}
                          />
                        </button>
                        <span className="text-xs font-medium text-slate-700">
                          Analisis Dokumen
                        </span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-semibold text-slate-900">
                {editingModelId
                  ? `Edit Model Custom (${getKindBadgeText(
                      selectedKind as CustomModelKind
                    )})`
                  : `Tambah Model Custom Baru (${getKindBadgeText(
                      selectedKind as CustomModelKind
                    )})`}
              </div>
              {editingModelId && (
                <button
                  type="button"
                  onClick={() => resetCustomForm("external_api")}
                  className="text-[11px] font-medium text-slate-500 hover:text-slate-800"
                >
                  Batal Edit
                </button>
              )}
            </div>

            {selectedKind === "external_api" && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-medium text-slate-500">
                  Preset Cepat:
                </span>
                {PRESET_PROVIDERS.map((preset) => (
                  <button
                    key={preset.displayName}
                    type="button"
                    onClick={() => {
                      if (!displayName.trim()) {
                        setDisplayName(preset.displayName);
                      }
                      setProviderName(preset.providerName);
                      setBaseUrl(preset.baseUrl);
                      setModelName(preset.model);
                    }}
                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-[#0a4d8c] hover:text-[#0a4d8c]"
                  >
                    {preset.providerName}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div
                className={
                  selectedKind === "external_mcp" ? "sm:col-span-2" : ""
                }
              >
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                  Nama Custom Model (Ditampilkan di Dropdown)
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={
                    selectedKind === "external_mcp"
                      ? "Contoh: Antigravity Live Agent"
                      : "Contoh: Groq GPT-OSS 120B / OpenRouter Free"
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#0a4d8c] focus:outline-none"
                />
              </div>

              {selectedKind !== "external_mcp" && (
                <>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      ID / Nama Model Teknis
                    </label>
                    <input
                      type="text"
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      placeholder="openai/gpt-oss-120b / gpt-4o-mini"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#0a4d8c] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      {selectedKind === "external_webhook"
                        ? "Endpoint Webhook URL"
                        : "Base URL Endpoint"}
                    </label>
                    <input
                      type="text"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder={
                        selectedKind === "external_webhook"
                          ? "https://agent.anda.com/webhook"
                          : "https://api.openai.com/v1"
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#0a4d8c] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      API Key / Bearer Secret
                    </label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={
                        editingModelId
                          ? "Biarkan seperti semula untuk mempertahankan key"
                          : "sk-..."
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#0a4d8c] focus:outline-none"
                    />
                  </div>
                </>
              )}
            </div>

            {selectedKind === "external_mcp" && (
              <div className="rounded-lg border border-[#0a4d8c]/20 bg-[#f4f8fd] p-3 text-xs text-slate-700 leading-relaxed">
                Pertanyaan dari dropdown chat yang memilih model ini akan masuk ke antrean tiket Takeover (<code className="font-mono text-[#0a4d8c]">TKT-...</code>) dan dibalas real-time oleh client MCP Anda melalui <code className="font-mono text-[#0a4d8c]">prima_get_pending_chat_takeover</code> &amp; <code className="font-mono text-[#0a4d8c]">prima_reply_chat_takeover</code>.
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              <div className="flex flex-wrap items-center gap-4">
                <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableChat}
                    onChange={(e) => setEnableChat(e.target.checked)}
                    className="rounded border-slate-300 text-[#0a4d8c] focus:ring-[#0a4d8c]"
                  />
                  <span>Tampilkan di Dropdown Chat</span>
                </label>

                {selectedKind !== "external_mcp" && (
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableAnalysis}
                      onChange={(e) => setEnableAnalysis(e.target.checked)}
                      className="rounded border-slate-300 text-[#0a4d8c] focus:ring-[#0a4d8c]"
                    />
                    <span>Tampilkan di Dropdown Analisis Dokumen &amp; OCR</span>
                  </label>
                )}

                <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={setAsDefaultOnSave}
                    onChange={(e) => setSetAsDefaultOnSave(e.target.checked)}
                    className="rounded border-slate-300 text-[#0a4d8c] focus:ring-[#0a4d8c]"
                  />
                  <span>Jadikan default pilihan awal</span>
                </label>
              </div>

              <button
                type="button"
                onClick={handleSaveCustomModel}
                disabled={updateConfig.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a4d8c] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#083b6c] disabled:opacity-50"
              >
                {updateConfig.isPending ? (
                  <>
                    <Spinner
                      size="xs"
                      className="border-white border-t-transparent"
                    />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Plus size={13} />
                    <span>
                      {editingModelId
                        ? "Simpan Perubahan Model"
                        : "Simpan Model Custom"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* 1C. Saved Custom Models Registry List */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              Model Custom Tersimpan ({savedModels.length})
            </span>
            <span className="text-[11px] text-slate-400">
              Model custom gagal tidak akan fallback otomatis ke model default
            </span>
          </div>

          {savedModels.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-5 text-center text-xs text-slate-500">
              Belum ada model custom tersimpan. Pilih{" "}
              <strong>External via MCP</strong>, <strong>External via API</strong>, atau{" "}
              <strong>External via Webhook</strong> di atas untuk menambahkan.
            </div>
          ) : (
            <div className="space-y-2">
              {savedModels.map((m) => {
                const isDefault = activeCustomModelId === m.id;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3.5 transition ${
                      isDefault
                        ? "border-[#0a4d8c]/35 bg-[#f4f8fd]"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900">
                          {m.display_name}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          {getKindBadgeText(m.provider_kind)}
                        </span>
                        {isDefault && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#0a4d8c] px-2 py-0.5 text-[10px] font-semibold text-white">
                            <Check size={10} />
                            Default Aktif
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
                        <span className="font-mono text-[#0a4d8c]">
                          {m.model_name || "External via MCP"}
                        </span>
                        {m.base_url && (
                          <span className="truncate max-w-[260px]">
                            {m.base_url}
                          </span>
                        )}
                        <span>
                          {m.enable_chat ? "Chat" : ""}
                          {m.enable_chat && m.enable_analysis ? " · " : ""}
                          {m.enable_analysis ? "Analisis & OCR" : ""}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetCustomDefault(m.id)}
                          disabled={updateConfig.isPending}
                          className="rounded-lg border border-[#0a4d8c]/25 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#0a4d8c] hover:bg-[#e8f2fc]"
                        >
                          Jadikan Default
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleStartEditModel(m)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:border-[#0a4d8c] hover:text-[#0a4d8c]"
                      >
                        <Pencil size={11} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomModel(m.id)}
                        disabled={updateConfig.isPending}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 size={11} />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 2: MCP SERVER & EXTERNAL AGENT CONNECTION (ANTIGRAVITY, CODEX, CLAUDE, CURSOR, CHATGPT) */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e8f2fc] text-[#0a4d8c]">
              <Blocks size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Koneksi MCP Server &amp; Token Agent Eksternal
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Izinkan AI luar (Antigravity, Claude Code, Codex, Cursor, atau ChatGPT Actions) berkomunikasi langsung dengan database PRIMA dan melakukan operasi CRUD &amp; analisis.
              </p>
            </div>
          </div>

          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-700">
            MCP Protocol 2024-11-05 · {toolsList.length} Tools Aktif
          </span>
        </div>

        {/* Token Generator */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Label Token Akses Agent (Berlaku 365 Hari)
              </label>
              <input
                type="text"
                value={tokenLabel}
                onChange={(e) => setTokenLabel(e.target.value)}
                placeholder="Contoh: Antigravity / Claude Desktop Key"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#0a4d8c] focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleGenerateToken}
              disabled={generateToken.isPending}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0a4d8c] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#083b6c] shrink-0"
            >
              {generateToken.isPending ? (
                <Spinner
                  size="xs"
                  className="border-white border-t-transparent"
                />
              ) : (
                <KeyRound size={13} />
              )}
              <span>Generate Token Baru</span>
            </button>
          </div>

          {generatedToken && (
            <div className="rounded-lg border border-[#0a4d8c]/25 bg-[#e8f2fc] p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#0a4d8c]">
                  Personal Access Token Anda (Salin sekarang):
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy("token", generatedToken)}
                  className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-[11px] font-semibold text-[#0a4d8c] shadow-2xs"
                >
                  {copiedKey === "token" ? (
                    <Check size={12} />
                  ) : (
                    <Copy size={12} />
                  )}
                  <span>{copiedKey === "token" ? "Tersalin" : "Salin Token"}</span>
                </button>
              </div>
              <code className="block break-all rounded bg-white/90 p-2 font-mono text-[11px] text-slate-800">
                {generatedToken}
              </code>
            </div>
          )}
        </div>

        {/* Ready-to-Copy MCP Config & Endpoints */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800">
                Konfigurasi JSON MCP (Antigravity / Claude / Cursor / Codex)
              </span>
              <button
                type="button"
                onClick={() => handleCopy("mcp-json", mcpClientConfigJson)}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 hover:border-[#0a4d8c] hover:text-[#0a4d8c]"
              >
                {copiedKey === "mcp-json" ? (
                  <Check size={11} />
                ) : (
                  <Copy size={11} />
                )}
                <span>Salin JSON</span>
              </button>
            </div>
            <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 font-mono text-[11px] text-slate-100 leading-relaxed">
              {mcpClientConfigJson}
            </pre>
          </div>

          <div className="rounded-xl border border-slate-200 p-3.5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <span className="text-xs font-semibold text-slate-800 block">
                Endpoint Integrasi Langsung
              </span>

              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  1. MCP Streamable HTTP (JSON-RPC 2.0)
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                  <code className="truncate font-mono text-[11px] text-slate-700">
                    {mcpEndpointUrl}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopy("mcp-url", mcpEndpointUrl)}
                    className="text-slate-400 hover:text-[#0a4d8c]"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  2. OpenAPI 3.1 Spec (Untuk ChatGPT Custom GPT Actions / Gemini)
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                  <code className="truncate font-mono text-[11px] text-slate-700">
                    {openapiEndpointUrl}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopy("openapi-url", openapiEndpointUrl)}
                    className="text-slate-400 hover:text-[#0a4d8c]"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Gunakan header <code className="font-mono text-slate-700">Authorization: Bearer &lt;TOKEN&gt;</code> saat menghubungkan ChatGPT Actions atau MCP Client.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3: LIVE MCP TOOL CATALOG & INTERACTIVE PLAYGROUND */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex items-start gap-3 border-b border-slate-100 pb-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e8f2fc] text-[#0a4d8c]">
            <Terminal size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Katalog Tool MCP &amp; Live Playground
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Daftar operasi CRUD dan analisis yang diekspos ke AI eksternal. Anda dapat menguji eksekusi setiap tool secara langsung di bawah ini.
            </p>
          </div>
        </div>

        {/* Tool Chips */}
        <div className="flex flex-wrap gap-1.5">
          {toolsList.map((t) => {
            const active = t.name === selectedTool;
            return (
              <button
                key={t.name}
                type="button"
                onClick={() => handleSelectToolTemplate(t.name)}
                className={`rounded-lg border px-3 py-1.5 font-mono text-[11px] font-medium transition ${
                  active
                    ? "border-[#0a4d8c] bg-[#0a4d8c] text-white"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-[#0a4d8c]/40 hover:bg-[#f4f8fd] hover:text-[#0a4d8c]"
                }`}
              >
                {t.name}
              </button>
            );
          })}
        </div>

        {/* Active Tool Description + Playground */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-mono text-xs font-bold text-[#0a4d8c]">
                {selectedTool}
              </span>
              <p className="text-xs text-slate-600 mt-0.5">
                {toolsList.find((t) => t.name === selectedTool)?.description}
              </p>
            </div>

            <button
              type="button"
              onClick={handleRunPlaygroundTool}
              disabled={executeTool.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a4d8c] px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#083b6c] disabled:opacity-50"
            >
              {executeTool.isPending ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : (
                <Play size={13} />
              )}
              <span>Jalankan Tool Sekarang</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div>
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Arguments Payload (JSON)
              </span>
              <textarea
                rows={7}
                value={toolArgsJson}
                onChange={(e) => setToolArgsJson(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white p-2.5 font-mono text-[11px] text-slate-800 focus:border-[#0a4d8c] focus:outline-none"
              />
            </div>

            <div>
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Response Output
              </span>
              <pre className="h-[154px] overflow-auto rounded-lg border border-slate-200 bg-slate-900 p-2.5 font-mono text-[11px] text-slate-100">
                {toolResultJson || "// Klik 'Jalankan Tool Sekarang' untuk melihat output JSON real-time"}
              </pre>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
