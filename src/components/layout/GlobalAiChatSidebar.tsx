"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Sparkles,
  Zap,
  Plus,
  Maximize2,
  X,
  ChevronDown,
  MessageSquare,
  MapPin,
} from "lucide-react";
import {
  type AiChatSession,
  type AiChatMessage,
  getAllChatSessions,
  getChatSessionById,
  createChatSession,
  upsertChatSession,
  generateMessageId,
  buildTitleFromPrompt,
  rememberChatUploadedFile,
} from "@/lib/aiChatStore";
import { useOmniAssistant } from "@/lib/query/hooks/ai/useOmniAssistant";
import { useCurrentUser } from "@/lib/query/hooks/auth/useCurrentUser";
import {
  useDeadlines,
  useProcurements,
  useDocuments,
} from "@/lib/query/hooks/procurement/useProcurement";
import { useValidationLogs } from "@/lib/query/hooks/procurement/useValidation";
import { useSettings } from "@/lib/query/hooks/settings/useSettings";
import { useProcurement } from "@/context/ProcurementContext";
import { getDeadlineTiming } from "@/lib/deadlineUtils";
import { formatRequestCode, formatRupiah } from "@/lib/utils";
import { getErrorMessage } from "@/lib/api/errors";
import { SLAActionModal } from "@/components/widgets/modals/SLAActionModal";
import { ChatMessageBubble } from "@/components/pages/onboarding/chat/ChatMessageBubble";
import { ChatInputBar } from "@/components/pages/onboarding/chat/ChatInputBar";
import type { DeadlineItem } from "@/types";
import type { OmniChatHistoryTurnDto } from "@/lib/api";

