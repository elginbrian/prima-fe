"use client";

import type { OmniAssistantResponseDto } from "@/lib/api";

export interface AiChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  status?: "sending" | "done" | "error";
  aiData?: OmniAssistantResponseDto | null;
  errorMessage?: string | null;
  commandExecuted?: boolean;
}

export interface AiChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: AiChatMessage[];
}

const STORAGE_KEY = "prima_ai_chat_sessions_v1";

function safeReadSessions(): AiChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWriteSessions(sessions: AiChatSession[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, 60)));
    window.dispatchEvent(new CustomEvent("prima-ai-chat-updated"));
  } catch {
    // ignore storage quota errors
  }
}

export function generateChatId(): string {
  const rand = Math.random().toString(36).substring(2, 8);
  const ts = Date.now().toString(36).slice(-4);
  return `chat-${ts}${rand}`;
}

export function generateMessageId(): string {
  return `msg-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
}

export function buildTitleFromPrompt(prompt: string): string {
  const clean = prompt.trim().replace(/\s+/g, " ");
  if (!clean) return "Diskusi AI Baru";
  return clean.length > 48 ? `${clean.slice(0, 48)}...` : clean;
}

export function getAllChatSessions(): AiChatSession[] {
  return safeReadSessions().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function getChatSessionById(chatId: string): AiChatSession | null {
  const sessions = safeReadSessions();
  return sessions.find((s) => s.id === chatId) ?? null;
}

export function createChatSession(
  initialPrompt?: string,
  customId?: string
): AiChatSession {
  const now = new Date().toISOString();
  const id = customId || generateChatId();
  const initialMessages: AiChatMessage[] = initialPrompt?.trim()
    ? [
        {
          id: generateMessageId(),
          role: "user",
          content: initialPrompt.trim(),
          createdAt: now,
          status: "done",
        },
      ]
    : [];

  const newSession: AiChatSession = {
    id,
    title: initialPrompt ? buildTitleFromPrompt(initialPrompt) : "Diskusi AI Baru",
    createdAt: now,
    updatedAt: now,
    messages: initialMessages,
  };

  const existing = safeReadSessions().filter((s) => s.id !== id);
  safeWriteSessions([newSession, ...existing]);
  return newSession;
}

export function upsertChatSession(session: AiChatSession): void {
  const existing = safeReadSessions().filter((s) => s.id !== session.id);
  safeWriteSessions([
    { ...session, updatedAt: new Date().toISOString() },
    ...existing,
  ]);
}

export function deleteChatSession(chatId: string): AiChatSession[] {
  const next = safeReadSessions().filter((s) => s.id !== chatId);
  safeWriteSessions(next);
  return next;
}
