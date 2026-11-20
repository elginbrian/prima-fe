"use client";

import Link from "next/link";
import { ArrowLeft, FileSearch } from "lucide-react";

interface NotFoundViewProps {
  /** Compact variant used inside DashboardLayout where sidebar & header already exist */
  embedded?: boolean;
}

export function NotFoundView({ embedded = false }: NotFoundViewProps) {
  const card = (
    <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white px-7 py-8 text-center shadow-xs">
      <h1 className="mt-1.5 text-lg font-semibold tracking-tight text-slate-900">
        Halaman Tidak Ditemukan
      </h1>

      <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
        Alamat yang Anda tuju tidak tersedia atau telah dipindahkan.
      </p>

      <div className="mt-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0a4d8c] px-5 py-2.5 text-xs font-medium text-white shadow-2xs transition hover:!bg-[#083b6c]"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Dashboard</span>
        </Link>
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div className="flex min-h-[calc(100vh-160px)] items-center justify-center px-4 py-8">
        {card}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f4f7fb] px-4 py-8 text-slate-900">
      <img
        src="/pertamina-full.png"
        alt="Pertamina"
        className="mb-6 h-7 w-auto object-contain"
      />
      {card}
    </div>
  );
}
