"use client";

import Image from "next/image";

interface LogoutModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function LogoutModal({ isOpen, onCancel, onConfirm }: LogoutModalProps) {
  if (!isOpen) return null;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4"
      onClick={onCancel}
    >
      {/* Card */}
      <div
        className="relative w-full max-w-[380px] rounded-3xl bg-white shadow-[0_24px_60px_rgba(10,77,140,0.18)] p-7 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200"
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
        <h2 className="text-[1.15rem] font-bold text-slate-800 leading-snug">
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
    </div>
  );
}
