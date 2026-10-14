"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Clock, AlertTriangle, CheckCircle2, User, Building2, Calendar, ArrowRight, Target, ShieldAlert, Send } from "lucide-react";
import { DeadlineItem } from "@/types";
import { useProcurement } from "@/context/ProcurementContext";
import { useUpdateDeadline, useProcurements, useEscalateDeadline, useSubmitRecoveryPlan } from "@/lib/query/hooks";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { getErrorMessage } from "@/lib/api/errors";

interface SLAActionModalProps {
  deadline: DeadlineItem;
  onClose: () => void;
}

const STATUS_MAP = {
  "On Track": { label: "On Track", color: "bg-blue-50 text-[#0a4d8c] border-blue-200", icon: <CheckCircle2 size={14} /> },
  "At Risk": { label: "At Risk", color: "bg-amber-50 text-amber-700 border-amber-200", icon: <AlertTriangle size={14} /> },
  "Overdue": { label: "Overdue", color: "bg-red-50 text-red-700 border-red-200", icon: <AlertTriangle size={14} /> },
  "Selesai": { label: "Selesai", color: "bg-slate-100 text-slate-700 border-slate-200", icon: <CheckCircle2 size={14} /> },
};

const URGENCY_MAP = {
  "Critical": "bg-red-100 text-red-800 border-red-300",
  "High": "bg-orange-50 text-orange-700 border-orange-200",
  "Medium": "bg-amber-50 text-amber-700 border-amber-200",
  "Low": "bg-slate-50 text-slate-600 border-slate-200",
};

