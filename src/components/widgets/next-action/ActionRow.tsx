"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, AlertCircle, ArrowRight, ExternalLink, Shield, FileText, Clock, Flame } from "lucide-react";
import { ActionItem } from "@/types";
import { useProcurement } from "@/context/ProcurementContext";
import { useGuarantees } from "@/lib/query/hooks/procurement/useGuarantees";
import { useDeadlines, useDocuments, useProcurements } from "@/lib/query/hooks/procurement/useProcurement";

import { ActionRowProps } from "./types";
import { GuaranteeEditModal } from "@/components/widgets/modals/GuaranteeEditModal";
import { DocumentActionModal } from "@/components/widgets/modals/DocumentActionModal";
import { SLAActionModal } from "@/components/widgets/modals/SLAActionModal";

export function ActionRow({ item }: ActionRowProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showGuaranteeModal, setShowGuaranteeModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showSlaModal, setShowSlaModal] = useState(false);
  const { state } = useProcurement();
  const { data: procurements = [] } = useProcurements();
  const { data: guarantees = [] } = useGuarantees();
  const { data: deadlines = [] } = useDeadlines();
  const { data: documents = [] } = useDocuments();

  // Resolve the real document/guarantee/deadline object from state for the modal
  const linkedDoc = documents.find(d => d.id === item.referenceId);
  const linkedGuarantee = guarantees.find(g => g.id === item.referenceId);
  const linkedDeadline = deadlines.find(d => d.id === item.referenceId);
  const linkedRequest = procurements.find(r => r.id === item.requestId) || state.requests.find(r => r.id === item.requestId);

  const getStatusBadge = (status: ActionItem["status"]) => {
    switch (status) {
      case "Done": return "bg-blue-50 text-[#0a4d8c] border-blue-200";
      case "In Progress": return "bg-blue-50/80 text-[#0a4d8c] border-blue-200";
      case "Cancelled": return "bg-red-50 text-red-700 border-red-200";
      case "Pending":
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getPriorityBadge = (priority: ActionItem["priority"]) => {
    switch (priority) {
      case "High": return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-700 border border-red-200 uppercase tracking-wider">HIGH</span>;
      case "Medium": return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-[#0a4d8c] border border-blue-200 uppercase tracking-wider">MEDIUM</span>;
      case "Low": return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">LOW</span>;
    }
  };

  const getSourceIcon = () => {
    switch (item.source) {
      case "Dokumen": return <FileText size={13} className="text-[#0a4d8c] shrink-0" />;
      case "Jaminan": return <Shield size={13} className="text-[#0a4d8c] shrink-0" />;
      case "Deadline": return <Clock size={13} className="text-slate-500 shrink-0" />;
      default: return <Clock size={13} className="text-slate-400 shrink-0" />;
    }
  };

  return (
    <>
      {/* Row */}
      <tr
        onClick={() => setIsExpanded(!isExpanded)}
        className={`transition-colors hover:bg-slate-50 cursor-pointer ${isExpanded ? "bg-slate-50" : ""}`}
      >
        <td className="px-4 py-3 whitespace-nowrap max-w-[280px]">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-800 text-[13px] truncate">{item.title}</span>
            {linkedDeadline?.isEscalated && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-700">
                <Flame size={10} className="text-rose-600" />
                <span>ESKALASI</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#0a4d8c] mt-0.5">
            <ExternalLink size={10} />
            <span className="truncate">{item.referenceId}</span>
          </div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="flex items-center gap-1.5 text-[13px] text-slate-600">
            {getSourceIcon()}
            {item.source}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{item.actionType}</div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="text-[13px] text-slate-600">{item.assignee?.name || "Tidak ada assignee"}</div>
          {linkedRequest && <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[160px]">{linkedRequest.title}</div>}
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="text-[13px] text-slate-600">{item.dueDate}</div>
          <div className="mt-1">{getPriorityBadge(item.priority)}</div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="flex items-center justify-between gap-4">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(item.status)}`}>
              {item.status}
            </span>
            <div className="text-slate-400">
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>
        </td>
      </tr>

      {/* Expanded Details Panel */}
      {isExpanded && (
        <tr>
          <td colSpan={5} className="p-0 border-b border-slate-200">
            <div className={`px-6 py-5 bg-slate-50/50 border-l-4 ${item.priority === "High" ? "border-l-red-500" : item.priority === "Medium" ? "border-l-[#0a4d8c]" : "border-l-slate-300"}`}>
              <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">

                {/* Left: Description */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle size={15} className="text-slate-400 shrink-0" />
                    <h4 className="text-[13px] font-semibold text-slate-700">Deskripsi Tindakan</h4>
                  </div>
                  <p className="text-[13px] text-slate-600 leading-relaxed pl-6 break-words">
                    {item.description}
                  </p>
                  {linkedRequest && (
                    <div className="mt-3 pl-6 text-[12px] text-slate-500">
                      <span className="font-medium text-slate-600">Pengadaan: </span>{linkedRequest.title}
                      <span className="mx-1.5">·</span>
                      <span className="text-slate-500">{linkedRequest.id}</span>
                    </div>
                  )}
                </div>

                {/* Right: Action Buttons */}
                <div className="flex flex-col gap-2 lg:w-56 shrink-0">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Aksi Cepat</div>

                  {item.source === "Dokumen" && (
                    linkedDoc ? (
                      <button
                        onClick={e => { e.stopPropagation(); setShowDocumentModal(true); }}
                        className="w-full flex items-center justify-center gap-2 bg-[#0a4d8c] hover:bg-[#093e6f] text-white px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors shadow-sm"
                      >
                        <FileText size={14} />
                        Tinjau & Update Dokumen
                      </button>
                    ) : (
                      <button
                        onClick={e => { e.stopPropagation(); router.push('/dashboard/documents'); }}
                        className="w-full flex items-center justify-center gap-2 border border-[#0a4d8c] text-[#0a4d8c] hover:bg-blue-50 px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors shadow-sm"
                      >
                        <FileText size={14} />
                        Buka Modul Dokumen
                      </button>
                    )
                  )}

                  {item.source === "Jaminan" && (
                    linkedGuarantee ? (
                      <button
                        onClick={e => { e.stopPropagation(); setShowGuaranteeModal(true); }}
                        className="w-full flex items-center justify-center gap-2 bg-[#0a4d8c] hover:bg-[#093e6f] text-white px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors shadow-sm"
                      >
                        <Shield size={14} />
                        Perbarui Data Jaminan
                      </button>
                    ) : (
                      <button
                        onClick={e => { e.stopPropagation(); router.push('/dashboard/guarantees'); }}
                        className="w-full flex items-center justify-center gap-2 border border-[#0a4d8c] text-[#0a4d8c] hover:bg-blue-50 px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors shadow-sm"
                      >
                        <Shield size={14} />
                        Buka Modul Jaminan
                      </button>
                    )
                  )}

                  {(item.source === "Deadline" || item.source === "SLA/Jatuh Tempo") && (
                    linkedDeadline ? (
                      <button
                        onClick={e => { e.stopPropagation(); setShowSlaModal(true); }}
                        className="w-full flex items-center justify-center gap-2 bg-[#0a4d8c] hover:bg-[#093e6f] text-white px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors shadow-sm"
                      >
                        <ArrowRight size={14} />
                        Lihat Detail & Update SLA
                      </button>
                    ) : (
                      <button
                        onClick={e => { e.stopPropagation(); router.push('/dashboard/tracker'); }}
                        className="w-full flex items-center justify-center gap-2 border border-[#0a4d8c] text-[#0a4d8c] hover:bg-blue-50 px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors shadow-sm"
                      >
                        <ArrowRight size={14} />
                        Buka Tracker Pengadaan
                      </button>
                    )
                  )}
                </div>

              </div>
            </div>
          </td>
        </tr>
      )}

      {/* Modals */}
      {showGuaranteeModal && linkedGuarantee && (
        <GuaranteeEditModal guarantee={linkedGuarantee} onClose={() => setShowGuaranteeModal(false)} />
      )}
      {showDocumentModal && linkedDoc && (
        <DocumentActionModal doc={linkedDoc} onClose={() => setShowDocumentModal(false)} />
      )}
      {showSlaModal && linkedDeadline && (
        <SLAActionModal deadline={linkedDeadline} onClose={() => setShowSlaModal(false)} />
      )}
    </>
  );
}
