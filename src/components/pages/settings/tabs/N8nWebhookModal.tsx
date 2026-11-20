"use client";

import { useState, useMemo, useEffect } from "react";
import {
  X,
  Webhook,
  Shield,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Play,
  Copy,
  RefreshCw,
} from "lucide-react";
import type {
  N8nEventCatalogItemDto,
  N8nWebhookAuthType,
  N8nWebhookCreatePayload,
  N8nWebhookEndpointDto,
} from "@/lib/api";
import { useTestAdHocN8nUrl } from "@/lib/query/hooks/settings/useN8nPlugin";
import { useToast } from "@/components/ui/Toast";
import { getErrorMessage } from "@/lib/api/errors";

interface N8nWebhookModalProps {
  open: boolean;
  editingWebhook: N8nWebhookEndpointDto | null;
  eventsCatalog: N8nEventCatalogItemDto[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: N8nWebhookCreatePayload & { clear_secret?: boolean }) => Promise<void>;
}

const AUTH_OPTIONS: {
  value: N8nWebhookAuthType;
  label: string;
  hint: string;
}[] = [
  {
    value: "hmac_and_header",
    label: "HMAC + Custom Header (Direkomendasikan)",
    hint: "Mengirim X-PRIMA-Signature (HMAC-SHA256) sekaligus Header Auth untuk node Webhook n8n.",
  },
  {
    value: "header",
    label: "Custom Header Auth Saja",
    hint: "Cocok langsung dengan fitur Header Auth bawaan node Webhook n8n.",
  },
  {
    value: "hmac",
    label: "HMAC Signature Saja",
    hint: "Verifikasi keaslian payload lewat header X-PRIMA-Signature + X-PRIMA-Timestamp.",
  },
  {
    value: "none",
    label: "Tanpa Autentikasi",
    hint: "Hanya disarankan untuk pengujian internal di jaringan privat.",
  },
];

const WORKFLOW_PRESETS: {
  label: string;
  name: string;
  description: string;
  events: string[];
}[] = [
  {
    label: "Preset Google Drive Arsip",
    name: "Google Drive Auto-Archive",
    description: "Arsipkan PDF lulus verifikasi & buat folder paket pengadaan otomatis di Drive.",
    events: [
      "procurement.created",
      "document.status_changed",
      "validation.decision_updated",
      "validation.published",
    ],
  },
  {
    label: "Preset Google Calendar SLA & Jaminan",
    name: "Google Calendar SLA & Jaminan Sync",
    description: "Sinkronkan target deadline SLA dan jatuh tempo bank garansi ke Calendar.",
    events: [
      "deadline.created",
      "deadline.updated",
      "sla.escalated",
      "sla.recovery_plan_submitted",
      "guarantee.created",
      "guarantee.amended",
      "guarantee.expiring_soon",
    ],
  },
  {
    label: "Preset Google Sheets Rekap",
    name: "Google Sheets Live Tracker",
    description: "Update rekap status pengadaan, dokumen, SLA, dan jaminan ke spreadsheet.",
    events: [
      "procurement.created",
      "procurement.stage_changed",
      "procurement.status_changed",
      "sla.overdue",
      "guarantee.created",
      "guarantee.amended",
      "guarantee.claimed_or_released",
    ],
  },
];

