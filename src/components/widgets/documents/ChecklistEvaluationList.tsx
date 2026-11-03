"use client";

import { CheckCircle2, AlertTriangle, XCircle, Quote } from "lucide-react";
import type { ChecklistItemResult } from "@/types/validation";

interface ChecklistEvaluationListProps {
  evaluations: ChecklistItemResult[];
}

export function ChecklistEvaluationList({
  evaluations,
}: ChecklistEvaluationListProps) {
  if (!evaluations || evaluations.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-xs font-normal text-slate-500">
        Tidak ada evaluasi checklist untuk ditampilkan.
      </div>
    );
  }

  const passedCount = evaluations.filter((e) => e.status === "Memenuhi").length;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            Evaluasi Butir Kriteria Dokumen
          </h3>
          <p className="text-xs font-normal text-slate-500">
            Hasil pemeriksaan per butir checklist terhadap isi dokumen
          </p>
        </div>
        <div className="text-xs font-normal text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
          {passedCount} dari {evaluations.length} Memenuhi
        </div>
      </div>

      <div className="space-y-3">
        {evaluations.map((item, idx) => {
          const isPassed = item.status === "Memenuhi";
          const isFailed = item.status === "Tidak Memenuhi";

          const statusBadge = isPassed ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-normal text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              <CheckCircle2 size={12} className="text-[#0a4d8c]" />
              Memenuhi
            </span>
          ) : isFailed ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-normal text-white bg-[#0a4d8c] px-2.5 py-0.5 rounded-full border border-[#0a4d8c]">
              <XCircle size={12} />
              Tidak Memenuhi
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-normal text-[#0a4d8c] bg-[#e8f2fc] px-2.5 py-0.5 rounded-full border border-[#0a4d8c]/20">
              <AlertTriangle size={12} />
              Perlu Perhatian
            </span>
          );

          return (
            <div
              key={idx}
              className={`rounded-lg border p-4 transition-all space-y-2.5 ${
                isFailed
                  ? "border-[#0a4d8c]/30 bg-[#f4f8fd]"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start sm:items-center gap-2">
                  <span className="text-xs font-normal text-slate-400">
                    #{idx + 1}
                  </span>
                  <span className="text-xs font-medium text-slate-800 break-words">
                    {item.item}
                  </span>
                  {item.is_mandatory && (
                    <span className="text-[10px] font-normal px-2 py-0.5 rounded-full border bg-[#e8f2fc] text-[#0a4d8c] border-[#0a4d8c]/20 shrink-0">
                      Wajib
                    </span>
                  )}
                </div>
                <div className="shrink-0">{statusBadge}</div>
              </div>

              {/* Evidence Quote from Document */}
              {item.evidence_quote ? (
                <div className="rounded-r-lg border-l-2 border-[#0a4d8c] bg-slate-50 p-3 space-y-1">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-[#0a4d8c] flex items-center gap-1">
                    <Quote size={11} />
                    Kutipan Bukti Dokumen
                  </div>
                  <p className="text-xs font-normal text-slate-700 italic leading-relaxed break-words">
                    &ldquo;{item.evidence_quote}&rdquo;
                  </p>
                </div>
              ) : (
                isFailed && (
                  <div className="text-[11px] font-normal text-slate-600 bg-white rounded px-2.5 py-1.5 border border-slate-200 italic">
                    Bukti pemenuhan kriteria ini belum ditemukan di dalam naskah dokumen yang diunggah.
                  </div>
                )
              )}

              {/* Explanation */}
              {item.explanation && (
                <p className="text-xs font-normal text-slate-600 leading-snug">
                  <span className="font-medium text-slate-800">Analisis:</span>{" "}
                  {item.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
