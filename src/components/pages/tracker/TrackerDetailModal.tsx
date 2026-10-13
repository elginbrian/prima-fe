import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LayoutList, X, CheckCircle2, FileText, ChevronRight, ChevronDown, ShieldCheck, CalendarClock, AlertTriangle, ShieldAlert, ArrowRightLeft } from "lucide-react";
import { ProcurementRequest, ProcurementOperationalStatus, ProcurementStep, DeadlineItem, DocumentItem, GuaranteeItem, HistoryItem, ProcurementMilestone } from "@/types";
import { useProcurement, useProcurementActivities, useProcurementGatekeeper, useAssignPic } from "@/lib/query/hooks/procurement/useProcurement";
import { useUsers } from "@/lib/query/hooks/users/useUsers";
import { useToast } from "@/components/ui/Toast";
import { getErrorMessage } from "@/lib/api/errors";

import { TrackerDetailModalProps } from "./types";

const PROCUREMENT_STEPS: ProcurementStep[] = [
  "Rapat Pra-Tender",
  "Pengumuman Pengadaan",
  "Prebid Meeting",
  "Pemasukan Dokumen Penawaran",
  "Pembukaan Penawaran",
  "Evaluasi Dokumen Penawaran",
  "Sosialisasi e-Auction",
  "Negosiasi e-Auction",
  "Negosiasi Manual",
  "Laporan Hasil Pemilihan",
  "Pengumuman Pemenang",
  "Penunjukan Pemenang",
];

