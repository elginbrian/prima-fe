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
import { Spinner, SearchableSelect } from "@/components/ui";
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
      const prompt = profile.custom_system_prompt || profile.prompt_template;
      if (prompt) {
        setCustomPrompt(prompt);
      }
    } else {
      setSelectedProfileId("");
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

      {/* Main Form Layout */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col lg:flex-row flex-1">
        {/* Left Column: Upload Dropzone & Document Preview */}
        <div className="w-full lg:w-5/12 bg-slate-50/70 border-r border-slate-200 p-6 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Berkas Dokumen Target
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
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center flex-1 transition-all cursor-pointer ${
                isDragging
                  ? "border-[#0a4d8c] bg-[#e8f2fc]/60"
                  : "border-slate-300 bg-white hover:border-[#0a4d8c]/60 hover:bg-slate-50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="w-12 h-12 bg-[#e8f2fc] text-[#0a4d8c] rounded-xl flex items-center justify-center mb-3 border border-[#0a4d8c]/20">
                <UploadCloud size={24} />
              </div>
              <h3 className="text-sm font-medium text-slate-800 mb-1">
                Tarik & Lepas Berkas ke Sini
              </h3>
              <p className="text-xs font-normal text-slate-500 text-center max-w-xs mb-4 leading-relaxed">
                Mendukung berkas PDF, DOCX, XLSX, atau pindaian resmi (Maks. 25MB)
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
            <div className="flex-1 flex flex-col min-h-[460px]">
              <DocumentPreview file={file} />
            </div>
          )}

          {/* Quick Notice Info */}
          <div className="rounded-lg border border-slate-200 bg-white p-3.5 text-xs text-slate-600 space-y-1">
            <div className="font-medium text-[#0a4d8c] flex items-center gap-1.5">
              <Sparkles size={13} />
              Verifikasi Berbobot & Ekstraksi Tahapan AI
            </div>
            <p className="text-[11px] font-normal leading-relaxed text-slate-500">
              PRIMA AI mengevaluasi setiap kriteria secara terukur sesuai bobot persentase (termasuk perbandingan jadwal/nilai), menormalisasi bobot ke 100%, serta menyusun tahapan pekerjaan otomatis baik dengan maupun tanpa template.
            </p>
          </div>
        </div>

        {/* Right Column: Settings, Profile & Checklist Editor */}
        <div className="w-full lg:w-7/12 flex flex-col">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-800">
              Konfigurasi Standar Kelayakan Dokumen
            </h2>
            <p className="text-xs font-normal text-slate-500 mt-0.5">
              Pilih template standar Pertamina, unggah file daftar kriteria, atau sesuaikan bobot & kriteria kustom.
            </p>
          </div>

          <div className="p-6 space-y-5 flex-1 overflow-y-auto max-h-[calc(100vh-260px)]">
            {/* 1. Validation Profile Selector (Searchable) */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <ValidationProfileSelector
                profiles={profiles}
                selectedProfileId={selectedProfileId}
                onSelectProfile={handleSelectProfile}
                isLoading={isLoadingProfiles}
              />
            </div>

            {/* 2. Bind to Existing Tracker Job (Optional, Searchable) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Building2 size={12} className="text-[#0a4d8c]" />
                Tautkan ke Pekerjaan Pengadaan (Opsional)
              </label>
              <SearchableSelect
                options={requestOptions}
                value={selectedRequestId}
                onChange={setSelectedRequestId}
                allowClear={Boolean(selectedRequestId)}
                placeholder="-- Buat Pekerjaan Baru Otomatis dari Ekstraksi Dokumen --"
                searchPlaceholder="Ketik kode atau nama pekerjaan..."
              />
              <p className="text-[11px] font-normal text-slate-400">
                Jika dikosongkan, AI akan mengekstrak judul pekerjaan, nilai anggaran, dan tahapan otomatis untuk diterbitkan sebagai pekerjaan baru.
              </p>
            </div>

            {/* 3. Interactive Weighted Checklist Rules Editor */}
            <div className="rounded-xl border border-slate-200 p-4 bg-white space-y-4">
              <div className="border-b border-slate-100 pb-2.5 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-[11px] font-medium uppercase tracking-wider text-[#0a4d8c] flex items-center gap-1.5">
                    <Sliders size={13} />
                    Daftar Kriteria Kelayakan & Bobot (%)
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {selectedProfileId ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-normal text-slate-600">
                        <ShieldCheck size={11} className="text-[#0a4d8c]" />
                        {templateRuleCount} dari Template Standar
                        {customRuleCount > 0 && (
                          <span className="text-[#0a4d8c] font-medium">
                            + {customRuleCount} Kriteria Kustom
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-[11px] font-normal text-slate-500">
                        Mode Kriteria Kustom Mandiri (tanpa template standar)
                      </span>
                    )}
                  </div>
                </div>
                {checklistRules.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsSaveTemplateModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-[#0a4d8c] hover:border-[#0a4d8c] hover:bg-[#e8f2fc]/60 transition-colors focus:outline-none"
                  >
                    <BookmarkPlus size={13} />
                    <span>Simpan sebagai Template Baru</span>
                  </button>
                )}
              </div>

              <ChecklistEditor
                items={checklistRules}
                onChange={setChecklistRules}
                passingScore={passingScore}
                onPassingScoreChange={setPassingScore}
                showSourceBadges
                onCriteriaFileExtracted={(meta) => {
                  if (!customPrompt.trim() && meta.suggested_system_prompt) {
                    setCustomPrompt(meta.suggested_system_prompt);
                  }
                }}
              />
            </div>

            {/* 4. Custom Prompt / AI Instructions */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles size={12} className="text-[#0a4d8c]" />
                Instruksi Tambahan untuk AI (Opsional)
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Contoh: Bandingkan durasi pelaksanaan terhadap target KAK 12 bulan (lebih cepat = memenuhi) dan verifikasi rincian PPN 11%."
                rows={3}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-normal text-slate-800 placeholder-slate-400 focus:border-[#0a4d8c] focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-3 mt-auto">
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
              className={`px-5 py-2.5 flex items-center gap-2 rounded-lg text-xs font-medium transition-all ${
                file && !analyzeMutation.isPending
                  ? "bg-[#0a4d8c] hover:bg-[#083b6c] text-white cursor-pointer"
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

      {/* Modal: Save Criteria as Reusable Template */}
      {isSaveTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-4">
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
      )}
    </div>
  );
}
