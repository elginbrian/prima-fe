"use client";

import { useState, useMemo } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Edit3,
  Filter,
  Plus,
  Search,
  ShieldCheck,
  Sliders,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useValidationProfiles,
  useCreateValidationProfile,
  useUpdateValidationProfile,
  useDeleteValidationProfile,
} from "@/lib/query/hooks/procurement/useValidation";
import { ChecklistEditor } from "@/components/widgets/documents/ChecklistEditor";
import { useToast } from "@/components/ui/Toast";
import { Spinner, Skeleton } from "@/components/ui";
import { formatDateIndo } from "@/lib/utils";
import type {
  ValidationProfile,
  ChecklistRuleItem,
  CreateValidationProfilePayload,
} from "@/types/validation";

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

const TARGET_STAGE_OPTIONS = [
  "",
  "Penerimaan FPP",
  "Pembuatan TOR",
  "Penyusunan RKS & Spesifikasi Teknis",
  "Rapat Pra-Tender",
  "Pengumuman Pengadaan",
  "Pemasukan Dokumen Penawaran",
  "Evaluasi Dokumen Penawaran",
  "Negosiasi",
  "Penunjukan Pemenang",
  "Penandatanganan Kontrak",
  "Serah Terima (BAST)",
];

export default function ValidationTemplatesPage() {
  const router = useRouter();
  const toast = useToast();
  const { data: profiles = [], isLoading } = useValidationProfiles();
  const createMutation = useCreateValidationProfile();
  const updateMutation = useUpdateValidationProfile();
  const deleteMutation = useDeleteValidationProfile();

  const [searchQuery, setSearchQuery] = useState("");
  const [kindFilter, setKindFilter] = useState("All");
  const [scopeFilter, setScopeFilter] = useState("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] =
    useState<ValidationProfile | null>(null);

  const [formName, setFormName] = useState("");
  const [formKind, setFormKind] = useState("Kerangka Acuan Kerja");
  const [formScope, setFormScope] = useState("GLOBAL");
  const [formDescription, setFormDescription] = useState("");
  const [formPassingScore, setFormPassingScore] = useState(80);
  const [formStrictMandatory, setFormStrictMandatory] = useState(true);
  const [formTargetStage, setFormTargetStage] = useState("");
  const [formSystemPrompt, setFormSystemPrompt] = useState("");
  const [formRules, setFormRules] = useState<ChecklistRuleItem[]>([]);
  const [formIsDefault, setFormIsDefault] = useState(false);

  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(q) ||
        p.document_kind.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false);
      const matchesKind =
        kindFilter === "All" || p.document_kind === kindFilter;
      const matchesScope = scopeFilter === "All" || p.scope === scopeFilter;
      return matchesSearch && matchesKind && matchesScope;
    });
  }, [profiles, searchQuery, kindFilter, scopeFilter]);

  const handleOpenCreate = () => {
    setEditingProfile(null);
    setFormName("");
    setFormKind("Kerangka Acuan Kerja");
    setFormScope("GLOBAL");
    setFormDescription("");
    setFormPassingScore(80);
    setFormStrictMandatory(true);
    setFormTargetStage("Penyusunan RKS & Spesifikasi Teknis");
    setFormSystemPrompt("");
    setFormIsDefault(false);
    setFormRules([
      {
        category: "Ruang Lingkup",
        item: "Uraian ruang lingkup kebutuhan dan spesifikasi teknis jelas serta terukur",
        is_mandatory: true,
        weight: 30,
        severity_on_failure: "ERROR",
      },
      {
        category: "Legalitas & Otorisasi",
        item: "Dokumen memuat tanggal, nomor surat, dan otorisasi pejabat berwenang",
        is_mandatory: true,
        weight: 25,
        severity_on_failure: "ERROR",
      },
    ]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (profile: ValidationProfile) => {
    setEditingProfile(profile);
    setFormName(profile.name);
    setFormKind(profile.document_kind || "Umum");
    setFormScope(profile.scope || "GLOBAL");
    setFormDescription(profile.description || "");
    setFormPassingScore(profile.passing_score_threshold || 80);
    setFormStrictMandatory(profile.strict_mandatory_enforcement ?? true);
    setFormTargetStage(profile.target_stage_to_clear || "");
    setFormSystemPrompt(
      profile.custom_system_prompt || profile.prompt_template || ""
    );
    setFormRules(profile.checklist_rules || []);
    setFormIsDefault(profile.is_default ?? false);
    setIsModalOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!formName.trim()) {
      toast.warning("Nama template standar kelayakan wajib diisi.");
      return;
    }
    if (formRules.length === 0) {
      toast.warning("Tambahkan minimal 1 butir kriteria kelayakan.");
      return;
    }

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
      checklist_rules: formRules,
      is_default: formIsDefault,
    };

    try {
      if (editingProfile) {
        await updateMutation.mutateAsync({
          id: editingProfile.id,
          payload,
        });
        toast.success(
          `Template '${payload.name}' berhasil diperbarui di database.`
        );
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(
          `Template baru '${payload.name}' berhasil disimpan ke pustaka database.`
        );
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Gagal menyimpan template standar.");
    }
  };

  const handleDeleteProfile = async (profile: ValidationProfile) => {
    try {
      await deleteMutation.mutateAsync(profile.id);
      toast.success(`Template '${profile.name}' berhasil dinonaktifkan.`);
    } catch (err: any) {
      toast.error(err?.message || "Gagal menghapus template.");
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex flex-col gap-5 pb-12">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/dashboard/documents")}
          className="inline-flex w-fit items-center gap-2 text-xs font-medium text-slate-500 transition-colors hover:text-[#0a4d8c] focus:outline-none"
        >
          <ArrowLeft size={15} />
          Kembali ke Pemeriksaan Dokumen
        </button>
      </div>

      {/* 1. Blue Action Header Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-[#0a4d8c] px-6 py-6 text-white shadow-xs sm:px-8">
        <div className="relative z-10 max-w-3xl">
          <h2 className="max-w-2xl text-xl font-semibold tracking-tight sm:text-2xl">
            Pustaka Template Standar Kelayakan Dokumen
          </h2>
          <p className="mt-2 max-w-2xl text-xs sm:text-sm font-normal leading-relaxed text-blue-100">
            Susun dan kelola standar kriteria checklist, ambang batas skor kelulusan, instruksi AI, serta pemetaan auto-clear tahapan untuk berbagai jenis dokumen pengadaan.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs sm:text-sm font-medium text-[#0a4d8c] shadow-xs transition hover:bg-blue-50 focus:outline-none"
            >
              <Plus size={15} /> Buat Template Standar Baru
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard/documents/upload")}
              className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-xs sm:text-sm font-medium text-white transition hover:bg-white/20 focus:outline-none"
            >
              <Sparkles size={15} /> Uji Validasi Dokumen
            </button>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border-[32px] border-blue-300/15" />
        <div className="pointer-events-none absolute -bottom-24 right-24 h-48 w-48 rounded-full border-[24px] border-blue-300/10" />
      </section>

      {/* 2. Search & Filter Bar (Identical to GuaranteeFilterBar) */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full xl:w-96 flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Cari nama template, jenis dokumen, atau deskripsi standar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0a4d8c] focus:ring-1 focus:ring-[#0a4d8c]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
          <Filter className="hidden sm:block text-slate-400 shrink-0" size={16} />
          <select
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value)}
            className="border border-slate-200 rounded-lg text-xs font-medium text-slate-700 px-3 py-2 focus:outline-none focus:border-[#0a4d8c] bg-white"
          >
            <option value="All">Semua Jenis Dokumen</option>
            {DOCUMENT_KIND_OPTIONS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>

          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value)}
            className="border border-slate-200 rounded-lg text-xs font-medium text-slate-700 px-3 py-2 focus:outline-none focus:border-[#0a4d8c] bg-white"
          >
            <option value="All">Semua Cakupan</option>
            <option value="GLOBAL">Global Pertamina</option>
            <option value="IT">IT Infrastructure</option>
            <option value="INFRASTRUCTURE">Engineering & Konstruksi</option>
            <option value="SERVICES">Jasa Umum & Operasional</option>
          </select>
        </div>
      </div>

      {/* 3. Templates Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredProfiles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProfiles.map((profile) => {
            const ruleCount = profile.checklist_rules?.length || 0;
            const mandatoryCount = (profile.checklist_rules || []).filter(
              (r) => r.is_mandatory
            ).length;

            return (
              <div
                key={profile.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between gap-4 hover:border-slate-300 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e8f2fc] text-[#0a4d8c]">
                        <BookOpen size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-slate-900">
                            {profile.name}
                          </h3>
                          {profile.is_default && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#0a4d8c]/20 bg-[#e8f2fc] px-2 py-0.5 text-[10px] font-normal text-[#0a4d8c]">
                              <ShieldCheck size={10} />
                              Standar Utama
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] font-normal text-slate-500">
                          <span>Jenis: {profile.document_kind}</span>
                          <span>•</span>
                          <span>Cakupan: {profile.scope}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-[#0a4d8c]">
                        Lulus &ge; {profile.passing_score_threshold}%
                      </span>
                    </div>
                  </div>

                  {profile.description && (
                    <p className="text-xs font-normal text-slate-600 leading-relaxed line-clamp-2">
                      {profile.description}
                    </p>
                  )}

                  {/* Checklist Preview Pills */}
                  <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-medium text-slate-700">
                        {ruleCount} Kriteria Checklist ({mandatoryCount} Wajib)
                      </span>
                      {profile.target_stage_to_clear && (
                        <span className="text-[#0a4d8c] flex items-center gap-1">
                          <Sparkles size={11} />
                          Auto-clear: {profile.target_stage_to_clear}
                        </span>
                      )}
                    </div>
                    <ul className="space-y-1 text-xs font-normal text-slate-600">
                      {(profile.checklist_rules || [])
                        .slice(0, 3)
                        .map((rule, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 line-clamp-1"
                          >
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#0a4d8c] shrink-0" />
                            <span className="truncate">{rule.item}</span>
                          </li>
                        ))}
                      {ruleCount > 3 && (
                        <li className="text-[11px] text-slate-400 pl-3.5">
                          +{ruleCount - 3} kriteria lainnya...
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <span className="text-[11px] font-normal text-slate-400">
                    Diperbarui {formatDateIndo(profile.updated_at)}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(profile)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-[#0a4d8c] hover:text-[#0a4d8c] transition-colors focus:outline-none"
                    >
                      <Edit3 size={12} />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProfile(profile)}
                      disabled={deleteMutation.isPending}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:border-slate-300 hover:text-slate-800 transition-colors focus:outline-none"
                      title="Nonaktifkan Template"
                    >
                      <Trash2 size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/dashboard/documents/upload?profileId=${encodeURIComponent(
                            profile.id
                          )}`
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a4d8c] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#083b6c] transition-colors focus:outline-none"
                    >
                      <Sparkles size={12} />
                      <span>Gunakan Template</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center space-y-3">
          <BookOpen size={32} className="mx-auto text-slate-300" />
          <div className="text-sm font-medium text-slate-700">
            Template standar tidak ditemukan
          </div>
          <p className="text-xs font-normal text-slate-500 max-w-md mx-auto">
            Belum ada template standar yang sesuai dengan filter pencarian, atau buat template baru untuk memulai.
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a4d8c] px-4 py-2 text-xs font-medium text-white hover:bg-[#083b6c] transition-colors"
          >
            <Plus size={14} />
            Buat Template Standar Baru
          </button>
        </div>
      )}

      {/* Modal Create / Edit Template */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  {editingProfile
                    ? "Edit Template Standar Kelayakan"
                    : "Buat Template Standar Kelayakan Baru"}
                </h3>
                <p className="text-xs font-normal text-slate-500 mt-0.5">
                  Konfigurasi aturan checklist dan parameter AI yang akan disimpan ke database
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 focus:outline-none"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-medium uppercase tracking-wider text-slate-600 block mb-1">
                    Nama Template Standar
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
                  <select
                    value={formKind}
                    onChange={(e) => setFormKind(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-800 bg-white focus:border-[#0a4d8c] focus:outline-none"
                  >
                    {DOCUMENT_KIND_OPTIONS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium uppercase tracking-wider text-slate-600 block mb-1">
                    Cakupan Standar
                  </label>
                  <select
                    value={formScope}
                    onChange={(e) => setFormScope(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-800 bg-white focus:border-[#0a4d8c] focus:outline-none"
                  >
                    <option value="GLOBAL">Global Pertamina (Semua Fungsi)</option>
                    <option value="IT">IT Infrastructure</option>
                    <option value="INFRASTRUCTURE">Engineering & Konstruksi</option>
                    <option value="SERVICES">Jasa Umum & Operasional</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-medium uppercase tracking-wider text-slate-600 block mb-1">
                    Deskripsi & Acuan Pedoman
                  </label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Deskripsi singkat kegunaan standar validasi ini..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-800 focus:border-[#0a4d8c] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium uppercase tracking-wider text-slate-600 block mb-1">
                    Tahap Pekerjaan yang Di-Auto-Clear (Opsional)
                  </label>
                  <select
                    value={formTargetStage}
                    onChange={(e) => setFormTargetStage(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-800 bg-white focus:border-[#0a4d8c] focus:outline-none"
                  >
                    <option value="">-- Tidak Ada Auto-Clear Tahap --</option>
                    {TARGET_STAGE_OPTIONS.filter(Boolean).map((stg) => (
                      <option key={stg} value={stg}>
                        {stg}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col justify-end gap-2">
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
                    <span>Jadikan sebagai standar utama (Default)</span>
                  </label>
                </div>
              </div>

              {/* Checklist Rules Editor */}
              <div className="rounded-xl border border-slate-200 p-4 bg-white space-y-3">
                <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-[#0a4d8c]">
                  <Sliders size={13} />
                  <span>Daftar Kriteria Checklist & Ambang Skor</span>
                </div>
                <ChecklistEditor
                  items={formRules}
                  onChange={setFormRules}
                  passingScore={formPassingScore}
                  onPassingScoreChange={setFormPassingScore}
                />
              </div>

              {/* Custom System Prompt */}
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider text-slate-600 block mb-1">
                  Instruksi Sistem AI (Prompt Pedoman Pemeriksaan)
                </label>
                <textarea
                  value={formSystemPrompt}
                  onChange={(e) => setFormSystemPrompt(e.target.value)}
                  rows={2}
                  placeholder="Contoh: Pastikan pencantuman klausul TKDN minimal 40% dan kepatuhan CSMS..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-800 focus:border-[#0a4d8c] focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="px-5 py-2 bg-[#0a4d8c] hover:bg-[#083b6c] text-white rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-50"
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
                    <span>Simpan Template ke Database</span>
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