export function SLAActionModal({ deadline, onClose }: SLAActionModalProps) {
  const { state } = useProcurement();
  const { data: procurements = [] } = useProcurements();
  const updateDeadline = useUpdateDeadline();
  const escalateDeadline = useEscalateDeadline();
  const submitRecoveryPlan = useSubmitRecoveryPlan();
  const toast = useToast();

  const [showEscalateForm, setShowEscalateForm] = useState(false);
  const [escalateReason, setEscalateReason] = useState("");
  const [escalateTo, setEscalateTo] = useState("Manager Pengadaan Korporat");

  const [recoveryPlanText, setRecoveryPlanText] = useState(deadline.recoveryPlan || "");
  const [recoveryTargetDate, setRecoveryTargetDate] = useState(deadline.recoveryDate ? deadline.recoveryDate.split("T")[0] : "");
  const [isSubmittingRecovery, setIsSubmittingRecovery] = useState(false);

  const linkedRequest = procurements.find(r => r.id === deadline.requestId) || state.requests.find(r => r.id === deadline.requestId);
  const statusMeta = STATUS_MAP[deadline.status] ?? STATUS_MAP["On Track"];

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleMarkDone = async () => {
    try {
      await updateDeadline.mutateAsync({ id: deadline.id, payload: { status: "Selesai" } });
      toast.success(`SLA "${deadline.taskName}" berhasil ditandai Selesai`);
      onClose();
    } catch (err) {
      toast.error(`Gagal memperbarui SLA: ${getErrorMessage(err)}`);
    }
  };

  const handleEscalateToRisk = async () => {
    try {
      await updateDeadline.mutateAsync({ id: deadline.id, payload: { status: "At Risk" } });
      toast.warning(`SLA "${deadline.taskName}" telah diubah ke status At Risk`);
      onClose();
    } catch (err) {
      toast.error(`Gagal memperbarui SLA: ${getErrorMessage(err)}`);
    }
  };

  const handleManagerEscalation = async () => {
    if (!escalateReason.trim()) {
      toast.warning("Mohon isi alasan eskalasi ke manajerial.");
      return;
    }
    try {
      await escalateDeadline.mutateAsync({
        id: deadline.id,
        payload: { escalated_to: escalateTo, reason: escalateReason },
      });
      toast.success(`Tugas berhasil dieskalasi ke ${escalateTo}`);
      setShowEscalateForm(false);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal melakukan eskalasi"));
    }
  };

  const handleSaveRecoveryPlan = async () => {
    if (!recoveryPlanText.trim() || !recoveryTargetDate) {
      toast.warning("Mohon isi deskripsi rencana pemulihan dan target tanggal.");
      return;
    }
    setIsSubmittingRecovery(true);
    try {
      await submitRecoveryPlan.mutateAsync({
        id: deadline.id,
        payload: {
          recovery_plan: recoveryPlanText.trim(),
          recovery_date: new Date(recoveryTargetDate).toISOString(),
        },
      });
      toast.success("Action Recovery Plan berhasil disimpan.");
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal menyimpan recovery plan"));
    } finally {
      setIsSubmittingRecovery(false);
    }
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
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusMeta.color}`}>
              {statusMeta.icon}
              {statusMeta.label}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border uppercase tracking-wide ${URGENCY_MAP[deadline.urgencyLevel] ?? URGENCY_MAP["Low"]}`}>
              {deadline.urgencyLevel}
            </span>
            {deadline.isEscalated && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border bg-rose-100 text-rose-800 border-rose-300">
                <ShieldAlert size={13} /> DIESKALASI KE MANAJER
              </span>
            )}
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

          {/* Managerial Escalation & Recovery Plan Section */}
          {deadline.isEscalated && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <ShieldAlert size={18} className="text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold text-rose-900">Eskalasi Manajerial Aktif</div>
                  <div className="text-rose-700">
                    Dialihkan ke <span className="font-semibold">{deadline.escalatedTo || "Manager Pengadaan"}</span>
                    {deadline.escalatedAt && ` pada ${deadline.escalatedAt.split("T")[0]}`}.
                  </div>
                </div>
              </div>

              {/* Action Recovery Plan Form */}
              <div className="mt-2 space-y-2 border-t border-rose-200/80 pt-3">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-rose-800">
                  Rencana Pemulihan SLA (Recovery Action Plan)
                </span>
                <textarea
                  value={recoveryPlanText}
                  onChange={(e) => setRecoveryPlanText(e.target.value)}
                  placeholder="Jelaskan langkah mitigasi, penambahan tim, atau strategi percepatan..."
                  rows={2}
                  className="w-full rounded-lg border border-rose-200 bg-white p-2.5 text-xs text-slate-700 focus:border-[#0a4d8c] focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={recoveryTargetDate}
                    onChange={(e) => setRecoveryTargetDate(e.target.value)}
                    className="flex-1 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-[#0a4d8c] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSaveRecoveryPlan}
                    disabled={isSubmittingRecovery}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmittingRecovery ? (
                      <>
                        <Spinner size="xs" className="border-white border-t-transparent" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Send size={12} />
                        <span>Simpan Plan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Manual Escalation Form Modal inline */}
          {showEscalateForm && !deadline.isEscalated && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} className="text-amber-700 shrink-0" />
                <span className="text-xs font-bold text-amber-900">Eskalasi Manual ke Manajer</span>
              </div>
              <label className="block text-xs">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-amber-800">Tujuan Eskalasi</span>
                <select
                  value={escalateTo}
                  onChange={(e) => setEscalateTo(e.target.value)}
                  className="w-full rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
                >
                  <option value="Manager Pengadaan Korporat">Manager Pengadaan Korporat</option>
                  <option value="VP Procurement Strategy">VP Procurement Strategy</option>
                  <option value="Senior Manager Risk & Compliance">Senior Manager Risk & Compliance</option>
                </select>
              </label>
              <label className="block text-xs">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-amber-800">Alasan Eskalasi</span>
                <textarea
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  placeholder="Tuliskan kendala teknis atau alasan keterlambatan..."
                  rows={2}
                  className="w-full rounded-lg border border-amber-200 bg-white p-2.5 text-xs text-slate-700 focus:outline-none"
                />
              </label>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowEscalateForm(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-amber-100/60"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleManagerEscalation}
                  disabled={escalateDeadline.isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-amber-700 disabled:opacity-50"
                >
                  {escalateDeadline.isPending ? (
                    <>
                      <Spinner size="xs" className="border-white border-t-transparent" />
                      <span>Mengirim...</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert size={13} />
                      <span>Kirim ke Manajer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

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
          <div className="flex flex-wrap items-center gap-2">
            {!deadline.isEscalated && deadline.status !== "Selesai" && !showEscalateForm && (
              <button
                type="button"
                onClick={() => setShowEscalateForm(true)}
                className="flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100"
              >
                <ShieldAlert size={14} />
                Eskalasi ke Manajer
              </button>
            )}
            {deadline.status !== "Overdue" && deadline.status !== "Selesai" && (
              <button
                type="button"
                onClick={handleEscalateToRisk}
                disabled={updateDeadline.isPending}
                className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50"
              >
                <AlertTriangle size={14} />
                Tandai At Risk
              </button>
            )}
            {deadline.status !== "Selesai" && (
              <button
                type="button"
                onClick={handleMarkDone}
                disabled={updateDeadline.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-[#0a4d8c] px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#093e6f] disabled:opacity-50"
              >
                {updateDeadline.isPending ? (
                  <>
                    <Spinner size="xs" className="border-white border-t-transparent" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Tandai Selesai</span>
                  </>
                )}
              </button>
            )}
            {deadline.status === "Selesai" && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-[#0a4d8c]">
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
