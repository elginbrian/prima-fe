"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  UploadCloud,
  ArrowRight,
  X,
  Sparkles,
  Building2,
  Sliders,
  BookOpen,
  BookmarkPlus,
  Check,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useProcurement } from "@/context/ProcurementContext";
import { useProcurements } from "@/lib/query/hooks/procurement/useProcurement";
import {
  useValidationProfiles,
  useAnalyzeDocumentChecklist,
  useCreateValidationProfile,
  useWorkflowStages,
} from "@/lib/query/hooks/procurement/useValidation";
import { useToast } from "@/components/ui/Toast";
import { Spinner, SearchableSelect, ModalPortal } from "@/components/ui";
import { DocumentPreview } from "@/components/widgets/upload/DocumentPreview";
import { ValidationProfileSelector } from "@/components/widgets/documents/ValidationProfileSelector";
import {
  ChecklistEditor,
  normalizeWeightsTo100,
} from "@/components/widgets/documents/ChecklistEditor";
import { formatRequestCode } from "@/lib/utils";
import type { ChecklistRuleItem, ValidationProfile } from "@/types/validation";

const DOCUMENT_KIND_OPTIONS = [
  "Kerangka Acuan Kerja",
  "Rencana Anggaran Biaya",
  "Jaminan Pelaksanaan",
  "Jaminan Penawaran",
  "Dokumen Penawaran",
  "Kontrak & Perjanjian",
  "Berita Acara",
  "Umum",
];

