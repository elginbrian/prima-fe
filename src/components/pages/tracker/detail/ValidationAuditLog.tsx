import React from "react";
import {
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useValidationLogs } from "@/lib/query/hooks/procurement/useValidation";
import { Skeleton } from "@/components/ui/Skeleton";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { formatDateTimeIndo } from "@/lib/utils";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

interface ValidationAuditLogProps {
  requestId: string;
  router: AppRouterInstance;
}

export function ValidationAuditLog({ requestId, router }: ValidationAuditLogProps) {
  const { data: logs = [], isLoading } = useValidationLogs(requestId);

  if (!isLoading && logs.length === 0) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-[#0a4d8c] shrink-0" />
          <span>
            <strong className="font-medium text-slate-700">Riwayat Pemeriksaan Dokumen AI (0):</strong>{" "}
            Belum ada pemeriksaan AI tercatat pada pekerjaan ini.
          </span>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div>
          <h4 className="text-sm font-medium text-slate-800 flex items-center gap-2">
            <Sparkles size={15} className="text-[#0a4d8c]" />
            <span>Riwayat Pemeriksaan Dokumen AI</span>
          </h4>
          <p className="mt-0.5 text-xs text-slate-500">
            Rekam jejak hasil pemeriksaan checklist dan skor kelayakan dokumen pada pekerjaan ini.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-normal text-slate-600 border border-slate-200">
          {isLoading ? "Memuat..." : `${logs.length} pemeriksaan`}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : logs.length > 0 ? (
        <div className="space-y-3">
          {logs.map((log) => {
            const isPass = log.compliance_status === "Lulus Verifikasi";

            const statusBadge = isPass ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10px] font-normal text-[#0a4d8c]">
                <CheckCircle2 size={11} />
                Lulus Verifikasi
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[10px] font-normal text-slate-700">
                <AlertTriangle size={11} className="text-slate-500" />
                {log.compliance_status}
              </span>
            );

            return (
              <div
                key={log.id}
                className="rounded-xl border border-slate-200 bg-slate-50/30 p-4 transition hover:border-slate-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                      <FileCheck2 size={17} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] font-normal text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {log.id}
                        </span>
                        <span className="text-xs font-medium text-slate-800 truncate">
                          {log.document_name}
                        </span>
                        {log.profile_name && (
                          <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[10px] font-normal text-slate-500 border border-slate-200">
                            <ShieldCheck size={10} className="text-[#0a4d8c]" />
                            {log.profile_name}
                          </span>
                        )}
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                        <span>
                          Skor Kelayakan:{" "}
                          <span className="text-slate-700 font-medium">
                            {Math.round(log.overall_score)}/100
                          </span>{" "}
                          (Min. {Math.round(log.passing_score_threshold ?? 80)}%)
                        </span>
                        <span>•</span>
                        <span>
                          Checklist:{" "}
                          <span className="text-slate-700">
                            {log.passed_count} dari {log.checklist_count}
                          </span>{" "}
                          memenuhi
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1.5">
                          <span>Pemeriksa:</span>
                          <UserAvatar name={log.validated_by_name || "Admin"} size="xs" />
                          <span className="text-slate-700">{log.validated_by_name || "Admin"}</span>
                        </span>
                        <span>•</span>
                        <span>{formatDateTimeIndo(log.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between gap-2 shrink-0">
                    {statusBadge}
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard/documents/result?id=${log.id}`)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-normal text-slate-600 hover:border-[#0a4d8c] hover:text-[#0a4d8c] transition-colors"
                    >
                      <span>Buka Bukti Validasi</span>
                      <ExternalLink size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center">
          <p className="text-xs font-normal text-slate-500">
            Belum ada riwayat pemeriksaan AI untuk pekerjaan ini.
          </p>
        </div>
      )}
    </section>
  );
}
