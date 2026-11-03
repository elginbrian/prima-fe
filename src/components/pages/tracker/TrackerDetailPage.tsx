"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRightLeft,
  GitBranch,
  ShieldCheck,
  History,
  Building2,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProcurementOperationalStatus, ProcurementStep } from "@/types";
import {
  useProcurement,
  useProcurementActivities,
  useProcurementGatekeeper,
  useAssignPic,
  useMoveStep,
  useUpdateOperationalStatus,
  useDeadlines,
  useDocuments,
  useUpdateDeadline,
  useCreateDeadline,
} from "@/lib/query/hooks/procurement/useProcurement";
import { useGuarantees } from "@/lib/query/hooks/procurement/useGuarantees";
import { useValidationLogs } from "@/lib/query/hooks/procurement/useValidation";
import { useActions } from "@/lib/query/hooks/procurement/useActions";
import { useUsers } from "@/lib/query/hooks/users/useUsers";
import { useSettings } from "@/lib/query/hooks/settings/useSettings";
import { useToast } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/Skeleton";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { getErrorMessage } from "@/lib/api/errors";
import { formatRupiah, formatRequestCode } from "@/lib/utils";
import { getDeadlineTiming } from "@/lib/deadlineUtils";
import {
  deadlineToCreatePayload,
  deadlineChangesToUpdatePayload,
} from "@/lib/adapters/procurement.mutations";

import { GatekeeperCard } from "./detail/GatekeeperCard";
import { StatusReasonPanel } from "./detail/StatusReasonPanel";
import { ManagerOverrideModal } from "./detail/ManagerOverrideModal";
import { HandoverPicModal } from "./detail/HandoverPicModal";
import { ProcurementTimeline } from "./detail/ProcurementTimeline";
import { RelatedDocuments } from "./detail/RelatedDocuments";
import { RelatedGuarantees } from "./detail/RelatedGuarantees";
import { ActivityLog } from "./detail/ActivityLog";
import { ValidationAuditLog } from "./detail/ValidationAuditLog";
import { JobActionsPanel } from "./detail/JobActionsPanel";
import { DeadlineEditor, DeadlineCreator } from "./TrackerModals";

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

type DetailTab = "timeline" | "docs-guarantees" | "audit-log";

