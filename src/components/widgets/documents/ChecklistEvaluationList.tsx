"use client";

import { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Quote,
  Scale,
  Percent,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { ChecklistItemResult } from "@/types/validation";

interface ChecklistEvaluationListProps {
  evaluations: ChecklistItemResult[];
}

export function ChecklistEvaluationList({
  evaluations,
}: ChecklistEvaluationListProps) {
  const [expandedMap, setExpandedMap] = useState<Record<number, boolean>>({});
  const [expandAllPassed, setExpandAllPassed] = useState(false);

  if (!evaluations || evaluations.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-xs font-normal text-slate-500">
        Tidak ada evaluasi checklist untuk ditampilkan.
      </div>
    );
  }

  const passedCount = evaluations.filter((e) => e.status === "Memenuhi").length;
  const totalEarned = evaluations.reduce(
    (sum, e) => sum + (typeof e.earned_score === "number" ? e.earned_score : 0),
    0
  );
  const hasWeights = evaluations.some(
    (e) => (e.normalized_weight ?? e.weight ?? 0) > 0
  );

  const toggleAllPassed = () => {
    const nextVal = !expandAllPassed;
    setExpandAllPassed(nextVal);
    const nextMap: Record<number, boolean> = {};
    evaluations.forEach((item, idx) => {
      if (item.status === "Memenuhi") {
        nextMap[idx] = nextVal;
      }
    });
    setExpandedMap((prev) => ({ ...prev, ...nextMap }));
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            Evaluasi Kriteria Berbobot ({passedCount}/{evaluations.length} Memenuhi)
          </h3>
          <p className="text-xs font-normal text-slate-500">
            Item bermasalah terbuka otomatis; klik item lulus untuk membaca kutipan bukti.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hasWeights && (
            <div className="text-xs font-medium text-[#0a4d8c] bg-[#e8f2fc] border border-[#0a4d8c]/20 px-2.5 py-1 rounded-full">
              Skor: {totalEarned.toFixed(1)} / 100
            </div>
          )}
          {passedCount > 0 && (
            <button
              type="button"
              onClick={toggleAllPassed}
              className="text-[11px] font-medium text-slate-600 hover:text-[#0a4d8c] border border-slate-200 bg-white px-2.5 py-1 rounded-lg transition-colors focus:outline-none"
            >
              {expandAllPassed ? "Ringkas Item Lulus" : "Buka Semua Detail"}
            </button>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 divide-y divide-slate-200 bg-white overflow-hidden">
        {evaluations.map((item, idx) => {
          const isPassed = item.status === "Memenuhi";
          const isFailed = item.status === "Tidak Memenuhi";
          const normWeight = item.normalized_weight ?? item.weight ?? 0;
          const earned = item.earned_score ?? 0;
          // Problematic items default expanded; passed items collapse cleanly unless toggled
          const isExpanded =
            expandedMap[idx] !== undefined ? expandedMap[idx] : !isPassed;

          const statusBadge = isPassed ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-normal text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              <CheckCircle2 size={11} className="text-[#0a4d8c]" />
              Memenuhi
            </span>
          ) : isFailed ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-normal text-white bg-[#0a4d8c] px-2 py-0.5 rounded-full border border-[#0a4d8c]">
              <XCircle size={11} />
              Tidak Memenuhi
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-normal text-[#0a4d8c] bg-[#e8f2fc] px-2 py-0.5 rounded-full border border-[#0a4d8c]/20">
              <AlertTriangle size={11} />
              Perlu Perhatian
            </span>
          );

          return (
            <div
              key={idx}
              className={`px-4 py-3 transition-colors space-y-2 ${
                isFailed ? "bg-[#f4f8fd]/80" : "bg-white hover:bg-slate-50/40"
              }`}
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedMap((prev) => ({ ...prev, [idx]: !isExpanded }))
                }
                className="w-full text-left flex flex-col sm:flex-row sm:items-center justify-between gap-2 focus:outline-none"
              >
                <div className="flex flex-wrap items-start sm:items-center gap-1.5 min-w-0">
                  <span className="text-xs font-medium text-slate-400">
                    {idx + 1}.
                  </span>
                  <span className="text-xs font-medium text-slate-800 break-words">
                    {item.item}
                  </span>
                  {item.is_mandatory && (
                    <span className="text-[10px] font-normal px-1.5 py-0.5 rounded-full border bg-[#e8f2fc] text-[#0a4d8c] border-[#0a4d8c]/20 shrink-0">
                      Wajib
                    </span>
                  )}
                  {item.source && (
                    <span className="text-[10px] font-normal px-1.5 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-500 shrink-0">
                      {item.source === "template" ? "Template" : "Kustom"}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {normWeight > 0 && (
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0a4d8c] bg-[#f4f8fd] border border-[#0a4d8c]/20 px-2 py-0.5 rounded-md"
                      title={`Bobot ternormalisasi ${normWeight.toFixed(1)}% · Pemenuhan ${Math.round((item.fulfillment_ratio ?? 1) * 100)}%`}
                    >
                      <Percent size={10} />
                      <span>
                        +{earned.toFixed(1)}/{normWeight.toFixed(1)}
                      </span>
                    </span>
                  )}
                  {statusBadge}
                  <span className="text-slate-400 pl-0.5">
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </span>
                </div>
              </button>

              {!isExpanded && (item.comparison_detail || item.explanation) && (
                <p className="text-[11px] text-slate-500 line-clamp-1 pl-4">
                  {item.comparison_detail || item.explanation}
                </p>
              )}

              {isExpanded && (
                <div className="space-y-2 pt-1 pl-4">
                  {item.comparison_detail && (
                    <div className="rounded-lg border border-[#0a4d8c]/20 bg-[#f4f8fd]/70 px-3 py-2 flex items-start gap-2">
                      <Scale size={13} className="mt-0.5 shrink-0 text-[#0a4d8c]" />
                      <div className="text-xs font-normal text-slate-700 leading-snug">
                        <span className="font-medium text-[#0a4d8c]">
                          Perbandingan:{" "}
                        </span>
                        {item.comparison_detail}
                      </div>
                    </div>
                  )}

                  {item.evidence_quote ? (
                    <div className="rounded-r-lg border-l-2 border-[#0a4d8c] bg-slate-50 px-3 py-2 space-y-0.5">
                      <div className="text-[10px] font-medium uppercase tracking-wider text-[#0a4d8c] flex items-center gap-1">
                        <Quote size={10} />
                        Kutipan Bukti
                      </div>
                      <p className="text-xs font-normal text-slate-700 italic leading-relaxed break-words">
                        &ldquo;{item.evidence_quote}&rdquo;
                      </p>
                    </div>
                  ) : (
                    isFailed && (
                      <div className="text-[11px] font-normal text-slate-600 bg-white rounded px-2.5 py-1.5 border border-slate-200 italic">
                        Bukti pemenuhan kriteria ini belum ditemukan di dalam naskah dokumen.
                      </div>
                    )
                  )}

                  {item.explanation && (
                    <p className="text-xs font-normal text-slate-600 leading-relaxed">
                      <span className="font-medium text-slate-800">Analisis AI:</span>{" "}
                      {item.explanation}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
