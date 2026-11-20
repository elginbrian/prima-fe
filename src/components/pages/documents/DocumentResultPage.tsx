"use client";

import { useState, useEffect, useMemo } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Printer,
  Sparkles,
  ArrowUpRight,
  Check,
  Eye,
  Sliders,
  RefreshCw,
  Building2,
  Plus,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useProcurement } from "@/context/ProcurementContext";
import { useProcurements } from "@/lib/query/hooks/procurement/useProcurement";
import {
  useValidationDetail,
  usePublishValidationToTracker,
  useUpdateValidationDecision,
  useReevaluateValidation,
  useWorkflowStages,
} from "@/lib/query/hooks/procurement/useValidation";
import { useToast } from "@/components/ui/Toast";
import { Spinner, Skeleton, SearchableSelect, ModalPortal, AiModeSelector, AI_TIER_META } from "@/components/ui";
import { resolveStorageUrl } from "@/lib/api/client";
import { useAiJobs } from "@/context/AiJobsContext";
import { formatDateIndo, formatRupiah, formatRequestCode } from "@/lib/utils";
import { ValidationScoreCard } from "@/components/widgets/documents/ValidationScoreCard";
import { ChecklistEvaluationList } from "@/components/widgets/documents/ChecklistEvaluationList";
import { ExtractedStagesTimeline } from "@/components/widgets/documents/ExtractedStagesTimeline";
import { ChecklistEditor } from "@/components/widgets/documents/ChecklistEditor";
import { DocumentPreviewModal } from "@/components/widgets/modals/DocumentPreviewModal";
import type {
  AiTier,
  DocumentValidationResponse,
  ComplianceStatus,
  ChecklistRuleItem,
  ExtractedStage,
} from "@/types/validation";

const COMPLIANCE_STATUS_OPTIONS = [
  { value: "Lulus Verifikasi", label: "Lulus Verifikasi" },
  { value: "Catatan Procurement", label: "Catatan Procurement" },
  {
    value: "Perlu Perbaikan",
    label: "Perlu Perbaikan (Tindak Lanjut FPP)",
  },
];

