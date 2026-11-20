"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  History,
  Zap,
  Cpu,
  Menu,
} from "lucide-react";
import {
  type AiChatSession,
  type AiChatMessage,
  getAllChatSessions,
  getChatSessionById,
  createChatSession,
  upsertChatSession,
  deleteChatSession,
  generateMessageId,
  buildTitleFromPrompt,
  consumePendingChatAttachment,
  rememberChatUploadedFile,
} from "@/lib/aiChatStore";
import { useOmniAssistant } from "@/lib/query/hooks/ai/useOmniAssistant";
import {
  useCurrentUser,
  useLogout,
} from "@/lib/query/hooks/auth/useCurrentUser";
import { useSidebar } from "@/context/SidebarContext";
import { UserProfileBean } from "@/components/layout/UserProfileBean";
import { useDeadlines } from "@/lib/query/hooks/procurement/useProcurement";
import { useSettings } from "@/lib/query/hooks/settings/useSettings";
import { useChatAiMode } from "@/lib/query/hooks/settings/useIntegrations";
import { useProcurement } from "@/context/ProcurementContext";
import { getDeadlineTiming } from "@/lib/deadlineUtils";
import { getErrorMessage } from "@/lib/api/errors";
import { SLAActionModal } from "@/components/widgets/modals/SLAActionModal";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { ChatInputBar } from "./ChatInputBar";
import { ChatHistorySidebar } from "./ChatHistorySidebar";
import type { DeadlineItem } from "@/types";
import type { OmniChatHistoryTurnDto } from "@/lib/api";

const STARTER_SUGGESTIONS = [
  "Pekerjaan mana saja yang SLA-nya sedang terlambat?",
  "Dokumen mana yang skor analisis AI-nya paling rendah?",
  "Warkat jaminan apa yang masa berlakunya paling cepat habis?",
  "Jalankan evaluasi dan sinkronisasi seluruh SLA sekarang",
];

interface AiChatWorkspaceProps {
  chatId: string;
}

