"use client";

import type { OmniAssistantResponseDto } from "@/lib/api";

export interface AiChatAttachmentMeta {
  name: string;
  size: number;
  type: string;
}

export interface AiChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  status?: "sending" | "done" | "error";
  attachment?: AiChatAttachmentMeta | null;
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

// In-memory bridge so an attachment uploaded in /dashboard/onboarding search bar
// is seamlessly consumed when redirecting to /dashboard/onboarding/chat/[chatId]
const pendingSessionFiles = new Map<string, File>();

// Last uploaded file in chat so user can 1-click route it to Document Validation or Guarantee OCR without re-uploading
let lastChatUploadedFile: File | null = null;
let pendingSmartRoutedFile: File | null = null;

export function setPendingChatAttachment(chatId: string, file: File): void {
  pendingSessionFiles.set(chatId, file);
  lastChatUploadedFile = file;
}

export function consumePendingChatAttachment(chatId: string): File | null {
  const f = pendingSessionFiles.get(chatId) ?? null;
  if (f) {
    pendingSessionFiles.delete(chatId);
    lastChatUploadedFile = f;
  }
  return f;
}

export function rememberChatUploadedFile(file: File | null | undefined): void {
  if (file) {
    lastChatUploadedFile = file;
  }
}

export function getLastChatUploadedFile(): File | null {
  return lastChatUploadedFile;
}

export function stageFileForSmartUpload(file: File): void {
  pendingSmartRoutedFile = file;
}

export function consumeSmartUploadFile(): File | null {
  const f = pendingSmartRoutedFile;
  pendingSmartRoutedFile = null;
  return f;
}

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

export function buildTitleFromPrompt(
  prompt: string,
  attachmentName?: string
): string {
  const clean = prompt.trim().replace(/\s+/g, " ");
  if (!clean && attachmentName) {
    return `Analisis: ${attachmentName}`.slice(0, 48);
  }
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
  customId?: string,
  initialFile?: File | null
): AiChatSession {
  const now = new Date().toISOString();
  const id = customId || generateChatId();
  const effectiveText =
    initialPrompt?.trim() ||
    (initialFile ? `Analisis berkas ${initialFile.name}` : "");

  const initialMessages: AiChatMessage[] = effectiveText
    ? [
        {
          id: generateMessageId(),
          role: "user",
          content: effectiveText,
          createdAt: now,
          status: "done",
          attachment: initialFile
            ? {
                name: initialFile.name,
                size: initialFile.size,
                type: initialFile.type || "application/octet-stream",
              }
            : null,
        },
      ]
    : [];

  if (initialFile) {
    setPendingChatAttachment(id, initialFile);
  }

  const newSession: AiChatSession = {
    id,
    title:
      initialPrompt || initialFile
        ? buildTitleFromPrompt(initialPrompt || "", initialFile?.name)
        : "Diskusi AI Baru",
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
  pendingSessionFiles.delete(chatId);
  const next = safeReadSessions().filter((s) => s.id !== chatId);
  safeWriteSessions(next);
  return next;
}
