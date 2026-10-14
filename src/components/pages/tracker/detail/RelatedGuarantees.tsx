import React from "react";
import { ShieldCheck, ChevronRight, ChevronDown } from "lucide-react";
import type { GuaranteeItem } from "@/types";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

interface RelatedGuaranteesProps {
  guars: GuaranteeItem[];
  selectedRequestId: string | null;
  expandedRelatedId: string | null;
  setExpandedRelatedId: React.Dispatch<React.SetStateAction<string | null>>;
  router: AppRouterInstance;
}

export function RelatedGuarantees({
  guars,
  selectedRequestId,
  expandedRelatedId,
  setExpandedRelatedId,
  router,
}: RelatedGuaranteesProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2 text-[#0a4d8c] font-semibold text-sm">
          <ShieldCheck size={16} />
          Jaminan
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/guarantees")}
            className="text-[11px] font-medium text-slate-500 hover:text-[#0a4d8c] transition-colors flex items-center gap-1"
          >
            Lihat Semua <ChevronRight size={12} />
          </button>
          <button
            onClick={() =>
              router.push(`/dashboard/guarantees/upload?requestId=${selectedRequestId}`)
            }
            className="rounded-md bg-[#0a4d8c] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#093e6f]"
          >
            + Jaminan
          </button>
        </div>
      </div>
      {guars.length > 0 ? (
        <div className="space-y-2">
          {guars.map((g) => (
            <div key={g.id}>
              <button
                onClick={() =>
                  setExpandedRelatedId((current) =>
                    current === `guarantee-${g.id}` ? null : `guarantee-${g.id}`
                  )
                }
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-left transition hover:border-blue-200 hover:bg-blue-50/40"
              >
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-medium text-slate-800">
                    {g.vendor.name}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    {g.type} • Jatuh tempo: {g.expiryDate}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      g.status === "Aktif"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }`}
                  >
                    {g.status}
                  </span>
                  {expandedRelatedId === `guarantee-${g.id}` ? (
                    <ChevronDown size={15} className="text-slate-400" />
                  ) : (
                    <ChevronRight size={15} className="text-slate-400" />
                  )}
                </div>
              </button>
              {expandedRelatedId === `guarantee-${g.id}` && (
                <div className="border-x border-b border-slate-200 bg-white px-3 py-3 text-xs text-slate-600">
                  <div>
                    <span className="font-semibold">{g.referenceNo}</span> • {g.issuer} • Rp{" "}
                    {g.value.toLocaleString("id-ID")}
                  </div>
                  {g.nextAction && (
                    <div className="mt-2">
                      <span className="font-semibold text-[#0a4d8c]">Next Action:</span>{" "}
                      {g.nextAction}
                    </div>
                  )}
                  <button
                    onClick={() => router.push("/dashboard/guarantees")}
                    className="mt-3 font-semibold text-[#0a4d8c] hover:underline"
                  >
                    Buka modul jaminan
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-slate-500 italic py-2 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
          Tidak ada jaminan tertaut.
        </div>
      )}
    </div>
  );
}
