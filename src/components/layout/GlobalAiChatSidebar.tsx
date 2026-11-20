"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Zap,
  Plus,
  Maximize2,
  X,
  ChevronDown,
  MessageSquare,
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
} from "@/lib/aiChatStore";
import { useOmniAssistant } from "@/lib/query/hooks/ai/useOmniAssistant";
import { useCurrentUser } from "@/lib/query/hooks/auth/useCurrentUser";
import { useDeadlines } from "@/lib/query/hooks/procurement/useProcurement";
import { useSettings } from "@/lib/query/hooks/settings/useSettings";
import { useProcurement } from "@/context/ProcurementContext";
import { getDeadlineTiming } from "@/lib/deadlineUtils";
import { getErrorMessage } from "@/lib/api/errors";
import { SLAActionModal } from "@/components/widgets/modals/SLAActionModal";
import { ChatMessageBubble } from "@/components/pages/onboarding/chat/ChatMessageBubble";
import { ChatInputBar } from "@/components/pages/onboarding/chat/ChatInputBar";
import type { DeadlineItem } from "@/types";
import type { OmniChatHistoryTurnDto } from "@/lib/api";

const QUICK_PROMPTS = [
  "Ringkas status pekerjaan & SLA saat ini",
  "Dokumen mana yang skor AI-nya perlu perbaikan?",
  "Warkat jaminan apa yang hampir expired?",
];

interface GlobalAiChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalAiChatSidebar({
  isOpen,
  onClose,
}: GlobalAiChatSidebarProps) {
  const router = useRouter();
  const { state } = useProcurement();
  const { data: currentUser } = useCurrentUser();
  const { data: serverDeadlines = [] } = useDeadlines();
  const { data: settings } = useSettings();
  const omniAssistant = useOmniAssistant();

  const slaWarningDays = settings?.slaWarningDays ?? 3;
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
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-3 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e8f2fc] text-[#0a4d8c] mb-3">
                <Sparkles size={18} />
              </div>
              <p className="text-xs font-semibold text-slate-800">
                Asisten AI PRIMA Siap Membantu
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Tanyakan data dokumen, pekerjaan, warkat, atau perintahkan aksi langsung dari halaman ini.
              </p>

              <div className="mt-4 w-full space-y-1.5">
                {QUICK_PROMPTS.map((q, idx) => (
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
