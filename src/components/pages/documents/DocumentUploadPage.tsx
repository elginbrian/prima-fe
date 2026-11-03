"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useProcurement } from "@/context/ProcurementContext";
import { useProcurements } from "@/lib/query/hooks/procurement/useProcurement";
import {
  useValidationProfiles,
  useAnalyzeDocumentChecklist,
  useCreateValidationProfile,
} from "@/lib/query/hooks/procurement/useValidation";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui";
import { DocumentPreview } from "@/components/widgets/upload/DocumentPreview";
import { ValidationProfileSelector } from "@/components/widgets/documents/ValidationProfileSelector";
import { ChecklistEditor } from "@/components/widgets/documents/ChecklistEditor";
import { formatRequestCode } from "@/lib/utils";
import type { ChecklistRuleItem, ValidationProfile } from "@/types/validation";

export default function DocumentUploadPage() {
  const router = useRouter();
  const toast = useToast();
  const { state } = useProcurement();
  const { data: serverRequests = [] } = useProcurements();
  const requests = serverRequests.length > 0 ? serverRequests : state.requests;

  const { data: profiles = [], isLoading: isLoadingProfiles } =
    useValidationProfiles();
  const analyzeMutation = useAnalyzeDocumentChecklist();
  const createProfileMutation = useCreateValidationProfile();

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [checklistRules, setChecklistRules] = useState<ChecklistRuleItem[]>([]);
  const [passingScore, setPassingScore] = useState<number>(75);
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [selectedRequestId, setSelectedRequestId] = useState<string>("");

  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateKind, setNewTemplateKind] = useState("Kerangka Acuan Kerja");
  const [newTemplateDesc, setNewTemplateDesc] = useState("");
  const [newTemplateStage, setNewTemplateStage] = useState("");

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
        checklist_rules: checklistRules,
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
      setChecklistRules(profile.checklist_rules || []);
      setPassingScore(profile.passing_score_threshold || 75);
      const prompt = profile.custom_system_prompt || profile.prompt_template;
      if (prompt && !customPrompt) {
        setCustomPrompt(prompt);
      }
    } else {
      setSelectedProfileId("");
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
          <span>Kelola Pustaka Template</span>
        </button>
      </div>

      {/* Main Form Layout */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col lg:flex-row flex-1">
        {/* Left Column: Upload Dropzone & Document Preview */}
        <div className="w-full lg:w-5/12 bg-slate-50/70 border-r border-slate-200 p-6 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Berkas Dokumen
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
                Mendukung berkas PDF, DOCX, atau pindaian resmi (Maks. 25MB)
              </p>

              <label className="cursor-pointer bg-[#0a4d8c] hover:bg-[#083b6c] text-white px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2">
                <span>Telusuri Komputer</span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
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
              Verifikasi Dokumen & Ekstraksi Tahapan
            </div>
            <p className="text-[11px] font-normal leading-relaxed text-slate-500">
              PRIMA AI membaca isi dokumen, memverifikasi kriteria kelayakan, menghitung skor kepatuhan, serta mengekstrak tahapan pekerjaan secara otomatis.
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
              Pilih standar template Pertamina atau sesuaikan kriteria kelayakan sesuai kebutuhan pengadaan.
            </p>
          </div>

          <div className="p-6 space-y-5 flex-1 overflow-y-auto max-h-[calc(100vh-260px)]">
            {/* 1. Validation Profile Selector */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <ValidationProfileSelector
                profiles={profiles}
                selectedProfileId={selectedProfileId}
                onSelectProfile={handleSelectProfile}
                isLoading={isLoadingProfiles}
              />
            </div>

            {/* 2. Bind to Existing Tracker Job (Optional) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Building2 size={12} className="text-[#0a4d8c]" />
                Tautkan ke Pekerjaan Pengadaan (Opsional)
              </label>
              <select
                value={selectedRequestId}
                onChange={(e) => setSelectedRequestId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-normal text-slate-800 transition-colors focus:border-[#0a4d8c] focus:outline-none"
              >
                <option value="">
                  -- Buat Pekerjaan Baru Otomatis dari Ekstraksi Dokumen --
                </option>
                {requests.map((r) => (
                  <option key={r.id} value={r.id}>
                    {formatRequestCode(r.id)} &ndash; {r.title}
                  </option>
                ))}
              </select>
              <p className="text-[11px] font-normal text-slate-400">
                Jika dikosongkan, sistem dapat mengekstrak judul pekerjaan, nilai anggaran, dan vendor untuk diterbitkan sebagai pekerjaan baru.
              </p>
            </div>

            {/* 3. Interactive Checklist Rules Editor */}
            <div className="rounded-xl border border-slate-200 p-4 bg-white space-y-4">
              <div className="border-b border-slate-100 pb-2.5 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-[11px] font-medium uppercase tracking-wider text-[#0a4d8c] flex items-center gap-1.5">
                    <Sliders size={13} />
                    Daftar Kriteria Kelayakan (Checklist)
                  </h3>
                  <p className="text-[11px] font-normal text-slate-500 mt-0.5">
                    Tentukan syarat kelayakan dan tandai kriteria yang bersifat wajib.
                  </p>
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
                placeholder="Contoh: Pastikan nama penerima jaminan tertulis PT Pertamina Patra Niaga dan masa berlaku minimal 90 hari kalender."
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
                  Simpan {checklistRules.length} butir kriteria & ambang batas {passingScore}% ke database
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
                  <select
                    value={newTemplateKind}
                    onChange={(e) => setNewTemplateKind(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-800 bg-white focus:border-[#0a4d8c] focus:outline-none"
                  >
                    <option value="Kerangka Acuan Kerja">Kerangka Acuan Kerja</option>
                    <option value="Rencana Anggaran Biaya">Rencana Anggaran Biaya</option>
                    <option value="Jaminan Pelaksanaan">Jaminan Pelaksanaan</option>
                    <option value="Dokumen Penawaran">Dokumen Penawaran</option>
                    <option value="Kontrak & Perjanjian">Kontrak & Perjanjian</option>
                    <option value="Umum">Umum</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium uppercase tracking-wider text-slate-600 block mb-1">
                    Auto-Clear Tahap (Opsional)
                  </label>
                  <select
                    value={newTemplateStage}
                    onChange={(e) => setNewTemplateStage(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-800 bg-white focus:border-[#0a4d8c] focus:outline-none"
                  >
                    <option value="">-- Tidak Ada --</option>
                    <option value="Pembuatan TOR">Pembuatan TOR</option>
                    <option value="Penyusunan RKS & Spesifikasi Teknis">
                      Penyusunan RKS & Spesifikasi Teknis
                    </option>
                    <option value="Rapat Pra-Tender">Rapat Pra-Tender</option>
                    <option value="Pemasukan Dokumen Penawaran">
                      Pemasukan Dokumen Penawaran
                    </option>
                    <option value="Evaluasi Dokumen Penawaran">
                      Evaluasi Dokumen Penawaran
                    </option>
                  </select>
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
