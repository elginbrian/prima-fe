"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Clock, AlertTriangle, CheckCircle2, User, Building2, Calendar, ArrowRight, Target } from "lucide-react";
import { DeadlineItem } from "@/types";
import { useProcurement } from "@/context/ProcurementContext";
import { useUpdateDeadline } from "@/lib/query/hooks/procurement/useDeadlines";

interface SLAActionModalProps {
  deadline: DeadlineItem;
  onClose: () => void;
}

const STATUS_MAP = {
  "On Track": { label: "On Track", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 size={14} /> },
  "At Risk": { label: "At Risk", color: "bg-amber-50 text-amber-700 border-amber-200", icon: <AlertTriangle size={14} /> },
  "Overdue": { label: "Overdue", color: "bg-red-50 text-red-700 border-red-200", icon: <AlertTriangle size={14} /> },
  "Selesai": { label: "Selesai", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 size={14} /> },
};

const URGENCY_MAP = {
  "Critical": "bg-red-100 text-red-800 border-red-300",
  "High": "bg-orange-50 text-orange-700 border-orange-200",
  "Medium": "bg-amber-50 text-amber-700 border-amber-200",
  "Low": "bg-slate-50 text-slate-600 border-slate-200",
};

export function SLAActionModal({ deadline, onClose }: SLAActionModalProps) {
  const { state } = useProcurement();
  const updateDeadline = useUpdateDeadline();

  const linkedRequest = state.requests.find(r => r.id === deadline.requestId);
  const statusMeta = STATUS_MAP[deadline.status] ?? STATUS_MAP["On Track"];

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleMarkDone = () => {
    updateDeadline.mutate({ id: deadline.id, payload: { status: "Selesai" } });
    onClose();
  };

  const handleEscalate = () => {
    updateDeadline.mutate({ id: deadline.id, payload: { status: "At Risk" } });
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex min-h-dvh items-center justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-6 sm:p-8 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300 ease-out"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-start justify-between px-6 py-5 gap-4 border-b border-slate-100 ${deadline.status === "Overdue" ? "bg-red-50" : deadline.status === "At Risk" ? "bg-amber-50" : "bg-white"}`}>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={15} className={deadline.status === "Overdue" ? "text-red-500" : deadline.status === "At Risk" ? "text-amber-600" : "text-slate-400"} />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">SLA / Deadline Pekerjaan</span>
            </div>
            <h2 className="text-base font-bold text-slate-800 truncate">{deadline.taskName}</h2>
            {linkedRequest && (
              <p className="mt-1 text-xs text-slate-500 truncate">{linkedRequest.title} · {linkedRequest.id}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-slate-400 transition-colors hover:bg-white hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Status & Urgency badges */}
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusMeta.color}`}>
              {statusMeta.icon}
              {statusMeta.label}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border uppercase tracking-wide ${URGENCY_MAP[deadline.urgencyLevel] ?? URGENCY_MAP["Low"]}`}>
              {deadline.urgencyLevel}
            </span>
          </div>

          {/* Detail fields */}
          <div className="grid grid-cols-2 gap-4 text-[13px]">
            <div className="flex items-start gap-2">
              <User size={14} className="text-slate-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-[11px] text-slate-400 uppercase tracking-wide font-semibold mb-0.5">PIC</div>
                <div className="font-medium text-slate-700">{deadline.pic.name}</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Building2 size={14} className="text-slate-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-[11px] text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Departemen</div>
                <div className="font-medium text-slate-700">{deadline.department.name}</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar size={14} className="text-slate-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-[11px] text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Target Selesai</div>
                <div className={`font-semibold ${deadline.status === "Overdue" ? "text-red-600" : "text-slate-700"}`}>{deadline.targetDate}</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Target size={14} className="text-slate-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-[11px] text-slate-400 uppercase tracking-wide font-semibold mb-0.5">Milestone</div>
                <div className="font-medium text-slate-700">{deadline.milestone}</div>
              </div>
            </div>
          </div>

          {/* Next Action */}
          {deadline.nextAction && (
            <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#0a4d8c] mb-1">Rekomendasi Tindak Lanjut</div>
              <p className="text-[13px] text-slate-700 leading-relaxed">{deadline.nextAction}</p>
            </div>
          )}

          {/* Overdue reason */}
          {deadline.overdueReason && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-red-600 mb-1">Alasan Keterlambatan</div>
              <p className="text-[13px] text-red-700 leading-relaxed">{deadline.overdueReason}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-200/50"
          >
            Tutup
          </button>
          <div className="flex gap-2">
            {deadline.status !== "Overdue" && deadline.status !== "Selesai" && (
              <button
                type="button"
                onClick={handleEscalate}
                className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700 transition-colors hover:bg-amber-100"
              >
                <AlertTriangle size={14} />
                Tandai At Risk
              </button>
            )}
            {deadline.status !== "Selesai" && (
              <button
                type="button"
                onClick={handleMarkDone}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700"
              >
                <CheckCircle2 size={14} />
                Tandai Selesai
              </button>
            )}
            {deadline.status === "Selesai" && (
              <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                <CheckCircle2 size={16} /> SLA Sudah Selesai
              </span>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