interface GlobalAiChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalAiChatSidebar({
  isOpen,
  onClose,
}: GlobalAiChatSidebarProps) {
  const router = useRouter();
  const pathname = usePathname() || "";
  const [urlQuery, setUrlQuery] = useState<{ id: string; lens: string }>({
    id: "",
    lens: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncUrlParams = () => {
      const p = new URLSearchParams(window.location.search);
      setUrlQuery({
        id: p.get("id") || "",
        lens: p.get("lens") || "",
      });
    };
    syncUrlParams();
    window.addEventListener("popstate", syncUrlParams);
    window.addEventListener("prima-lens-change", syncUrlParams);
    return () => {
      window.removeEventListener("popstate", syncUrlParams);
      window.removeEventListener("prima-lens-change", syncUrlParams);
    };
  }, [pathname, isOpen]);
  const { state } = useProcurement();
  const { data: currentUser } = useCurrentUser();
  const { data: serverRequests = [] } = useProcurements();
  const { data: serverDocs = [] } = useDocuments();
  const { data: validationLogs = [] } = useValidationLogs();
  const { data: serverDeadlines = [] } = useDeadlines();
  const { data: settings } = useSettings();
  const omniAssistant = useOmniAssistant();

  const slaWarningDays = settings?.slaWarningDays ?? 3;
  const requests =
    serverRequests.length > 0 ? serverRequests : state.requests;
  const documents = serverDocs.length > 0 ? serverDocs : state.documents;
  const deadlines =
    serverDeadlines.length > 0 ? serverDeadlines : state.deadlines;

  const enrichedDeadlines = useMemo(() => {
    return deadlines.map((d) => {
      const timing = getDeadlineTiming(d, slaWarningDays);
      return {
        ...d,
        status: timing.status,
        daysRemaining: timing.daysRemaining,
      };
    });
  }, [deadlines, slaWarningDays]);

  // ── Page-Aware AI Context Detection (Prioritas #1) ──────────────────────
  const activePageContext = useMemo(() => {
    // 1. Detail Pekerjaan (/dashboard/overview/[id])
    const jobMatch = pathname.match(/^\/dashboard\/overview\/([^/]+)$/);
    if (jobMatch && jobMatch[1] !== "guarantees") {
      const reqId = decodeURIComponent(jobMatch[1]);
      const req = requests.find((r) => r.id === reqId);
      const jobSlas = enrichedDeadlines.filter((d) => d.requestId === reqId);
      const overdueCount = jobSlas.filter((d) => d.status === "Overdue").length;

      return {
        badgeLabel: req
          ? `${formatRequestCode(req.id)} · ${req.title}`
          : `Pekerjaan ${formatRequestCode(reqId)}`,
        contextDescription: req
          ? `Pengguna sedang membuka halaman Detail Pekerjaan ID="${req.id}", Judul="${req.title}", Tahap="${req.stage}" (${req.currentStep}), Metode="${req.procurementMethod || "Tender Terbuka"}", Nilai=${formatRupiah(req.amount)}, PIC="${req.pic.name}", Status Operasional="${req.operationalStatus}", Total SLA=${jobSlas.length} (${overdueCount} Overdue).`
          : `Pengguna sedang membuka Detail Pekerjaan ID="${reqId}".`,
        quickPrompts: [
          `Apa saja langkah berikutnya dan status SLA untuk pekerjaan ${formatRequestCode(reqId)} ini?`,
          `Apakah ada dokumen atau risiko keterlambatan pada pekerjaan ini?`,
          `Pindahkan tahap pekerjaan ini atau perbarui statusnya`,
        ],
      };
    }

    // 2. Hasil Pemeriksaan Dokumen (/dashboard/documents/result?id=...)
    if (pathname.startsWith("/dashboard/documents/result")) {
      const valId = urlQuery.id;
      const log = validationLogs.find(
        (l) => l.id === valId || l.document_id === valId
      );
      const doc = documents.find((d) => d.id === valId);
      const docTitle = log?.document_name || doc?.name || valId || "Dokumen";

      return {
        badgeLabel: `Hasil Analisis: ${docTitle}`,
        contextDescription: log
          ? `Pengguna sedang membuka halaman Hasil Pemeriksaan AI untuk Dokumen ID="${log.id}", Nama="${log.document_name}", Template="${log.profile_name || "-"}", Skor=${Math.round(log.overall_score)}/100, Status="${log.compliance_status}".`
          : `Pengguna sedang melihat Hasil Pemeriksaan Dokumen ID="${valId}" (${docTitle}).`,
        quickPrompts: [
          `Jelaskan poin kriteria yang perlu diperbaiki pada dokumen ${docTitle} ini`,
          `Buatkan ringkasan rekomendasi tindak lanjut untuk dokumen ini`,
          `Apakah dokumen ini sudah layak diterbitkan ke pekerjaan?`,
        ],
      };
    }

    // 3. Kelola Tahapan (/dashboard/documents/stages)
    if (pathname.startsWith("/dashboard/documents/stages")) {
      return {
        badgeLabel: "Kelola Metode & Tahapan Pekerjaan",
        contextDescription:
          "Pengguna sedang berada di halaman Kelola Metode & Tahapan Pekerjaan (/dashboard/documents/stages).",
        quickPrompts: [
          "Rekomendasikan urutan tahapan dan SLA untuk metode Tender Cepat",
          "Pekerjaan mana saja yang saat ini mengalami keterlambatan tahapan?",
          "Bagaimana hubungan standar SLA tahapan dengan jadwal pekerjaan?",
        ],
      };
    }

    // 4. Pustaka Template Kriteria (/dashboard/documents/templates)
    if (pathname.startsWith("/dashboard/documents/templates")) {
      return {
        badgeLabel: "Pustaka Template Kriteria Standar",
        contextDescription:
          "Pengguna sedang berada di halaman Pustaka Template Kriteria Standar (/dashboard/documents/templates).",
        quickPrompts: [
          "Template standar apa saja yang aktif beserta ambang batas skornya?",
          "Kriteria wajib apa yang sebaiknya ada pada template KAK?",
          "Buka halaman validasi dokumen baru",
        ],
      };
    }

    // 5. Daftar Pemeriksaan Dokumen (/dashboard/documents)
    if (pathname.startsWith("/dashboard/documents")) {
      return {
        badgeLabel: "Pemeriksaan Dokumen",
        contextDescription:
          "Pengguna sedang berada di halaman Pemeriksaan Dokumen (/dashboard/documents).",
        quickPrompts: [
          "Dokumen mana saja yang skor AI-nya di bawah ambang lulus?",
          "Ringkas hasil pemeriksaan dokumen terbaru hari ini",
          "Buka halaman unggah & validasi dokumen baru",
        ],
      };
    }

    // 6. Overview Lenses (Warkat Jaminan / SLA / Analitik / Daftar Pekerjaan)
    if (pathname.startsWith("/dashboard/overview")) {
      const lens = urlQuery.lens || "jobs";
      if (lens === "guarantees" || pathname.includes("guarantees")) {
        return {
          badgeLabel: "Manajemen Warkat Jaminan",
          contextDescription:
            "Pengguna sedang berada di tampilan Manajemen Warkat Jaminan (/dashboard/overview?lens=guarantees).",
          quickPrompts: [
            "Warkat jaminan mana yang sudah expired atau mendekati jatuh tempo?",
            "Berapa total nilai jaminan pelaksanaan yang sedang aktif?",
            "Buka halaman unggah & OCR warkat jaminan baru",
          ],
        };
      }
      if (lens === "sla-actions") {
        return {
          badgeLabel: "SLA & Tindak Lanjut Prioritas",
          contextDescription:
            "Pengguna sedang berada di tampilan SLA & Tindak Lanjut Prioritas (/dashboard/overview?lens=sla-actions).",
          quickPrompts: [
            "SLA mana yang paling kritis dan perlu dieskalasi ke manajer?",
            "Jalankan evaluasi dan sinkronisasi seluruh SLA sekarang",
            "Tampilkan rencana mitigasi untuk SLA yang terlambat",
          ],
        };
      }
      if (lens === "analytics") {
        return {
          badgeLabel: "Analitik & Performa Pengadaan",
          contextDescription:
            "Pengguna sedang berada di tampilan Analitik & Performa Pengadaan (/dashboard/overview?lens=analytics).",
          quickPrompts: [
            "Ringkas performa kepatuhan SLA dan beban kerja departemen saat ini",
            "Tahapan mana yang paling sering menjadi bottleneck pengadaan?",
            "Berapa total nilai anggaran pengadaan yang sedang berjalan?",
          ],
        };
      }
      return {
        badgeLabel: "Daftar Pekerjaan Pengadaan",
        contextDescription:
          "Pengguna sedang berada di halaman Daftar Pekerjaan Pengadaan (/dashboard/overview).",
        quickPrompts: [
          "Ringkas status seluruh pekerjaan pengadaan yang sedang berjalan",
          "Pekerjaan mana yang berstatus Urgent atau memiliki SLA terlambat?",
          "Buatkan paket pekerjaan pengadaan baru",
        ],
      };
    }

    // 7. Pusat Notifikasi
    if (pathname.startsWith("/dashboard/notifications")) {
      return {
        badgeLabel: "Pusat Notifikasi",
        contextDescription:
          "Pengguna sedang berada di halaman Pusat Notifikasi (/dashboard/notifications).",
        quickPrompts: [
          "Apa saja tindak lanjut paling mendesak yang perlu saya selesaikan hari ini?",
          "Ringkas temuan validasi AI dan peringatan SLA terbaru",
          "Jalankan sinkronisasi SLA sekarang",
        ],
      };
    }

    return {
      badgeLabel: "Ruang Kerja PRIMA",
      contextDescription: `Pengguna sedang berada di halaman ${pathname}.`,
      quickPrompts: [
        "Ringkas status pekerjaan & SLA saat ini",
        "Dokumen mana yang skor AI-nya perlu perbaikan?",
        "Warkat jaminan apa yang hampir expired?",
      ],
    };
  }, [
    pathname,
    urlQuery,
    requests,
    enrichedDeadlines,
    validationLogs,
    documents,
  ]);

  const [sessions, setSessions] = useState<AiChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<AiChatSession | null>(
    null
  );
  const [sessionMenuOpen, setSessionMenuOpen] = useState(false);
  const [selectedSlaModal, setSelectedSlaModal] = useState<DeadlineItem | null>(
    null
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionMenuRef = useRef<HTMLDivElement>(null);

  const syncSessions = useCallback(() => {
    const all = getAllChatSessions();
    if (all.length === 0) {
      const created = createChatSession();
      setSessions([created]);
      setCurrentSession(created);
    } else {
      setSessions(all);
      setCurrentSession((prev) => {
        if (prev) {
          const updated = getChatSessionById(prev.id);
          if (updated) return updated;
        }
        return all[0];
      });
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    syncSessions();

    const handleStoreUpdate = () => syncSessions();
    window.addEventListener("prima-ai-chat-updated", handleStoreUpdate);
    return () => {
      window.removeEventListener("prima-ai-chat-updated", handleStoreUpdate);
    };
  }, [isOpen, syncSessions]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        sessionMenuRef.current &&
        !sessionMenuRef.current.contains(e.target as Node)
      ) {
        setSessionMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, currentSession?.messages.length]);

  const handleSendMessage = async (
    text: string,
    attachmentFile?: File | null
  ) => {
    if (!currentSession || omniAssistant.isPending) return;

    if (attachmentFile) {
      rememberChatUploadedFile(attachmentFile);
    }

    const userMsg: AiChatMessage = {
      id: generateMessageId(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
      status: "done",
      attachment: attachmentFile
        ? {
            name: attachmentFile.name,
            size: attachmentFile.size,
            type: attachmentFile.type || "application/octet-stream",
          }
        : null,
    };

    const assistantPlaceholderId = generateMessageId();
    const placeholderMsg: AiChatMessage = {
      id: assistantPlaceholderId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
      status: "sending",
    };

    const withPlaceholder: AiChatSession = {
      ...currentSession,
      title:
        currentSession.messages.length === 0 ||
        currentSession.title === "Diskusi AI Baru"
          ? buildTitleFromPrompt(text, attachmentFile?.name)
          : currentSession.title,
      messages: [...currentSession.messages, userMsg, placeholderMsg],
    };

    setCurrentSession(withPlaceholder);
    upsertChatSession(withPlaceholder);

    const historyTurns: OmniChatHistoryTurnDto[] = currentSession.messages
      .filter((m) => m.status === "done" && m.content.trim().length > 0)
      .slice(-8)
      .map((m) => ({
        role: m.role,
        content: m.aiData?.answer || m.content,
      }));

    try {
      const res = await omniAssistant.mutateAsync({
        query: text,
        history: historyTurns,
        file: attachmentFile,
        pageContext: activePageContext.contextDescription,
      });

      const completedMsg: AiChatMessage = {
        id: assistantPlaceholderId,
        role: "assistant",
        content: res.answer,
        createdAt: new Date().toISOString(),
        status: "done",
        aiData: res,
      };

      const finalSession: AiChatSession = {
        ...withPlaceholder,
        messages: withPlaceholder.messages.map((m) =>
          m.id === assistantPlaceholderId ? completedMsg : m
        ),
      };

      setCurrentSession(finalSession);
      upsertChatSession(finalSession);
    } catch (err) {
      const errMsg = getErrorMessage(
        err,
        "Gagal menghubungi layanan PRIMA AI"
      );
      const failedMsg: AiChatMessage = {
        id: assistantPlaceholderId,
        role: "assistant",
        content: errMsg,
        createdAt: new Date().toISOString(),
        status: "error",
        errorMessage: errMsg,
      };

      const failedSession: AiChatSession = {
        ...withPlaceholder,
        messages: withPlaceholder.messages.map((m) =>
          m.id === assistantPlaceholderId ? failedMsg : m
        ),
      };

      setCurrentSession(failedSession);
      upsertChatSession(failedSession);
    }
  };

  const handleMarkCommandExecuted = (messageId: string) => {
    if (!currentSession) return;
    const nextSession: AiChatSession = {
      ...currentSession,
      messages: currentSession.messages.map((m) =>
        m.id === messageId ? { ...m, commandExecuted: true } : m
      ),
    };
    setCurrentSession(nextSession);
    upsertChatSession(nextSession);
  };

  const handleTakeoverReplied = (
    messageId: string,
    replyPayload: NonNullable<AiChatMessage["aiData"]>
  ) => {
    if (!currentSession) return;
    const nextSession: AiChatSession = {
      ...currentSession,
      messages: currentSession.messages.map((m) =>
        m.id === messageId
          ? {
              ...m,
              content: replyPayload.answer,
              status: "done",
              aiData: replyPayload,
            }
          : m
      ),
    };
    setCurrentSession(nextSession);
    upsertChatSession(nextSession);
  };

  const handleNewChat = () => {
    const fresh = createChatSession();
    setCurrentSession(fresh);
    setSessions(getAllChatSessions());
    setSessionMenuOpen(false);
  };

  const handleExpandFullPage = () => {
    const targetId = currentSession?.id || createChatSession().id;
    onClose();
    router.push(`/dashboard/onboarding/chat/${encodeURIComponent(targetId)}`);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        onClick={onClose}
      />

      <aside className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-[400px] sm:w-[410px] shrink-0 flex-col border-l border-slate-200 bg-[#f8fafd] shadow-2xl lg:static lg:z-20 lg:shadow-none">
        {/* Sidebar Header */}
        <div className="flex h-[84px] shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-4">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#0a4d8c] text-white shadow-2xs">
              <Sparkles size={15} />
            </div>

            {/* Session Switcher Dropdown */}
            <div ref={sessionMenuRef} className="relative min-w-0 flex-1">
              <button
                type="button"
                onClick={() => setSessionMenuOpen((o) => !o)}
                className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1 text-left transition hover:bg-slate-100"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-xs font-semibold text-slate-900">
                      {currentSession?.title || "Diskusi AI"}
                    </span>
                    <ChevronDown size={12} className="shrink-0 text-slate-400" />
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-medium text-[#0a4d8c]">
                    <Zap size={9} />
                    <span>Mode Cekatan</span>
                  </div>
                </div>
              </button>

              {sessionMenuOpen && (
                <div className="absolute left-0 top-full z-50 mt-1.5 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                  <div className="border-b border-slate-100 p-2">
                    <button
                      type="button"
                      onClick={handleNewChat}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#0a4d8c] px-3 py-1.5 text-xs font-semibold text-white transition hover:!bg-[#083b6c]"
                    >
                      <Plus size={13} />
                      <span>Diskusi Baru</span>
                    </button>
                  </div>
                  <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5 scrollbar-thin">
                    {sessions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setCurrentSession(s);
                          setSessionMenuOpen(false);
                        }}
                        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition ${
                          s.id === currentSession?.id
                            ? "bg-[#e8f2fc] font-semibold text-[#0a4d8c]"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <MessageSquare size={12} className="shrink-0" />
                        <span className="truncate flex-1">{s.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleNewChat}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-[#0a4d8c]"
              title="Mulai diskusi baru"
            >
              <Plus size={15} />
            </button>
            <button
              type="button"
              onClick={handleExpandFullPage}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-[#0a4d8c]"
              title="Buka di halaman penuh Diskusi AI"
            >
              <Maximize2 size={14} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              title="Tutup sidebar Diskusi AI"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Page-Aware Active Context Banner (Prioritas #1) */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 bg-[#f4f8fd] px-3.5 py-2 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin size={12} className="shrink-0 text-[#0a4d8c]" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 shrink-0">
              Konteks:
            </span>
            <span
              className="truncate text-[11px] font-semibold text-[#0a4d8c]"
              title={activePageContext.badgeLabel}
            >
              {activePageContext.badgeLabel}
            </span>
          </div>
        </div>

        {/* Scrollable Message Stream */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-4 scrollbar-thin">
          {currentSession && currentSession.messages.length > 0 ? (
            currentSession.messages.map((msg) => (
              <ChatMessageBubble
                key={msg.id}
                message={msg}
                userName={currentUser?.name}
                userAvatarUrl={currentUser?.avatar_url}
                onSelectFollowup={(prompt) => handleSendMessage(prompt)}
                onOpenSlaModal={(deadlineId) => {
                  const found = enrichedDeadlines.find(
                    (d) => d.id === deadlineId
                  );
                  if (found) setSelectedSlaModal(found);
                }}
                onMarkCommandExecuted={handleMarkCommandExecuted}
                onTakeoverReplied={handleTakeoverReplied}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8 px-3 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e8f2fc] text-[#0a4d8c] mb-3">
                <Sparkles size={18} />
              </div>
              <p className="text-xs font-semibold text-slate-800">
                Asisten AI Kontekstual
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                AI memahami bahwa Anda sedang membuka{" "}
                <strong className="font-semibold text-[#0a4d8c]">
                  {activePageContext.badgeLabel}
                </strong>
                .
              </p>

              <div className="mt-4 w-full space-y-1.5">
                {activePageContext.quickPrompts.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(q)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-[11px] font-medium text-slate-700 shadow-2xs transition hover:border-[#0a4d8c]/40 hover:bg-[#f4f8fd] hover:text-[#0a4d8c]"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Bar */}
        <ChatInputBar
          onSend={handleSendMessage}
          disabled={omniAssistant.isPending}
        />
      </aside>

      {selectedSlaModal && (
        <SLAActionModal
          deadline={selectedSlaModal}
          onClose={() => setSelectedSlaModal(null)}
        />
      )}
    </>
  );
}