export default function DocumentUploadPage() {
  const router = useRouter();
  const toast = useToast();
  const { state } = useProcurement();
  const { data: serverRequests = [] } = useProcurements();
  const requests = serverRequests.length > 0 ? serverRequests : state.requests;

  const { data: profiles = [], isLoading: isLoadingProfiles } =
    useValidationProfiles();
  const { data: workflowStages = [] } = useWorkflowStages();
  const analyzeMutation = useAnalyzeDocumentChecklist();
  const createProfileMutation = useCreateValidationProfile();

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [checklistRules, setChecklistRules] = useState<ChecklistRuleItem[]>([]);
  const [passingScore, setPassingScore] = useState<number>(80);
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [selectedRequestId, setSelectedRequestId] = useState<string>("");
  const [showCriteriaEditor, setShowCriteriaEditor] = useState<boolean>(true);
  const [showPromptBox, setShowPromptBox] = useState<boolean>(false);

  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateKind, setNewTemplateKind] = useState("Kerangka Acuan Kerja");
  const [newTemplateDesc, setNewTemplateDesc] = useState("");
  const [newTemplateStage, setNewTemplateStage] = useState("");

  const requestOptions = useMemo(
    () => [
      {
        value: "",
        label: "-- Buat Pekerjaan Baru Otomatis dari Ekstraksi Dokumen --",
        description: "AI mengekstrak judul, estimasi anggaran, dan urutan tahapan otomatis",
      },
      ...requests.map((r) => ({
        value: r.id,
        label: `${formatRequestCode(r.id)} – ${r.title}`,
        description: `${r.department?.name || "-"} · Tahap: ${r.currentStep}`,
        keywords: `${r.id} ${r.title} ${r.department?.name || ""}`,
      })),
    ],
    [requests]
  );

  const stageOptions = useMemo(() => {
    const seen = new Set<string>();
    const list: { value: string; label: string; description?: string }[] = [
      { value: "", label: "-- Tidak Ada --" },
    ];
    workflowStages.forEach((s) => {
      if (!seen.has(s.step_name)) {
        seen.add(s.step_name);
        list.push({
          value: s.step_name,
          label: s.step_name,
          description: `${s.stage_group} · ${s.procurement_method}`,
        });
      }
    });
    return list;
  }, [workflowStages]);

  const templateRuleCount = checklistRules.filter(
    (r) => r.source === "template"
  ).length;
  const customRuleCount = checklistRules.filter(
    (r) => r.source !== "template"
  ).length;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const reqId = params.get("requestId");
      if (reqId) {
        setSelectedRequestId(reqId);
      }
      const profId = params.get("profileId");
      if (profId && profiles.length > 0 && !selectedProfileId) {
        const found = profiles.find((p) => p.id === profId);
        if (found) {
          handleSelectProfile(found);
        }
      }
    }
  }, [profiles]);

  const handleSaveAsNewTemplate = async () => {
    if (!newTemplateName.trim()) {
      toast.warning("Nama template baru wajib diisi.");
      return;
    }
    if (checklistRules.length === 0) {
      toast.warning("Tambahkan minimal 1 butir kriteria kelayakan terlebih dahulu.");
      return;
    }
    try {
      const created = await createProfileMutation.mutateAsync({
        name: newTemplateName.trim(),
        document_kind: newTemplateKind,
        description: newTemplateDesc.trim() || undefined,
        scope: "GLOBAL",
        passing_score_threshold: passingScore,
        warning_score_threshold: Math.max(50, passingScore - 20),
        strict_mandatory_enforcement: true,
        target_stage_to_clear: newTemplateStage || undefined,
        custom_system_prompt: customPrompt.trim() || undefined,
        checklist_rules: normalizeWeightsTo100(checklistRules).map((r) => ({
          ...r,
          source: "template" as const,
        })),
        is_default: false,
      });
      setSelectedProfileId(created.id);
      setIsSaveTemplateModalOpen(false);
      setNewTemplateName("");
      setNewTemplateDesc("");
      toast.success(`Template '${created.name}' berhasil disimpan ke database!`);
    } catch (err: any) {
      toast.error(err?.message || "Gagal menyimpan template baru.");
    }
  };

  const handleSelectProfile = (profile: ValidationProfile | null) => {
    if (profile) {
      setSelectedProfileId(profile.id);
      const normalized = normalizeWeightsTo100(
        (profile.checklist_rules || []).map((r) => ({
          ...r,
          source: "template" as const,
        }))
      );
      setChecklistRules(normalized);
      setPassingScore(profile.passing_score_threshold || 80);
      setShowCriteriaEditor(false);
      const prompt = profile.custom_system_prompt || profile.prompt_template;
      if (prompt) {
        setCustomPrompt(prompt);
        setShowPromptBox(true);
      }
    } else {
      setSelectedProfileId("");
      setShowCriteriaEditor(true);
      setChecklistRules((prev) =>
        prev.map((r) => ({ ...r, source: "custom" as const }))
      );
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.warning("Silakan pilih atau unggah berkas dokumen terlebih dahulu.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    if (selectedProfileId) {
      formData.append("profile_id", selectedProfileId);
    }
    if (checklistRules.length > 0) {
      formData.append("checklist_items", JSON.stringify(checklistRules));
    }
    formData.append("passing_score_threshold", String(passingScore));
    if (customPrompt.trim()) {
      formData.append("custom_prompt", customPrompt.trim());
    }
    if (selectedRequestId) {
      formData.append("request_id", selectedRequestId);
    }

    try {
      toast.info("Mengirim dokumen ke layanan validasi AI PRIMA...");
      const result = await analyzeMutation.mutateAsync(formData);
      toast.success("Dokumen berhasil dianalisis!");
      router.push(`/dashboard/documents/result?id=${result.id}`);
    } catch (err: any) {
      toast.error(
        err?.message || "Gagal melakukan analisis validasi dokumen."
      );
    }
  };

  return (
    <div className="space-y-5 pt-2 pb-12 min-h-[calc(100vh-140px)] flex flex-col">
      {/* Top Breadcrumb Header */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() =>
            selectedRequestId
              ? router.push(
                  `/dashboard/overview/${encodeURIComponent(
                    selectedRequestId
                  )}?tab=docs-guarantees`
                )
              : router.push("/dashboard/documents")
          }
          className="inline-flex w-fit items-center gap-2 text-xs font-medium text-slate-500 transition-colors hover:text-[#0a4d8c] focus:outline-none"
        >
          <ArrowLeft size={15} />
          {selectedRequestId
            ? "Kembali ke Detail Pekerjaan"
            : "Kembali ke Pemeriksaan Dokumen"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/dashboard/documents/templates")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-[#0a4d8c] hover:text-[#0a4d8c] transition-colors shadow-2xs focus:outline-none"
        >
          <BookOpen size={13} className="text-[#0a4d8c]" />
          <span>Kelola Template & Tahapan</span>
        </button>
      </div>

      {/* Main Form Layout — natural single-page scroll with sticky CTA footer */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col lg:flex-row">
        {/* Left Column: Upload Dropzone & Document Preview */}
        <div className="w-full lg:w-5/12 bg-slate-50/70 border-b lg:border-b-0 lg:border-r border-slate-200 p-5 sm:p-6 flex flex-col space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              1. Berkas Dokumen Target
            </h2>
            {file && (
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 hover:underline focus:outline-none"
              >
                <X size={13} />
                Ganti Berkas
              </button>
            )}
          </div>

          {!file ? (
            <div
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center min-h-[340px] transition-all cursor-pointer ${
                isDragging
                  ? "border-[#0a4d8c] bg-[#e8f2fc]/60"
                  : "border-slate-300 bg-white hover:border-[#0a4d8c]/60 hover:bg-slate-50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="w-11 h-11 bg-[#e8f2fc] text-[#0a4d8c] rounded-xl flex items-center justify-center mb-3 border border-[#0a4d8c]/20">
                <UploadCloud size={22} />
              </div>
              <h3 className="text-sm font-medium text-slate-800 mb-1">
                Tarik &amp; Lepas Berkas ke Sini
              </h3>
              <p className="text-xs font-normal text-slate-500 text-center max-w-xs mb-4 leading-relaxed">
                PDF, DOCX, XLSX, atau pindaian resmi (Maks. 25MB)
              </p>

              <label className="cursor-pointer bg-[#0a4d8c] hover:bg-[#083b6c] text-white px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2">
                <span>Telusuri Komputer</span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-[420px]">
              <DocumentPreview file={file} />
            </div>
          )}

          <div className="flex items-center gap-1.5 text-[11px] font-normal text-slate-500">
            <Sparkles size={12} className="text-[#0a4d8c] shrink-0" />
            <span>Mendukung penilaian berbobot otomatis (normalisasi 100%) &amp; ekstraksi tahapan AI.</span>
          </div>
        </div>

        {/* Right Column: Progressive Disclosure Configuration + Sticky Submit Footer */}
        <div className="w-full lg:w-7/12 flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm sm:text-base font-semibold text-slate-800">
              2. Standar Pemeriksaan &amp; Kriteria
            </h2>
            <p className="text-xs font-normal text-slate-500 mt-0.5">
              Pilih template standar siap pakai atau atur kriteria &amp; bobot kustom.
            </p>
          </div>

          <div className="p-6 space-y-5 flex-1">
            {/* Step A: Validation Profile Selector (clean, no outer double box) */}
            <ValidationProfileSelector
              profiles={profiles}
              selectedProfileId={selectedProfileId}
              onSelectProfile={handleSelectProfile}
              isLoading={isLoadingProfiles}
            />

            {/* Step B: Bind to Existing Tracker Job (Optional, Searchable) */}
            <div className="border-t border-slate-100 pt-4 space-y-1.5">
              <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Building2 size={12} className="text-[#0a4d8c]" />
                Tautkan ke Pekerjaan (Opsional)
              </label>
              <SearchableSelect
                options={requestOptions}
                value={selectedRequestId}
                onChange={setSelectedRequestId}
                allowClear={Boolean(selectedRequestId)}
                placeholder="-- Buat Pekerjaan Baru Otomatis dari Dokumen --"
                searchPlaceholder="Ketik kode atau nama pekerjaan..."
              />
            </div>

            {/* Step C: Progressive Criteria Section */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[11px] font-medium uppercase tracking-wider text-[#0a4d8c] flex items-center gap-1.5">
                    <Sliders size={13} />
                    Kriteria Kelayakan &amp; Bobot ({checklistRules.length})
                  </h3>
                  {selectedProfileId && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                      <ShieldCheck size={10} className="text-[#0a4d8c]" />
                      {templateRuleCount} Template
                      {customRuleCount > 0 ? ` + ${customRuleCount} Kustom` : ""}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {checklistRules.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsSaveTemplateModalOpen(true)}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:border-[#0a4d8c] hover:text-[#0a4d8c] transition-colors focus:outline-none"
                    >
                      <BookmarkPlus size={12} />
                      <span>Simpan Template</span>
                    </button>
                  )}

                  {selectedProfileId && (
                    <button
                      type="button"
                      onClick={() => setShowCriteriaEditor((v) => !v)}
                      className="inline-flex items-center gap-1 rounded-md border border-[#0a4d8c]/30 bg-[#e8f2fc] px-2.5 py-1 text-[11px] font-medium text-[#0a4d8c] hover:bg-[#d8e8fa] transition-colors focus:outline-none"
                    >
                      {showCriteriaEditor ? "Ringkas Kriteria" : "Ubah Bobot / Kriteria"}
                    </button>
                  )}
                </div>
              </div>

              {/* Collapsed Calm Summary when using Template */}
              {selectedProfileId && !showCriteriaEditor && checklistRules.length > 0 ? (
                <div className="rounded-lg bg-slate-50/80 border border-slate-200/80 px-3.5 py-2.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span>
                      Menggunakan <span className="font-medium text-slate-800">{checklistRules.length} butir standar</span> dengan ambang lulus{" "}
                      <span className="font-medium text-[#0a4d8c]">&ge; {passingScore}%</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {checklistRules.map((r, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-700 max-w-full"
                      >
                        <span className="truncate max-w-[200px]">{r.item}</span>
                        <span className="font-semibold text-[#0a4d8c]">{r.weight}%</span>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <ChecklistEditor
                  items={checklistRules}
                  onChange={setChecklistRules}
                  passingScore={passingScore}
                  onPassingScoreChange={setPassingScore}
                  showSourceBadges
                  onCriteriaFileExtracted={(meta) => {
                    if (!customPrompt.trim() && meta.suggested_system_prompt) {
                      setCustomPrompt(meta.suggested_system_prompt);
                      setShowPromptBox(true);
                    }
                  }}
                />
              )}
            </div>

            {/* Step D: Collapsible Custom Prompt / AI Instructions */}
            <div className="border-t border-slate-100 pt-3">
              {!showPromptBox ? (
                <button
                  type="button"
                  onClick={() => setShowPromptBox(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#0a4d8c] transition-colors focus:outline-none"
                >
                  <Sparkles size={13} className="text-[#0a4d8c]" />
                  <span>+ Tambah Instruksi Khusus untuk AI (Opsional)</span>
                </button>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Sparkles size={12} className="text-[#0a4d8c]" />
                      Instruksi Tambahan AI (Opsional)
                    </label>
                    {!customPrompt.trim() && (
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
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Contoh: Bandingkan durasi pelaksanaan terhadap target KAK 12 bulan (lebih cepat = memenuhi)..."
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-normal text-slate-800 placeholder-slate-400 focus:border-[#0a4d8c] focus:outline-none resize-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Sticky Footer Actions — always visible */}
          <div className="sticky bottom-0 z-10 px-6 py-3.5 bg-white/95 backdrop-blur-xs border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard/documents")}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!file || analyzeMutation.isPending}
              className={`px-5 py-2 flex items-center gap-2 rounded-lg text-xs font-medium transition-all ${
                file && !analyzeMutation.isPending
                  ? "bg-[#0a4d8c] hover:bg-[#083b6c] text-white cursor-pointer shadow-2xs"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              {analyzeMutation.isPending ? (
                <>
                  <Spinner
                    size="xs"
                    className="border-white border-t-transparent"
                  />
                  <span>Menganalisis Dokumen...</span>
                </>
              ) : (
                <>
                  <span>Mulai Pemeriksaan AI</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Save Criteria as Reusable Template (full-screen centered via Portal) */}
      {isSaveTemplateModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Simpan ke Pustaka Template Standar
                </h3>
                <p className="text-xs font-normal text-slate-500 mt-0.5">
                  Simpan {checklistRules.length} butir kriteria berbobot & ambang batas {passingScore}% ke database
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSaveTemplateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 focus:outline-none"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-3.5">
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider text-slate-600 block mb-1">
                  Nama Template Standar
                </label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="Contoh: Standar KAK Pompa & Peralatan Kilang"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-800 focus:border-[#0a4d8c] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium uppercase tracking-wider text-slate-600 block mb-1">
                    Jenis Dokumen
                  </label>
                  <SearchableSelect
                    size="sm"
                    value={newTemplateKind}
                    onChange={setNewTemplateKind}
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
                    Auto-Clear Tahap (Opsional)
                  </label>
                  <SearchableSelect
                    size="sm"
                    value={newTemplateStage}
                    onChange={setNewTemplateStage}
                    allowClear
                    allowCustomValue
                    searchPlaceholder="Cari tahapan..."
                    options={stageOptions}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider text-slate-600 block mb-1">
                  Deskripsi Singkat (Opsional)
                </label>
                <input
                  type="text"
                  value={newTemplateDesc}
                  onChange={(e) => setNewTemplateDesc(e.target.value)}
                  placeholder="Catatan penggunaan template ini..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-800 focus:border-[#0a4d8c] focus:outline-none"
                />
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsSaveTemplateModalOpen(false)}
                className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveAsNewTemplate}
                disabled={createProfileMutation.isPending}
                className="px-4 py-2 bg-[#0a4d8c] hover:bg-[#083b6c] text-white rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {createProfileMutation.isPending ? (
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
                    <span>Simpan Template</span>
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
