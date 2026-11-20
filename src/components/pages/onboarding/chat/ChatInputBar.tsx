"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, FileText, X } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { AiModeDropdown } from "./AiModeDropdown";

interface ChatInputBarProps {
  onSend: (message: string, attachment?: File | null) => void;
  disabled?: boolean;
}

const ACCEPTED_FILE_TYPES =
  ".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.webp";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ChatInputBar({ onSend, disabled = false }: ChatInputBarProps) {
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [text]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Strictly max 1 attachment: selecting a new file replaces the previous one
      setAttachment(file);
    }
    e.target.value = "";
  };

  const handleSubmit = () => {
    const trimmed = text.trim();
    if ((!trimmed && !attachment) || disabled) return;
    const messageToSend =
      trimmed || (attachment ? `Analisis berkas ${attachment.name}` : "");
    onSend(messageToSend, attachment);
    setText("");
    setAttachment(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = (Boolean(text.trim()) || Boolean(attachment)) && !disabled;

  return (
    <div className="border-t border-slate-200/80 bg-white/85 backdrop-blur-md px-4 py-3 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-xs transition focus-within:border-[#0a4d8c] focus-within:ring-3 focus-within:ring-[#0a4d8c]/12">
          {/* Selected Attachment Preview Pill (Max 1) */}
          {attachment && (
            <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-[#0a4d8c]/20 bg-[#f4f8fd] px-3 py-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={14} className="shrink-0 text-[#0a4d8c]" />
                <span className="truncate text-xs font-medium text-slate-800">
                  {attachment.name}
                </span>
                <span className="shrink-0 text-[10px] text-slate-400">
                  ({formatFileSize(attachment.size)})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="shrink-0 rounded-md p-0.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700"
                title="Hapus lampiran"
                aria-label="Hapus lampiran"
              >
                <X size={13} />
              </button>
            </div>
          )}

          <div className="flex items-end gap-2">
            {/* Hidden file input (max 1 file) */}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_FILE_TYPES}
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              disabled={disabled}
              onClick={() => fileInputRef.current?.click()}
              className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition focus:outline-none ${
                attachment
                  ? "border-[#0a4d8c]/30 bg-[#e8f2fc] text-[#0a4d8c]"
                  : "border-slate-200 bg-slate-50 text-slate-500 hover:border-[#0a4d8c]/30 hover:bg-[#e8f2fc] hover:text-[#0a4d8c]"
              }`}
              title={
                attachment
                  ? `Ganti lampiran (${attachment.name}) — Maks. 1 berkas`
                  : "Unggah 1 berkas lampiran (PDF, DOCX, Excel, Gambar)"
              }
              aria-label="Unggah lampiran"
            >
              <Paperclip size={14} />
            </button>

            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              disabled={disabled}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                attachment
                  ? "Tanyakan sesuatu atau beri perintah terkait berkas ini..."
                  : "Ketik pertanyaan atau perintah untuk PRIMA AI..."
              }
              className="max-h-32 min-h-[28px] py-1 flex-1 resize-none bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-60"
            />

            <div className="flex items-center gap-1.5 shrink-0">
              <AiModeDropdown compact direction="up" />

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSend}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#0a4d8c] text-white shadow-2xs transition hover:!bg-[#083b6c] disabled:opacity-40"
                aria-label="Kirim pesan"
              >
                {disabled ? (
                  <Spinner
                    size="xs"
                    className="border-white border-t-transparent"
                  />
                ) : (
                  <Send size={14} />
                )}
              </button>
            </div>
          </div>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-slate-400">
          Mendukung maks. 1 lampiran dokumen per pesan · Terhubung real-time dengan data PRIMA.
        </p>
      </div>
    </div>
  );
}
