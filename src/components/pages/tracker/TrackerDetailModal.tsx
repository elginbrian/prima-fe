import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LayoutList, X, ArrowRightLeft } from "lucide-react";
import { ProcurementOperationalStatus, ProcurementStep } from "@/types";
import { useProcurement, useProcurementActivities, useProcurementGatekeeper, useAssignPic } from "@/lib/query/hooks/procurement/useProcurement";
import { useUsers } from "@/lib/query/hooks/users/useUsers";
import { useToast } from "@/components/ui/Toast";
import { getErrorMessage } from "@/lib/api/errors";
import { formatRupiah } from "@/lib/utils";

import { TrackerDetailModalProps } from "./types";
import { GatekeeperCard } from "./detail/GatekeeperCard";
import { StatusReasonPanel } from "./detail/StatusReasonPanel";
import { ManagerOverrideModal } from "./detail/ManagerOverrideModal";
import { HandoverPicModal } from "./detail/HandoverPicModal";
import { ProcurementTimeline } from "./detail/ProcurementTimeline";
import { RelatedDocuments } from "./detail/RelatedDocuments";
import { RelatedGuarantees } from "./detail/RelatedGuarantees";
import { ActivityLog } from "./detail/ActivityLog";

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
  selectedRequestId,
  setSelectedRequestId,
  request: initialRequest,
  milestones: initialMilestones,
  docs,
  guars,
  slas,
  history,
  showFullTimeline,
  setShowFullTimeline,
  statusReasonDraft,
  setStatusReasonDraft,
  moveRequestStep,
  updateRequestOperationalStatus,
  expandedRelatedId,
  setExpandedRelatedId,
  router,
  setAddingDeadlineRequestId,
  setEditingDeadlineId,
}: TrackerDetailModalProps) {
  const { data: detailData } = useProcurement(selectedRequestId);
  const { data: activitiesData, isLoading: isLoadingActivities } = useProcurementActivities(selectedRequestId || "");
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
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedRequestId(null);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [setSelectedRequestId]);

  if (typeof document === "undefined") return null;

  const currentMilestoneIndex = milestones.findIndex((m) => m.status === "In Progress");
  const completedMilestones = milestones.filter((m) => m.status === "Done").length;
  const timelineStart = showFullTimeline
    ? 0
    : Math.max(0, currentMilestoneIndex > -1 ? currentMilestoneIndex - 1 : 0);
  const visibleMilestones = showFullTimeline
    ? milestones
    : milestones.slice(timelineStart, timelineStart + 3);
  const hasHiddenMilestones = !showFullTimeline && milestones.length > visibleMilestones.length;

  const handleStepChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const targetStep = event.target.value as ProcurementStep;
    if (targetStep === request?.currentStep) return;
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
  };

  const handleOverrideConfirm = async () => {
    if (!pendingStep) return;
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
  };

  const handleHandoverSubmit = async () => {
    if (!request) return;
    const selectedUser = usersList?.find((u) => u.id === targetPicId);
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
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex min-h-dvh items-center justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300"
      onClick={() => setSelectedRequestId(null)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tracker-detail-title"
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-6 py-5 sm:px-8">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-slate-500">
              <LayoutList size={18} />
              <span className="text-[11px] font-bold uppercase tracking-[0.16em]">
                Ringkasan Pekerjaan
              </span>
            </div>
            <h3 id="tracker-detail-title" className="mt-2 truncate text-lg font-bold text-slate-800">
              {request?.title ?? selectedRequestId}
            </h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-medium text-slate-500">
              <span className="font-mono text-slate-600">{selectedRequestId}</span>
              {request && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                  {request.procurementMethod || "Tender Terbuka"}
                </span>
              )}
              {request && (
                <div className="flex items-center gap-2">
                  <span>
                    PIC: <strong className="text-slate-700">{request.pic.name}</strong>
                  </span>
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
              {request && (
                <span>{formatRupiah(request.amount)}</span>
              )}
            </div>
          </div>
          <button
            aria-label="Tutup detail request"
            onClick={() => setSelectedRequestId(null)}
            className="shrink-0 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 space-y-8 overflow-y-auto p-6 sm:p-8">
          {request && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#0a4d8c]">
                    Posisi proses saat ini
                  </div>
                  <div className="mt-1 text-lg font-bold text-slate-800">{request.currentStep}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    Stage ringkas: {request.stage} · {completedMilestones} dari {milestones.length} tahap selesai
                  </div>
                </div>
                <label className="w-full lg:w-72">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Update tahap manual
                  </span>
                  <select
                    value={request.currentStep}
                    onChange={handleStepChange}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-[#0a4d8c] focus:outline-none"
                  >
                    {(milestones.length > 0 ? milestones.map((m) => m.step) : PROCUREMENT_STEPS).map((step) => (
                      <option key={step} value={step}>
                        {step}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="w-full lg:w-44">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Status pekerjaan
                  </span>
                  <select
                    value={request.operationalStatus}
                    onChange={(event) =>
                      updateRequestOperationalStatus(
                        selectedRequestId,
                        event.target.value as ProcurementOperationalStatus,
                        event.target.value === "On Going" ? "" : statusReasonDraft
                      )
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-[#0a4d8c] focus:outline-none"
                  >
                    <option value="On Going">On Going</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Batal">Batal</option>
                  </select>
                </label>
              </div>

              {/* Progress Bar */}
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/80">
                <div
                  className="h-full rounded-full bg-[#0a4d8c] transition-all"
                  style={{
                    width: `${
                      milestones.length
                        ? ((completedMilestones + (currentMilestoneIndex >= 0 ? 1 : 0)) / milestones.length) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>

              {/* Gatekeeper Card */}
              {gatekeeperData && <GatekeeperCard data={gatekeeperData} />}

              {/* Status Reason & SLA Paused Panel */}
              {request.operationalStatus !== "On Going" && (
                <StatusReasonPanel
                  status={request.operationalStatus}
                  reasonDraft={statusReasonDraft}
                  setReasonDraft={setStatusReasonDraft}
                  onSave={() =>
                    updateRequestOperationalStatus(
                      selectedRequestId,
                      request.operationalStatus,
                      statusReasonDraft
                    )
                  }
                />
              )}
            </div>
          )}

          {/* Sub-modals */}
          {pendingStep && (
            <ManagerOverrideModal
              pendingStep={pendingStep}
              gatekeeperData={gatekeeperData}
              overrideReason={overrideReason}
              setOverrideReason={setOverrideReason}
              isOverriding={isOverriding}
              onCancel={() => setPendingStep(null)}
              onConfirm={handleOverrideConfirm}
            />
          )}

          {showHandoverModal && request && (
            <HandoverPicModal
              currentPic={request.pic}
              usersList={usersList}
              targetPicId={targetPicId}
              setTargetPicId={setTargetPicId}
              handoverNotes={handoverNotes}
              setHandoverNotes={setHandoverNotes}
              isSubmitting={isSubmittingHandover}
              onCancel={() => setShowHandoverModal(false)}
              onSubmit={handleHandoverSubmit}
            />
          )}

          {/* Timeline Section */}
          <ProcurementTimeline
            stage={request?.stage}
            milestones={milestones}
            visibleMilestones={visibleMilestones}
            timelineStart={timelineStart}
            slas={slas}
            expandedRelatedId={expandedRelatedId}
            setExpandedRelatedId={setExpandedRelatedId}
            showFullTimeline={showFullTimeline}
            setShowFullTimeline={setShowFullTimeline}
            hasHiddenMilestones={hasHiddenMilestones}
            onAddSla={() => setAddingDeadlineRequestId(selectedRequestId)}
            onEditSla={(id) => setEditingDeadlineId(id)}
          />

          {/* Documents Section */}
          <RelatedDocuments
            docs={docs}
            expandedRelatedId={expandedRelatedId}
            setExpandedRelatedId={setExpandedRelatedId}
            router={router}
          />

          {/* Guarantees Section */}
          <RelatedGuarantees
            guars={guars}
            selectedRequestId={selectedRequestId}
            expandedRelatedId={expandedRelatedId}
            setExpandedRelatedId={setExpandedRelatedId}
            router={router}
          />

          {/* Activity Log Section */}
          <ActivityLog activities={activitiesData} history={history} isLoading={isLoadingActivities} />
        </div>
      </div>
    </div>,
    document.body
  );
}
