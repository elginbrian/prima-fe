import { ShieldCheck, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import type { VendorRiskDto } from "@/lib/api/procurement.api";
import { formatRupiah } from "./utils";

interface VendorRiskTableProps {
  vendorRiskIndex: VendorRiskDto[];
}

export function VendorRiskTable({ vendorRiskIndex }: VendorRiskTableProps) {
  return (
    <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-cyan-700" size={18} />
          <h3 className="text-sm font-bold text-slate-800">
            Vendor Risk Index & Garansi Bank (Modul D2)
          </h3>
        </div>
        <span className="text-[11px] font-semibold text-slate-500">Evaluasi Eksposur Vendor</span>
      </div>

      <div className="p-0 overflow-x-auto flex-1">
        {vendorRiskIndex.length === 0 ? (
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
              {vendorRiskIndex.map((v, i) => {
                const isHigh = v.risk_level === "High";
                const isMed = v.risk_level === "Medium";
                return (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-slate-800">{v.vendor_name}</td>
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
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isHigh
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : isMed
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
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
  );
}
