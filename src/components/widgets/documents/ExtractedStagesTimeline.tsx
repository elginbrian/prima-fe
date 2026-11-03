"use client";

import { CheckCircle2, Clock, Sparkles, Building2, Wallet, Layers } from "lucide-react";
import type { ExtractedProject } from "@/types/validation";
import { formatRupiah } from "@/lib/utils";

interface ExtractedStagesTimelineProps {
  project: ExtractedProject;
}

export function ExtractedStagesTimeline({ project }: ExtractedStagesTimelineProps) {
  const stages = project.stages || [];
  const autoClearedCount = stages.filter((s) => s.auto_cleared).length;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Sparkles size={15} className="text-[#0a4d8c]" />
            Ekstraksi Proyek & Tahapan Pekerjaan
          </h3>
          <p className="text-xs font-normal text-slate-500">
            AI memetakan pekerjaan dan mengidentifikasi tahapan yang otomatis terpenuhi
          </p>
        </div>
        {autoClearedCount > 0 && (
          <span className="text-xs font-normal text-[#0a4d8c] bg-[#e8f2fc] px-3 py-1 rounded-full border border-[#0a4d8c]/20 flex items-center gap-1.5 self-start md:self-auto">
            <CheckCircle2 size={13} className="text-[#0a4d8c]" />
            {autoClearedCount} Tahap Selesai Otomatis
          </span>
        )}
      </div>

      {/* Project Meta Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-1">
          <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Layers size={11} className="text-[#0a4d8c]" />
            Judul Proyek
          </div>
          <div className="text-xs font-medium text-slate-800 break-words">
            {project.title}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-1">
          <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Wallet size={11} className="text-[#0a4d8c]" />
            Estimasi Nilai / HPS
          </div>
          <div className="text-xs font-medium text-[#0a4d8c]">
            {project.estimated_amount > 0
              ? formatRupiah(project.estimated_amount)
              : "Sesuai Pagu KAK"}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-1">
          <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Building2 size={11} className="text-[#0a4d8c]" />
            Metode & Fungsi
          </div>
          <div className="text-xs font-medium text-slate-800">
            {project.suggested_method} ·{" "}
            <span className="text-slate-500 font-normal">
              {project.department_name}
            </span>
          </div>
        </div>
      </div>

      {/* Stages Stepper */}
      <div className="space-y-3 pt-1">
        <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
          Alur Tahapan Pekerjaan ({stages.length} Tahapan)
        </div>

        <div className="space-y-2">
          {stages.map((stage, idx) => {
            const isDone = stage.status === "Done" || stage.auto_cleared;
            const isInProgress = stage.status === "In Progress";

            return (
              <div
                key={idx}
                className={`flex items-start gap-3 p-3.5 rounded-lg border transition-all ${
                  stage.auto_cleared
                    ? "border-slate-200 bg-slate-50/70"
                    : isInProgress
                    ? "border-[#0a4d8c] bg-[#f4f8fd]"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="pt-0.5 shrink-0">
                  {stage.auto_cleared || isDone ? (
                    <div className="h-6 w-6 rounded-full bg-[#e8f2fc] text-[#0a4d8c] flex items-center justify-center text-xs">
                      <CheckCircle2 size={14} />
                    </div>
                  ) : isInProgress ? (
                    <div className="h-6 w-6 rounded-full bg-[#0a4d8c] text-white flex items-center justify-center text-xs">
                      <Clock size={13} />
                    </div>
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-normal text-xs">
                      {idx + 1}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-800 break-words">
                      {stage.step}
                    </span>
                    <div>
                      {stage.auto_cleared ? (
                        <span className="text-[10px] font-normal text-[#0a4d8c] bg-[#e8f2fc] px-2.5 py-0.5 rounded-full border border-[#0a4d8c]/20 flex items-center gap-1">
                          <Sparkles size={10} />
                          Selesai Otomatis
                        </span>
                      ) : isInProgress ? (
                        <span className="text-[10px] font-normal text-white bg-[#0a4d8c] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Clock size={10} />
                          Tahap Aktif
                        </span>
                      ) : (
                        <span className="text-[10px] font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          Menunggu
                        </span>
                      )}
                    </div>
                  </div>
                  {stage.notes && (
                    <p className="text-[11px] font-normal text-slate-500">
                      {stage.notes}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
