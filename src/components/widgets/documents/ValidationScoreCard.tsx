"use client";

import { CheckCircle2, AlertTriangle, FileText, ExternalLink } from "lucide-react";
import type { ComplianceStatus } from "@/types/validation";
import { formatDateIndo } from "@/lib/utils";

interface ValidationScoreCardProps {
  score: number;
  threshold: number;
  status: ComplianceStatus;
  summary: string;
  documentName: string;
  profileName?: string | null;
  validationId?: string;
  createdAt?: string;
  fileUrl?: string | null;
}

export function ValidationScoreCard({
  score,
  threshold,
  status,
  summary,
  documentName,
  profileName,
  validationId,
  createdAt,
  fileUrl,
}: ValidationScoreCardProps) {
  const statusConfig = {
    "Lulus Verifikasi": {
      bgColor: "bg-slate-100 border-slate-200 text-slate-700",
      icon: CheckCircle2,
      label: "Lulus Verifikasi",
    },
    "Catatan Procurement": {
      bgColor: "bg-[#e8f2fc] border-[#0a4d8c]/20 text-[#0a4d8c]",
      icon: AlertTriangle,
      label: "Catatan Procurement",
    },
    "Perlu Perbaikan": {
      bgColor: "bg-[#0a4d8c] border-[#0a4d8c] text-white",
      icon: AlertTriangle,
      label: "Perlu Perbaikan",
    },
  }[status] ?? {
    bgColor: "bg-slate-100 border-slate-200 text-slate-700",
    icon: AlertTriangle,
    label: status,
  };

  const IconComponent = statusConfig.icon;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="space-y-1 min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <FileText size={13} className="text-[#0a4d8c]" />
            Hasil Analisis Kelayakan Dokumen
          </div>
          <h2 className="text-lg font-semibold text-slate-900 break-words">
            {documentName}
          </h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-normal text-slate-500 pt-0.5">
            {profileName && (
              <span>
                Acuan Standar:{" "}
                <span className="font-medium text-slate-700">{profileName}</span>
              </span>
            )}
            {validationId && (
              <span>
                ID: <span className="font-mono text-slate-700">{validationId}</span>
              </span>
            )}
            {createdAt && <span>Waktu: {formatDateIndo(createdAt)}</span>}
            {fileUrl && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-medium text-[#0a4d8c] hover:underline"
              >
                <span>Buka Berkas Asli</span>
                <ExternalLink size={11} />
              </a>
            )}
          </div>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className={`px-3.5 py-1.5 rounded-full border flex items-center gap-1.5 font-medium text-xs ${statusConfig.bgColor}`}
          >
            <IconComponent size={15} className="shrink-0" />
            <span>{statusConfig.label}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Score Box */}
        <div className="md:col-span-1 rounded-xl border border-[#0a4d8c]/20 bg-[#f4f8fd] p-4 flex flex-col items-center justify-center text-center space-y-1">
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#0a4d8c]">
            Skor Kepatuhan
          </div>
          <div className="text-3xl font-semibold text-[#0a4d8c] tracking-tight">
            {Math.round(score)}
            <span className="text-base font-normal text-slate-400">/100</span>
          </div>
          <div className="text-[11px] text-slate-500 font-normal pt-0.5">
            Ambang Batas:{" "}
            <span className="font-medium text-slate-700">{threshold}%</span>
          </div>
        </div>

        {/* Summary Description Box */}
        <div className="md:col-span-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 flex flex-col justify-center space-y-1.5">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Ringkasan Evaluasi AI
          </div>
          <p className="text-xs font-normal text-slate-700 leading-relaxed break-words">
            {summary}
          </p>
        </div>
      </div>
    </div>
  );
}