export default function TrackerDetailPage({ requestId }: { requestId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const { data: detailData, isLoading: isLoadingDetail } = useProcurement(requestId);
  const { data: activitiesData, isLoading: isLoadingActivities } =
    useProcurementActivities(requestId);
  const { data: gatekeeperData } = useProcurementGatekeeper(requestId);
  const { data: validationLogs = [] } = useValidationLogs(requestId);
  const { data: allDocuments = [] } = useDocuments();
  const { data: allGuarantees = [] } = useGuarantees();
  const { data: allDeadlines = [] } = useDeadlines();
  const { data: allActions = [] } = useActions();
  const { data: usersList } = useUsers();
  const { data: settings } = useSettings();

  const slaWarningDays = settings?.slaWarningDays ?? 3;

  const updateStep = useMoveStep();
  const updateStatus = useUpdateOperationalStatus();
  const assignPicMutation = useAssignPic();
  const editDeadline = useUpdateDeadline();
  const createDeadline = useCreateDeadline();

  const [activeTab, setActiveTab] = useState<DetailTab>("timeline");
  const [expandedRelatedId, setExpandedRelatedId] = useState<string | null>(null);
  const [statusReasonDraft, setStatusReasonDraft] = useState("");
  const [editingDeadlineId, setEditingDeadlineId] = useState<string | null>(null);
  const [showAddDeadline, setShowAddDeadline] = useState(false);

  const [pendingStep, setPendingStep] = useState<ProcurementStep | null>(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [isOverriding, setIsOverriding] = useState(false);

  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [targetPicId, setTargetPicId] = useState("");
  const [handoverNotes, setHandoverNotes] = useState("");
  const [isSubmittingHandover, setIsSubmittingHandover] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "docs-guarantees" || tabParam === "audit-log" || tabParam === "timeline") {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const request = detailData?.request;
  const milestones = detailData?.milestones ?? [];

  useEffect(() => {
    if (request?.operationalStatusReason !== undefined) {
      setStatusReasonDraft(request.operationalStatusReason || "");
    }
  }, [request?.operationalStatusReason]);

  const docs = useMemo(
    () => allDocuments.filter((d) => d.requestId === requestId),
    [allDocuments, requestId]
  );

  const guars = useMemo(
    () => allGuarantees.filter((g) => g.requestId === requestId),
    [allGuarantees, requestId]
  );

  const slas = useMemo(
    () =>
      allDeadlines
        .filter((d) => d.requestId === requestId)
        .map((deadline) => ({
          ...deadline,
          ...getDeadlineTiming(deadline, slaWarningDays),
        })),
    [allDeadlines, requestId, slaWarningDays]
  );

  const pendingActionsCount = useMemo(
    () => allActions.filter((a) => a.requestId === requestId && a.status === "Pending").length,
    [allActions, requestId]
  );

  const totalAuditCount = (activitiesData?.length ?? 0) + validationLogs.length;
  const completedMilestones = milestones.filter((m) => m.status === "Done").length;
  const currentMilestoneIndex = milestones.findIndex((m) => m.status === "In Progress");
  const progressPct = milestones.length
    ? Math.round(
        ((completedMilestones + (currentMilestoneIndex >= 0 ? 0.5 : 0)) / milestones.length) * 100
      )
    : 0;

  const handleStepChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const targetStep = event.target.value as ProcurementStep;
    if (targetStep === request?.currentStep) return;
    if (gatekeeperData && !gatekeeperData.is_ready_to_advance) {
      setPendingStep(targetStep);
      setOverrideReason("");
      return;
    }
    try {
      await updateStep.mutateAsync({
        id: requestId,
        payload: { step: targetStep, force: false },
      });
      toast.success(`Tahap berhasil diperbarui ke ${targetStep}`);
    } catch (err: any) {
      const msg = getErrorMessage(err);
      if (msg.includes("Syarat dokumen") || msg.includes("wajib")) {
        setPendingStep(targetStep);
        setOverrideReason("");
      } else {
        toast.error(msg);
      }
    }
  };

  const handleOverrideConfirm = async () => {
    if (!pendingStep) return;
    if (!overrideReason.trim()) {
      toast.error("Alasan override wajib diisi untuk kepatuhan audit.");
      return;
    }
    setIsOverriding(true);
    try {
      await updateStep.mutateAsync({
        id: requestId,
        payload: {
          step: pendingStep,
          force: true,
          override_reason: overrideReason.trim(),
        },
      });
      toast.success(`Tahap di-override ke ${pendingStep}`);
      setPendingStep(null);
      setOverrideReason("");
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsOverriding(false);
    }
  };

  const handleHandoverSubmit = async () => {
    if (!targetPicId) {
      toast.error("Pilih PIC penerima terlebih dahulu.");
      return;
    }
    if (!handoverNotes.trim()) {
      toast.error("Catatan serah terima wajib diisi untuk audit trail.");
      return;
    }
    const targetUser = usersList?.find((u) => u.id === targetPicId);
    if (!targetUser) return;

    setIsSubmittingHandover(true);
    try {
      await assignPicMutation.mutateAsync({
        id: requestId,
        payload: {
          new_pic_id: targetUser.id,
          new_pic_name: targetUser.name,
          handover_notes: handoverNotes.trim(),
        },
      });
      toast.success(`Tanggung jawab PIC berhasil didelegasikan kepada ${targetUser.name}`);
      setShowHandoverModal(false);
      setTargetPicId("");
      setHandoverNotes("");
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmittingHandover(false);
    }
  };

  if (isLoadingDetail) {
    return (
      <div className="space-y-5 pb-12">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-12">
      {/* Top Breadcrumb & Back Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.push("/dashboard/overview")}
          className="inline-flex items-center gap-2 text-xs font-normal text-slate-600 transition-colors hover:text-[#0a4d8c] focus:outline-none"
        >
          <ArrowLeft size={15} />
          <span>Kembali ke Daftar Pekerjaan</span>
        </button>

        {request && (
          <button
            type="button"
            onClick={() => {
              setTargetPicId("");
              setHandoverNotes("");
              setShowHandoverModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-normal text-slate-600 shadow-2xs transition hover:border-[#0a4d8c] hover:text-[#0a4d8c]"
          >
            <ArrowRightLeft size={13} className="text-[#0a4d8c]" />
            <span>Delegasikan PIC ({request.pic.name})</span>
          </button>
        )}
      </div>

      {/* Unified Compact Job Summary & Control Header Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
          {/* Left: Project Identity & Metadata */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                title={requestId}
                className="font-mono text-xs font-normal text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200"
              >
                {formatRequestCode(requestId)}
              </span>
              {request && (
                <span className="rounded bg-blue-50 px-2.5 py-0.5 text-[11px] font-normal text-[#0a4d8c] border border-blue-200">
                  {request.procurementMethod || "Tender Terbuka"}
                </span>
              )}
              {request?.department?.name && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <Building2 size={13} className="text-slate-400" />
                  {request.department.name}
                </span>
              )}
              {request?.pic?.name && (
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <UserAvatar name={request.pic.name} userId={request.pic.id} size="xs" />
                  <span>PIC: <span className="text-slate-700">{request.pic.name}</span></span>
                </span>
              )}
            </div>

            <h1 className="mt-2 text-lg sm:text-xl font-semibold text-slate-800 leading-snug">
              {request?.title ?? requestId}
            </h1>

            {request && (
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <div>
                  <span>Nilai Pekerjaan: </span>
                  <span className="text-slate-800 font-medium">
                    {formatRupiah(request.amount)}
                  </span>
                </div>
                <span className="text-slate-300">•</span>
                <div>
                  <span>Progres Tahapan: </span>
                  <span className="text-slate-700">
                    {completedMilestones} dari {milestones.length} selesai ({progressPct}%)
                  </span>
                </div>
                {pendingActionsCount > 0 && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-[#0a4d8c]">
                      {pendingActionsCount} tindak lanjut aktif
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right: Inline Step & Status Controls */}
          {request && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 rounded-xl bg-slate-50 p-3 border border-slate-200/80">
              <label className="w-full sm:w-56">
                <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-slate-500">
                  Tahap Saat Ini
                </span>
                <select
                  value={request.currentStep}
                  onChange={handleStepChange}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-normal text-slate-700 focus:border-[#0a4d8c] focus:outline-none"
                >
                  {(milestones.length > 0 ? milestones.map((m) => m.step) : PROCUREMENT_STEPS).map(
                    (step) => (
                      <option key={step} value={step}>
                        {step}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="w-full sm:w-44">
                <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-slate-500">
                  Status Pekerjaan
                </span>
                <select
                  value={request.operationalStatus}
                  onChange={(event) => {
                    const nextStatus = event.target.value as ProcurementOperationalStatus;
                    updateStatus.mutate({
                      id: requestId,
                      payload: {
                        status: nextStatus,
                        reason: nextStatus === "On Going" ? "" : statusReasonDraft,
                      },
                    });
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-normal text-slate-700 focus:border-[#0a4d8c] focus:outline-none"
                >
                  <option value="On Going">Berjalan (On Going)</option>
                  <option value="On Hold">Ditunda (On Hold)</option>
                  <option value="Batal">Dibatalkan</option>
                </select>
              </label>
            </div>
          )}
        </div>

        {/* Slim Progress Bar */}
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#0a4d8c] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* On Hold / Cancelled Reason Input */}
        {request && request.operationalStatus !== "On Going" && (
          <StatusReasonPanel
            status={request.operationalStatus}
            reasonDraft={statusReasonDraft}
            setReasonDraft={setStatusReasonDraft}
            onSave={() =>
              updateStatus.mutate({
                id: requestId,
                payload: {
                  status: request.operationalStatus,
                  reason: statusReasonDraft,
                },
              })
            }
          />
        )}
      </div>

      {/* Clean 3-Tab Navigation Bar */}
      <div className="flex overflow-x-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xs hide-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab("timeline")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all whitespace-nowrap focus:outline-none ${
            activeTab === "timeline"
              ? "bg-[#0a4d8c] text-white shadow-2xs"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <GitBranch size={14} />
          <span>Tahapan & Jadwal SLA</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-normal ${
              activeTab === "timeline" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            {completedMilestones}/{milestones.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("docs-guarantees")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all whitespace-nowrap focus:outline-none ${
            activeTab === "docs-guarantees"
              ? "bg-[#0a4d8c] text-white shadow-2xs"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <ShieldCheck size={14} />
          <span>Dokumen & Warkat Jaminan</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-normal ${
              activeTab === "docs-guarantees"
                ? "bg-white/20 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {docs.length + guars.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("audit-log")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all whitespace-nowrap focus:outline-none ${
            activeTab === "audit-log"
              ? "bg-[#0a4d8c] text-white shadow-2xs"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <History size={14} />
          <span>Riwayat & Log Audit</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-normal ${
              activeTab === "audit-log" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            {totalAuditCount}
          </span>
        </button>
      </div>

      {/* TAB 1: TIMELINE & SLA (Directly visible without redundant warning boxes above) */}
      {activeTab === "timeline" && (
        <ProcurementTimeline
          stage={request?.stage}
          milestones={milestones}
          slas={slas}
          gatekeeperData={gatekeeperData}
          expandedRelatedId={expandedRelatedId}
          setExpandedRelatedId={setExpandedRelatedId}
          onAddSla={() => setShowAddDeadline(true)}
          onEditSla={(id) => setEditingDeadlineId(id)}
          onOpenDocsTab={() => setActiveTab("docs-guarantees")}
        />
      )}

      {/* TAB 2: DOCUMENTS & BANK GUARANTEES */}
      {activeTab === "docs-guarantees" && (
        <div className="space-y-6">
          <RelatedDocuments
            docs={docs}
            selectedRequestId={requestId}
            router={router}
          />
          <RelatedGuarantees
            guars={guars}
            selectedRequestId={requestId}
            expandedRelatedId={expandedRelatedId}
            setExpandedRelatedId={setExpandedRelatedId}
            router={router}
          />
        </div>
      )}

      {/* TAB 3: AUDIT LOG & AI VALIDATION HISTORY */}
      {activeTab === "audit-log" && (
        <div className="space-y-6">
          <ValidationAuditLog requestId={requestId} router={router} />
          <ActivityLog
            activities={activitiesData}
            history={[]}
            isLoading={isLoadingActivities}
          />
        </div>
      )}

      {/* MODALS */}
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

      {editingDeadlineId &&
        (() => {
          const deadline = allDeadlines.find((item) => item.id === editingDeadlineId);
          if (!deadline) return null;
          return (
            <DeadlineEditor
              deadline={deadline}
              isSaving={editDeadline.isPending}
              errorMessage={editDeadline.isError ? getErrorMessage(editDeadline.error) : null}
              onClose={() => {
                editDeadline.reset();
                setEditingDeadlineId(null);
              }}
              onSave={(changes) =>
                editDeadline.mutate(
                  { id: deadline.id, payload: deadlineChangesToUpdatePayload(changes) },
                  {
                    onSuccess: () => {
                      toast.success("Target SLA berhasil diperbarui.");
                      setEditingDeadlineId(null);
                    },
                  }
                )
              }
            />
          );
        })()}

      {showAddDeadline && request && (
        <DeadlineCreator
          requestId={request.id}
          pic={request.pic}
          department={request.department}
          isSaving={createDeadline.isPending}
          errorMessage={createDeadline.isError ? getErrorMessage(createDeadline.error) : null}
          onClose={() => {
            createDeadline.reset();
            setShowAddDeadline(false);
          }}
          onSave={(deadline) =>
            createDeadline.mutate(deadlineToCreatePayload(deadline), {
              onSuccess: () => {
                toast.success("Target SLA berhasil ditambahkan.");
                setShowAddDeadline(false);
              },
            })
          }
        />
      )}
    </div>
  );
}

