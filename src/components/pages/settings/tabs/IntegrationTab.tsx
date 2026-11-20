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
} from "lucide-react";
import {
  useIntegrationConfig,
  useUpdateIntegrationConfig,
  useGenerateAgentToken,
  useExecuteMcpTool,
} from "@/lib/query/hooks/settings/useIntegrations";
import { API_ORIGIN } from "@/lib/api/client";
import { useToast } from "@/components/ui/Toast";
import { Spinner, Skeleton, SearchableSelect } from "@/components/ui";
import { getErrorMessage } from "@/lib/api/errors";
import type { ExternalProviderMode } from "@/lib/api";

const PROVIDER_MODE_OPTIONS: {
  value: ExternalProviderMode;
  label: string;
  description: string;
}[] = [
  {
    value: "internal_gemini",
    label: "PRIMA Internal AI (Google Gemini + Gemma 4 Failover)",
    description: "Menggunakan mesin AI internal PRIMA dengan rantai Mode Cekatan/Cermat/Cerdas",
  },
  {
    value: "mcp_takeover",
    label: "External Agent Takeover via MCP (Antigravity / Claude Code / Codex / Cursor)",
    description: "AI Eksternal mengambil alih penuh dan membalas langsung pesan Diskusi AI dari luar sistem tanpa butuh API Key di web",
  },
  {
    value: "openai_compatible",
    label: "External OpenAI-Compatible AI (ChatGPT, Claude/OpenRouter, Codex, Ollama)",
    description: "Gantikan otak AI di dalam PRIMA dengan API OpenAI, OpenRouter, Groq, atau LLM lokal",
  },
  {
    value: "custom_webhook",
    label: "Custom External AI Agent Webhook",
    description: "Hubungkan ke endpoint HTTP agent kustom eksternal Anda sendiri",
  },
];

const PRESET_PROVIDERS = [
  {
    name: "OpenAI (ChatGPT)",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
  },
  {
    name: "OpenRouter (Claude / Gemini / DeepSeek)",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "anthropic/claude-3.5-haiku",
  },
  {
    name: "Groq Cloud (Ultra-Fast)",
    baseUrl: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
  },
];

