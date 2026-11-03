"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Shield,
  FileText,
  Clock,
} from "lucide-react";
import { ActionItem } from "@/types";
import { useProcurement } from "@/context/ProcurementContext";
import { useGuarantees } from "@/lib/query/hooks/procurement/useGuarantees";
import {
  useDeadlines,
  useDocuments,
  useProcurements,
} from "@/lib/query/hooks/procurement/useProcurement";

import { ActionRowProps } from "./types";
import { formatDateIndo, formatRequestCode } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { GuaranteeEditModal } from "@/components/widgets/modals/GuaranteeEditModal";
import { DocumentActionModal } from "@/components/widgets/modals/DocumentActionModal";
import { SLAActionModal } from "@/components/widgets/modals/SLAActionModal";

export function ActionRow({ item, onOpenRequestDetail }: ActionRowProps) {
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

  const linkedDoc = documents.find((d) => d.id === item.referenceId);
  const linkedGuarantee = guarantees.find((g) => g.id === item.referenceId);
  const linkedDeadline = deadlines.find((d) => d.id === item.referenceId);
  const linkedRequest =
    procurements.find((r) => r.id === item.requestId) ||
    state.requests.find((r) => r.id === item.requestId);

  const getStatusBadge = (status: ActionItem["status"]) => {
    switch (status) {
      case "Done":
        return "bg-slate-100 text-slate-600 border-slate-200";
      case "In Progress":
        return "bg-blue-50 text-[#0a4d8c] border-blue-200";
      case "Cancelled":
        return "bg-slate-100 text-slate-500 border-slate-200";
      case "Pending":
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  const getStatusLabel = (status: ActionItem["status"]) => {
    switch (status) {
      case "Done":
        return "Selesai";
      case "In Progress":
        return "Dalam Proses";
      case "Cancelled":
        return "Dibatalkan";
      case "Pending":
      default:
        return "Menunggu";
    }
  };

  const getPriorityBadge = (priority: ActionItem["priority"]) => {
    switch (priority) {
      case "High":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-normal bg-blue-50 text-[#0a4d8c] border border-blue-200">
            Prioritas Utama
          </span>
        );
      case "Medium":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-normal bg-slate-100 text-slate-600 border border-slate-200">
            Sedang
          </span>
        );
      case "Low":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-normal bg-slate-50 text-slate-500 border border-slate-200">
            Normal
          </span>
        );
    }
  };

  const getSourceIcon = () => {
    switch (item.source) {
      case "Dokumen":
        return <FileText size={13} className="text-[#0a4d8c] shrink-0" />;
      case "Jaminan":
        return <Shield size={13} className="text-[#0a4d8c] shrink-0" />;
      case "Deadline":
        return <Clock size={13} className="text-slate-500 shrink-0" />;
      default:
        return <Clock size={13} className="text-slate-400 shrink-0" />;
    }
  };

  return (
    <>
      <tr
        onClick={() => setIsExpanded(!isExpanded)}
        className={`transition-colors hover:bg-slate-50/80 cursor-pointer ${
          isExpanded ? "bg-slate-50/60" : ""
        }`}
      >
        <td className="px-5 py-3.5 max-w-[320px]">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-800 text-xs sm:text-[13px] truncate">
              {item.title}
            </span>
            {linkedDeadline?.isEscalated && (
              <span className="inline-flex shrink-0 items-center rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-normal text-[#0a4d8c] border border-blue-200">
                Eskalasi
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
            <span className="font-mono">{item.referenceId}</span>
            {linkedRequest && (
              <>
                <span>·</span>
                <span className="truncate text-slate-500">{linkedRequest.title}</span>
              </>
            )}
          </div>
        </td>
        <td className="px-4 py-3.5 whitespace-nowrap">
          <div className="flex items-center gap-1.5 text-xs font-normal text-slate-600">
            {getSourceIcon()}
            {item.source}
          </div>
        </td>
        <td className="px-4 py-3.5 whitespace-nowrap text-xs font-normal text-slate-600">
          <div className="inline-flex items-center gap-2">
            <UserAvatar name={item.assignee?.name} userId={item.assignee?.id} size="xs" />
            <span>{item.assignee?.name || "-"}</span>
          </div>
        </td>
        <td className="px-4 py-3.5 whitespace-nowrap">
          <div className="text-xs font-normal text-slate-600">{formatDateIndo(item.dueDate)}</div>
          <div className="mt-1">{getPriorityBadge(item.priority)}</div>
        </td>
        <td className="px-5 py-3.5 whitespace-nowrap">
          <div className="flex items-center justify-between gap-3">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-normal border ${getStatusBadge(
                item.status
              )}`}
            >
              {getStatusLabel(item.status)}
            </span>
            <div className="text-slate-400">
              {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </div>
          </div>
        </td>
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={5} className="p-0 border-b border-slate-200">
            <div className="px-6 py-4 bg-slate-50/60 border-l-2 border-l-[#0a4d8c]">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertCircle size={14} className="text-slate-400 shrink-0" />
                    <span className="text-xs font-medium text-slate-700">Rincian Tindak Lanjut</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-5">
                    {item.description}
                  </p>
                  {linkedRequest && (
                    <div className="mt-1.5 pl-5 text-[11px] text-slate-500">
                      Pekerjaan: {linkedRequest.title} ({formatRequestCode(linkedRequest.id)})
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {item.source === "Dokumen" &&
                    (linkedDoc ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDocumentModal(true);
                        }}
                        className="inline-flex items-center gap-1.5 bg-[#0a4d8c] hover:bg-[#093e6f] text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      >
                        <FileText size={13} />
                        <span>Tinjau Dokumen</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push("/dashboard/documents");
                        }}
                        className="inline-flex items-center gap-1.5 border border-slate-200 bg-white text-slate-700 hover:border-[#0a4d8c] hover:text-[#0a4d8c] px-3 py-1.5 rounded-lg text-xs font-normal transition-colors"
                      >
                        <FileText size={13} />
                        <span>Buka Dokumen</span>
                      </button>
                    ))}

                  {item.source === "Jaminan" && linkedGuarantee && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowGuaranteeModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 bg-[#0a4d8c] hover:bg-[#093e6f] text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Shield size={13} />
                      <span>Perbarui Jaminan</span>
                    </button>
                  )}

                  {(item.source === "Deadline" || item.source === "SLA/Jatuh Tempo") &&
                    linkedDeadline && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowSlaModal(true);
                        }}
                        className="inline-flex items-center gap-1.5 bg-[#0a4d8c] hover:bg-[#093e6f] text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      >
                        <ArrowRight size={13} />
                        <span>Perbarui SLA</span>
                      </button>
                    )}

                  {linkedRequest && onOpenRequestDetail && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenRequestDetail(linkedRequest.id);
                      }}
                      className="inline-flex items-center gap-1.5 border border-slate-200 bg-white text-slate-600 hover:border-[#0a4d8c] hover:text-[#0a4d8c] px-3 py-1.5 rounded-lg text-xs font-normal transition-colors"
                    >
                      <ExternalLink size={12} />
                      <span>Buka Pekerjaan</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}

      {showGuaranteeModal && linkedGuarantee && (
        <GuaranteeEditModal
          guarantee={linkedGuarantee}
          onClose={() => setShowGuaranteeModal(false)}
        />
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
