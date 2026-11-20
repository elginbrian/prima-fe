"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  FileSpreadsheet,
  RefreshCw,
  ShieldCheck,
  Sliders,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCreateValidationProfile,
  useExtractCriteria,
  useUpdateValidationProfile,
  useValidationProfile,
  useWorkflowStages,
} from "@/lib/query/hooks/procurement/useValidation";
import {
  ChecklistEditor,
  normalizeWeightsTo100,
} from "@/components/widgets/documents/ChecklistEditor";
import { DocumentPreview } from "@/components/widgets/upload/DocumentPreview";
import { SearchableSelect, Skeleton, Spinner, AiModeSelector } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { DOCUMENT_KIND_OPTIONS, SCOPE_OPTIONS } from "./templateConstants";
import type {
  AiTier,
  ChecklistRuleItem,
  CreateValidationProfilePayload,
} from "@/types/validation";

const SAMPLE_STARTER_RULES: ChecklistRuleItem[] = [
  {
    category: "Ruang Lingkup",
    item: "Uraian ruang lingkup kebutuhan dan spesifikasi teknis jelas serta terukur",
    is_mandatory: true,
    weight: 50,
    severity_on_failure: "ERROR",
    source: "template",
  },
  {
    category: "Legalitas & Otorisasi",
    item: "Dokumen memuat tanggal, nomor surat, dan otorisasi pejabat berwenang",
    is_mandatory: true,
    weight: 50,
    severity_on_failure: "ERROR",
    source: "template",
  },
];

