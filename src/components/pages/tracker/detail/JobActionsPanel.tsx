import React, { useState } from "react";
import { CheckSquare, ListTodo, FileText, Shield, Clock, ArrowRight } from "lucide-react";
import { useActions } from "@/lib/query/hooks/procurement/useActions";
import { useGuarantees } from "@/lib/query/hooks/procurement/useGuarantees";
import { useDeadlines, useDocuments } from "@/lib/query/hooks/procurement/useProcurement";
import { formatDateIndo } from "@/lib/utils";
import { GuaranteeEditModal } from "@/components/widgets/modals/GuaranteeEditModal";
import { DocumentActionModal } from "@/components/widgets/modals/DocumentActionModal";
import { SLAActionModal } from "@/components/widgets/modals/SLAActionModal";
import type { DocumentItem, GuaranteeItem, DeadlineItem } from "@/types";

interface JobActionsPanelProps {
  requestId: string;
  compact?: boolean;
}

export function JobActionsPanel({ requestId, compact = false }: JobActionsPanelProps) {
  const { data: allActions = [], isLoading } = useActions();
  const { data: guarantees = [] } = useGuarantees();
  const { data: deadlines = [] } = useDeadlines();
  const { data: documents = [] } = useDocuments();

  const [activeDoc, setActiveDoc] = useState<DocumentItem | null>(null);
  const [activeGuarantee, setActiveGuarantee] = useState<GuaranteeItem | null>(null);
  const [activeDeadline, setActiveDeadline] = useState<DeadlineItem | null>(null);

  const jobActions = allActions.filter((a) => a.requestId === requestId && a.status !== "Done");

  if (isLoading) return null;
  if (compact && jobActions.length === 0) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <ListTodo size={16} className="text-[#0a4d8c]" />
            <span>Daftar Tindak Lanjut Pekerjaan</span>
          </h4>
          <p className="mt-0.5 text-xs text-slate-500">
            Hal yang perlu diselesaikan terkait dokumen, masa berlaku jaminan, atau target waktu tahapan.
          </p>
        </div>
        <span className="rounded-full bg-[#e8f2fc] px-2.5 py-1 text-[11px] font-bold text-[#0a4d8c] border border-[#0a4d8c]/20">
          {jobActions.length} perlu tindak lanjut
        </span>
      </div>

      {jobActions.length > 0 ? (
        <div className="space-y-2.5">
          {jobActions.map((item) => {
            const linkedDoc = documents.find((d) => d.id === item.referenceId);
            const linkedGuarantee = guarantees.find((g) => g.id === item.referenceId);
            const linkedDeadline = deadlines.find((d) => d.id === item.referenceId);

            return (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 transition hover:border-[#0a4d8c]/30 hover:bg-white"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700">
                      {item.source === "Dokumen" ? (
                        <FileText size={11} className="text-[#0a4d8c]" />
                      ) : item.source === "Jaminan" ? (
                        <Shield size={11} className="text-[#0a4d8c]" />
                      ) : (
                        <Clock size={11} className="text-[#0a4d8c]" />
                      )}
                      {item.source}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        item.priority === "High"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-blue-50 text-[#0a4d8c] border border-blue-200"
                      }`}
                    >
                      Prioritas {item.priority === "High" ? "Tinggi" : item.priority === "Medium" ? "Sedang" : "Rendah"}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Batas waktu: <strong className="text-slate-700">{formatDateIndo(item.dueDate)}</strong>
                    </span>
                  </div>
                  <div className="mt-1.5 text-xs font-bold text-slate-800">{item.title}</div>
                  {item.description && (
                    <p className="mt-0.5 text-xs text-slate-600 line-clamp-2">{item.description}</p>
                  )}
                </div>

                <div className="shrink-0">
                  {item.source === "Dokumen" && linkedDoc && (
                    <button
                      type="button"
                      onClick={() => setActiveDoc(linkedDoc)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a4d8c] px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#093e6f] transition-colors"
                    >
                      <span>Tinjau Dokumen</span>
                      <ArrowRight size={13} />
                    </button>
                  )}
                  {item.source === "Jaminan" && linkedGuarantee && (
                    <button
                      type="button"
                      onClick={() => setActiveGuarantee(linkedGuarantee)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a4d8c] px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#093e6f] transition-colors"
                    >
                      <span>Perbarui Jaminan</span>
                      <ArrowRight size={13} />
                    </button>
                  )}
                  {(item.source === "Deadline" || item.source === "SLA/Jatuh Tempo") && linkedDeadline && (
                    <button
                      type="button"
                      onClick={() => setActiveDeadline(linkedDeadline)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a4d8c] px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#093e6f] transition-colors"
                    >
                      <span>Tindak Lanjuti SLA</span>
                      <ArrowRight size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-6 text-slate-500">
          <CheckSquare size={32} className="text-slate-300 mb-2" />
          <p className="text-xs font-bold text-slate-700">
            Seluruh tindak lanjut pada pekerjaan ini sudah terkendali
          </p>
        </div>
      )}

      {activeDoc && <DocumentActionModal doc={activeDoc} onClose={() => setActiveDoc(null)} />}
      {activeGuarantee && (
        <GuaranteeEditModal guarantee={activeGuarantee} onClose={() => setActiveGuarantee(null)} />
      )}
      {activeDeadline && (
        <SLAActionModal deadline={activeDeadline} onClose={() => setActiveDeadline(null)} />
      )}
    </section>
  );
}


