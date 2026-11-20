"use client";

import { useState } from "react";
import {
  Webhook,
  Plus,
  Play,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Copy,
  ChevronDown,
  Workflow,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import {
  useN8nPlugin,
  useUpdateN8nGlobal,
  useCreateN8nWebhook,
  useUpdateN8nWebhook,
  useDeleteN8nWebhook,
  useTestN8nWebhook,
  useClearN8nLogs,
} from "@/lib/query/hooks/settings/useN8nPlugin";
import { API_ORIGIN } from "@/lib/api/client";
import type {
  N8nWebhookCreatePayload,
  N8nWebhookEndpointDto,
} from "@/lib/api";
import { Skeleton } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { getErrorMessage } from "@/lib/api/errors";
import { N8nWebhookModal } from "./N8nWebhookModal";

function formatShortTime(iso?: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function N8nPluginSection({
  onJumpToTokenSection,
}: {
  onJumpToTokenSection?: () => void;
}) {
  const toast = useToast();
  const { data: overview, isLoading } = useN8nPlugin();
  const updateGlobal = useUpdateN8nGlobal();
  const createWebhook = useCreateN8nWebhook();
  const updateWebhook = useUpdateN8nWebhook();
  const deleteWebhook = useDeleteN8nWebhook();
  const testWebhook = useTestN8nWebhook();
  const clearLogs = useClearN8nLogs();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] =
    useState<N8nWebhookEndpointDto | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [showInboundGuide, setShowInboundGuide] = useState(false);
  const [latestPlainSecret, setLatestPlainSecret] = useState<{
    name: string;
    secret: string;
  } | null>(null);

  if (isLoading || !overview) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-44 w-full rounded-xl" />
      </div>
    );
  }

  const webhooks = overview.webhooks || [];
  const activeCount = webhooks.filter((w) => w.enabled).length;
  const logs = overview.delivery_logs || [];
  const catalog = overview.events_catalog || [];

  const handleToggleGlobal = async (nextEnabled: boolean) => {
    try {
      await updateGlobal.mutateAsync(nextEnabled);
      toast.success(
        nextEnabled
          ? "Plugin n8n diaktifkan secara global."
          : "Plugin n8n dijeda (tidak ada webhook yang dikirim)."
      );
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal mengubah status plugin n8n"));
    }
  };

  const handleToggleSingleWebhook = async (wh: N8nWebhookEndpointDto) => {
    try {
      await updateWebhook.mutateAsync({
        webhookId: wh.id,
        payload: { enabled: !wh.enabled },
      });
      toast.success(
        `Webhook '${wh.name}' ${!wh.enabled ? "diaktifkan" : "dinonaktifkan"}.`
      );
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal memperbarui status webhook"));
    }
  };

  const handleDelete = async (wh: N8nWebhookEndpointDto) => {
    try {
      await deleteWebhook.mutateAsync(wh.id);
      toast.success(`Webhook '${wh.name}' berhasil dihapus.`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal menghapus webhook"));
    }
  };

  const handleTest = async (wh: N8nWebhookEndpointDto) => {
    setTestingId(wh.id);
    try {
      const res = await testWebhook.mutateAsync(wh.id);
      if (res.delivery.ok) {
        toast.success(
          `Test ke '${wh.name}' sukses (${res.delivery.status_code}, ${res.delivery.latency_ms} ms)`
        );
      } else {
        toast.error(
          `Test ke '${wh.name}' gagal: ${res.delivery.error || res.delivery.status_code}`
        );
      }
      setShowLogs(true);
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal menguji webhook"));
    } finally {
      setTestingId(null);
    }
  };

  const handleModalSubmit = async (
    payload: N8nWebhookCreatePayload & { clear_secret?: boolean }
  ) => {
    try {
      if (editingWebhook) {
        await updateWebhook.mutateAsync({
          webhookId: editingWebhook.id,
          payload,
        });
        toast.success(`Webhook '${payload.name}' berhasil diperbarui.`);
      } else {
        const created = await createWebhook.mutateAsync(payload);
        if (created.plain_secret_once) {
          setLatestPlainSecret({
            name: payload.name,
            secret: created.plain_secret_once,
          });
        }
        toast.success(`Webhook '${payload.name}' berhasil ditambahkan.`);
      }
      setModalOpen(false);
      setEditingWebhook(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal menyimpan konfigurasi webhook"));
    }
  };

  const copyText = (label: string, text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} disalin ke clipboard.`);
  };

  const inboundItems = [
    {
      title: "Eksekusi Tool MCP (Buat Pengadaan / Analisis / Update Stage)",
      url: `${API_ORIGIN}${overview.inbound_endpoints.tools_execute_url}`,
    },
    {
      title: "Trigger Evaluasi SLA Harian (Schedule n8n jam 08:00)",
      url: `${API_ORIGIN}${overview.inbound_endpoints.evaluate_sla_url}`,
    },
    {
      title: "Trigger Evaluasi Jatuh Tempo Jaminan Bank",
      url: `${API_ORIGIN}${overview.inbound_endpoints.evaluate_guarantees_url}`,
    },
  ];

  return (
    <div className="space-y-5">
      {/* HEADER & GLOBAL MASTER SWITCH */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f2fc] text-[#0a4d8c]">
              <Workflow size={20} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  Plugin n8n &amp; Otomasi Multi-Webhook
                </h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                    overview.enabled
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-500 border border-slate-200"
                  }`}
                >
                  {overview.enabled
                    ? `${activeCount} / ${webhooks.length} Webhook Aktif`
                    : "Plugin Dijeda"}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500 max-w-2xl">
                Sambungkan PRIMA ke beberapa workflow n8n sekaligus (Google Drive Auto-Archive, Google Calendar SLA &amp; Jaminan, Google Sheets Tracker, WhatsApp/Email Alert) berdasarkan event spesifik.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">
              <span>Master Switch</span>
              <input
                type="checkbox"
                checked={overview.enabled}
                disabled={updateGlobal.isPending}
                onChange={(e) => handleToggleGlobal(e.target.checked)}
                className="h-4 w-4 accent-[#0a4d8c]"
              />
            </label>

            <button
              type="button"
              onClick={() => {
                setEditingWebhook(null);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a4d8c] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#083b6c]"
            >
              <Plus size={14} />
              <span>Tambah Webhook</span>
            </button>
          </div>
        </div>

        {/* One-time plain secret reveal banner */}
        {latestPlainSecret && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2.5 text-xs text-emerald-900">
            <div className="min-w-0">
              <span className="font-semibold">
                Secret untuk &ldquo;{latestPlainSecret.name}&rdquo; berhasil dibuat:
              </span>{" "}
              <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-emerald-800">
                {latestPlainSecret.secret}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  copyText("Webhook Secret", latestPlainSecret.secret)
                }
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100"
              >
                <Copy size={11} />
                <span>Salin Secret</span>
              </button>
              <button
                type="button"
                onClick={() => setLatestPlainSecret(null)}
                className="text-[11px] text-emerald-700 hover:underline"
              >
                Tutup
              </button>
            </div>
          </div>
        )}

        {/* WEBHOOK LIST */}
        {webhooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center">
            <Webhook size={28} className="text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-700">
              Belum ada endpoint webhook n8n terdaftar
            </p>
            <p className="mt-1 max-w-md text-[11px] text-slate-500">
              Tambahkan satu atau beberapa webhook n8n sekaligus — misalnya dipisah khusus untuk arsip Google Drive, sinkronisasi Google Calendar, dan rekap Google Sheets.
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingWebhook(null);
                setModalOpen(true);
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[#0a4d8c]/30 bg-white px-3.5 py-2 text-xs font-semibold text-[#0a4d8c] hover:bg-[#e8f2fc]"
            >
              <Plus size={14} />
              <span>Buat Webhook Pertama</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {webhooks.map((wh) => {
              const isAll = wh.events.includes("*");
              const lastOk =
                wh.last_status_code !== null &&
                wh.last_status_code !== undefined &&
                wh.last_status_code >= 200 &&
                wh.last_status_code < 300;
              return (
                <div
                  key={wh.id}
                  className={`rounded-xl border p-4 transition ${
                    wh.enabled && overview.enabled
                      ? "border-slate-200 bg-white"
                      : "border-slate-200/80 bg-slate-50/70 opacity-80"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900">
                          {wh.name}
                        </span>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-600">
                          {wh.id}
                        </span>
                        {wh.auth_type !== "none" && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-[#0a4d8c]">
                            <ShieldCheck size={10} />
                            <span>
                              {wh.auth_type === "hmac_and_header"
                                ? `HMAC + ${wh.custom_header_name}`
                                : wh.auth_type === "header"
                                  ? `Header: ${wh.custom_header_name}`
                                  : "HMAC-SHA256"}
                            </span>
                          </span>
                        )}
                        {wh.last_triggered_at && (
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium ${
                              lastOk
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {lastOk ? (
                              <CheckCircle2 size={10} />
                            ) : (
                              <AlertCircle size={10} />
                            )}
                            <span>
                              {wh.last_status_code
                                ? `HTTP ${wh.last_status_code}`
                                : "Gagal"}{" "}
                              · {formatShortTime(wh.last_triggered_at)}
                            </span>
                          </span>
                        )}
                      </div>

                      {wh.description && (
                        <p className="text-[11px] text-slate-500">
                          {wh.description}
                        </p>
                      )}

                      <div className="flex items-center gap-1.5">
                        <code className="truncate rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700 max-w-xl">
                          {wh.url}
                        </code>
                        <button
                          type="button"
                          onClick={() => copyText("Webhook URL", wh.url)}
                          className="text-slate-400 hover:text-[#0a4d8c]"
                          title="Salin URL"
                        >
                          <Copy size={12} />
                        </button>
                      </div>

                      {/* Subscribed Events */}
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        {isAll ? (
                          <span className="rounded-md border border-[#0a4d8c]/20 bg-[#e8f2fc] px-2 py-0.5 text-[10px] font-semibold text-[#0a4d8c]">
                            Semua Event PRIMA ({catalog.length} triggers)
                          </span>
                        ) : (
                          <>
                            {wh.events.slice(0, 5).map((ev) => (
                              <span
                                key={ev}
                                className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[10px] text-slate-700"
                              >
                                {ev}
                              </span>
                            ))}
                            {wh.events.length > 5 && (
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                                +{wh.events.length - 5} event lainnya
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Card Controls */}
                    <div className="flex shrink-0 items-center gap-1.5">
                      <label
                        className="mr-1 inline-flex cursor-pointer items-center gap-1.5 text-[11px] text-slate-600"
                        title="Aktif / Nonaktifkan webhook ini"
                      >
                        <input
                          type="checkbox"
                          checked={wh.enabled}
                          onChange={() => handleToggleSingleWebhook(wh)}
                          className="h-4 w-4 accent-[#0a4d8c]"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => handleTest(wh)}
                        disabled={testingId === wh.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:border-[#0a4d8c] hover:text-[#0a4d8c] disabled:opacity-50"
                      >
                        {testingId === wh.id ? (
                          <RefreshCw size={12} className="animate-spin" />
                        ) : (
                          <Play size={12} />
                        )}
                        <span>Test</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingWebhook(wh);
                          setModalOpen(true);
                        }}
                        className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:border-[#0a4d8c] hover:text-[#0a4d8c]"
                        title="Edit webhook"
                      >
                        <Pencil size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(wh)}
                        className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                        title="Hapus webhook"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* DELIVERY AUDIT LOGS */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowLogs((prev) => !prev)}
          className="flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-slate-50/70"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Clock size={15} />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-900">
                Riwayat Pengiriman Event ke n8n ({logs.length})
              </h4>
              <p className="text-[11px] text-slate-500">
                Pantau status HTTP, latensi, dan pesan error dari pengiriman webhook terakhir.
              </p>
            </div>
          </div>
          <ChevronDown
            size={16}
            className={`text-slate-400 transition-transform ${
              showLogs ? "rotate-180" : ""
            }`}
          />
        </button>

        {showLogs && (
          <div className="border-t border-slate-100 p-4 space-y-3">
            {logs.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">
                Belum ada riwayat pengiriman webhook. Klik tombol Test pada salah satu webhook untuk mencoba.
              </p>
            ) : (
              <>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => clearLogs.mutate()}
                    disabled={clearLogs.isPending}
                    className="text-[11px] font-medium text-slate-500 hover:text-red-600"
                  >
                    Bersihkan Riwayat
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {logs.map((log) => (
                    <div
                      key={`${log.delivery_id}-${log.webhook_id}`}
                      className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-[11px]"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-semibold ${
                            log.ok
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {log.status_code ?? "ERR"}
                        </span>
                        <code className="font-mono font-semibold text-[#0a4d8c]">
                          {log.event}
                        </code>
                        <span className="truncate text-slate-600">
                          → {log.webhook_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-500">
                        {log.error && (
                          <span className="max-w-[240px] truncate text-red-600" title={log.error}>
                            {log.error}
                          </span>
                        )}
                        {log.latency_ms !== undefined && log.latency_ms !== null && (
                          <span>{log.latency_ms} ms</span>
                        )}
                        <span>{formatShortTime(log.sent_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* INBOUND GUIDE (n8n -> PRIMA) */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowInboundGuide((prev) => !prev)}
          className="flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-slate-50/70"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8f2fc] text-[#0a4d8c]">
              <KeyRound size={15} />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-900">
                Endpoint Inbound PRIMA untuk Node HTTP Request &amp; Schedule di n8n
              </h4>
              <p className="text-[11px] text-slate-500">
                Gunakan endpoint ini bila n8n ingin memicu aksi di PRIMA (membuat pengadaan, cek SLA harian, atau cek jatuh tempo jaminan).
              </p>
            </div>
          </div>
          <ChevronDown
            size={16}
            className={`text-slate-400 transition-transform ${
              showInboundGuide ? "rotate-180" : ""
            }`}
          />
        </button>

        {showInboundGuide && (
          <div className="border-t border-slate-100 p-4 space-y-3">
            <div className="space-y-2">
              {inboundItems.map((item) => (
                <div
                  key={item.title}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium text-slate-700">
                      {item.title}
                    </div>
                    <code className="block truncate font-mono text-[11px] text-[#0a4d8c]">
                      POST {item.url}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(item.title, item.url)}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600 hover:text-[#0a4d8c]"
                  >
                    <Copy size={11} />
                    <span>Salin</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
              <span>
                Autentikasi node HTTP Request di n8n memakai header{" "}
                <code className="font-mono text-slate-800">
                  Authorization: Bearer &lt;TOKEN&gt;
                </code>
                .
              </span>
              {onJumpToTokenSection && (
                <button
                  type="button"
                  onClick={onJumpToTokenSection}
                  className="font-semibold text-[#0a4d8c] hover:underline"
                >
                  Buat Token di Tab Model AI &amp; MCP →
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      <N8nWebhookModal
        open={modalOpen}
        editingWebhook={editingWebhook}
        eventsCatalog={catalog}
        isSubmitting={createWebhook.isPending || updateWebhook.isPending}
        onClose={() => {
          setModalOpen(false);
          setEditingWebhook(null);
        }}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
}
