"use client";

import { useMemo } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  Building2, 
  Coins, 
  FileCheck2, 
  RefreshCw, 
  Flame,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useProcurementAnalytics, useEvaluateSla } from "@/lib/query/hooks/procurement/useProcurement";
import { useToast } from "@/components/ui/Toast";

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function TrackerAnalyticsView() {
  const { data: analytics, isLoading, isError, refetch, isRefetching } = useProcurementAnalytics();
  const evaluateSlaMutation = useEvaluateSla();
  const toast = useToast();

  const handleRunEvaluation = async () => {
    try {
      const res = await evaluateSlaMutation.mutateAsync(undefined);
      toast.success(
        `Evaluasi SLA harian tuntas: ${res.data.total_evaluated} diperiksa (${res.data.overdue} overdue, ${res.data.escalated} eskalasi).`
      );
      refetch();
    } catch {
      toast.error("Gagal menjalankan evaluasi SLA.");
    }
  };

  const complianceBadgeColor = useMemo(() => {
    const rate = analytics?.summary.overall_compliance_rate ?? 100;
    if (rate >= 85) return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (rate >= 70) return "text-amber-700 bg-amber-50 border-amber-200";
    return "text-red-700 bg-red-50 border-red-200";
  }, [analytics?.summary.overall_compliance_rate]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-white rounded-xl border border-slate-200 text-center shadow-sm">
        <div className="w-10 h-10 border-4 border-[#0a4d8c] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-700">Mengkalkulasi Analitik Eksekutif & SLA Intelligence...</p>
        <p className="text-xs text-slate-400 mt-1">Mengumpulkan data pengadaan, jaminan bank, dan kepatuhan SLA antar departemen</p>
      </div>
    );
  }

  if (isError || !analytics) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-red-200 text-center shadow-sm">
        <AlertTriangle className="text-red-500 mb-2" size={32} />
        <p className="text-sm font-semibold text-slate-800">Gagal memuat analitik pengadaan</p>
        <p className="text-xs text-slate-500 mt-1 max-w-md">Terjadi kendala saat menghitung agregat intelijen SLA. Pastikan layanan backend aktif.</p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-[#0a4d8c] text-white rounded-lg text-xs font-semibold hover:bg-[#083c6c] transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const { summary, bottlenecks, department_compliance, vendor_risk_index, methods_breakdown, status_breakdown, document_stats } = analytics;

  return (
    <div className="space-y-6">
      {/* ── Top Bar Action Banner ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0a4d8c] to-[#0d5ca8] p-5 rounded-xl text-white shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="text-blue-200" size={20} />
            <h2 className="text-base font-bold tracking-wide">Executive Procurement Analytics & SLA Intelligence</h2>
          </div>
          <p className="text-xs text-blue-100 mt-1 max-w-2xl">
            Dasbor intelijen komprehensif untuk pengawasan SLA lintas fungsi, identifikasi kemacetan (bottleneck) tahapan pengadaan, dan profil risiko vendor jaminan bank.
          </p>
        </div>
        <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs font-semibold backdrop-blur-sm transition-all"
            title="Perbarui Metrik"
          >
            <RefreshCw size={14} className={isRefetching ? "animate-spin" : ""} />
            <span>{isRefetching ? "Memperbarui..." : "Segarkan"}</span>
          </button>
          <button
            type="button"
            onClick={handleRunEvaluation}
            disabled={evaluateSlaMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow transition-all active:scale-95 disabled:opacity-50"
            title="Jalankan Evaluasi SLA Harian Otomatis"
          >
            <Clock size={14} />
            <span>{evaluateSlaMutation.isPending ? "Mengevaluasi..." : "Sinkronisasi SLA Harian"}</span>
          </button>
        </div>
      </div>

      {/* ── 1. KPI Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Compliance Rate */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Kepatuhan SLA</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${complianceBadgeColor}`}>
              {summary.overall_compliance_rate >= 85 ? "Optimal" : summary.overall_compliance_rate >= 70 ? "Waspada" : "Kritis"}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800">{summary.overall_compliance_rate}%</span>
            <span className="text-xs text-slate-400">dari {summary.total_deadlines} milestone</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full ${summary.overall_compliance_rate >= 85 ? "bg-emerald-500" : summary.overall_compliance_rate >= 70 ? "bg-amber-500" : "bg-red-500"}`}
              style={{ width: `${Math.min(100, Math.max(0, summary.overall_compliance_rate))}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <CheckCircle2 size={12} className="text-emerald-500" />
            {summary.total_deadlines - summary.overdue_deadlines} tepat waktu / selesai
          </p>
        </div>

        {/* Total Budget */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pagu Anggaran</span>
            <div className="p-1.5 bg-blue-50 text-[#0a4d8c] rounded-lg">
              <Coins size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-slate-800 tracking-tight block truncate" title={formatRupiah(summary.total_budget)}>
              {formatRupiah(summary.total_budget)}
            </span>
            <span className="text-xs text-slate-400 mt-1 block">
              {summary.total_procurements} paket pengadaan aktif
            </span>
          </div>
          <p className="mt-4 text-[11px] text-slate-400 flex items-center gap-1">
            <TrendingUp size={12} className="text-[#0a4d8c]" />
            Rata-rata {summary.total_procurements > 0 ? formatRupiah(summary.total_budget / summary.total_procurements) : "Rp 0"}/paket
          </p>
        </div>

        {/* Overdue & Escalation Tasks */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Overdue & Eskalasi</span>
            <div className="p-1.5 bg-red-50 text-red-600 rounded-lg">
              <Flame size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-red-600">{summary.overdue_deadlines}</span>
              <span className="text-[11px] text-red-500 font-semibold">Overdue</span>
            </div>
            <div className="text-slate-300">|</div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-amber-600">{summary.escalated_deadlines}</span>
              <span className="text-[11px] text-amber-600 font-semibold">Eskalasi</span>
            </div>
          </div>
          <p className="mt-4 text-[11px] text-slate-400 flex items-center gap-1">
            <AlertCircle size={12} className={summary.overdue_deadlines > 0 ? "text-red-500" : "text-emerald-500"} />
            {summary.escalated_deadlines > 0 ? "Membutuhkan intervensi manajerial segera" : "Tidak ada eskalasi aktif saat ini"}
          </p>
        </div>

        {/* Document Verification Health */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Kualitas Dokumen (D1)</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <FileCheck2 size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800">{document_stats.verified}</span>
            <span className="text-xs text-slate-400">/ {document_stats.total} terverifikasi</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px]">
            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">
              {document_stats.with_notes} Catatan
            </span>
            <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
              {document_stats.follow_up} Tindak Lanjut FPP
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. Middle Row: SLA Bottlenecks & Department Compliance ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Widget 2A: SLA Bottleneck Identifier */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-2">
              <ShieldAlert className="text-red-600" size={18} />
              <h3 className="text-sm font-bold text-slate-800">SLA Bottleneck Identifier (Deteksi Kemacetan)</h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">Tahapan Paling Menghambat</span>
          </div>
          
          <div className="p-5 flex-1 flex flex-col justify-between">
            {bottlenecks.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
                <p className="text-xs font-medium">Tidak ada kemacetan terdeteksi. Semua tahapan pengadaan memenuhi SLA tepat waktu.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {bottlenecks.map((item, idx) => {
                  const isHigh = item.severity === "High";
                  return (
                    <div key={idx} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800">{item.milestone}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isHigh ? "bg-red-100 text-red-700 border border-red-200" : "bg-amber-100 text-amber-700 border border-amber-200"
                        }`}>
                          {item.severity} Severity ({item.overdue_count} Overdue)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full ${isHigh ? "bg-red-500" : "bg-amber-500"}`}
                          style={{ width: `${Math.min(100, item.overdue_count * 25)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Managerial Recommendation Box */}
            <div className="mt-4 p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-xs text-[#0a4d8c]">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <AlertCircle size={14} />
                <span>Rekomendasi Tindakan Manajerial:</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Tahapan dengan severity tinggi membutuhkan eskalasi ke FPP dan PIC pengadaan terkait. Segera jadwalkan rapat akselerasi evaluasi teknis dan penyerahan jaminan untuk menghindari pembengkakan lead time.
              </p>
            </div>
          </div>
        </div>

        {/* Widget 2B: Department SLA Compliance Ranking */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-2">
              <Building2 className="text-[#0a4d8c]" size={18} />
              <h3 className="text-sm font-bold text-slate-800">Peringkat Kepatuhan SLA Departemen</h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">Ranking Lintas Fungsi</span>
          </div>

          <div className="p-5 flex-1 flex flex-col justify-between">
            {department_compliance.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <p className="text-xs">Belum ada data SLA per departemen.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {department_compliance.map((dept, idx) => {
                  const rate = dept.compliance_rate;
                  const barColor = rate >= 85 ? "bg-emerald-500" : rate >= 70 ? "bg-amber-500" : "bg-red-500";
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-700">{dept.department}</span>
                          <span className="text-[10px] text-slate-400">({dept.total_deadlines} tugas)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {dept.overdue > 0 && (
                            <span className="text-[10px] text-red-600 font-semibold bg-red-50 px-1.5 py-0.2 rounded">
                              {dept.overdue} overdue
                            </span>
                          )}
                          <span className="font-bold text-slate-800">{rate}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full ${barColor} transition-all duration-500`}
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> &gt;= 85% Memuaskan
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> 70-84% Waspada
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" /> &lt; 70% Kritis
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* ── 3. Bottom Row: Vendor Risk Index (Modul D2) & Methods Breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Vendor Risk Index (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-cyan-700" size={18} />
              <h3 className="text-sm font-bold text-slate-800">Vendor Risk Index & Garansi Bank (Modul D2)</h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">Evaluasi Eksposur Vendor</span>
          </div>

          <div className="p-0 overflow-x-auto flex-1">
            {vendor_risk_index.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Belum ada data jaminan bank terdaftar untuk evaluasi vendor.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                    <th className="py-2.5 px-4">Nama Vendor</th>
                    <th className="py-2.5 px-3 text-center">Jaminan</th>
                    <th className="py-2.5 px-3">Total Nilai (IDR)</th>
                    <th className="py-2.5 px-3 text-center">Expiry Dekat</th>
                    <th className="py-2.5 px-3 text-center">Klaim</th>
                    <th className="py-2.5 px-4 text-center">Risk Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {vendor_risk_index.map((v, i) => {
                    const isHigh = v.risk_level === "High";
                    const isMed = v.risk_level === "Medium";
                    return (
                      <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-4 font-semibold text-slate-800">
                          {v.vendor_name}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600 font-medium">
                          {v.total_guarantees}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-700">
                          {formatRupiah(v.total_value)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {v.expiring_soon > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px]">
                              {v.expiring_soon}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {v.claimed > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-bold text-[10px]">
                              {v.claimed}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isHigh 
                              ? "bg-red-50 text-red-700 border border-red-200" 
                              : isMed 
                              ? "bg-amber-50 text-amber-700 border border-amber-200" 
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}>
                            {isHigh && (
                              <>
                                <AlertTriangle size={11} className="text-red-600 shrink-0" />
                                <span>High Risk</span>
                              </>
                            )}
                            {isMed && (
                              <>
                                <AlertCircle size={11} className="text-amber-600 shrink-0" />
                                <span>Medium Risk</span>
                              </>
                            )}
                            {!isHigh && !isMed && (
                              <>
                                <CheckCircle2 size={11} className="text-emerald-600 shrink-0" />
                                <span>Low Risk</span>
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Procurement Methods & Status Breakdown (1 Column) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
            <h3 className="text-sm font-bold text-slate-800">Metode & Status Operasional</h3>
          </div>

          <div className="p-5 space-y-5">
            {/* Metode Pengadaan */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                Metode Pengadaan
              </span>
              <div className="space-y-2">
                {Object.entries(methods_breakdown).map(([method, count]) => {
                  const percent = summary.total_procurements > 0 ? Math.round((count / summary.total_procurements) * 100) : 0;
                  return (
                    <div key={method} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-medium">{method}</span>
                        <span className="font-bold text-slate-700">{count} ({percent}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-[#0a4d8c] h-full" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status Operasional */}
            <div className="pt-3 border-t border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                Status Pengadaan
              </span>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
                  <span className="text-lg font-bold text-emerald-700 block">{status_breakdown["On Going"] ?? 0}</span>
                  <span className="text-[10px] text-emerald-600 font-medium">On Going</span>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-100">
                  <span className="text-lg font-bold text-amber-700 block">{status_breakdown["On Hold"] ?? 0}</span>
                  <span className="text-[10px] text-amber-600 font-medium">On Hold</span>
                </div>
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-100">
                  <span className="text-lg font-bold text-red-700 block">{status_breakdown["Batal"] ?? 0}</span>
                  <span className="text-[10px] text-red-600 font-medium">Batal</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 text-center">
            Data teragregasi secara real-time dari database pengadaan PRIMA.
          </div>
        </div>

      </div>
    </div>
  );
}