export default function DocumentResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { trackJob } = useAiJobs();
  const docId = searchParams.get("id") || "";

  const { data: serverValidationData, isLoading: isLoadingVal } =
    useValidationDetail(docId);
  const { data: workflowStages = [] } = useWorkflowStages();
  const publishMutation = usePublishValidationToTracker();
  const decisionMutation = useUpdateValidationDecision();
  const reevaluateMutation = useReevaluateValidation();

  const { state } = useProcurement();
  const { data: serverRequests = [] } = useProcurements();
  const requests = serverRequests.length > 0 ? serverRequests : state.requests;

  // Strictly use real AI validation data from the backend (no client-side synthetic fallback)
  const validationData: DocumentValidationResponse | null =
    serverValidationData ?? null;

  const [editedStages, setEditedStages] = useState<ExtractedStage[] | null>(null);

  useEffect(() => {
    if (validationData?.extracted_project?.stages) {
      setEditedStages(validationData.extracted_project.stages);
    }
  }, [validationData?.id, validationData?.extracted_project?.stages]);

  const activeStages = useMemo(
    () => editedStages ?? validationData?.extracted_project?.stages ?? [],
    [editedStages, validationData]
  );

  const methodOptions = useMemo(() => {
    const set = new Set<string>([
      "Tender Terbuka",
      "Pemilihan Langsung",
      "Penunjukan Langsung",
      "Tender Terbatas",
      "Pengadaan Langsung",
    ]);
    workflowStages.forEach((s) => {
      if (s.procurement_method) set.add(s.procurement_method);
    });
    return Array.from(set).map((m) => ({ value: m, label: m }));
  }, [workflowStages]);

  const requestOptions = useMemo(
    () => [
      { value: "", label: "-- Pilih Pekerjaan --" },
      ...requests.map((r) => ({
        value: r.id,
        label: `${formatRequestCode(r.id)} – ${r.title}`,
        description: `${r.department?.name || "-"} · ${r.currentStep}`,
        keywords: `${r.id} ${r.title} ${r.department?.name || ""}`,
      })),
    ],
    [requests]
  );

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Reviewer manual override modal
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [decisionStatus, setDecisionStatus] =
    useState<ComplianceStatus>("Lulus Verifikasi");
  const [decisionScore, setDecisionScore] = useState<number>(85);
  const [decisionNotes, setDecisionNotes] = useState<string>("");
  const [decisionNextAction, setDecisionNextAction] = useState<string>("");

  // AI Re-evaluation modal (adjust criteria/weights/prompt & re-run AI without re-uploading file)
  const [isReevalModalOpen, setIsReevalModalOpen] = useState(false);
  const [reevalRules, setReevalRules] = useState<ChecklistRuleItem[]>([]);
  const [reevalPassingScore, setReevalPassingScore] = useState<number>(80);
  const [reevalPrompt, setReevalPrompt] = useState<string>("");
  const [reevalAiTier, setReevalAiTier] = useState<AiTier>("cekatan");

  // Publish / Link to Tracker modal
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishMode, setPublishMode] = useState<"existing" | "new">("new");
  const [targetRequestId, setTargetRequestId] = useState<string>("");
  const [publishForm, setPublishForm] = useState({
    title: "",
    amount: 0,
    method: "Tender Terbuka",
    vendorName: "",
    departmentName: "",
  });

  const handleOpenDecisionModal = () => {
    if (!validationData) return;
    setDecisionStatus(validationData.compliance_status);
    setDecisionScore(Math.round(validationData.overall_score));
    setDecisionNotes(validationData.summary || "");
    setDecisionNextAction(validationData.recommendations?.[0] || "");
    setIsDecisionModalOpen(true);
  };

  const handleSaveDecision = async () => {
    if (!validationData) return;
    try {
      await decisionMutation.mutateAsync({
        id: validationData.id,
        payload: {
          compliance_status: decisionStatus,
          overall_score: decisionScore,
          reviewer_notes: decisionNotes.trim() || undefined,
          next_action: decisionNextAction.trim() || undefined,
        },
      });
      toast.success("Keputusan verifikasi dan catatan berhasil disimpan ke database.");
      setIsDecisionModalOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Gagal memperbarui keputusan verifikasi.");
    }
  };

  const handleOpenReevalModal = () => {
    if (!validationData) return;
    const baseRules: ChecklistRuleItem[] =
      validationData.checklist_rules && validationData.checklist_rules.length > 0
        ? validationData.checklist_rules
        : validationData.checklist_evaluations.map((ev) => ({
            category: "Umum",
            item: ev.item,
            is_mandatory: ev.is_mandatory,
            weight: ev.weight ?? ev.normalized_weight ?? 20,
            severity_on_failure: ev.is_mandatory ? "ERROR" : "WARNING",
            source: ev.source ?? "custom",
          }));
    setReevalRules(baseRules);
    setReevalPassingScore(validationData.passing_score_threshold || 80);
    setReevalPrompt(validationData.user_prompt || "");
    setIsReevalModalOpen(true);
  };

  const handleConfirmReevaluate = async () => {
    if (!validationData) return;
    if (reevalRules.length === 0) {
      toast.warning("Tambahkan minimal 1 kriteria untuk evaluasi ulang AI.");
      return;
    }
    try {
      const updated = await reevaluateMutation.mutateAsync({
        id: validationData.id,
        payload: {
          checklist_rules: reevalRules,
          passing_score_threshold: reevalPassingScore,
          custom_prompt: reevalPrompt.trim() || undefined,
          ai_tier: reevalAiTier,
          async_mode: true,
        },
      });
      setIsReevalModalOpen(false);
      if (updated.processing_status === "processing") {
        trackJob({
          id: updated.id,
          documentName: updated.document_name,
          aiTierRequested: reevalAiTier,
        });
        toast.info(
          `Evaluasi ulang AI (${AI_TIER_META[reevalAiTier]?.label ?? reevalAiTier}) berjalan di latar belakang. Anda dapat berpindah halaman — notifikasi akan muncul saat selesai.`,
          { durationMs: 6500 }
        );
      } else {
        if (updated.ai_fallback_notice) {
          toast.warning(updated.ai_fallback_notice, { durationMs: 9000 });
        }
        toast.success("Evaluasi ulang AI selesai dan hasil berhasil diperbarui!");
      }
    } catch (err: any) {
      toast.error(err?.message || "Gagal menjalankan evaluasi ulang AI.");
    }
  };

  const handleOpenPublishModal = () => {
    if (!validationData) return;
    const proj = validationData.extracted_project;
    if (validationData.request_id) {
      setPublishMode("existing");
      setTargetRequestId(validationData.request_id);
    } else if (requests.length > 0) {
      setPublishMode("new");
      setTargetRequestId(requests[0].id);
    }
    setPublishForm({
      title:
        proj.title ||
        `Pengadaan: ${validationData.document_name.replace(/\.[^/.]+$/, "")}`,
      amount: proj.estimated_amount || 0,
      method: proj.suggested_method || "Tender Terbuka",
      vendorName: proj.vendor_name || "",
      departmentName:
        proj.department_name ||
        proj.department ||
        "Procurement & General Support",
    });
    setIsPublishModalOpen(true);
  };

  const handleConfirmPublish = async () => {
    if (!validationData) return;
    try {
      const res = await publishMutation.mutateAsync({
        validation_log_id: validationData.id,
        target_request_id:
          publishMode === "existing" ? targetRequestId : undefined,
        title: publishForm.title,
        amount: publishForm.amount,
        procurement_method: publishForm.method,
        department_name: publishForm.departmentName,
        vendor_name: publishForm.vendorName,
        stages: activeStages.map((s) => ({
          step: s.step,
          status: s.status,
          auto_cleared: s.auto_cleared,
          notes: s.notes,
        })),
      });

      toast.success(
        publishMode === "existing"
          ? "Dokumen berhasil ditautkan dan tahapan pekerjaan diperbarui!"
          : "Pekerjaan baru berhasil diterbitkan ke Pusat Kendali Pekerjaan!"
      );
      setIsPublishModalOpen(false);
      if (res?.request_id) {
        router.push(`/dashboard/overview/${encodeURIComponent(res.request_id)}`);
      } else {
        router.push("/dashboard/overview");
      }
    } catch (err: any) {
      toast.error(err?.message || "Gagal menerbitkan atau menautkan pekerjaan.");
    }
  };

  if (isLoadingVal) {
    return (
      <div className="space-y-6 pt-2 pb-12 min-h-[calc(100vh-140px)] flex flex-col">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-8 w-52 rounded-lg" />
          <div className="flex gap-3">
            <Skeleton className="h-9 w-32 rounded-lg" />
            <Skeleton className="h-9 w-44 rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-36 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (validationData) {
    const autoClearedCount = activeStages.filter((s) => s.auto_cleared).length;

    const linkedRequest = validationData.request_id
      ? requests.find((r) => r.id === validationData.request_id)
      : undefined;

    return (
      <div className="space-y-5 pt-2 pb-12 min-h-[calc(100vh-140px)] flex flex-col">
        {/* Top Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <button
            type="button"
            onClick={() => router.push("/dashboard/documents")}
            className="inline-flex w-fit items-center gap-2 text-xs font-medium text-slate-500 transition-colors hover:text-[#0a4d8c] focus:outline-none"
          >
            <ArrowLeft size={15} />
            Kembali ke Pemeriksaan Dokumen
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-[#0a4d8c] hover:text-[#0a4d8c] text-slate-700 rounded-lg text-xs font-medium transition-colors focus:outline-none"
            >
              <Eye size={13} className="text-[#0a4d8c]" />
              <span>Pratinjau</span>
            </button>

            <button
              type="button"
              onClick={handleOpenReevalModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-[#0a4d8c] hover:text-[#0a4d8c] text-slate-700 rounded-lg text-xs font-medium transition-colors focus:outline-none"
              title="Sesuaikan bobot, kriteria, atau prompt lalu jalankan ulang AI pada berkas ini"
            >
              <RefreshCw size={13} className="text-[#0a4d8c]" />
              <span>Evaluasi Ulang AI</span>
            </button>

            <button
              type="button"
              onClick={handleOpenDecisionModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-[#0a4d8c] hover:text-[#0a4d8c] text-slate-700 rounded-lg text-xs font-medium transition-colors focus:outline-none"
            >
              <Sliders size={13} className="text-[#0a4d8c]" />
              <span>Keputusan</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              title="Cetak atau Simpan sebagai PDF"
              aria-label="Cetak PDF"
              className="inline-flex items-center justify-center p-2 bg-white border border-slate-200 hover:border-[#0a4d8c] hover:text-[#0a4d8c] text-slate-600 rounded-lg transition-colors focus:outline-none"
            >
              <Printer size={14} />
            </button>

            {validationData.request_id && (
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/dashboard/overview/${encodeURIComponent(
                      validationData.request_id!
                    )}`
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#e8f2fc] border border-[#0a4d8c]/20 hover:bg-blue-100 text-[#0a4d8c] rounded-lg text-xs font-medium transition-colors focus:outline-none"
              >
                <Building2 size={13} />
                <span>{formatRequestCode(validationData.request_id)}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenPublishModal}
              disabled={publishMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0a4d8c] hover:bg-[#083b6c] text-white rounded-lg text-xs font-medium transition-all shadow-2xs disabled:opacity-50 focus:outline-none"
            >
              {publishMutation.isPending ? (
                <>
                  <Spinner
                    size="xs"
                    className="border-white border-t-transparent"
                  />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <span>
                    {validationData.request_id
                      ? "Perbarui Tautan & Pekerjaan"
                      : "Terbitkan ke Pekerjaan"}
                  </span>
                  <ArrowUpRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Background Processing / Error State Banners */}
        {validationData.processing_status === "processing" && (
          <div className="rounded-xl border border-[#0a4d8c]/25 bg-[#f4f8fd] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-[#0a4d8c]/20">
                <Spinner size="sm" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-semibold text-slate-900">
                  Dokumen Sedang Dianalisis AI (
                  {AI_TIER_META[validationData.ai_tier_requested || "cekatan"]?.badgeText ||
                    "Mode Cekatan"}
                  )
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Analisis &ldquo;{validationData.document_name}&rdquo; sedang diproses di latar belakang. Halaman ini akan otomatis diperbarui setelah selesai, atau Anda dapat berpindah ke menu lain dan menunggu notifikasi.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push("/dashboard/documents")}
              className="shrink-0 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:border-[#0a4d8c] hover:text-[#0a4d8c] transition-colors focus:outline-none"
            >
              Kembali ke Daftar Dokumen
            </button>
          </div>
        )}

        {validationData.processing_status === "failed" && (
          <div className="rounded-xl border border-red-200 bg-red-50/90 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-red-600 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <div className="text-sm font-semibold text-red-900">
                  Analisis AI Gagal Diproses
                </div>
                <p className="text-xs text-red-700 leading-relaxed">
                  {validationData.error_message ||
                    "Terjadi kendala saat memproses dokumen dengan AI. Silakan coba jalankan evaluasi ulang."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleOpenReevalModal}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-[#0a4d8c] px-4 py-2 text-xs font-medium text-white hover:bg-[#083b6c] transition-colors focus:outline-none"
            >
              <RefreshCw size={13} />
              <span>Coba Evaluasi Ulang AI</span>
            </button>
          </div>
        )}

        {/* 1. Unified Score, Compliance & Document Metadata Card */}
        {validationData.processing_status !== "processing" && (
        <ValidationScoreCard
          score={validationData.overall_score}
          threshold={validationData.passing_score_threshold}
          status={validationData.compliance_status}
          summary={validationData.summary}
          documentName={validationData.document_name}
          profileName={validationData.profile_name}
          validationId={validationData.id}
          createdAt={validationData.created_at}
          fileUrl={resolveStorageUrl(
            validationData.file_url_signed ||
              validationData.document_file_url ||
              validationData.file_url
          )}
          aiTierUsed={validationData.ai_tier_used}
          aiModelUsed={validationData.ai_model_used}
          aiFallbackNotice={validationData.ai_fallback_notice}
        />
        )}

        {/* 2. Main Content Grid */}
        {validationData.processing_status !== "processing" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column (5/12): Recommendations & Editable Extracted Stages */}
          <div className="lg:col-span-5 space-y-5">
            {validationData.recommendations &&
              validationData.recommendations.length > 0 && (
                <div className="rounded-xl border border-[#0a4d8c]/20 bg-[#f4f8fd] p-5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-[#0a4d8c]">
                    <div className="flex items-center gap-2">
                      <Sparkles size={15} />
                      <h3 className="text-[11px] font-medium uppercase tracking-wider">
                        Rekomendasi Tindak Lanjut Procurement
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenDecisionModal}
                      className="text-[11px] font-medium text-[#0a4d8c] hover:underline"
                    >
                      Ubah Catatan
                    </button>
                  </div>
                  <ul className="space-y-1.5 text-xs font-normal text-slate-700">
                    {validationData.recommendations.map((rec, idx) => (
                      <li
                        key={`rec-${idx}`}
                        className="flex items-start gap-2 leading-relaxed"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0a4d8c] mt-1.5 shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            <ExtractedStagesTimeline
              project={{
                ...validationData.extracted_project,
                stages: activeStages,
              }}
              editable
              onChangeStages={setEditedStages}
            />
          </div>

          {/* Right Column (7/12): Weighted Checklist Evaluations */}
          <div className="lg:col-span-7 space-y-5">
            <ChecklistEvaluationList
              evaluations={validationData.checklist_evaluations}
            />
          </div>
        </div>
        )}

        {/* Document Preview Modal */}
        {isPreviewOpen && (
          <DocumentPreviewModal
            title={validationData.document_name}
            fileId={validationData.document_id || validationData.id}
            fileType="document"
            directUrl={resolveStorageUrl(
              validationData.file_url_signed ||
                validationData.document_file_url ||
                validationData.file_url
            )}
            fileName={validationData.document_name}
            metadata={[
              { label: "ID Validasi", value: validationData.id },
              {
                label: "Standar Acuan",
                value: validationData.profile_name || "Standar Kelayakan PRIMA",
              },
              {
                label: "Skor Kepatuhan",
                value: `${Math.round(validationData.overall_score)} / 100`,
              },
              {
                label: "Status Verifikasi",
                value: validationData.compliance_status,
              },
              {
                label: "Pekerjaan Terikat",
                value: linkedRequest
                  ? `${formatRequestCode(linkedRequest.id)} - ${linkedRequest.title}`
                  : "Belum Ditautkan",
              },
              {
                label: "Waktu Pemeriksaan",
                value: formatDateIndo(validationData.created_at),
              },
            ]}
            onClose={() => setIsPreviewOpen(false)}
          />
        )}

        {/* Modal: Re-Evaluate with AI (Spacious 4xl layout, full-screen centered via Portal) */}
        {isReevalModalOpen && (
          <ModalPortal>
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">
                    Evaluasi Ulang Dokumen dengan AI
                  </h3>
                  <p className="text-xs font-normal text-slate-500 mt-0.5">
                    Sesuaikan bobot, kriteria, atau panduan perbandingan untuk berkas &ldquo;{validationData.document_name}&rdquo; lalu jalankan ulang analisis AI.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReevalModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 focus:outline-none"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <AiModeSelector
                  label="Mode Model AI untuk Evaluasi Ulang"
                  value={reevalAiTier}
                  onChange={setReevalAiTier}
                />

                <ChecklistEditor
                  items={reevalRules}
                  onChange={setReevalRules}
                  passingScore={reevalPassingScore}
                  onPassingScoreChange={setReevalPassingScore}
                  showSourceBadges
                  aiTier={reevalAiTier}
                />

                <div>
                  <label className="text-[11px] font-medium uppercase tracking-wider text-slate-600 block mb-1">
                    Instruksi Tambahan / Fokus Evaluasi Ulang AI
                  </label>
                  <textarea
                    rows={3}
                    value={reevalPrompt}
                    onChange={(e) => setReevalPrompt(e.target.value)}
                    placeholder="Contoh: Fokus evaluasi perbandingan jadwal penawaran (12 bulan) terhadap KAK (13 bulan) dan detail rincian PPN..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-800 focus:border-[#0a4d8c] focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReevalModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReevaluate}
                  disabled={reevaluateMutation.isPending}
                  className="px-5 py-2 bg-[#0a4d8c] hover:bg-[#083b6c] text-white rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {reevaluateMutation.isPending ? (
                    <>
                      <Spinner
                        size="xs"
                        className="border-white border-t-transparent"
                      />
                      <span>Menganalisis Ulang...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw size={13} />
                      <span>Jalankan Evaluasi Ulang AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            </div>
          </ModalPortal>
        )}

        {/* Modal: Reviewer Decision Override */}
        {isDecisionModalOpen && (
          <ModalPortal>
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">
                    Keputusan & Catatan Verifikasi Reviewer
                  </h3>
                  <p className="text-xs font-normal text-slate-500 mt-0.5">
                    Tetapkan status kelayakan akhir dan instruksi tindak lanjut di database
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDecisionModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 focus:outline-none"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium uppercase tracking-wider text-slate-600 block mb-1">
                      Status Kelayakan Dokumen
                    </label>
                    <SearchableSelect
                      size="sm"
                      value={decisionStatus}
                      onChange={(val) =>
                        setDecisionStatus(val as ComplianceStatus)
                      }
                      searchPlaceholder="Cari status..."
                      options={COMPLIANCE_STATUS_OPTIONS}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium uppercase tracking-wider text-slate-600 block mb-1">
                      Skor Kepatuhan (0 - 100)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={decisionScore}
                      onChange={(e) =>
                        setDecisionScore(
                          Math.min(100, Math.max(0, Number(e.target.value)))
                        )
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-800 focus:border-[#0a4d8c] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium uppercase tracking-wider text-slate-600 block mb-1">
                    Ringkasan Evaluasi / Catatan Reviewer
                  </label>
                  <textarea
                    rows={3}
                    value={decisionNotes}
                    onChange={(e) => setDecisionNotes(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-800 focus:border-[#0a4d8c] focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium uppercase tracking-wider text-slate-600 block mb-1">
                    Rekomendasi / Tindak Lanjut Utama
                  </label>
                  <input
                    type="text"
                    value={decisionNextAction}
                    onChange={(e) => setDecisionNextAction(e.target.value)}
                    placeholder="Contoh: Lanjutkan ke Rapat Pra-Tender atau minta revisi RAB ke FPP..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-800 focus:border-[#0a4d8c] focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDecisionModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveDecision}
                  disabled={decisionMutation.isPending}
                  className="px-5 py-2 bg-[#0a4d8c] hover:bg-[#083b6c] text-white rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {decisionMutation.isPending ? (
                    <>
                      <Spinner
                        size="xs"
                        className="border-white border-t-transparent"
                      />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Simpan Keputusan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            </div>
          </ModalPortal>
        )}

        {/* Modal: Publish / Link to Tracker Confirmation */}
        {isPublishModalOpen && (
          <ModalPortal>
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">
                    Terbitkan atau Tautkan ke Pusat Kendali Pekerjaan
                  </h3>
                  <p className="text-xs font-normal text-slate-500 mt-0.5">
                    Pilih untuk membuat pekerjaan baru atau memperbarui tautan pada pekerjaan yang sudah berjalan
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 focus:outline-none"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Mode Selector Tabs */}
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setPublishMode("new")}
                    className={`flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition-all ${
                      publishMode === "new"
                        ? "bg-white text-[#0a4d8c] shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Plus size={13} />
                    <span>Buat Pekerjaan Baru</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPublishMode("existing");
                      if (!targetRequestId && requests.length > 0) {
                        setTargetRequestId(requests[0].id);
                      }
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition-all ${
                      publishMode === "existing"
                        ? "bg-white text-[#0a4d8c] shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Building2 size={13} />
                    <span>Tautkan ke Pekerjaan Ada</span>
                  </button>
                </div>

                {autoClearedCount > 0 && (
                  <div className="rounded-lg bg-[#e8f2fc] border border-[#0a4d8c]/20 p-3 text-xs font-normal text-[#0a4d8c] flex items-center gap-2">
                    <CheckCircle2 size={15} className="shrink-0" />
                    <span>
                      <span className="font-medium">
                        {autoClearedCount} Tahapan
                      </span>{" "}
                      akan ditandai selesai otomatis pada alur kerja pekerjaan.
                    </span>
                  </div>
                )}

                {publishMode === "existing" ? (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="text-[11px] font-medium text-slate-600 uppercase tracking-wider block mb-1">
                        Pilih Pekerjaan Pengadaan
                      </label>
                      <SearchableSelect
                        value={targetRequestId}
                        onChange={setTargetRequestId}
                        options={requestOptions}
                        searchPlaceholder="Cari kode atau nama pekerjaan..."
                      />
                    </div>
                    <p className="text-xs font-normal text-slate-500 leading-relaxed">
                      Dokumen{" "}
                      <span className="font-medium text-slate-700">
                        {validationData.document_name}
                      </span>{" "}
                      beserta hasil pemeriksaan AI akan ditautkan ke pekerjaan terpilih dan memperbarui status tahapan terkait.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="text-[11px] font-medium text-slate-600 uppercase tracking-wider block mb-1">
                        Judul Pekerjaan Pengadaan Baru
                      </label>
                      <input
                        type="text"
                        value={publishForm.title}
                        onChange={(e) =>
                          setPublishForm({
                            ...publishForm,
                            title: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-800 focus:border-[#0a4d8c] focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-medium text-slate-600 uppercase tracking-wider block mb-1">
                          Estimasi HPS / Anggaran
                        </label>
                        <input
                          type="number"
                          value={publishForm.amount}
                          onChange={(e) =>
                            setPublishForm({
                              ...publishForm,
                              amount: Number(e.target.value),
                            })
                          }
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-800 focus:border-[#0a4d8c] focus:outline-none"
                        />
                        <span className="text-[11px] text-[#0a4d8c] font-medium block mt-1">
                          {formatRupiah(publishForm.amount)}
                        </span>
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-slate-600 uppercase tracking-wider block mb-1">
                          Metode Pengadaan
                        </label>
                        <SearchableSelect
                          size="sm"
                          value={publishForm.method}
                          onChange={(val) =>
                            setPublishForm({
                              ...publishForm,
                              method: val,
                            })
                          }
                          allowCustomValue
                          searchPlaceholder="Cari metode..."
                          options={methodOptions}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-medium text-slate-600 uppercase tracking-wider block mb-1">
                          Vendor Rekanan (Bila ada)
                        </label>
                        <input
                          type="text"
                          value={publishForm.vendorName}
                          onChange={(e) =>
                            setPublishForm({
                              ...publishForm,
                              vendorName: e.target.value,
                            })
                          }
                          placeholder="PT Vendor Rekanan..."
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-800 focus:border-[#0a4d8c] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-slate-600 uppercase tracking-wider block mb-1">
                          Fungsi Pemohon (FPP)
                        </label>
                        <input
                          type="text"
                          value={publishForm.departmentName}
                          onChange={(e) =>
                            setPublishForm({
                              ...publishForm,
                              departmentName: e.target.value,
                            })
                          }
                          placeholder="Fungsi Pemohon..."
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-800 focus:border-[#0a4d8c] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPublish}
                  disabled={
                    publishMutation.isPending ||
                    (publishMode === "new" && !publishForm.title.trim()) ||
                    (publishMode === "existing" && !targetRequestId)
                  }
                  className="px-5 py-2 bg-[#0a4d8c] hover:bg-[#083b6c] text-white rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {publishMutation.isPending ? (
                    <>
                      <Spinner
                        size="xs"
                        className="border-white border-t-transparent"
                      />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>
                        {publishMode === "existing"
                          ? "Tautkan & Perbarui Pekerjaan"
                          : "Konfirmasi & Terbitkan Baru"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
            </div>
          </ModalPortal>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-8 pb-12 text-center max-w-md mx-auto">
      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
        <AlertTriangle size={22} />
      </div>
      <h3 className="text-sm font-semibold text-slate-800">
        Data Hasil Analisis Tidak Ditemukan
      </h3>
      <p className="text-xs font-normal text-slate-500">
        ID dokumen atau log validasi tidak ditemukan dalam sistem.
      </p>
      <button
        type="button"
        onClick={() => router.push("/dashboard/documents")}
        className="mt-2 px-4 py-2 bg-[#0a4d8c] text-white text-xs font-medium rounded-lg hover:bg-[#083b6c] transition-colors"
      >
        Kembali ke Pemeriksaan Dokumen
      </button>
    </div>
  );
}
