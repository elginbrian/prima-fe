import React from "react";
import { FileText, ChevronRight, ChevronDown } from "lucide-react";
import type { DocumentItem } from "@/types";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

interface RelatedDocumentsProps {
  docs: DocumentItem[];
  expandedRelatedId: string | null;
  setExpandedRelatedId: React.Dispatch<React.SetStateAction<string | null>>;
  router: AppRouterInstance;
}

export function RelatedDocuments({
  docs,
  expandedRelatedId,
  setExpandedRelatedId,
  router,
}: RelatedDocumentsProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2 text-[#0a4d8c] font-semibold text-sm">
          <FileText size={16} />
          Dokumen
        </div>
        <button
          onClick={() => router.push("/dashboard/documents")}
          className="text-[11px] font-medium text-slate-500 hover:text-[#0a4d8c] transition-colors flex items-center gap-1"
        >
          Ke Modul Dokumen <ChevronRight size={12} />
        </button>
      </div>
      {docs.length > 0 ? (
        <div className="space-y-2">
          {docs.map((d) => (
            <div key={d.id}>
              <button
                onClick={() =>
                  setExpandedRelatedId((current) =>
                    current === `doc-${d.id}` ? null : `doc-${d.id}`
                  )
                }
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-left transition hover:border-blue-200 hover:bg-blue-50/40"
              >
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-medium text-slate-800">{d.name}</div>
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    {d.type} • {d.uploadDate}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      d.status === "Lulus Verifikasi"
                        ? "bg-blue-50 text-[#0a4d8c] border-blue-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }`}
                  >
                    {d.status}
                  </span>
                  {expandedRelatedId === `doc-${d.id}` ? (
                    <ChevronDown size={15} className="text-slate-400" />
                  ) : (
                    <ChevronRight size={15} className="text-slate-400" />
                  )}
                </div>
              </button>
              {expandedRelatedId === `doc-${d.id}` && (
                <div className="border-x border-b border-slate-200 bg-white px-3 py-3 text-xs text-slate-600">
                  <div>
                    {d.issues.length > 0 ? d.issues.join(" ") : "Tidak ada temuan pemeriksaan."}
                  </div>
                  {d.nextAction && (
                    <div className="mt-2">
                      <span className="font-semibold text-[#0a4d8c]">Next Action:</span> {d.nextAction}
                    </div>
                  )}
                  <button
                    onClick={() => router.push(`/dashboard/documents/result?id=${d.id}`)}
                    className="mt-3 font-semibold text-[#0a4d8c] hover:underline"
                  >
                    Buka hasil pemeriksaan
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-slate-500 italic py-2 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
          Tidak ada dokumen tertaut.
        </div>
      )}
    </div>
  );
}
