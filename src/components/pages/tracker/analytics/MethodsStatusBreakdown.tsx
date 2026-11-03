interface MethodsStatusBreakdownProps {
  methodsBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  totalProcurements: number;
}

export function MethodsStatusBreakdown({
  methodsBreakdown,
  statusBreakdown,
  totalProcurements,
}: MethodsStatusBreakdownProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between">
      <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
        <h3 className="text-sm font-medium text-slate-800">Metode & Status Pekerjaan</h3>
      </div>

      <div className="p-5 space-y-5">
        <div>
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-2.5">
            Metode Pengadaan
          </span>
          <div className="space-y-2.5">
            {Object.entries(methodsBreakdown).map(([method, count]) => {
              const percent =
                totalProcurements > 0 ? Math.round((count / totalProcurements) * 100) : 0;
              return (
                <div key={method} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-normal">{method}</span>
                    <span className="font-medium text-slate-700">
                      {count} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-[#0a4d8c] h-full" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-2.5">
            Status Operasional
          </span>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-200">
              <span className="text-lg font-semibold text-[#0a4d8c] block">
                {statusBreakdown["On Going"] ?? 0}
              </span>
              <span className="text-[11px] text-[#0a4d8c] font-normal">Berjalan</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-lg font-semibold text-slate-700 block">
                {statusBreakdown["On Hold"] ?? 0}
              </span>
              <span className="text-[11px] text-slate-500 font-normal">Ditunda</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-lg font-semibold text-slate-700 block">
                {statusBreakdown["Batal"] ?? 0}
              </span>
              <span className="text-[11px] text-slate-500 font-normal">Dibatalkan</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3.5 bg-slate-50/60 border-t border-slate-100 text-[11px] text-slate-400 text-center">
        Data teragregasi secara otomatis dari daftar pekerjaan.
      </div>
    </div>
  );
}