export function IntegrationTab() {
  const toast = useToast();
  const { data: integrationData, isLoading } = useIntegrationConfig();
  const updateConfig = useUpdateIntegrationConfig();
  const generateToken = useGenerateAgentToken();
  const executeTool = useExecuteMcpTool();

  const [providerMode, setProviderMode] =
    useState<ExternalProviderMode>("internal_gemini");
  const [providerName, setProviderName] = useState(
    "PRIMA Internal (Google Gemini)"
  );
  const [baseUrl, setBaseUrl] = useState("https://api.openai.com/v1");
  const [apiKey, setApiKey] = useState("");
  const [modelName, setModelName] = useState("gpt-4o-mini");
  const [replaceChatBrain, setReplaceChatBrain] = useState(true);
  const [replaceAnalysisBrain, setReplaceAnalysisBrain] = useState(false);

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
      setProviderMode(c.provider_mode || "internal_gemini");
      setProviderName(c.provider_name || "PRIMA Internal (Google Gemini)");
      setBaseUrl(c.base_url || "https://api.openai.com/v1");
      setApiKey(c.api_key || "");
      setModelName(c.model_name || "gpt-4o-mini");
      setReplaceChatBrain(c.replace_chat_brain ?? true);
      setReplaceAnalysisBrain(c.replace_analysis_brain ?? false);
    }
  }, [integrationData]);

  const handleCopy = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    toast.success("Berhasil disalin ke clipboard");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveProviderConfig = async () => {
    try {
      await updateConfig.mutateAsync({
        provider_mode: providerMode,
        provider_name: providerName,
        base_url: baseUrl,
        api_key: apiKey,
        model_name: modelName,
        replace_chat_brain: replaceChatBrain,
        replace_analysis_brain: replaceAnalysisBrain,
      });
      toast.success("Konfigurasi Otak AI & Integrasi berhasil disimpan.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal menyimpan konfigurasi AI"));
    }
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

  return (
    <div className="space-y-7">
      {/* SECTION 1: PLUGGABLE AI BRAIN ROUTER (GANTIKAN AI DI DALAM CHAT & ANALISIS) */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e8f2fc] text-[#0a4d8c]">
              <Cpu size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Pluggable AI Brain (Otak AI di Dalam Chat &amp; Analisis PRIMA)
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Pilih apakah ruang Diskusi AI &amp; pemeriksaan dokumen menggunakan Gemini internal PRIMA atau digantikan oleh AI eksternal (ChatGPT, Claude, OpenRouter, Codex, atau Webhook Agent).
              </p>
            </div>
          </div>

          <span className="rounded-full border border-[#0a4d8c]/20 bg-[#e8f2fc] px-3 py-1 text-[11px] font-semibold text-[#0a4d8c]">
            {providerMode === "internal_gemini"
              ? "Aktif: Gemini Internal"
              : providerMode === "mcp_takeover"
              ? "Aktif: External Agent Takeover (MCP)"
              : `Aktif: ${modelName}`}
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              Mode Provider Otak AI
            </label>
            <SearchableSelect
              value={providerMode}
              onChange={(val) => setProviderMode(val as ExternalProviderMode)}
              options={PROVIDER_MODE_OPTIONS}
              searchPlaceholder="Pilih mode provider AI..."
            />
          </div>

          {providerMode === "mcp_takeover" && (
            <div className="rounded-xl border border-[#0a4d8c]/25 bg-[#f4f8fd] p-4 space-y-2.5 text-xs text-slate-700">
              <div className="font-semibold text-[#0a4d8c]">
                Mode External Agent Takeover (Live Bridge via MCP) Aktif
              </div>
              <p className="leading-relaxed">
                Saat mode ini disimpan, setiap pertanyaan atau lampiran yang dikirim pengguna di <strong>Search Bar Beranda</strong>, <strong>Halaman Diskusi AI</strong>, maupun <strong>Sidebar Kanan</strong> akan masuk ke antrean tiket Takeover (<code className="font-mono text-[#0a4d8c]">TKT-...</code>).
              </p>
              <p className="leading-relaxed">
                Agent eksternal Anda (seperti <strong>Antigravity, Claude Code, Codex, atau Cursor</strong>) dapat mengambil pertanyaan tersebut dengan tool <code className="font-mono text-[#0a4d8c]">prima_get_pending_chat_takeover</code> dan mengirimkan balasannya langsung ke layar chat pengguna dengan tool <code className="font-mono text-[#0a4d8c]">prima_reply_chat_takeover</code>.
              </p>
            </div>
          )}

          {providerMode !== "internal_gemini" &&
            providerMode !== "mcp_takeover" && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
              {/* Quick Preset Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-medium text-slate-500">
                  Preset Cepat:
                </span>
                {PRESET_PROVIDERS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setProviderName(preset.name);
                      setBaseUrl(preset.baseUrl);
                      setModelName(preset.model);
                    }}
                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-[#0a4d8c] hover:text-[#0a4d8c]"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                    Base URL Endpoint
                  </label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://api.openai.com/v1"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#0a4d8c] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                    Nama Model AI Eksternal
                  </label>
                  <input
                    type="text"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder="gpt-4o-mini / claude-3-5-sonnet"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#0a4d8c] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                    API Key / Bearer Secret Provider Eksternal
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#0a4d8c] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-5 pt-1">
                <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={replaceChatBrain}
                    onChange={(e) => setReplaceChatBrain(e.target.checked)}
                    className="rounded border-slate-300 text-[#0a4d8c] focus:ring-[#0a4d8c]"
                  />
                  <span>Gantikan AI di dalam Diskusi AI &amp; Omni-Search</span>
                </label>

                <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={replaceAnalysisBrain}
                    onChange={(e) => setReplaceAnalysisBrain(e.target.checked)}
                    className="rounded border-slate-300 text-[#0a4d8c] focus:ring-[#0a4d8c]"
                  />
                  <span>Gantikan AI pada Pemeriksaan Dokumen &amp; OCR</span>
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSaveProviderConfig}
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
                  <Sparkles size={13} />
                  <span>Simpan Konfigurasi Otak AI</span>
                </>
              )}
            </button>
          </div>
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
