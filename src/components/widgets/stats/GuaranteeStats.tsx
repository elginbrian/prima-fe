import { GuaranteeStatsProps } from "./types";

export function GuaranteeStats({ totalCount, aktifCount, mendekatiCount, expiredCount, aktifPct, mendekatiPct }: GuaranteeStatsProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
      {/* Total Guarantees */}
      <div className="p-5 flex-1 flex items-center justify-between">
        <div>
          <div className="text-[13px] font-medium text-slate-500 mb-1 uppercase tracking-wider">Total Jaminan</div>
          <div className="text-3xl font-black text-[#0a4d8c]">{totalCount}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Tercatat dalam sistem</div>
        </div>
        <div className="w-14 h-14 rounded-full relative shadow-[inset_0_2px_8px_rgba(0,0,0,0.06)]" style={{
          background: `conic-gradient(#10b981 0% ${aktifPct}%, #0a4d8c ${aktifPct}% ${aktifPct + mendekatiPct}%, #ef4444 ${aktifPct + mendekatiPct}% 100%)`
        }}>
          <div className="absolute inset-2 bg-white rounded-full"></div>
        </div>
      </div>

      {/* Aktif */}
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[13px] font-medium text-slate-500 mb-1 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#0a4d8c]"></div>
              Aktif
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-2">{aktifCount}</div>
          </div>
          <div className="bg-blue-50 text-[#0a4d8c] text-xs font-medium px-2.5 py-0.5 rounded-full border border-blue-100">
            {aktifPct.toFixed(0)}%
          </div>
        </div>
        <div className="text-[11px] text-slate-400 mt-1 font-medium">Masa berlaku masih panjang</div>
      </div>

      {/* Mendekati Expiry */}
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[13px] font-medium text-slate-500 mb-1 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
              Mendekati Expiry
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-2">{mendekatiCount}</div>
          </div>
          <div className="bg-amber-50 text-amber-700 text-xs font-medium px-2.5 py-0.5 rounded-full border border-amber-100">
            {mendekatiPct.toFixed(0)}%
          </div>
        </div>
        <div className="text-[11px] text-slate-400 mt-1 font-medium">Kurang dari 30 hari</div>
      </div>

      {/* Expired */}
      <div className="p-5 flex-1">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[13px] font-medium text-slate-500 mb-1 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
              Expired
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-2">{expiredCount}</div>
          </div>
          <div className="bg-red-50 text-red-700 text-xs font-medium px-2.5 py-0.5 rounded-full border border-red-100">
            {(100 - aktifPct - mendekatiPct).toFixed(0)}%
          </div>
        </div>
        <div className="text-[11px] text-slate-400 mt-1 font-medium">Masa berlaku habis</div>
      </div>
    </div>
  );
}
