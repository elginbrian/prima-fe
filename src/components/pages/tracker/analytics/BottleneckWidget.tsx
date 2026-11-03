import { ShieldAlert, CheckCircle2, AlertCircle } from "lucide-react";
import type { BottleneckDto } from "@/lib/api/procurement.api";

interface BottleneckWidgetProps {
  bottlenecks: BottleneckDto[];
}

export function BottleneckWidget({ bottlenecks }: BottleneckWidgetProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-2">
          <ShieldAlert className="text-[#0a4d8c]" size={16} />
          <h3 className="text-sm font-medium text-slate-800">
            Deteksi Kemacetan Tahapan (Bottleneck)
          </h3>
        </div>
        <span className="text-[11px] font-normal text-slate-400">
          Tahapan Paling Menghambat
        </span>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        {bottlenecks.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <CheckCircle2 size={28} className="mx-auto text-[#0a4d8c] mb-2" />
            <p className="text-xs font-normal">
              Tidak ada kemacetan terdeteksi. Semua tahapan pengadaan memenuhi jadwal SLA.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {bottlenecks.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/40"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-medium flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-medium text-slate-800">{item.milestone}</span>
                  </div>
                  <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-blue-50 text-[#0a4d8c] border border-blue-200">
                    {item.overdue_count} Terlambat
                  </span>
                </div>
                <div className="w-full bg-slate-200/70 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-[#0a4d8c]"
                    style={{ width: `${Math.min(100, item.overdue_count * 25)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-medium text-slate-700 mb-1">
            <AlertCircle size={13} className="text-[#0a4d8c]" />
            <span>Catatan Evaluasi:</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Tahapan dengan keterlambatan memerlukan koordinasi dengan PIC pengadaan terkait untuk percepatan penyelesaian dokumen dan persetujuan.
          </p>
        </div>
      </div>
    </div>
  );
}
