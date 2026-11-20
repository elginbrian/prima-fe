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
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={16} className="text-[#0a4d8c] shrink-0" />
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 break-words">
              {documentName}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-normal text-slate-500">
            {profileName && (
              <span>
                Acuan:{" "}
                <span className="font-medium text-slate-700">{profileName}</span>
              </span>
            )}
            {validationId && (
              <span>
                ID: <span className="font-mono text-slate-700">{validationId}</span>
              </span>
            )}
            {createdAt && <span>{formatDateIndo(createdAt)}</span>}
            {fileUrl && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-medium text-[#0a4d8c] hover:underline"
              >
                <span>Berkas Asli</span>
                <ExternalLink size={11} />
              </a>
            )}
          </div>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className={`px-3 py-1 rounded-full border flex items-center gap-1.5 font-medium text-xs ${statusConfig.bgColor}`}
          >
            <IconComponent size={14} className="shrink-0" />
            <span>{statusConfig.label}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Compact Score Block */}
        <div className="md:col-span-3 flex items-center md:flex-col md:items-start justify-between md:justify-center gap-2 md:border-r md:border-slate-100 md:pr-4">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Skor Kepatuhan
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-[#0a4d8c] tracking-tight">
              {Math.round(score)}
              <span className="text-sm font-normal text-slate-400">/100</span>
            </span>
            <span className="text-[11px] text-slate-500 font-normal">
              (Min. {threshold}%)
            </span>
          </div>
        </div>

        {/* Clean Summary Block */}
        <div className="md:col-span-9 space-y-1">
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
