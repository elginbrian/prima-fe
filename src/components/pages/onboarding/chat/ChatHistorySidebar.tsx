"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  MessageSquare,
  Trash2,
  Search,
  History,
  X,
} from "lucide-react";
import type { AiChatSession } from "@/lib/aiChatStore";
import { formatDateIndo } from "@/lib/utils";

interface ChatHistorySidebarProps {
  sessions: AiChatSession[];
  activeChatId: string;
  onSelectSession: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (chatId: string) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function ChatHistorySidebar({
  sessions,
  activeChatId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  mobileOpen = false,
  onCloseMobile,
}: ChatHistorySidebarProps) {
  const [filterText, setFilterText] = useState("");

  const filteredSessions = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [sessions, filterText]);

  const content = (
    <div className="flex h-full flex-col bg-white">
      {/* Top Header & New Chat Button */}
      <div className="border-b border-slate-200/80 p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
            <History size={14} className="text-[#0a4d8c]" />
            <span>Riwayat Diskusi AI</span>
          </div>
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            onNewChat();
            onCloseMobile?.();
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#0a4d8c] px-3 py-2 text-xs font-semibold text-white shadow-2xs transition hover:!bg-[#083b6c]"
        >
          <Plus size={14} />
          <span>Diskusi Baru</span>
        </button>

        {/* Search Filter inside History */}
        {sessions.length > 2 && (
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5">
            <Search size={12} className="text-slate-400 shrink-0" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Cari riwayat chat..."
              className="w-full bg-transparent text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1 scrollbar-thin">
        {filteredSessions.length > 0 ? (
          filteredSessions.map((session) => {
            const isActive = session.id === activeChatId;
            const msgCount = session.messages.length;

            return (
              <div
                key={session.id}
                className={`group relative flex items-start justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition cursor-pointer ${
                  isActive
                    ? "bg-[#e8f2fc] text-[#0a4d8c]"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
                onClick={() => {
                  onSelectSession(session.id);
                  onCloseMobile?.();
                }}
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <MessageSquare
                    size={14}
                    className={`mt-0.5 shrink-0 ${
                      isActive ? "text-[#0a4d8c]" : "text-slate-400"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-xs ${
                        isActive
                          ? "font-semibold text-[#0a4d8c]"
                          : "font-medium text-slate-800"
                      }`}
                    >
                      {session.title}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {formatDateIndo(session.updatedAt)} · {msgCount} pesan
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 rounded-md p-1 text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 transition-opacity shrink-0"
                  title="Hapus riwayat ini"
                  aria-label="Hapus riwayat diskusi"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })
        ) : (
          <div className="py-10 px-4 text-center">
            <MessageSquare size={22} className="mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-medium text-slate-600">
              Belum ada riwayat diskusi
            </p>
            <p className="mt-0.5 text-[10px] text-slate-400">
              Mulai percakapan baru dengan PRIMA AI.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Right Sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 border-l border-slate-200/90 bg-white h-full">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 w-72 h-full shadow-2xl">{content}</div>
        </div>
      )}
    </>
  );
}
