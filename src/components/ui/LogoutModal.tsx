"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface LogoutModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function LogoutModal({ isOpen, onCancel, onConfirm }: LogoutModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    // Backdrop covering entire viewport
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 animate-in fade-in duration-200"
      onClick={onCancel}
    >
      {/* Card centered in viewport */}
      <div
        className="relative w-full max-w-[400px] rounded-3xl bg-white shadow-2xl border border-slate-100 p-7 flex flex-col items-center text-center animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Illustration */}
        <div className="mb-5">
          <Image
            src="/logout-image.svg"
            width={130}
            height={100}
            alt="Keluar dari aplikasi"
            className="mx-auto"
          />
        </div>

        {/* Text */}
        <h2 className="text-[1.2rem] font-bold text-slate-800 leading-snug">
          Apakah Anda yakin ingin keluar?
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Sesi Anda akan diakhiri dan Anda perlu masuk kembali.
        </p>

        {/* Actions */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3 w-full">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-300"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-red-200 transition hover:bg-red-700 active:scale-[0.97]"
          >
            Ya, Keluar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