export default function AiChatWorkspace({ chatId }: AiChatWorkspaceProps) {
  const router = useRouter();
  const { state } = useProcurement();
  const { setMobileOpen } = useSidebar();
  const { data: currentUser } = useCurrentUser();
  const logout = useLogout();
  const { data: serverDeadlines = [] } = useDeadlines();
  const { data: settings } = useSettings();
  const {
    activeMode: activeChatMode,
    isCustom: isCustomChat,
    label: chatCustomLabel,
  } = useChatAiMode();
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
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [selectedSlaModal, setSelectedSlaModal] = useState<DeadlineItem | null>(
    null
  );

  const messagesStreamRef = useRef<HTMLDivElement>(null);
  const autoTriggeredRef = useRef<string | null>(null);

  const scrollToBottom = useCallback(() => {
    const el = messagesStreamRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
  }, []);

  // Load session & session list on mount or chatId change
  useEffect(() => {
    let target = getChatSessionById(chatId);
    if (!target) {
      target = createChatSession(undefined, chatId);
    }
    setCurrentSession(target);
    setSessions(getAllChatSessions());
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages.length, scrollToBottom]);

  // Execute AI query for a given user message
  const triggerAiReply = useCallback(
    async (
      sessionSnapshot: AiChatSession,
      userQueryText: string,
      attachmentFile?: File | null
    ) => {
      const assistantPlaceholderId = generateMessageId();
      const placeholderMsg: AiChatMessage = {
        id: assistantPlaceholderId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
        status: "sending",
      };

      const withPlaceholder: AiChatSession = {
        ...sessionSnapshot,
        title:
          sessionSnapshot.title === "Diskusi AI Baru"
            ? buildTitleFromPrompt(userQueryText, attachmentFile?.name)
            : sessionSnapshot.title,
        messages: [...sessionSnapshot.messages, placeholderMsg],
      };

      setCurrentSession(withPlaceholder);
      upsertChatSession(withPlaceholder);
      setSessions(getAllChatSessions());

      // Build multi-turn history excluding the last user message and placeholder
      const historyTurns: OmniChatHistoryTurnDto[] = sessionSnapshot.messages
        .slice(0, -1)
        .filter((m) => m.status === "done" && m.content.trim().length > 0)
        .slice(-8)
        .map((m) => ({
          role: m.role,
          content: m.aiData?.answer || m.content,
        }));

      try {
        const res = await omniAssistant.mutateAsync({
          query: userQueryText,
          history: historyTurns,
          file: attachmentFile,
          aiTier: activeChatMode,
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
        setSessions(getAllChatSessions());
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
        setSessions(getAllChatSessions());
      }
    },
    [omniAssistant, activeChatMode]
  );

  // If session was just created from /dashboard/onboarding Omni-Search with 1 user message and no AI reply yet, auto-trigger AI!
  useEffect(() => {
    if (!currentSession) return;
    if (
      currentSession.messages.length === 1 &&
      currentSession.messages[0].role === "user" &&
      autoTriggeredRef.current !== currentSession.id
    ) {
      autoTriggeredRef.current = currentSession.id;
      const pendingFile = consumePendingChatAttachment(currentSession.id);
      triggerAiReply(
        currentSession,
        currentSession.messages[0].content,
        pendingFile
      );
    }
  }, [currentSession, triggerAiReply]);

  const handleSendMessage = (text: string, attachmentFile?: File | null) => {
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

    const updatedSession: AiChatSession = {
      ...currentSession,
      title:
        currentSession.messages.length === 0
          ? buildTitleFromPrompt(text, attachmentFile?.name)
          : currentSession.title,
      messages: [...currentSession.messages, userMsg],
    };

    triggerAiReply(updatedSession, text, attachmentFile);
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
    setSessions(getAllChatSessions());
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
    setSessions(getAllChatSessions());
  };

  const handleNewChat = () => {
    const created = createChatSession();
    setSessions(getAllChatSessions());
    router.push(`/dashboard/onboarding/chat/${encodeURIComponent(created.id)}`);
  };

  const handleDeleteSession = (idToDelete: string) => {
    const remaining = deleteChatSession(idToDelete);
    setSessions(remaining);
    if (idToDelete === chatId) {
      if (remaining.length > 0) {
        router.push(
          `/dashboard/onboarding/chat/${encodeURIComponent(remaining[0].id)}`
        );
      } else {
        const fresh = createChatSession();
        setSessions(getAllChatSessions());
        router.push(
          `/dashboard/onboarding/chat/${encodeURIComponent(fresh.id)}`
        );
      }
    }
  };

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-[#f4f7fb]">
      {/* Animated Blue Shades Background */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="animate-blue-shade-1 absolute -top-24 -left-20 h-[400px] w-[400px] rounded-full bg-[#0a4d8c]/10 blur-[95px]" />
        <div className="animate-blue-shade-2 absolute top-1/3 right-48 h-[420px] w-[420px] rounded-full bg-blue-400/12 blur-[110px]" />
        <div className="animate-blue-shade-3 absolute -bottom-28 left-1/4 h-[360px] w-[420px] rounded-full bg-[#1565c0]/10 blur-[100px]" />
      </div>

      {/* Left/Center Main Chat Column */}
      <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col h-full">
        {/* Top Bar of Center Column: Title + Mode Cekatan on Left, User Bean on Right */}
        <div className="flex h-[76px] shrink-0 items-center justify-between gap-3 border-b border-slate-200/70 bg-white/80 backdrop-blur-md px-4 sm:px-6">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 lg:hidden"
            >
              <Menu size={16} />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-xs sm:text-sm font-semibold text-slate-900">
                  {currentSession?.title || "Diskusi AI"}
                </h1>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#0a4d8c]/20 bg-[#e8f2fc] px-2 py-0.5 text-[10px] font-semibold text-[#0a4d8c]">
                  {isCustomChat ? <Cpu size={9} /> : <Zap size={9} />}
                  {isCustomChat
                    ? `Custom · ${chatCustomLabel}`
                    : `Mode ${chatCustomLabel}`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setMobileHistoryOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 lg:hidden"
            >
              <History size={14} className="text-[#0a4d8c]" />
              <span>Riwayat</span>
            </button>

            <UserProfileBean
              userName={currentUser?.name ?? "—"}
              userRole={currentUser?.role ?? "—"}
              userAvatarUrl={currentUser?.avatar_url}
              onLogout={logout}
            />
          </div>
        </div>

        {/* Scrollable Message Stream */}
        <div
          ref={messagesStreamRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 sm:px-6 scrollbar-thin"
        >
          <div className="mx-auto max-w-3xl space-y-5">
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
              /* Empty Session Starter View */
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0a4d8c] text-white shadow-sm mb-3">
                  <Sparkles size={20} />
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                  Diskusi AI PRIMA
                </h2>
                <p className="mt-1 max-w-md text-xs text-slate-500">
                  Tanyakan apa saja terkait dokumen, hasil analisis AI, pekerjaan pengadaan, warkat jaminan, atau berikan perintah langsung.
                </p>

                <div className="mt-6 grid w-full max-w-xl grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {STARTER_SUGGESTIONS.map((starter, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(starter)}
                      className="rounded-xl border border-slate-200 bg-white p-3 text-left text-xs font-medium text-slate-700 shadow-2xs transition hover:border-[#0a4d8c]/40 hover:bg-[#f8fbff] hover:text-[#0a4d8c]"
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Bottom Text Bar */}
        <ChatInputBar
          onSend={handleSendMessage}
          disabled={omniAssistant.isPending}
        />
      </div>

      {/* Right History Sidebar */}
      <div className="relative z-10 h-full">
        <ChatHistorySidebar
          sessions={sessions}
          activeChatId={chatId}
          onSelectSession={(id) =>
            router.push(`/dashboard/onboarding/chat/${encodeURIComponent(id)}`)
          }
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
          mobileOpen={mobileHistoryOpen}
          onCloseMobile={() => setMobileHistoryOpen(false)}
        />
      </div>

      {/* SLA Action Modal */}
      {selectedSlaModal && (
        <SLAActionModal
          deadline={selectedSlaModal}
          onClose={() => setSelectedSlaModal(null)}
        />
      )}
    </div>
  );
}