export default function TemplateEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const editId = searchParams.get("id") ?? "";
  const isEditMode = Boolean(editId);

  const { data: existingProfile, isLoading: isLoadingProfile } =
    useValidationProfile(editId || undefined);
  const { data: allStages = [] } = useWorkflowStages();
  const extractMutation = useExtractCriteria();
  const createMutation = useCreateValidationProfile();
  const updateMutation = useUpdateValidationProfile();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [criteriaFile, setCriteriaFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadMergeMode, setUploadMergeMode] = useState<"replace" | "append">(
    "replace"
  );
  const [aiTier, setAiTier] = useState<AiTier>("cekatan");

  const [formName, setFormName] = useState("");
  const [formKind, setFormKind] = useState("Kerangka Acuan Kerja");
  const [formScope, setFormScope] = useState("GLOBAL");
  const [formDescription, setFormDescription] = useState("");
  const [formPassingScore, setFormPassingScore] = useState(80);
  const [formStrictMandatory, setFormStrictMandatory] = useState(true);
  const [formTargetStage, setFormTargetStage] = useState(
    "Penyusunan RKS & Spesifikasi Teknis"
  );
  const [formSystemPrompt, setFormSystemPrompt] = useState("");
  const [showPromptBox, setShowPromptBox] = useState(false);
  const [formRules, setFormRules] = useState<ChecklistRuleItem[]>([]);
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [hydratedId, setHydratedId] = useState<string>("");

  useEffect(() => {
    if (isEditMode && existingProfile && hydratedId !== existingProfile.id) {
      setFormName(existingProfile.name);
      setFormKind(existingProfile.document_kind || "Umum");
      setFormScope(existingProfile.scope || "GLOBAL");
      setFormDescription(existingProfile.description || "");
      setFormPassingScore(existingProfile.passing_score_threshold || 80);
      setFormStrictMandatory(
        existingProfile.strict_mandatory_enforcement ?? true
      );
      setFormTargetStage(existingProfile.target_stage_to_clear || "");
      const prompt =
        existingProfile.custom_system_prompt ||
        existingProfile.prompt_template ||
        "";
      setFormSystemPrompt(prompt);
      setShowPromptBox(Boolean(prompt.trim()));
      setFormRules(existingProfile.checklist_rules || []);
      setFormIsDefault(existingProfile.is_default ?? false);
      setHydratedId(existingProfile.id);
    }
  }, [isEditMode, existingProfile, hydratedId]);

  const uniqueStageOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts: { value: string; label: string; description?: string }[] = [
      { value: "", label: "-- Tidak Ada Auto-Clear Tahap --" },
    ];
    allStages.forEach((s) => {
      if (!seen.has(s.step_name)) {
        seen.add(s.step_name);
        opts.push({
          value: s.step_name,
          label: s.step_name,
          description: `${s.stage_group} · ${s.procurement_method}`,
        });
      }
    });
    return opts;
  }, [allStages]);

  const isPreviewableInBrowser = useMemo(() => {
    if (!criteriaFile) return false;
    const ext = criteriaFile.name.split(".").pop()?.toLowerCase() || "";
    return ["pdf", "png", "jpg", "jpeg", "webp"].includes(ext);
  }, [criteriaFile]);

  const mandatoryCount = useMemo(
    () => formRules.filter((r) => r.is_mandatory).length,
    [formRules]
  );

  const runCriteriaExtraction = async (uploaded: File) => {
    try {
      toast.info(
        `Mengekstrak kriteria & bobot dari '${uploaded.name}' dengan AI...`
      );
      const extracted = await extractMutation.mutateAsync({
        file: uploaded,
        aiTier,
      });
      if (extracted.ai_fallback_notice) {
        toast.warning(extracted.ai_fallback_notice, { durationMs: 9000 });
      }
      const extractedRules: ChecklistRuleItem[] = (
        extracted.checklist_rules || []
      ).map((r) => ({
        ...r,
        source: "template" as const,
      }));

      if (extractedRules.length === 0) {
        toast.warning(
          "Tidak ada butir kriteria yang terdeteksi dari file tersebut."
        );
        return;
      }

      if (uploadMergeMode === "append" && formRules.length > 0) {
        setFormRules(normalizeWeightsTo100([...formRules, ...extractedRules]));
      } else {
        setFormRules(normalizeWeightsTo100(extractedRules));
      }

      if (!formName.trim() && extracted.suggested_name) {
        setFormName(extracted.suggested_name);
      }
      if (extracted.suggested_document_kind) {
        setFormKind(extracted.suggested_document_kind);
      }
      if (!formSystemPrompt.trim() && extracted.suggested_system_prompt) {
        setFormSystemPrompt(extracted.suggested_system_prompt);
        setShowPromptBox(true);
      }

      toast.success(
        `Berhasil mengekstrak ${extractedRules.length} kriteria berbobot dari '${uploaded.name}'.`
      );
    } catch (err: any) {
      toast.error(
        err?.message || "Gagal mengekstrak kriteria dari file yang diunggah."
      );
    }
  };

  const handleSelectedFile = (uploaded: File) => {
    setCriteriaFile(uploaded);
    void runCriteriaExtraction(uploaded);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.warning("Nama template standar kelayakan wajib diisi.");
      return;
    }
    if (formRules.length === 0) {
      toast.warning(
        "Tambahkan minimal 1 butir kriteria kelayakan (atau unggah file kriteria)."
      );
      return;
    }

    const normalizedRules = normalizeWeightsTo100(formRules).map((r) => ({
      ...r,
      source: "template" as const,
    }));

    const payload: CreateValidationProfilePayload = {
      name: formName.trim(),
      document_kind: formKind,
      description: formDescription.trim() || undefined,
      scope: formScope,
      passing_score_threshold: formPassingScore,
      warning_score_threshold: Math.max(50, formPassingScore - 20),
      strict_mandatory_enforcement: formStrictMandatory,
      target_stage_to_clear: formTargetStage || undefined,
      custom_system_prompt: formSystemPrompt.trim() || undefined,
      checklist_rules: normalizedRules,
      is_default: formIsDefault,
    };

    try {
      if (isEditMode && editId) {
        await updateMutation.mutateAsync({ id: editId, payload });
        toast.success(`Template '${payload.name}' berhasil diperbarui.`);
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(
          `Template baru '${payload.name}' berhasil disimpan ke database.`
        );
      }
      router.push("/dashboard/documents/templates");
    } catch (err: any) {
      toast.error(err?.message || "Gagal menyimpan template standar.");
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4 pt-1 pb-12 flex flex-col">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.push("/dashboard/documents/templates")}
          className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-[#0a4d8c] focus:outline-none"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Pustaka Template</span>
        </button>
      </div>

      {/* Main Split Workspace — matching DocumentUploadPage experience */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-x-clip flex flex-col lg:flex-row">
        {/* Left Column (5/12): Criteria File Dropzone & Preview */}
        <div className="w-full lg:w-5/12 bg-slate-50/70 border-b lg:border-b-0 lg:border-r border-slate-200 p-5 sm:p-6 flex flex-col space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              1. Impor Kriteria dari File (Opsional)
            </h2>

            {formRules.length > 0 && (
              <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setUploadMergeMode("replace")}
                  className={`rounded px-2 py-0.5 font-medium transition-colors ${
                    uploadMergeMode === "replace"
                      ? "bg-[#0a4d8c] text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Ganti
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMergeMode("append")}
                  className={`rounded px-2 py-0.5 font-medium transition-colors ${
                    uploadMergeMode === "append"
                      ? "bg-[#0a4d8c] text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Tambah
                </button>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.png,.jpg,.jpeg"
            onChange={(e) => {
              const chosen = e.target.files?.[0];
              e.target.value = "";
              if (chosen) handleSelectedFile(chosen);
            }}
            className="hidden"
          />

          {!criteriaFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const dropped = e.dataTransfer.files?.[0];
                if (dropped) handleSelectedFile(dropped);
              }}
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center flex-1 min-h-[260px] transition-all cursor-pointer ${
                isDragging
                  ? "border-[#0a4d8c] bg-[#e8f2fc]/60"
                  : "border-slate-300 bg-white hover:border-[#0a4d8c]/60 hover:bg-slate-50"
              }`}
            >
              <div className="w-11 h-11 bg-[#e8f2fc] text-[#0a4d8c] rounded-xl flex items-center justify-center mb-3 border border-[#0a4d8c]/20">
                {extractMutation.isPending ? (
                  <Spinner size="sm" />
                ) : (
                  <UploadCloud size={22} />
                )}
              </div>
              <h3 className="text-sm font-medium text-slate-800 mb-1 text-center">
                {extractMutation.isPending
                  ? "Mengekstrak Daftar Kriteria dengan AI..."
                  : "Tarik & Lepas Berkas Kriteria ke Sini"}
              </h3>
              <p className="text-xs font-normal text-slate-500 text-center max-w-xs mb-4 leading-relaxed">
                Unggah PDF, DOCX, XLSX, CSV, atau gambar matriks kriteria agar butir &amp; bobot terisi otomatis ke panel kanan.
              </p>

              <span className="bg-[#0a4d8c] hover:bg-[#083b6c] text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1.5">
                <FileSpreadsheet size={14} />
                <span>Telusuri Berkas Kriteria</span>
              </span>
            </div>
          ) : (
            <div className="flex-1 flex flex-col space-y-2.5">
              <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
                <span className="font-medium text-slate-700 truncate">
                  {criteriaFile.name}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={extractMutation.isPending}
                    onClick={() => void runCriteriaExtraction(criteriaFile)}
                    className="inline-flex items-center gap-1 text-[#0a4d8c] font-medium hover:underline disabled:opacity-50 focus:outline-none"
                  >
                    <RefreshCw size={12} />
                    <span>Ekstrak Ulang</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCriteriaFile(null)}
                    className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 focus:outline-none"
                  >
                    <X size={13} />
                    <span>Ganti</span>
                  </button>
                </div>
              </div>

              {isPreviewableInBrowser ? (
                <div className="flex-1 flex flex-col min-h-[380px]">
                  <DocumentPreview file={criteriaFile} />
                </div>
              ) : (
                <div className="flex-1 rounded-xl border border-slate-200 bg-white p-6 flex flex-col items-center justify-center text-center min-h-[240px] space-y-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8f2fc] text-[#0a4d8c] border border-[#0a4d8c]/20">
                    <FileSpreadsheet size={22} />
                  </div>
                  <div className="text-xs font-semibold text-slate-800">
                    {criteriaFile.name}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {(criteriaFile.size / 1024).toFixed(1)} KB ·{" "}
                    {extractMutation.isPending
                      ? "Sedang mengekstrak..."
                      : `${formRules.length} butir kriteria siap di panel kanan`}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Compact AI Mode Selector for Criteria Extraction */}
          <div className="rounded-lg border border-slate-200/80 bg-white px-3.5 py-2.5">
            <AiModeSelector
              size="sm"
              label="Mode AI Ekstraksi"
              value={aiTier}
              onChange={setAiTier}
              disabled={extractMutation.isPending}
            />
          </div>

          {/* Compact Template Live Summary Strip */}
          <div className="rounded-lg border border-slate-200/80 bg-white px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
            <span className="inline-flex items-center gap-1.5 font-medium text-[#0a4d8c]">
              <Sparkles size={12} />
              <span>{formRules.length} Butir Kriteria</span>
            </span>
            <span>
              {mandatoryCount} Wajib · Ambang Lulus &ge; {formPassingScore}%
            </span>
          </div>
        </div>

        {/* Right Column (7/12): Metadata + Checklist Editor + True Sticky Footer */}
        <div className="w-full lg:w-7/12 flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm sm:text-base font-semibold text-slate-800">
              {isEditMode
                ? "2. Edit Standar Kelayakan & Kriteria"
                : "2. Konfigurasi Template Standar & Kriteria"}
            </h2>
            <p className="text-xs font-normal text-slate-500 mt-0.5">
              Lengkapi identitas standar dan atur bobot kriteria secara manual atau hasil ekstraksi AI.
            </p>
          </div>

          {isEditMode && isLoadingProfile ? (
            <div className="p-6 space-y-4 flex-1">
              <Skeleton className="h-10 w-full rounded-lg" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          ) : (
            <div className="p-6 space-y-5 flex-1">
              {/* Metadata: Clean Spacious 2-Column Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-medium uppercase tracking-wider text-slate-600 block mb-1">
                    Nama Template Standar <span className="text-[#0a4d8c]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Standar Evaluasi KAK Jasa Konsultansi"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-800 focus:border-[#0a4d8c] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium uppercase tracking-wider text-slate-600 block mb-1">
                    Jenis Dokumen
                  </label>
                  <SearchableSelect
                    size="sm"
                    value={formKind}
                    onChange={setFormKind}
                    allowCustomValue
                    searchPlaceholder="Cari jenis dokumen..."
                    options={DOCUMENT_KIND_OPTIONS.map((k) => ({
                      value: k,
                      label: k,
                    }))}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium uppercase tracking-wider text-slate-600 block mb-1">
                    Cakupan Standar
                  </label>
                  <SearchableSelect
                    size="sm"
                    value={formScope}
                    onChange={setFormScope}
                    searchPlaceholder="Cari cakupan..."
                    options={SCOPE_OPTIONS}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium uppercase tracking-wider text-slate-600 block mb-1">
                    Auto-Clear Tahap Pekerjaan (Opsional)
                  </label>
                  <SearchableSelect
                    size="sm"
                    value={formTargetStage}
                    onChange={setFormTargetStage}
                    allowClear
                    allowCustomValue
                    searchPlaceholder="Cari tahapan pekerjaan..."
                    options={uniqueStageOptions}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium uppercase tracking-wider text-slate-600 block mb-1">
                    Deskripsi Singkat (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Acuan kegunaan template standar..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-800 focus:border-[#0a4d8c] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2 flex flex-wrap items-center gap-6 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={formStrictMandatory}
                      onChange={(e) => setFormStrictMandatory(e.target.checked)}
                      className="rounded border-slate-300 accent-[#0a4d8c]"
                    />
                    <span>Wajib lulus seluruh kriteria berlabel Wajib</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={formIsDefault}
                      onChange={(e) => setFormIsDefault(e.target.checked)}
                      className="rounded border-slate-300 accent-[#0a4d8c]"
                    />
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck size={13} className="text-[#0a4d8c]" />
                      Jadikan standar utama (Default)
                    </span>
                  </label>
                </div>
              </div>

              {/* Weighted Criteria Section */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#0a4d8c]">
                    <Sliders size={13} />
                    <span>Kriteria Checklist Berbobot &amp; Ambang Skor</span>
                  </div>
                  {formRules.length === 0 && (
                    <button
                      type="button"
                      onClick={() => setFormRules(SAMPLE_STARTER_RULES)}
                      className="text-[11px] font-medium text-[#0a4d8c] hover:underline focus:outline-none"
                    >
                      + Muat 2 Contoh Kriteria Dasar
                    </button>
                  )}
                </div>

                <ChecklistEditor
                  items={formRules}
                  onChange={setFormRules}
                  passingScore={formPassingScore}
                  onPassingScoreChange={setFormPassingScore}
                  hideUploadBar
                />
              </div>

              {/* Collapsible AI System Prompt */}
              <div className="border-t border-slate-100 pt-3">
                {!showPromptBox ? (
                  <button
                    type="button"
                    onClick={() => setShowPromptBox(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#0a4d8c] transition-colors focus:outline-none"
                  >
                    <Sparkles size={13} className="text-[#0a4d8c]" />
                    <span>+ Tambah Instruksi Khusus Sistem AI (Opsional)</span>
                  </button>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Sparkles size={12} className="text-[#0a4d8c]" />
                        Instruksi Sistem AI (Opsional)
                      </label>
                      {!formSystemPrompt.trim() && (
                        <button
                          type="button"
                          onClick={() => setShowPromptBox(false)}
                          className="text-[11px] text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                          Tutup
                        </button>
                      )}
                    </div>
                    <textarea
                      value={formSystemPrompt}
                      onChange={(e) => setFormSystemPrompt(e.target.value)}
                      rows={2}
                      placeholder="Contoh: Pastikan pencantuman klausul TKDN minimal 40% dan kepatuhan CSMS..."
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-800 focus:border-[#0a4d8c] focus:outline-none resize-none"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* True Sticky Footer */}
          <div className="sticky bottom-0 z-10 px-6 py-3.5 bg-white/95 backdrop-blur-xs border-t border-slate-200 flex items-center justify-between gap-3 rounded-br-xl">
            <button
              type="button"
              onClick={() => router.push("/dashboard/documents/templates")}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || (isEditMode && isLoadingProfile)}
              className="px-5 py-2 bg-[#0a4d8c] hover:bg-[#083b6c] text-white rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            >
              {isSaving ? (
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
                  <span>
                    {isEditMode
                      ? "Simpan Perubahan Template"
                      : "Simpan Template ke Database"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