export function TrackerDetailModal({
  selectedRequestId, setSelectedRequestId, request: initialRequest, milestones: initialMilestones, docs, guars, slas, history,
  showFullTimeline, setShowFullTimeline, statusReasonDraft, setStatusReasonDraft,
  moveRequestStep, updateRequestOperationalStatus, expandedRelatedId, setExpandedRelatedId,
  router, setAddingDeadlineRequestId, setEditingDeadlineId
}: TrackerDetailModalProps) {
  const { data: detailData, isLoading } = useProcurement(selectedRequestId);
  const { data: activitiesData } = useProcurementActivities(selectedRequestId || "");
  const { data: gatekeeperData } = useProcurementGatekeeper(selectedRequestId || "");
  const { data: usersList } = useUsers();
  const assignPicMutation = useAssignPic();
  const toast = useToast();

  const [pendingStep, setPendingStep] = useState<ProcurementStep | null>(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [isOverriding, setIsOverriding] = useState(false);

  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [targetPicId, setTargetPicId] = useState("");
  const [handoverNotes, setHandoverNotes] = useState("");
  const [isSubmittingHandover, setIsSubmittingHandover] = useState(false);
  
  const request = detailData?.request ?? initialRequest;
  const milestones = detailData?.milestones ?? initialMilestones;

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedRequestId(null); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [setSelectedRequestId]);

  if (typeof document === 'undefined') return null;

  const currentMilestoneIndex = milestones.findIndex(m => m.status === "In Progress");
  const nextMilestone = milestones.find(m => m.status === "Pending");
  const completedMilestones = milestones.filter(m => m.status === "Done").length;
  const timelineStart = showFullTimeline ? 0 : Math.max(0, currentMilestoneIndex > -1 ? currentMilestoneIndex - 1 : 0);
  const visibleMilestones = showFullTimeline ? milestones : milestones.slice(timelineStart, timelineStart + 3);
  const hasHiddenMilestones = !showFullTimeline && milestones.length > visibleMilestones.length;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex min-h-dvh items-center justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300" onClick={() => setSelectedRequestId(null)}>
      <div role="dialog" aria-modal="true" aria-labelledby="tracker-detail-title" className="flex max-h-[calc(100dvh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300 ease-out" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-6 py-5 sm:px-8">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-slate-500">
              <LayoutList size={18} />
              <span className="text-[11px] font-bold uppercase tracking-[0.16em]">Ringkasan Pekerjaan</span>
            </div>
            <h3 id="tracker-detail-title" className="mt-2 truncate text-lg font-bold text-slate-800">{request?.title ?? selectedRequestId}</h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-medium text-slate-500">
              <span className="font-mono text-slate-600">{selectedRequestId}</span>
              {request && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                  {request.procurementMethod || "Tender Terbuka"}
                </span>
              )}
              {request && (
                <div className="flex items-center gap-2">
                  <span>PIC: <strong className="text-slate-700">{request.pic.name}</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetPicId("");
                      setHandoverNotes("");
                      setShowHandoverModal(true);
                    }}
                    className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#0a4d8c] transition hover:bg-blue-100 border border-blue-200 shadow-2xs"
                    title="Delegasikan tanggung jawab ke PIC lain"
                  >
                    <ArrowRightLeft size={11} />
                    <span>Delegasi PIC</span>
                  </button>
                </div>
              )}
              {request && <span>Rp {typeof request.amount === 'number' ? request.amount.toLocaleString('id-ID') : request.amount}</span>}
            </div>
          </div>
          <button aria-label="Tutup detail request" onClick={() => setSelectedRequestId(null)} className="shrink-0 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 space-y-8 overflow-y-auto p-6 sm:p-8">
          {request && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#0a4d8c]">Posisi proses saat ini</div>
                  <div className="mt-1 text-lg font-bold text-slate-800">{request.currentStep}</div>
                  <div className="mt-1 text-xs text-slate-500">Stage ringkas: {request.stage} · {completedMilestones} dari {milestones.length} tahap selesai</div>
                </div>
                <label className="w-full lg:w-72">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Update tahap manual</span>
                  <select
                    value={request.currentStep}
                    onChange={async (event) => {
                      const targetStep = event.target.value as ProcurementStep;
                      if (targetStep === request.currentStep) return;
                      if (gatekeeperData && !gatekeeperData.is_ready_to_advance) {
                        setPendingStep(targetStep);
                        setOverrideReason("");
                        return;
                      }
                      try {
                        await moveRequestStep(selectedRequestId, targetStep);
                        toast.success(`Tahap berhasil dipindahkan ke '${targetStep}'.`);
                      } catch (err) {
                        toast.error(getErrorMessage(err, "Gagal memindahkan tahap."));
                      }
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-[#0a4d8c] focus:outline-none"
                  >
                    {(milestones.length > 0 ? milestones.map(m => m.step) : PROCUREMENT_STEPS).map(step => (
                      <option key={step} value={step}>{step}</option>
                    ))}
                  </select>
                </label>
                <label className="w-full lg:w-44">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Status pekerjaan</span>
                  <select
                    value={request.operationalStatus}
                    onChange={(event) => updateRequestOperationalStatus(selectedRequestId, event.target.value as ProcurementOperationalStatus, event.target.value === "On Going" ? "" : statusReasonDraft)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-[#0a4d8c] focus:outline-none"
                  >
                    <option value="On Going">On Going</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Batal">Batal</option>
                  </select>
                </label>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/80"><div className="h-full rounded-full bg-[#0a4d8c] transition-all" style={{ width: `${milestones.length ? ((completedMilestones + (currentMilestoneIndex >= 0 ? 1 : 0)) / milestones.length) * 100 : 0}%` }} /></div>

              {/* Gatekeeper Prerequisite & Quality Gate Card */}
              {gatekeeperData && (
                <div className={`mt-4 rounded-xl border p-4 text-xs transition-all ${
                  gatekeeperData.is_ready_to_advance
                    ? "border-emerald-200 bg-emerald-50/70 text-emerald-950"
                    : "border-amber-300 bg-gradient-to-r from-amber-50/90 via-orange-50/70 to-rose-50/60 text-slate-800 shadow-xs"
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 rounded-lg p-2 ${
                        gatekeeperData.is_ready_to_advance ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
                      }`}>
                        {gatekeeperData.is_ready_to_advance ? <CheckCircle2 size={18} /> : <ShieldAlert size={18} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">
                            {gatekeeperData.is_ready_to_advance
                              ? "Quality Gate: Prasyarat Lengkap"
                              : `Quality Gate: Prasyarat Tertahan (${gatekeeperData.blockers.length} Kendala)`}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            gatekeeperData.is_ready_to_advance
                              ? "bg-emerald-200/70 text-emerald-800"
                              : "bg-rose-100 text-rose-700 border border-rose-200"
                          }`}>
                            {gatekeeperData.is_ready_to_advance ? "Siap Lanjut" : "Perlu Tindakan"}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-600">
                          {gatekeeperData.is_ready_to_advance
                            ? `Seluruh dokumen wajib (${gatekeeperData.mandatory_documents_verified}/${gatekeeperData.mandatory_documents_total}) telah diverifikasi dan jaminan valid untuk tahap ini.`
                            : `Tahap '${gatekeeperData.current_step}' membutuhkan penyelesaian prasyarat sebelum dapat dimajukan.`}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2 text-[11px]">
                      <span className="font-semibold text-slate-500">Verifikasi BA:</span>
                      <span className="font-bold text-slate-700 bg-white/90 px-2 py-1 rounded-md border border-slate-200 shadow-2xs">
                        {gatekeeperData.mandatory_documents_verified} / {gatekeeperData.mandatory_documents_total}
                      </span>
                    </div>
                  </div>

                  {gatekeeperData.blockers.length > 0 && (
                    <div className="mt-3.5 pt-3 border-t border-amber-200/70 space-y-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Daftar Kendala Yang Memblokir:</div>
                      {gatekeeperData.blockers.map((b, idx) => (
                        <div key={idx} className="flex items-start gap-2 bg-white/95 p-2.5 rounded-lg border border-amber-200/90 shadow-2xs">
                          <span className="text-rose-600 shrink-0 font-bold mt-0.5">⛔</span>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-slate-800">{b.title}</div>
                            <div className="text-[11px] text-slate-600 mt-0.5">{b.description}</div>
                          </div>
                          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-rose-50 text-rose-700 rounded border border-rose-200 shrink-0">
                            {b.category}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {gatekeeperData.warnings.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-amber-200/50 space-y-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Peringatan:</div>
                      {gatekeeperData.warnings.map((w, idx) => (
                        <div key={idx} className="flex items-start gap-2 bg-amber-50/80 p-2 rounded-lg border border-amber-200/60 text-[11px]">
                          <span className="text-amber-600 shrink-0">⚠️</span>
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-amber-900">{w.title}:</span>{" "}
                            <span className="text-amber-800">{w.description}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {request.operationalStatus !== "On Going" && (
                <div className="mt-4 border-t border-blue-100 pt-4">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Alasan status {request.operationalStatus}
                  </label>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <input
                      value={statusReasonDraft}
                      onChange={(event) => setStatusReasonDraft(event.target.value)}
                      placeholder={request.operationalStatus === "On Hold" ? "Contoh: menunggu persetujuan anggaran tambahan" : "Contoh: kebutuhan dibatalkan peminta"}
                      className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-[#0a4d8c] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => updateRequestOperationalStatus(selectedRequestId, request.operationalStatus, statusReasonDraft)}
                      className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-[#0a4d8c] hover:bg-blue-50"
                    >
                      Simpan Alasan
                    </button>
                  </div>
                  {request.operationalStatus === "On Hold" && (
                    <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/90 p-3 text-xs text-amber-900">
                      <span className="text-sm">⏸️</span>
                      <div className="min-w-0">
                        <span className="font-bold">Perhitungan SLA Sedang Dijeda (Paused):</span>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-amber-800">
                          Pengadaan berstatus <strong>On Hold</strong>. Jam kerja dan penalti batas waktu SLA dibekukan sementara.
                          Saat status kembali diaktifkan ke <strong>On Going</strong>, seluruh target tanggal deadline aktif akan diperpanjang secara otomatis sesuai durasi penundaan.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Manager Force Override Modal */}
          {pendingStep && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setPendingStep(null)}>
              <div className="w-full max-w-lg rounded-2xl border border-rose-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-rose-100 p-2.5 text-rose-600">
                    <ShieldAlert size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base font-bold text-slate-800">Otorisasi Manager (Gatekeeper Override)</h4>
                    <p className="mt-1 text-xs text-slate-600">
                      Tahap pengadaan ini memiliki kendala prasyarat yang belum terselesaikan. Memindahkan tahap ke <strong>'{pendingStep}'</strong> memerlukan otorisasi manajerial dan akan tercatat permanen pada Log Audit.
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50/60 p-3.5 space-y-2 max-h-48 overflow-y-auto">
                  <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Kendala Aktif:</div>
                  {gatekeeperData?.blockers.map((b, i) => (
                    <div key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                      <span className="text-rose-500 font-bold">•</span>
                      <span><strong>{b.title}</strong>: {b.description}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Alasan Otorisasi / Override <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={overrideReason}
                    onChange={e => setOverrideReason(e.target.value)}
                    placeholder="Contoh: Disetujui Manager Procurement berdasarkan Memo No. MEMO-123 karena verifikasi fisik paralel."
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:border-[#0a4d8c] focus:outline-none focus:ring-1 focus:ring-[#0a4d8c]"
                  />
                </div>

                <div className="mt-6 flex justify-end gap-2.5 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setPendingStep(null)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isOverriding || !overrideReason.trim()}
                    onClick={async () => {
                      try {
                        setIsOverriding(true);
                        await moveRequestStep(selectedRequestId, pendingStep, true, overrideReason.trim());
                        toast.success(`Tahap berhasil dipindahkan ke '${pendingStep}' dengan Otorisasi Manager.`);
                        setPendingStep(null);
                      } catch (err) {
                        toast.error(getErrorMessage(err, "Gagal override tahap."));
                      } finally {
                        setIsOverriding(false);
                      }
                    }}
                    className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
                  >
                    {isOverriding ? "Menyimpan..." : "Konfirmasi Override & Lanjutkan"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PIC Handover / Delegation Modal */}
          {showHandoverModal && request && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setShowHandoverModal(false)}>
              <div className="w-full max-w-md rounded-2xl border border-blue-100 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-blue-50 p-2.5 text-[#0a4d8c]">
                    <ArrowRightLeft size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base font-bold text-slate-800">Delegasi & Handover PIC</h4>
                    <p className="mt-1 text-xs text-slate-500">
                      Alihkan tanggung jawab pengadaan kepada personel lain secara resmi. Perubahan akan dicatat pada Log Audit.
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                  <div>PIC Saat Ini: <strong className="text-slate-800">{request.pic.name}</strong> ({request.pic.id})</div>
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Pilih PIC Baru <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={targetPicId}
                      onChange={e => setTargetPicId(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-[#0a4d8c] focus:outline-none"
                    >
                      <option value="">-- Pilih Personel PIC --</option>
                      {usersList?.filter(u => u.id !== request.pic.id).map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role || u.email || u.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Catatan Serah Terima (Handover Notes) <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={handoverNotes}
                      onChange={e => setHandoverNotes(e.target.value)}
                      placeholder="Contoh: Delegasi tugas karena cuti dinas s.d 25 Oktober 2026. File warkat asli tersimpan di lemari arsip lt. 3."
                      className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-700 focus:border-[#0a4d8c] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-2.5 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowHandoverModal(false)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingHandover || !targetPicId || !handoverNotes.trim()}
                    onClick={async () => {
                      const selectedUser = usersList?.find(u => u.id === targetPicId);
                      if (!selectedUser) return;
                      try {
                        setIsSubmittingHandover(true);
                        await assignPicMutation.mutateAsync({
                          id: request.id,
                          payload: {
                            new_pic_id: selectedUser.id,
                            new_pic_name: selectedUser.name,
                            handover_notes: handoverNotes.trim(),
                          },
                        });
                        toast.success(`PIC pengadaan berhasil didelegasikan ke ${selectedUser.name}.`);
                        setShowHandoverModal(false);
                      } catch (err) {
                        toast.error(getErrorMessage(err, "Gagal melakukan delegasi PIC."));
                      } finally {
                        setIsSubmittingHandover(false);
                      }
                    }}
                    className="rounded-lg bg-[#0a4d8c] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#093e6f] disabled:opacity-50"
                  >
                    {isSubmittingHandover ? "Memproses..." : "Konfirmasi Delegasi"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <section>
            <div className="flex items-end justify-between gap-3 border-b border-slate-200 pb-3">
              <div><h4 className="text-sm font-bold text-slate-800">Timeline proses procurement</h4><p className="mt-1 text-xs text-slate-500">Status setiap tahap Berita Acara dan deliverable terkait.</p></div>
              <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-[#0a4d8c]">{request?.stage ?? "-"}</span>
            </div>
            <div className="relative mt-5 space-y-1">
              <div className="absolute bottom-5 left-[15px] top-5 w-px bg-slate-200" />
              {visibleMilestones.map((milestone, index) => {
                const milestoneIndex = timelineStart + index;
                const isDone = milestone.status === "Done";
                const isCurrent = milestone.status === "In Progress";
                const milestoneSlas = slas.filter(sla => sla.milestone === milestone.step);
                return (
                  <div key={milestone.id} className="relative flex gap-4 py-2">
                    <div className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-4 border-white text-[11px] font-bold ${isDone ? "bg-emerald-500 text-white" : isCurrent ? "bg-[#0a4d8c] text-white ring-4 ring-blue-100" : "bg-slate-100 text-slate-400"}`}>
                      {isDone ? <CheckCircle2 size={15} /> : milestoneIndex + 1}
                    </div>
                    <div className={`min-w-0 flex-1 rounded-lg border px-3 py-2.5 ${isCurrent ? "border-blue-200 bg-blue-50/60" : isDone ? "border-emerald-100 bg-emerald-50/40" : "border-slate-100 bg-white"}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className={`text-sm font-semibold ${isCurrent ? "text-[#0a4d8c]" : "text-slate-700"}`}>{milestone.step}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isDone ? "text-emerald-600" : isCurrent ? "text-[#0a4d8c]" : "text-slate-400"}`}>{isDone ? "Selesai" : isCurrent ? "Sedang berjalan" : "Berikutnya"}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-slate-500">
                        {milestone.date && <span>{milestone.date}</span>}
                        {milestone.pic && <span>PIC: {milestone.pic.name}</span>}
                        {milestone.documentId && <span>Dokumen tertaut: {milestone.documentId}</span>}
                      </div>
                      
                      {milestoneSlas.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {milestoneSlas.map(s => (
                            <div key={s.id} className="overflow-hidden rounded-md border border-slate-200 bg-white/60">
                              <button onClick={() => setExpandedRelatedId(current => current === `sla-${s.id}` ? null : `sla-${s.id}`)} className="flex w-full items-center justify-between gap-3 px-2.5 py-2 text-left transition hover:bg-white">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5"><CalendarClock size={14} className="text-slate-400" /><span className="truncate text-xs font-semibold text-slate-700">{s.taskName}</span></div>
                                  <div className="mt-1 text-[11px] text-slate-500">PIC: {s.pic.name} • Target: {s.targetDate}</div>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${s.status === 'On Track' || s.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : s.status === 'At Risk' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                    {s.status === "Overdue" ? `${Math.abs(s.daysRemaining)}h lewat` : s.status === "Selesai" ? "Selesai" : `${s.daysRemaining}h sisa`}
                                  </span>
                                  {expandedRelatedId === `sla-${s.id}` ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                                </div>
                              </button>
                              {expandedRelatedId === `sla-${s.id}` && (
                                <div className="border-t border-slate-100 bg-slate-50 px-3 py-3 text-[11px] text-slate-600">
                                  <div><span className="font-semibold">SLA:</span> {s.startDate ?? "-"} s.d. {s.targetDate} • Urgensi: {s.urgencyLevel}</div>
                                  {s.status === "Overdue" && s.overdueReason && <div className="mt-1 text-red-600 font-medium">Alasan telat: {s.overdueReason}</div>}
                                  {s.nextAction && <div className="mt-1"><span className="font-semibold text-[#0a4d8c]">Next Action:</span> {s.nextAction}</div>}
                                  <button onClick={() => setEditingDeadlineId(s.id)} className="mt-2 text-[#0a4d8c] font-semibold hover:underline">Edit SLA</button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {!isDone && (
                        <button type="button" onClick={() => setAddingDeadlineRequestId(selectedRequestId)} className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-blue-200 bg-blue-50/50 py-2.5 text-[11px] font-bold text-[#0a4d8c] transition hover:bg-blue-100/50">
                          + Tambah SLA di tahapan ini
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {hasHiddenMilestones && <button type="button" onClick={() => setShowFullTimeline(true)} className="mt-4 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0a4d8c]">Tampilkan {milestones.length - visibleMilestones.length} tahapan lainnya</button>}
            {showFullTimeline && milestones.length > 3 && <button type="button" onClick={() => setShowFullTimeline(false)} className="mt-4 text-xs font-semibold text-[#0a4d8c] hover:underline">Ringkas timeline</button>}
          </section>
          
          {/* Documents Section */}
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-[#0a4d8c] font-semibold text-sm">
                <FileText size={16} />
                Dokumen
              </div>
              <button onClick={() => router.push('/dashboard/documents')} className="text-[11px] font-medium text-slate-500 hover:text-[#0a4d8c] transition-colors flex items-center gap-1">
                Ke Modul Dokumen <ChevronRight size={12} />
              </button>
            </div>
            {docs.length > 0 ? (
              <div className="space-y-2">
                {docs.map(d => (
                  <div key={d.id}>
                    <button onClick={() => setExpandedRelatedId(current => current === `doc-${d.id}` ? null : `doc-${d.id}`)} className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-left transition hover:border-blue-200 hover:bg-blue-50/40">
                      <div className="min-w-0"><div className="truncate text-[12px] font-medium text-slate-800">{d.name}</div><div className="mt-0.5 text-[11px] text-slate-500">{d.type} • {d.uploadDate}</div></div>
                      <div className="flex shrink-0 items-center gap-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${d.status === 'Lulus Verifikasi' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{d.status}</span>{expandedRelatedId === `doc-${d.id}` ? <ChevronDown size={15} className="text-slate-400" /> : <ChevronRight size={15} className="text-slate-400" />}</div>
                    </button>
                    {expandedRelatedId === `doc-${d.id}` && <div className="border-x border-b border-slate-200 bg-white px-3 py-3 text-xs text-slate-600"><div>{d.issues.length > 0 ? d.issues.join(" ") : "Tidak ada temuan pemeriksaan."}</div>{d.nextAction && <div className="mt-2"><span className="font-semibold text-[#0a4d8c]">Next Action:</span> {d.nextAction}</div>}<button onClick={() => router.push(`/dashboard/documents/result?id=${d.id}`)} className="mt-3 font-semibold text-[#0a4d8c] hover:underline">Buka hasil pemeriksaan</button></div>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic py-2 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">Tidak ada dokumen tertaut.</div>
            )}
          </div>

          {/* Guarantees Section */}
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-[#0a4d8c] font-semibold text-sm">
                <ShieldCheck size={16} />
                Jaminan
              </div>
              <div className="flex items-center gap-3"><button onClick={() => router.push('/dashboard/guarantees')} className="text-[11px] font-medium text-slate-500 hover:text-[#0a4d8c] transition-colors flex items-center gap-1">Lihat Semua <ChevronRight size={12} /></button><button onClick={() => router.push(`/dashboard/guarantees/upload?requestId=${selectedRequestId}`)} className="rounded-md bg-[#0a4d8c] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#093e6f]">+ Jaminan</button></div>
            </div>
            {guars.length > 0 ? (
              <div className="space-y-2">
                {guars.map(g => (
                  <div key={g.id}>
                    <button onClick={() => setExpandedRelatedId(current => current === `guarantee-${g.id}` ? null : `guarantee-${g.id}`)} className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-left transition hover:border-blue-200 hover:bg-blue-50/40">
                      <div className="min-w-0"><div className="truncate text-[12px] font-medium text-slate-800">{g.vendor.name}</div><div className="mt-0.5 text-[11px] text-slate-500">{g.type} • Jatuh tempo: {g.expiryDate}</div></div>
                      <div className="flex shrink-0 items-center gap-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${g.status === 'Aktif' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{g.status}</span>{expandedRelatedId === `guarantee-${g.id}` ? <ChevronDown size={15} className="text-slate-400" /> : <ChevronRight size={15} className="text-slate-400" />}</div>
                    </button>
                    {expandedRelatedId === `guarantee-${g.id}` && <div className="border-x border-b border-slate-200 bg-white px-3 py-3 text-xs text-slate-600"><div><span className="font-semibold">{g.referenceNo}</span> • {g.issuer} • Rp {g.value.toLocaleString('id-ID')}</div>{g.nextAction && <div className="mt-2"><span className="font-semibold text-[#0a4d8c]">Next Action:</span> {g.nextAction}</div>}<button onClick={() => router.push('/dashboard/guarantees')} className="mt-3 font-semibold text-[#0a4d8c] hover:underline">Buka modul jaminan</button></div>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic py-2 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">Tidak ada jaminan tertaut.</div>
            )}
          </div>


          <section>
            <div className="flex items-end justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Log Audit & Histori Aktivitas</h4>
                <p className="mt-1 text-xs text-slate-500">Jejak audit resmi: perubahan tahap, penundaan (On Hold), dan deliverable pengadaan.</p>
              </div>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-[#0a4d8c]">
                {activitiesData ? activitiesData.length : history.length} aktivitas
              </span>
            </div>

            {activitiesData && activitiesData.length > 0 ? (
              <div className="relative mt-4 space-y-4 border-l-2 border-slate-200 pl-5">
                {activitiesData.map((act) => {
                  const actionBadge =
                    act.action === "CREATE"
                      ? { label: "Pengadaan Dibuat", bg: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" }
                      : act.action === "HANDOVER_PIC"
                      ? { label: `Handover PIC: ${act.new_state}`, bg: "bg-purple-50 text-purple-700 border-purple-200 font-semibold", dot: "bg-purple-500" }
                      : act.action === "MOVE_STEP_OVERRIDE"
                      ? { label: `Override Tahap: ${act.new_state}`, bg: "bg-rose-50 text-rose-700 border-rose-300 font-bold", dot: "bg-rose-500" }
                      : act.action === "UPDATE_STATUS"
                      ? { label: `Status: ${act.new_state}`, bg: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" }
                      : act.action === "MOVE_STAGE"
                      ? { label: `Stage: ${act.new_state}`, bg: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-[#0a4d8c]" }
                      : { label: `Langkah: ${act.new_state}`, bg: "bg-indigo-50 text-indigo-700 border-indigo-200", dot: "bg-indigo-500" };

                  return (
                    <div key={act.id} className="relative group">
                      <span className={`absolute -left-[27px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm ${actionBadge.dot}`} />
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${actionBadge.bg}`}>
                          {actionBadge.label}
                        </span>
                        {act.user_name && (
                          <span className="text-[11px] font-semibold text-slate-700">
                            oleh {act.user_name}
                          </span>
                        )}
                        <time className="text-[10px] text-slate-400">
                          {act.created_at ? new Date(act.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "-"}
                        </time>
                      </div>
                      {act.notes && (
                        <p className="mt-1 text-xs text-slate-600 bg-slate-50/80 p-2 rounded-lg border border-slate-100">
                          {act.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : history.length > 0 ? (
              <div className="relative mt-4 space-y-4 border-l border-slate-200 pl-5">
                {history.map((item) => (
                  <div key={item.id} className="relative">
                    <span
                      className={`absolute -left-[25px] top-1.5 h-3 w-3 rounded-full border-2 border-white ${
                        item.category === "SLA"
                          ? "bg-amber-500"
                          : item.category === "Jaminan"
                          ? "bg-emerald-500"
                          : item.category === "Dokumen"
                          ? "bg-blue-500"
                          : "bg-slate-500"
                      }`}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-slate-800">{item.title}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{item.category}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{item.description}</p>
                    <time className="mt-1 block text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleString("id-ID")}</time>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
                Belum ada aktivitas yang tercatat untuk pekerjaan ini.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  , document.body);
}
