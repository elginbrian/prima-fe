import { Plus } from "lucide-react";
interface TrackerStatsPanelProps {
  totalItemsCount: number;
  onGoingCount: number;
  onHoldCount: number;
  cancelledCount: number;
  onAddRequest: () => void;
}

export function TrackerStatsPanel({
  totalItemsCount, onGoingCount, onHoldCount, cancelledCount, onAddRequest
}: TrackerStatsPanelProps) {
  const onGoingPercent = totalItemsCount ? (onGoingCount / totalItemsCount) * 100 : 0;
  const onHoldPercent = totalItemsCount ? (onHoldCount / totalItemsCount) * 100 : 0;
  const donutBackground = totalItemsCount
    ? `conic-gradient(#10b981 0% ${onGoingPercent}%, #f59e0b ${onGoingPercent}% ${onGoingPercent + onHoldPercent}%, #ef4444 ${onGoingPercent + onHoldPercent}% 100%)`
    : "conic-gradient(#e2e8f0 0% 100%)";
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm w-full">
      {/* Header */}
      <div className="flex items-center px-4 py-2.5 border-b border-[#093e6f] bg-[#0a4d8c] shrink-0">
        <h3 className="font-bold text-[12px] uppercase tracking-wider text-white">Statistik</h3>
      </div>

      <div className="flex flex-col p-4 gap-4">

        {/* Pie Chart */}
        <div className="flex flex-col items-center py-2">
          <div
            className="relative h-32 w-32 shrink-0 rounded-full shadow-[inset_0_2px_10px_rgba(0,0,0,0.12)]"
            style={{ background: donutBackground }}
            role="img"
            aria-label="Distribusi status pekerjaan"
          >
            <div className="absolute inset-0 m-auto flex h-[76px] w-[76px] flex-col items-center justify-center rounded-full bg-white shadow-sm">
              <span className="text-xl font-black text-slate-700 leading-none">{totalItemsCount}</span>
              <span className="text-[9px] text-slate-400 font-medium mt-0.5">TOTAL</span>
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
          {[
            { label: "Berjalan (On Going)", count: onGoingCount, color: "bg-emerald-500" },
            { label: "Ditunda (On Hold)", count: onHoldCount, color: "bg-amber-500" },
            { label: "Dibatalkan", count: cancelledCount, color: "bg-red-500" },
          ].map(({ label, count, color }) => (
            <div key={label} className="flex items-center justify-between text-[12px]">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />
                <span className="text-slate-600 font-medium">{label}</span>
              </div>
              <span className="font-bold text-slate-700">{count}</span>
            </div>
          ))}
        </div>

        {/* CTA Card */}
        <div className="relative overflow-hidden rounded-xl bg-[#0a4d8c] px-4 py-4 text-white shadow-sm">
          <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full border-[16px] border-blue-300/15" />
          <div className="pointer-events-none absolute -bottom-10 right-4 h-20 w-20 rounded-full border-[12px] border-blue-300/10" />
          <div className="relative z-10">
            <p className="text-[12px] font-semibold leading-snug">
              Daftarkan pekerjaan baru ke sistem
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-blue-100">
              Buat request dan pantau progresnya dari sini.
            </p>
            <button
              onClick={onAddRequest}
              className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-lg bg-white py-2 text-[11px] font-bold text-[#0a4d8c] shadow-sm transition hover:bg-blue-50 active:scale-95"
            >
              <Plus size={12} strokeWidth={2.5} />
              Tambah Pengadaan
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
