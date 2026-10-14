import { ShieldAlert, CheckCircle2, AlertCircle } from "lucide-react";
import type { BottleneckDto } from "@/lib/api/procurement.api";

interface BottleneckWidgetProps {
  bottlenecks: BottleneckDto[];
}

export function BottleneckWidget({ bottlenecks }: BottleneckWidgetProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center gap-2">
          <ShieldAlert className="text-red-600" size={18} />
          <h3 className="text-sm font-bold text-slate-800">
            SLA Bottleneck Identifier (Deteksi Kemacetan)
          </h3>
        </div>
        <span className="text-[11px] font-semibold text-slate-500">
          Tahapan Paling Menghambat
        </span>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        {bottlenecks.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <CheckCircle2 size={32} className="mx-auto text-[#0a4d8c] mb-2" />
            <p className="text-xs font-medium">
              Tidak ada kemacetan terdeteksi. Semua tahapan pengadaan memenuhi SLA tepat waktu.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {bottlenecks.map((item, idx) => {
              const isHigh = item.severity === "High";
              return (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-800">{item.milestone}</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isHigh
                          ? "bg-red-100 text-red-700 border border-red-200"
                          : "bg-amber-100 text-amber-700 border border-amber-200"
                      }`}
                    >
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
  );
}
