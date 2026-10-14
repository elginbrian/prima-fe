import { TrendingUp, Coins, Flame, FileCheck2, CheckCircle2, AlertCircle } from "lucide-react";
import type { AnalyticsSummaryDto, DocumentStatsDto } from "@/lib/api/procurement.api";
import { formatRupiah } from "./utils";

interface AnalyticsKpiCardsProps {
  summary: AnalyticsSummaryDto;
  documentStats: DocumentStatsDto;
  complianceBadgeColor: string;
}

export function AnalyticsKpiCards({
  summary,
  documentStats,
  complianceBadgeColor,
}: AnalyticsKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Compliance Rate */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Kepatuhan SLA
          </span>
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${complianceBadgeColor}`}
          >
            {summary.overall_compliance_rate >= 85
              ? "Optimal"
              : summary.overall_compliance_rate >= 70
              ? "Waspada"
              : "Kritis"}
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-800">
            {summary.overall_compliance_rate}%
          </span>
          <span className="text-xs text-slate-400">dari {summary.total_deadlines} milestone</span>
        </div>
        <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full ${
              summary.overall_compliance_rate >= 85
                ? "bg-[#0a4d8c]"
                : summary.overall_compliance_rate >= 70
                ? "bg-amber-500"
                : "bg-red-500"
            }`}
            style={{ width: `${Math.min(100, Math.max(0, summary.overall_compliance_rate))}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
          <CheckCircle2 size={12} className="text-[#0a4d8c]" />
          {summary.total_deadlines - summary.overdue_deadlines} tepat waktu / selesai
        </p>
      </div>

      {/* Total Budget */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Pagu Anggaran
          </span>
          <div className="p-1.5 bg-blue-50 text-[#0a4d8c] rounded-lg">
            <Coins size={16} />
          </div>
        </div>
        <div className="mt-3">
          <span
            className="text-xl font-bold text-slate-800 tracking-tight block truncate"
            title={formatRupiah(summary.total_budget)}
          >
            {formatRupiah(summary.total_budget)}
          </span>
          <span className="text-xs text-slate-400 mt-1 block">
            {summary.total_procurements} paket pengadaan aktif
          </span>
        </div>
        <p className="mt-4 text-[11px] text-slate-400 flex items-center gap-1">
          <TrendingUp size={12} className="text-[#0a4d8c]" />
          Rata-rata{" "}
          {summary.total_procurements > 0
            ? formatRupiah(summary.total_budget / summary.total_procurements)
            : "Rp 0"}
          /paket
        </p>
      </div>

      {/* Overdue & Escalation Tasks */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Overdue & Eskalasi
          </span>
          <div className="p-1.5 bg-red-50 text-red-600 rounded-lg">
            <Flame size={16} />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-3">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-red-600">
              {summary.overdue_deadlines}
            </span>
            <span className="text-[11px] text-red-500 font-semibold">Overdue</span>
          </div>
          <div className="text-slate-300">|</div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-amber-600">
              {summary.escalated_deadlines}
            </span>
            <span className="text-[11px] text-amber-600 font-semibold">Eskalasi</span>
          </div>
        </div>
        <p className="mt-4 text-[11px] text-slate-400 flex items-center gap-1">
          <AlertCircle
            size={12}
            className={summary.overdue_deadlines > 0 ? "text-red-500" : "text-[#0a4d8c]"}
          />
          {summary.escalated_deadlines > 0
            ? "Membutuhkan intervensi manajerial segera"
            : "Tidak ada eskalasi aktif saat ini"}
        </p>
      </div>

      {/* Document Verification Health */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Kualitas Dokumen (D1)
          </span>
          <div className="p-1.5 bg-blue-50 text-[#0a4d8c] rounded-lg">
            <FileCheck2 size={16} />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-800">
            {documentStats.verified}
          </span>
          <span className="text-xs text-slate-400">/ {documentStats.total} terverifikasi</span>
        </div>
        <div className="mt-3 flex items-center gap-2 text-[11px]">
          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">
            {documentStats.with_notes} Catatan
          </span>
          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
            {documentStats.follow_up} Tindak Lanjut FPP
          </span>
        </div>
      </div>
    </div>
  );
}
