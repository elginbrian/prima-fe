import { DocumentStatsProps } from "./types";

export function DocumentStats({ totalCount, readyCount, attnCount, notReadyCount, readyPct, attnPct }: DocumentStatsProps) {
  return (
    <div className="order-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
      {/* Total Documents */}
      <div className="p-5 flex-1 flex items-center justify-between">
        <div>
          <div className="text-[13px] font-medium text-slate-500 mb-1 uppercase tracking-wider">Total Dokumen</div>
          <div className="text-3xl font-black text-[#0a4d8c]">{totalCount}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Tercatat dalam sistem</div>
        </div>
        <div className="w-14 h-14 rounded-full relative shadow-[inset_0_2px_8px_rgba(0,0,0,0.06)]" style={{
          background: `conic-gradient(#10b981 0% ${readyPct}%, #0a4d8c ${readyPct}% ${readyPct + attnPct}%, #ef4444 ${readyPct + attnPct}% 100%)`
        }}>
          <div className="absolute inset-2 bg-white rounded-full"></div>
        </div>
      </div>

      {/* Ready */}
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[13px] font-medium text-slate-500 mb-1 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#0a4d8c]"></div>
              Lulus Verifikasi
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-2">{readyCount}</div>
          </div>
          <div className="bg-blue-50 text-[#0a4d8c] text-xs font-medium px-2.5 py-0.5 rounded-full border border-blue-100">
            {readyPct.toFixed(0)}%
          </div>
        </div>
        <div className="text-[11px] text-slate-400 mt-1 font-medium">Sesuai checklist DP3</div>
      </div>

      {/* Needs Attention */}
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[13px] font-medium text-slate-500 mb-1 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
              Catatan Review
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-2">{attnCount}</div>
          </div>
          <div className="bg-amber-50 text-amber-700 text-xs font-medium px-2.5 py-0.5 rounded-full border border-amber-100">
            {attnPct.toFixed(0)}%
          </div>
        </div>
        <div className="text-[11px] text-slate-400 mt-1 font-medium">Perlu perbaikan minor</div>
      </div>

      {/* Not Ready */}
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[13px] font-medium text-slate-500 mb-1 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
              Tindak Lanjut FPP
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-2">{notReadyCount}</div>
          </div>
          <div className="bg-red-50 text-red-700 text-xs font-medium px-2.5 py-0.5 rounded-full border border-red-100">
            {(100 - readyPct - attnPct).toFixed(0)}%
          </div>
        </div>
        <div className="text-[11px] text-slate-400 mt-1 font-medium">Dikembalikan ke fungsi peminta</div>
      </div>
    </div>
  );
}
