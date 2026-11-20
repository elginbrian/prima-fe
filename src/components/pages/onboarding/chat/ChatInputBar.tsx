"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Zap } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

interface ChatInputBarProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInputBar({ onSend, disabled = false }: ChatInputBarProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [text]);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
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

  return (
    <div className="border-t border-slate-200/80 bg-white/85 backdrop-blur-md px-4 py-3 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-xs transition focus-within:border-[#0a4d8c] focus-within:ring-3 focus-within:ring-[#0a4d8c]/12">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            disabled={disabled}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pertanyaan atau perintah untuk PRIMA AI..."
            className="max-h-32 min-h-[24px] flex-1 resize-none bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-60"
          />

          <div className="flex items-center gap-2 shrink-0">
            <span
              className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-[#0a4d8c]/20 bg-[#e8f2fc] px-2 py-1 text-[10px] font-semibold text-[#0a4d8c]"
              title="Dikunci pada Mode Cekatan untuk respons cepat"
            >
              <Zap size={10} />
              Cekatan
            </span>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!text.trim() || disabled}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#0a4d8c] text-white shadow-2xs transition hover:!bg-[#083b6c] disabled:opacity-40"
              aria-label="Kirim pesan"
            >
              {disabled ? (
                <Spinner size="xs" className="border-white border-t-transparent" />
              ) : (
                <Send size={14} />
              )}
            </button>
          </div>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-slate-400">
          PRIMA AI terhubung langsung dengan data pekerjaan, dokumen, warkat jaminan, dan SLA secara real-time.
        </p>
      </div>
    </div>
  );
}