export function N8nWebhookModal({
  open,
  editingWebhook,
  eventsCatalog,
  isSubmitting,
  onClose,
  onSubmit,
}: N8nWebhookModalProps) {
  const toast = useToast();
  const testAdHoc = useTestAdHocN8nUrl();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [authType, setAuthType] = useState<N8nWebhookAuthType>("hmac_and_header");
  const [secret, setSecret] = useState("");
  const [customHeaderName, setCustomHeaderName] = useState("X-N8N-Secret");
  const [includePresignedUrls, setIncludePresignedUrls] = useState(true);
  const [useAllEvents, setUseAllEvents] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [testFeedback, setTestFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!open) return;
    setTestFeedback(null);
    if (editingWebhook) {
      setName(editingWebhook.name);
      setDescription(editingWebhook.description || "");
      setUrl(editingWebhook.url);
      setEnabled(editingWebhook.enabled);
      setAuthType(editingWebhook.auth_type || "hmac_and_header");
      setSecret("");
      setCustomHeaderName(editingWebhook.custom_header_name || "X-N8N-Secret");
      setIncludePresignedUrls(editingWebhook.include_presigned_urls ?? true);
      const isWildcard = editingWebhook.events.includes("*");
      setUseAllEvents(isWildcard);
      setSelectedEvents(isWildcard ? [] : editingWebhook.events);
    } else {
      setName("");
      setDescription("");
      setUrl("");
      setEnabled(true);
      setAuthType("hmac_and_header");
      setSecret("");
      setCustomHeaderName("X-N8N-Secret");
      setIncludePresignedUrls(true);
      setUseAllEvents(true);
      setSelectedEvents([]);
    }
  }, [open, editingWebhook]);

  const groupedEvents = useMemo(() => {
    const groups: Record<string, N8nEventCatalogItemDto[]> = {};
    for (const item of eventsCatalog) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return Object.entries(groups);
  }, [eventsCatalog]);

  if (!open) return null;

  const toggleEvent = (eventKey: string) => {
    setUseAllEvents(false);
    setSelectedEvents((prev) =>
      prev.includes(eventKey)
        ? prev.filter((e) => e !== eventKey)
        : [...prev, eventKey]
    );
  };

  const toggleCategory = (items: N8nEventCatalogItemDto[]) => {
    setUseAllEvents(false);
    const keys = items.map((i) => i.event);
    const allChecked = keys.every((k) => selectedEvents.includes(k));
    if (allChecked) {
      setSelectedEvents((prev) => prev.filter((e) => !keys.includes(e)));
    } else {
      setSelectedEvents((prev) => Array.from(new Set([...prev, ...keys])));
    }
  };

  const applyPreset = (preset: (typeof WORKFLOW_PRESETS)[number]) => {
    if (!name.trim()) setName(preset.name);
    if (!description.trim()) setDescription(preset.description);
    setUseAllEvents(false);
    setSelectedEvents(preset.events);
  };

  const generateRandomSecret = () => {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    setSecret(`whsec_${hex}`);
  };

  const handleTestBeforeSave = async () => {
    if (!url.trim()) {
      toast.warning("Isi URL webhook terlebih dahulu untuk menguji koneksi.");
      return;
    }
    setTestFeedback(null);
    try {
      const res = await testAdHoc.mutateAsync({
        url: url.trim(),
        auth_type: authType,
        secret: secret.trim(),
        custom_header_name: customHeaderName.trim() || "X-N8N-Secret",
      });
      const d = res.delivery;
      setTestFeedback({
        ok: d.ok,
        message: d.ok
          ? `Terhubung! HTTP ${d.status_code} (${d.latency_ms ?? 0} ms)`
          : `Gagal (${d.status_code ?? "Network"}): ${d.error || "Tidak merespons"}`,
      });
    } catch (err) {
      setTestFeedback({
        ok: false,
        message: getErrorMessage(err, "URL tidak valid atau gagal terhubung"),
      });
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) {
      toast.warning("Nama dan URL Webhook wajib diisi.");
      return;
    }
    const eventsPayload = useAllEvents ? ["*"] : selectedEvents;
    if (!useAllEvents && eventsPayload.length === 0) {
      toast.warning("Pilih minimal 1 event pemicu atau aktifkan Semua Event.");
      return;
    }
    await onSubmit({
      name: name.trim(),
      description: description.trim(),
      url: url.trim(),
      enabled,
      events: eventsPayload,
      auth_type: authType,
      secret: secret.trim() || undefined,
      clear_secret: authType === "none",
      custom_header_name: customHeaderName.trim() || "X-N8N-Secret",
      include_presigned_urls: includePresignedUrls,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[1px]">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8f2fc] text-[#0a4d8c]">
              <Webhook size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {editingWebhook ? "Edit Webhook n8n" : "Tambah Webhook n8n Baru"}
              </h3>
              <p className="text-[11px] text-slate-500">
                Tiap webhook dapat memiliki endpoint &amp; daftar event pemicu masing-masing.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleFormSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {/* Quick Presets */}
            {!editingWebhook && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                  <Sparkles size={13} className="text-[#0a4d8c]" />
                  <span>Template Cepat Workflow (Drive / Calendar / Sheets):</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {WORKFLOW_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:border-[#0a4d8c] hover:text-[#0a4d8c]"
                    >
                      + {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Nama Webhook <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="cth. Google Drive Auto-Archive"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-[#0a4d8c] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Status Endpoint
                </label>
                <label className="flex h-[34px] cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-3 text-xs text-slate-700">
                  <span>{enabled ? "Aktif menerima event" : "Dijeda (Nonaktif)"}</span>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="h-4 w-4 accent-[#0a4d8c]"
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                URL Webhook n8n (Production / Test URL) <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://n8n.perusahaan.co.id/webhook/prima-events"
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs text-slate-800 focus:border-[#0a4d8c] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleTestBeforeSave}
                  disabled={testAdHoc.isPending}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:border-[#0a4d8c] hover:text-[#0a4d8c] disabled:opacity-50"
                >
                  {testAdHoc.isPending ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <Play size={13} />
                  )}
                  <span>Tes URL</span>
                </button>
              </div>
              {testFeedback && (
                <div
                  className={`mt-1.5 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium ${
                    testFeedback.ok
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {testFeedback.ok ? (
                    <CheckCircle2 size={13} />
                  ) : (
                    <AlertCircle size={13} />
                  )}
                  <span>{testFeedback.message}</span>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Deskripsi / Catatan Workflow (Opsional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="cth. Workflow n8n untuk arsip TOR & update spreadsheet harian"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-[#0a4d8c] focus:outline-none"
              />
            </div>

            {/* Security / Auth Settings */}
            <div className="rounded-xl border border-slate-200 p-3.5 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <Shield size={14} className="text-[#0a4d8c]" />
                <span>Autentikasi &amp; Keamanan Payload</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600">
                    Metode Auth Outbound
                  </label>
                  <select
                    value={authType}
                    onChange={(e) => setAuthType(e.target.value as N8nWebhookAuthType)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-800 focus:border-[#0a4d8c] focus:outline-none"
                  >
                    {AUTH_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {(authType === "hmac_and_header" || authType === "header") && (
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-600">
                      Nama Header Auth (n8n Header Auth)
                    </label>
                    <input
                      type="text"
                      value={customHeaderName}
                      onChange={(e) => setCustomHeaderName(e.target.value)}
                      placeholder="X-N8N-Secret"
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-2 font-mono text-xs text-slate-800 focus:border-[#0a4d8c] focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {authType !== "none" && (
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-[11px] font-medium text-slate-600">
                      Secret Token{" "}
                      {editingWebhook?.has_secret && !secret
                        ? `(Tersimpan: ${editingWebhook.secret_masked} — kosongkan jika tidak diubah)`
                        : "(Kosongkan untuk auto-generate)"}
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={generateRandomSecret}
                        className="text-[11px] font-semibold text-[#0a4d8c] hover:underline"
                      >
                        Generate Baru
                      </button>
                      {secret && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(secret);
                            toast.success("Secret disalin ke clipboard.");
                          }}
                          className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800"
                        >
                          <Copy size={11} />
                          <span>Salin</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    placeholder={
                      editingWebhook?.has_secret
                        ? "Biarkan kosong untuk mempertahankan secret saat ini"
                        : "whsec_... (otomatis dibuat jika dikosongkan)"
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs text-slate-800 focus:border-[#0a4d8c] focus:outline-none"
                  />
                </div>
              )}

              <p className="text-[11px] text-slate-500">
                {AUTH_OPTIONS.find((a) => a.value === authType)?.hint}
              </p>

              <label className="flex cursor-pointer items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-700">
                <div>
                  <span className="font-medium">Sertakan Tautan File Presigned (S3/Storage)</span>
                  <p className="text-[11px] text-slate-500">
                    Memudahkan n8n mendownload PDF/DOCX lalu upload otomatis ke Google Drive.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={includePresignedUrls}
                  onChange={(e) => setIncludePresignedUrls(e.target.checked)}
                  className="h-4 w-4 shrink-0 accent-[#0a4d8c]"
                />
              </label>
            </div>

            {/* Trigger Event Subscriptions */}
            <div className="rounded-xl border border-slate-200 p-3.5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-semibold text-slate-800">
                    Event Pemicu (*Trigger Events*)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Pilih event PRIMA yang akan dikirim ke webhook ini.
                  </p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#0a4d8c]/25 bg-[#e8f2fc]/60 px-2.5 py-1.5 text-[11px] font-semibold text-[#0a4d8c]">
                  <input
                    type="checkbox"
                    checked={useAllEvents}
                    onChange={(e) => setUseAllEvents(e.target.checked)}
                    className="h-3.5 w-3.5 accent-[#0a4d8c]"
                  />
                  <span>Kirim Semua Event (*)</span>
                </label>
              </div>

              <div className="space-y-3">
                {groupedEvents.map(([category, items]) => {
                  const allCategoryChecked =
                    useAllEvents ||
                    items.every((i) => selectedEvents.includes(i.event));
                  return (
                    <div
                      key={category}
                      className="rounded-lg border border-slate-100 bg-slate-50/60 p-2.5 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                          {category}
                        </span>
                        {!useAllEvents && (
                          <button
                            type="button"
                            onClick={() => toggleCategory(items)}
                            className="text-[11px] font-medium text-[#0a4d8c] hover:underline"
                          >
                            {allCategoryChecked ? "Batal Pilih Grup" : "Pilih Semua Grup"}
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {items.map((ev) => {
                          const checked =
                            useAllEvents || selectedEvents.includes(ev.event);
                          return (
                            <label
                              key={ev.event}
                              className={`flex cursor-pointer items-start gap-2 rounded-lg border p-2 transition ${
                                checked
                                  ? "border-[#0a4d8c]/35 bg-white"
                                  : "border-transparent bg-white/60 hover:border-slate-200"
                              } ${useAllEvents ? "opacity-75" : ""}`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={useAllEvents}
                                onChange={() => toggleEvent(ev.event)}
                                className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[#0a4d8c]"
                              />
                              <div className="min-w-0">
                                <div className="text-[11px] font-semibold text-slate-800 leading-tight">
                                  {ev.label}
                                </div>
                                <code className="block truncate font-mono text-[10px] text-[#0a4d8c]">
                                  {ev.event}
                                </code>
                                {ev.recommended_for && (
                                  <div className="mt-0.5 text-[10px] text-slate-500 leading-snug">
                                    {ev.recommended_for}
                                  </div>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a4d8c] px-5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-[#083b6c] disabled:opacity-50"
            >
              {isSubmitting && <RefreshCw size={13} className="animate-spin" />}
              <span>{editingWebhook ? "Simpan Perubahan" : "Tambah Webhook"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
