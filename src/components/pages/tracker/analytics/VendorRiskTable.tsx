import { ShieldCheck } from "lucide-react";
import type { VendorRiskDto } from "@/lib/api/procurement.api";
import { formatRupiah } from "./utils";

interface VendorRiskTableProps {
  vendorRiskIndex: VendorRiskDto[];
}

export function VendorRiskTable({ vendorRiskIndex }: VendorRiskTableProps) {
  return (
    <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-[#0a4d8c]" size={16} />
          <h3 className="text-sm font-medium text-slate-800">
            Evaluasi Eksposur Vendor & Warkat Jaminan
          </h3>
        </div>
        <span className="text-[11px] font-normal text-slate-400">Ringkasan per Vendor</span>
      </div>

      <div className="p-0 overflow-x-auto flex-1">
        {vendorRiskIndex.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Belum ada data warkat jaminan terdaftar untuk evaluasi vendor.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] uppercase font-medium text-slate-500 tracking-wider">
                <th className="py-2.5 px-4">Nama Vendor</th>
                <th className="py-2.5 px-3 text-center">Jaminan</th>
                <th className="py-2.5 px-3">Total Nilai</th>
                <th className="py-2.5 px-3 text-center">Mendekati Jatuh Tempo</th>
                <th className="py-2.5 px-3 text-center">Klaim</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {vendorRiskIndex.map((v, i) => {
                const isHigh = v.risk_level === "High";
                const isMed = v.risk_level === "Medium";
                return (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-800">{v.vendor_name}</td>
                    <td className="py-3 px-3 text-center text-slate-600 font-normal">
                      {v.total_guarantees}
                    </td>
                    <td className="py-3 px-3 font-normal text-slate-700">
                      {formatRupiah(v.total_value)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {v.expiring_soon > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-normal text-[11px]">
                          {v.expiring_soon}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {v.claimed > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#0a4d8c] font-normal text-[11px]">
                          {v.claimed}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-normal border ${
                          isHigh || isMed
                            ? "bg-blue-50 text-[#0a4d8c] border-blue-200"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
                      >
                        {isHigh ? "Perlu Perhatian" : isMed ? "Pantauan" : "Aman"}
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
