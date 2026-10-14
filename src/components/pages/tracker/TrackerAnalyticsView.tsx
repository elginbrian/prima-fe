"use client";

import { useMemo } from "react";
import { BarChart3, AlertTriangle, Clock, RefreshCw } from "lucide-react";
import { useProcurementAnalytics, useEvaluateSla } from "@/lib/query/hooks/procurement/useProcurement";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";

import { AnalyticsKpiCards } from "./analytics/AnalyticsKpiCards";
import { BottleneckWidget } from "./analytics/BottleneckWidget";
import { DepartmentComplianceWidget } from "./analytics/DepartmentComplianceWidget";
import { VendorRiskTable } from "./analytics/VendorRiskTable";
import { MethodsStatusBreakdown } from "./analytics/MethodsStatusBreakdown";

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
    if (rate >= 85) return "text-[#0a4d8c] bg-blue-50 border-blue-200";
    if (rate >= 70) return "text-amber-700 bg-amber-50 border-amber-200";
    return "text-red-700 bg-red-50 border-red-200";
  }, [analytics?.summary.overall_compliance_rate]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-white rounded-xl border border-slate-200 text-center shadow-sm">
        <Spinner size="xl" className="mb-4" />
        <p className="text-sm font-semibold text-slate-700">
          Mengkalkulasi Analitik Eksekutif & SLA Intelligence...
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Mengumpulkan data pengadaan, jaminan bank, dan kepatuhan SLA antar departemen
        </p>
      </div>
    );
  }

  if (isError || !analytics) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-red-200 text-center shadow-sm">
        <AlertTriangle className="text-red-500 mb-2" size={32} />
        <p className="text-sm font-semibold text-slate-800">Gagal memuat analitik pengadaan</p>
        <p className="text-xs text-slate-500 mt-1 max-w-md">
          Terjadi kendala saat menghitung agregat intelijen SLA. Pastikan layanan backend aktif.
        </p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-[#0a4d8c] text-white rounded-lg text-xs font-semibold hover:bg-[#083c6c] transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const {
    summary,
    bottlenecks,
    department_compliance,
    vendor_risk_index,
    methods_breakdown,
    status_breakdown,
    document_stats,
  } = analytics;

  return (
    <div className="space-y-6">
      {/* ── Top Bar Action Banner ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0a4d8c] to-[#0d5ca8] p-5 rounded-xl text-white shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="text-blue-200" size={20} />
            <h2 className="text-base font-bold tracking-wide">
              Executive Procurement Analytics & SLA Intelligence
            </h2>
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
            className="flex items-center gap-1.5 px-3 py-2 bg-[#0a4d8c] hover:bg-[#093e6f] text-white rounded-lg text-xs font-bold shadow transition-all active:scale-95 disabled:opacity-50"
            title="Jalankan Evaluasi SLA Harian Otomatis"
          >
            {evaluateSlaMutation.isPending ? (
              <>
                <Spinner size="xs" className="border-white border-t-transparent" />
                <span>Mengevaluasi...</span>
              </>
            ) : (
              <>
                <Clock size={14} />
                <span>Sinkronisasi SLA Harian</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── 1. KPI Metric Cards ── */}
      <AnalyticsKpiCards
        summary={summary}
        documentStats={document_stats}
        complianceBadgeColor={complianceBadgeColor}
      />

      {/* ── 2. Middle Row: SLA Bottlenecks & Department Compliance ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BottleneckWidget bottlenecks={bottlenecks} />
        <DepartmentComplianceWidget departmentCompliance={department_compliance} />
      </div>

      {/* ── 3. Bottom Row: Vendor Risk Index (Modul D2) & Methods Breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <VendorRiskTable vendorRiskIndex={vendor_risk_index} />
        <MethodsStatusBreakdown
          methodsBreakdown={methods_breakdown}
          statusBreakdown={status_breakdown}
          totalProcurements={summary.total_procurements}
        />
      </div>
    </div>
  );
}
