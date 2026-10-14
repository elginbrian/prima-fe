import { ActionStatsProps } from "./types";

export function ActionStats({ totalCount, highCount, mediumCount, lowCount, highPct, mediumPct }: ActionStatsProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
      {/* Total Actions */}
      <div className="p-5 flex-1 flex items-center justify-between">
        <div>
          <div className="text-[13px] font-medium text-slate-500 mb-1 uppercase tracking-wider">Total Tindakan</div>
          <div className="text-3xl font-black text-[#0a4d8c]">{totalCount}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Tugas yang belum selesai</div>
        </div>
        <div className="w-14 h-14 rounded-full relative shadow-[inset_0_2px_8px_rgba(0,0,0,0.06)]" style={{
          background: `conic-gradient(#ef4444 0% ${highPct}%, #0a4d8c ${highPct}% ${highPct + mediumPct}%, #10b981 ${highPct + mediumPct}% 100%)`
        }}>
          <div className="absolute inset-2 bg-white rounded-full"></div>
        </div>
      </div>

      {/* High Priority */}
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[13px] font-medium text-slate-500 mb-1 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
              High Priority
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-2">{highCount}</div>
          </div>
          <div className="bg-red-50 text-red-700 text-xs font-medium px-2.5 py-0.5 rounded-full border border-red-100">
            {highPct.toFixed(0)}%
          </div>
        </div>
        <div className="text-[11px] text-slate-400 mt-1 font-medium">Butuh perhatian segera</div>
      </div>

      {/* Medium Priority */}
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[13px] font-medium text-slate-500 mb-1 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#0a4d8c]"></div>
              Medium Priority
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-2">{mediumCount}</div>
          </div>
          <div className="bg-blue-50 text-[#0a4d8c] text-xs font-medium px-2.5 py-0.5 rounded-full border border-blue-100">
            {mediumPct.toFixed(0)}%
          </div>
        </div>
        <div className="text-[11px] text-slate-400 mt-1 font-medium">Tugas operasional rutin</div>
      </div>

      {/* Low Priority */}
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[13px] font-medium text-slate-500 mb-1 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>
              Low Priority
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-2">{lowCount}</div>
          </div>
          <div className="bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-0.5 rounded-full border border-slate-200">
            {(100 - highPct - mediumPct).toFixed(0)}%
          </div>
        </div>
        <div className="text-[11px] text-slate-400 mt-1 font-medium">Tidak mendesak</div>
      </div>
    </div>
  );
}
