import { TrendingUp, Coins, Clock, FileCheck2, CheckCircle2, AlertCircle } from "lucide-react";
import type { AnalyticsSummaryDto, DocumentStatsDto } from "@/lib/api/procurement.api";
import { formatRupiah } from "./utils";

interface AnalyticsKpiCardsProps {
  summary: AnalyticsSummaryDto;
  documentStats: DocumentStatsDto;
  complianceBadgeColor?: string;
}

export function AnalyticsKpiCards({
  summary,
  documentStats,
}: AnalyticsKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* Compliance Rate */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Kepatuhan SLA
          </span>
          <span className="text-[10px] font-normal px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-600">
            {summary.overall_compliance_rate >= 85
              ? "Optimal"
              : summary.overall_compliance_rate >= 70
              ? "Perlu Pantauan"
              : "Perlu Evaluasi"}
          </span>
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-slate-800">
            {summary.overall_compliance_rate}%
          </span>
          <span className="text-xs text-slate-400">dari {summary.total_deadlines} jadwal</span>
        </div>
        <div className="mt-2.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-[#0a4d8c]"
            style={{ width: `${Math.min(100, Math.max(0, summary.overall_compliance_rate))}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
          <CheckCircle2 size={12} className="text-[#0a4d8c]" />
          {summary.total_deadlines - summary.overdue_deadlines} tepat waktu / selesai
        </p>
      </div>

      {/* Total Budget */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Total Pagu Pengadaan
          </span>
          <div className="p-1.5 bg-slate-50 text-slate-500 border border-slate-200 rounded-lg">
            <Coins size={15} />
          </div>
        </div>
        <div className="mt-2.5">
          <span
            className="text-xl font-semibold text-slate-800 tracking-tight block truncate"
            title={formatRupiah(summary.total_budget)}
          >
            {formatRupiah(summary.total_budget)}
          </span>
          <span className="text-xs text-slate-400 mt-1 block">
            {summary.total_procurements} paket pekerjaan aktif
          </span>
        </div>
        <p className="mt-3 text-[11px] text-slate-400 flex items-center gap-1">
          <TrendingUp size={12} className="text-slate-400" />
          Rata-rata{" "}
          {summary.total_procurements > 0
            ? formatRupiah(summary.total_budget / summary.total_procurements)
            : "Rp 0"}
          /paket
        </p>
      </div>

      {/* Overdue & Escalation Tasks */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Keterlambatan & Eskalasi
          </span>
          <div className="p-1.5 bg-slate-50 text-slate-500 border border-slate-200 rounded-lg">
            <Clock size={15} />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold text-slate-800">
              {summary.overdue_deadlines}
            </span>
            <span className="text-xs text-slate-500 font-normal">Terlambat</span>
          </div>
          <div className="text-slate-200">|</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold text-[#0a4d8c]">
              {summary.escalated_deadlines}
            </span>
            <span className="text-xs text-slate-500 font-normal">Eskalasi</span>
          </div>
        </div>
        <p className="mt-3.5 text-[11px] text-slate-400 flex items-center gap-1">
          <AlertCircle size={12} className="text-slate-400" />
          {summary.escalated_deadlines > 0
            ? "Terdapat tahapan yang memerlukan tindak lanjut"
            : "Tidak ada eskalasi aktif saat ini"}
        </p>
      </div>

      {/* Document Verification Health */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Kepatuhan Dokumen
          </span>
          <div className="p-1.5 bg-slate-50 text-slate-500 border border-slate-200 rounded-lg">
            <FileCheck2 size={15} />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="text-2xl font-semibold text-slate-800">
            {documentStats.verified}
          </span>
          <span className="text-xs text-slate-400">/ {documentStats.total} terverifikasi</span>
        </div>
        <div className="mt-3 flex items-center gap-2 text-[11px]">
          <span className="px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-600 font-normal">
            {documentStats.with_notes} Catatan
          </span>
          <span className="px-2 py-0.5 rounded border border-blue-200 bg-blue-50 text-[#0a4d8c] font-normal">
            {documentStats.follow_up} Tindak Lanjut
          </span>
        </div>
      </div>
    </div>
  );
}
