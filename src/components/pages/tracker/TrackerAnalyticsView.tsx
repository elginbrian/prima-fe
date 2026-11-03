"use client";

import { AlertTriangle, Clock, RefreshCw } from "lucide-react";
import {
  useProcurementAnalytics,
  useEvaluateSla,
} from "@/lib/query/hooks/procurement/useProcurement";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";

import { AnalyticsKpiCards } from "./analytics/AnalyticsKpiCards";
import { BottleneckWidget } from "./analytics/BottleneckWidget";
import { DepartmentComplianceWidget } from "./analytics/DepartmentComplianceWidget";
import { VendorRiskTable } from "./analytics/VendorRiskTable";
import { MethodsStatusBreakdown } from "./analytics/MethodsStatusBreakdown";

export function TrackerAnalyticsView() {
  const { data: analytics, isLoading, isError, refetch, isRefetching } =
    useProcurementAnalytics();
  const evaluateSlaMutation = useEvaluateSla();
  const toast = useToast();

  const handleRunEvaluation = async () => {
    try {
      const res = await evaluateSlaMutation.mutateAsync(undefined);
      toast.success(
        `Evaluasi SLA harian selesai: ${res.data.total_evaluated} diperiksa (${res.data.overdue} terlambat, ${res.data.escalated} eskalasi).`
      );
      refetch();
    } catch {
      toast.error("Gagal menjalankan evaluasi SLA.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-white rounded-xl border border-slate-200 text-center shadow-sm">
        <Spinner size="xl" className="mb-4" />
        <p className="text-sm font-medium text-slate-700">
          Memuat ringkasan analitik pengadaan...
        </p>
      </div>
    );
  }

  if (isError || !analytics) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200 text-center shadow-sm">
        <AlertTriangle className="text-slate-400 mb-2" size={32} />
        <p className="text-sm font-medium text-slate-800">Gagal memuat analitik pengadaan</p>
        <p className="text-xs text-slate-500 mt-1 max-w-md">
          Pastikan layanan backend aktif lalu muat ulang halaman.
        </p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-[#0a4d8c] text-white rounded-lg text-xs font-medium hover:bg-[#083c6c] transition-colors"
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
    <div className="space-y-5">
      {/* Compact Toolbar Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-sm font-medium text-slate-800">
            Ringkasan Kepatuhan SLA & Evaluasi Tahapan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pemantauan tingkat ketepatan waktu tahapan, distribusi anggaran, dan eksposur jaminan vendor.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal text-slate-600 transition-colors"
          >
            <RefreshCw size={13} className={isRefetching ? "animate-spin text-[#0a4d8c]" : "text-slate-400"} />
            <span>{isRefetching ? "Memperbarui..." : "Segarkan"}</span>
          </button>
          <button
            type="button"
            onClick={handleRunEvaluation}
            disabled={evaluateSlaMutation.isPending}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0a4d8c] hover:bg-[#093e6f] text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          >
            {evaluateSlaMutation.isPending ? (
              <>
                <Spinner size="xs" className="border-white border-t-transparent" />
                <span>Mengevaluasi...</span>
              </>
            ) : (
              <>
                <Clock size={13} />
                <span>Sinkronisasi SLA</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 1. KPI Metric Cards */}
      <AnalyticsKpiCards
        summary={summary}
        documentStats={document_stats}
        complianceBadgeColor="text-[#0a4d8c] bg-blue-50 border-blue-200"
      />

      {/* 2. Middle Row: SLA Bottlenecks & Department Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <BottleneckWidget bottlenecks={bottlenecks} />
        <DepartmentComplianceWidget departmentCompliance={department_compliance} />
      </div>

      {/* 3. Bottom Row: Vendor Risk Index & Methods Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
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
