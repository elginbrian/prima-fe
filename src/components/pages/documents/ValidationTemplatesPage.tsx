"use client";

import { useState, useMemo } from "react";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  BookOpen,
  Check,
  Clock,
  Edit3,
  Filter,
  GitBranch,
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
  useWorkflowStages,
  useCreateWorkflowStage,
  useUpdateWorkflowStage,
  useReorderWorkflowStages,
  useDeleteWorkflowStage,
} from "@/lib/query/hooks/procurement/useValidation";
import {
  ChecklistEditor,
  normalizeWeightsTo100,
} from "@/components/widgets/documents/ChecklistEditor";
import { useToast } from "@/components/ui/Toast";
import { Spinner, Skeleton, SearchableSelect, ModalPortal } from "@/components/ui";
import { formatDateIndo } from "@/lib/utils";
import type {
  ValidationProfile,
  ChecklistRuleItem,
  CreateValidationProfilePayload,
  WorkflowStage,
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

const SCOPE_OPTIONS = [
  { value: "GLOBAL", label: "Global Pertamina (Semua Fungsi)" },
  { value: "IT", label: "IT Infrastructure" },
  { value: "INFRASTRUCTURE", label: "Engineering & Konstruksi" },
  { value: "SERVICES", label: "Jasa Umum & Operasional" },
];

const STAGE_GROUP_OPTIONS = [
  { value: "Persiapan", label: "Persiapan" },
  { value: "Sourcing", label: "Sourcing" },
  { value: "Evaluasi", label: "Evaluasi" },
  { value: "Contracting", label: "Contracting" },
  { value: "Selesai", label: "Selesai" },
];

const DEFAULT_METHODS = [
  "Tender Terbuka",
  "Pemilihan Langsung",
  "Penunjukan Langsung",
];

type ActiveTab = "templates" | "stages";

export default function ValidationTemplatesPage() {
  const router = useRouter();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<ActiveTab>("templates");

  // ── Templates State ──
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

  // ── Workflow Stages State (Tab 2) ──
  const { data: allStages = [], isLoading: isLoadingStages } =
    useWorkflowStages();
  const createStageMutation = useCreateWorkflowStage();
  const updateStageMutation = useUpdateWorkflowStage();
  const reorderStagesMutation = useReorderWorkflowStages();
  const deleteStageMutation = useDeleteWorkflowStage();

  const [selectedMethod, setSelectedMethod] = useState("Tender Terbuka");
  const [stageSearch, setStageSearch] = useState("");
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<WorkflowStage | null>(null);
  const [stageMethodInput, setStageMethodInput] = useState("Tender Terbuka");
  const [stageStepName, setStageStepName] = useState("");
  const [stageGroup, setStageGroup] = useState("Sourcing");
  const [stageSlaDays, setStageSlaDays] = useState(5);
  const [stageDescription, setStageDescription] = useState("");

  const availableMethods = useMemo(() => {
    const set = new Set<string>(DEFAULT_METHODS);
    allStages.forEach((s) => {
      if (s.procurement_method) set.add(s.procurement_method);
    });
    return Array.from(set);
  }, [allStages]);

  const methodOptions = useMemo(
    () => availableMethods.map((m) => ({ value: m, label: m })),
    [availableMethods]
  );

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

  const stagesForSelectedMethod = useMemo(() => {
    const q = stageSearch.trim().toLowerCase();
    return allStages
      .filter((s) => s.procurement_method === selectedMethod)
      .filter((s) =>
        !q
          ? true
          : s.step_name.toLowerCase().includes(q) ||
            s.stage_group.toLowerCase().includes(q) ||
            (s.description?.toLowerCase().includes(q) ?? false)
      )
      .sort((a, b) => a.order_index - b.order_index);
  }, [allStages, selectedMethod, stageSearch]);

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

  // ── Workflow Stages Handlers ──
  const handleOpenCreateStage = () => {
    setEditingStage(null);
    setStageMethodInput(selectedMethod);
    setStageStepName("");
    setStageGroup("Sourcing");
    setStageSlaDays(5);
    setStageDescription("");
    setIsStageModalOpen(true);
  };

  const handleOpenEditStage = (stage: WorkflowStage) => {
    setEditingStage(stage);
    setStageMethodInput(stage.procurement_method);
    setStageStepName(stage.step_name);
    setStageGroup(stage.stage_group);
    setStageSlaDays(stage.default_sla_days ?? 5);
    setStageDescription(stage.description || "");
    setIsStageModalOpen(true);
  };

  const handleSaveStage = async () => {
    if (!stageStepName.trim()) {
      toast.warning("Nama tahapan pekerjaan wajib diisi.");
      return;
    }
    const methodVal = stageMethodInput.trim() || "Tender Terbuka";
    try {
      if (editingStage) {
        await updateStageMutation.mutateAsync({
          id: editingStage.id,
          payload: {
            procurement_method: methodVal,
            step_name: stageStepName.trim(),
            stage_group: stageGroup,
            default_sla_days: stageSlaDays,
            description: stageDescription.trim() || undefined,
          },
        });
        toast.success(`Tahapan '${stageStepName.trim()}' berhasil diperbarui.`);
      } else {
        await createStageMutation.mutateAsync({
          procurement_method: methodVal,
          step_name: stageStepName.trim(),
          stage_group: stageGroup,
          default_sla_days: stageSlaDays,
          description: stageDescription.trim() || undefined,
        });
        setSelectedMethod(methodVal);
        toast.success(`Tahapan '${stageStepName.trim()}' berhasil ditambahkan.`);
      }
      setIsStageModalOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Gagal menyimpan tahapan pekerjaan.");
    }
  };

  const handleMoveStageOrder = async (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= stagesForSelectedMethod.length) return;
    const reordered = [...stagesForSelectedMethod];
    [reordered[index], reordered[targetIdx]] = [
      reordered[targetIdx],
      reordered[index],
    ];
    try {
      await reorderStagesMutation.mutateAsync({
        procurement_method: selectedMethod,
        ordered_stage_ids: reordered.map((s) => s.id),
      });
      toast.success("Urutan tahapan pekerjaan berhasil diperbarui.");
    } catch (err: any) {
      toast.error(err?.message || "Gagal mengubah urutan tahapan.");
    }
  };

  const handleDeleteStage = async (stage: WorkflowStage) => {
    try {
      await deleteStageMutation.mutateAsync(stage.id);
      toast.success(`Tahapan '${stage.step_name}' berhasil dihapus.`);
    } catch (err: any) {
      toast.error(err?.message || "Gagal menghapus tahapan.");
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isSavingStage =
    createStageMutation.isPending || updateStageMutation.isPending;

  return (
    <div className="flex flex-col gap-4 pb-12">
      {/* 1. Compact Top Toolbar (no redundant hero banner) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.push("/dashboard/documents")}
          className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-[#0a4d8c] focus:outline-none"
        >
          <ArrowLeft size={14} />
          Kembali ke Pemeriksaan Dokumen
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/dashboard/documents/upload")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition hover:border-[#0a4d8c] hover:text-[#0a4d8c] focus:outline-none"
          >
            <Sparkles size={14} className="text-[#0a4d8c]" />
            <span>Uji Validasi Dokumen</span>
          </button>
          {activeTab === "templates" ? (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a4d8c] px-4 py-2 text-xs font-medium text-white shadow-2xs transition hover:bg-[#083b6c] focus:outline-none"
            >
              <Plus size={14} />
              <span>Buat Template Standar</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenCreateStage}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a4d8c] px-4 py-2 text-xs font-medium text-white shadow-2xs transition hover:bg-[#083b6c] focus:outline-none"
            >
              <Plus size={14} />
              <span>Tambah Tahapan Pekerjaan</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Bean-style Tabs Switcher: Template Kriteria vs Kelola Tahapan Pekerjaan */}
      <div className="inline-flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xs w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("templates")}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-all focus:outline-none ${
            activeTab === "templates"
              ? "bg-[#0a4d8c] text-white shadow-xs"
              : "text-slate-600 hover:bg-[#eaf3ff] hover:text-[#0a4d8c]"
          }`}
        >
          <BookOpen size={14} />
          <span>Template Kriteria Standar</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium leading-none ${
              activeTab === "templates"
                ? "bg-white/20 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {profiles.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("stages")}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-all focus:outline-none ${
            activeTab === "stages"
              ? "bg-[#0a4d8c] text-white shadow-xs"
              : "text-slate-600 hover:bg-[#eaf3ff] hover:text-[#0a4d8c]"
          }`}
        >
          <GitBranch size={14} />
          <span>Kelola Tahapan Pekerjaan</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium leading-none ${
              activeTab === "stages"
                ? "bg-white/20 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {allStages.length}
          </span>
        </button>
      </div>

      {/* ── TAB 1: VALIDATION TEMPLATES ── */}
      {activeTab === "templates" && (
        <>
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
              <SearchableSelect
                size="sm"
                className="w-full sm:w-52"
                value={kindFilter}
                onChange={setKindFilter}
                searchPlaceholder="Cari jenis dokumen..."
                options={[
                  { value: "All", label: "Semua Jenis Dokumen" },
                  ...DOCUMENT_KIND_OPTIONS.map((k) => ({ value: k, label: k })),
                ]}
              />

              <SearchableSelect
                size="sm"
                className="w-full sm:w-48"
                value={scopeFilter}
                onChange={setScopeFilter}
                searchPlaceholder="Cari cakupan..."
                options={[
                  { value: "All", label: "Semua Cakupan" },
                  ...SCOPE_OPTIONS,
                ]}
              />
            </div>
          </div>

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
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col justify-between gap-4 hover:border-slate-300 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e8f2fc] text-[#0a4d8c]">
                            <BookOpen size={15} />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
                              {profile.name}
                            </h3>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] font-normal text-slate-500">
                              <span>{profile.document_kind}</span>
                              <span>·</span>
                              <span>{profile.scope}</span>
                              {profile.target_stage_to_clear && (
                                <>
                                  <span>·</span>
                                  <span className="text-[#0a4d8c] inline-flex items-center gap-1">
                                    <Sparkles size={10} />
                                    {profile.target_stage_to_clear}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-1.5">
                          {profile.is_default && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#0a4d8c]/20 bg-[#e8f2fc] px-2 py-0.5 text-[10px] font-medium text-[#0a4d8c]">
                              <ShieldCheck size={10} />
                              Default
                            </span>
                          )}
                          <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                            Lulus &ge; {profile.passing_score_threshold}%
                          </span>
                        </div>
                      </div>

                      {profile.description && (
                        <p className="text-xs font-normal text-slate-600 leading-relaxed line-clamp-2">
                          {profile.description}
                        </p>
                      )}

                      <div className="border-t border-slate-100 pt-2.5 space-y-1.5">
                        <div className="text-[11px] font-medium text-slate-500">
                          {ruleCount} Kriteria Berbobot ({mandatoryCount} Wajib)
                        </div>
                        <ul className="space-y-1 text-xs font-normal text-slate-600">
                          {(profile.checklist_rules || [])
                            .slice(0, 3)
                            .map((rule, idx) => (
                              <li
                                key={idx}
                                className="flex items-center justify-between gap-2"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="h-1.5 w-1.5 rounded-full bg-[#0a4d8c]/70 shrink-0" />
                                  <span className="truncate">{rule.item}</span>
                                </div>
                                <span className="shrink-0 text-[11px] font-medium text-slate-500">
                                  {rule.weight ?? 0}%
                                </span>
                              </li>
                            ))}
                          {ruleCount > 3 && (
                            <li className="text-[11px] text-slate-400 pl-3.5">
                              +{ruleCount - 3} kriteria lainnya
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
        </>
      )}

      {/* ── TAB 2: ADMIN WORKFLOW STAGES MANAGEMENT ── */}
      {activeTab === "stages" && (
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <div className="relative w-full lg:w-80 flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Cari nama tahapan atau kelompok stage..."
                value={stageSearch}
                onChange={(e) => setStageSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0a4d8c] focus:ring-1 focus:ring-[#0a4d8c]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
              <span className="text-xs font-medium text-slate-500">
                Metode Pengadaan:
              </span>
              <SearchableSelect
                size="sm"
                className="w-full sm:w-56"
                value={selectedMethod}
                onChange={setSelectedMethod}
                options={methodOptions}
                searchPlaceholder="Cari metode pengadaan..."
              />
              <button
                type="button"
                onClick={handleOpenCreateStage}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a4d8c] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#083b6c] transition-colors focus:outline-none"
              >
                <Plus size={14} />
                <span>Tambah Tahapan</span>
              </button>
            </div>
          </div>

          {isLoadingStages ? (
            <div className="space-y-2.5">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : stagesForSelectedMethod.length > 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">
                    Urutan Tahapan: {selectedMethod}
                  </h3>
                  <p className="text-xs font-normal text-slate-500 mt-0.5">
                    Urutan ini otomatis menjadi acuan pembuatan pekerjaan baru, opsi auto-clear template, dan ekstraksi tahapan AI.
                  </p>
                </div>
                <span className="rounded-full bg-[#e8f2fc] border border-[#0a4d8c]/20 px-3 py-1 text-xs font-medium text-[#0a4d8c]">
                  {stagesForSelectedMethod.length} Tahapan Aktif
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {stagesForSelectedMethod.map((stg, idx) => (
                  <div
                    key={stg.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e8f2fc] text-[#0a4d8c] text-xs font-semibold">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-slate-800">
                            {stg.step_name}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-600">
                            {stg.stage_group}
                          </span>
                          {stg.default_sla_days && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-normal text-slate-500">
                              <Clock size={11} className="text-[#0a4d8c]" />
                              SLA {stg.default_sla_days} hari
                            </span>
                          )}
                        </div>
                        {stg.description && (
                          <p className="text-xs font-normal text-slate-500 mt-0.5">
                            {stg.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        disabled={idx === 0 || reorderStagesMutation.isPending}
                        onClick={() => handleMoveStageOrder(idx, -1)}
                        className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:border-[#0a4d8c] hover:text-[#0a4d8c] disabled:opacity-30 transition-colors"
                        title="Naikkan urutan"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        type="button"
                        disabled={
                          idx === stagesForSelectedMethod.length - 1 ||
                          reorderStagesMutation.isPending
                        }
                        onClick={() => handleMoveStageOrder(idx, 1)}
                        className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:border-[#0a4d8c] hover:text-[#0a4d8c] disabled:opacity-30 transition-colors"
                        title="Turunkan urutan"
                      >
                        <ArrowDown size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditStage(stg)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-[#0a4d8c] hover:text-[#0a4d8c] transition-colors"
                      >
                        <Edit3 size={12} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        disabled={deleteStageMutation.isPending}
                        onClick={() => handleDeleteStage(stg)}
                        className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:border-slate-300 hover:text-slate-800 transition-colors"
                        title="Hapus tahapan"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center space-y-3">
              <GitBranch size={32} className="mx-auto text-slate-300" />
              <div className="text-sm font-medium text-slate-700">
                Belum ada tahapan untuk metode &ldquo;{selectedMethod}&rdquo;
              </div>
              <button
                type="button"
                onClick={handleOpenCreateStage}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a4d8c] px-4 py-2 text-xs font-medium text-white hover:bg-[#083b6c]"
              >
                <Plus size={14} />
                Tambah Tahapan Pertama
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal Create / Edit Template (Portal-rendered full-screen centered) */}
      {isModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {editingProfile
                    ? "Edit Template Standar Kelayakan"
                    : "Buat Template Standar Kelayakan Baru"}
                </h3>
                <p className="text-xs font-normal text-slate-500 mt-0.5">
                  Atur informasi dasar template dan daftar kriteria checklist berbobot
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

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Section 1: Basic Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="sm:col-span-2 lg:col-span-2">
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
                    Auto-Clear Tahap (Opsional)
                  </label>
                  <SearchableSelect
                    size="sm"
                    value={formTargetStage}
                    onChange={setFormTargetStage}
                    allowClear
                    allowCustomValue
                    searchPlaceholder="Cari tahapan..."
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
                    placeholder="Acuan kegunaan template..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-800 focus:border-[#0a4d8c] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap items-center gap-6 pt-1">
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
                    <span>Jadikan standar utama (Default)</span>
                  </label>
                </div>
              </div>

              {/* Section 2: Flattened Checklist Rules Editor */}
              <div className="border-t border-slate-200 pt-5 space-y-3">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#0a4d8c]">
                  <Sliders size={13} />
                  <span>Kriteria Checklist Berbobot &amp; Ambang Skor</span>
                </div>
                <ChecklistEditor
                  items={formRules}
                  onChange={setFormRules}
                  passingScore={formPassingScore}
                  onPassingScoreChange={setFormPassingScore}
                  onCriteriaFileExtracted={(meta) => {
                    if (!formName.trim() && meta.suggested_name) {
                      setFormName(meta.suggested_name);
                    }
                    if (meta.suggested_document_kind) {
                      setFormKind(meta.suggested_document_kind);
                    }
                    if (!formSystemPrompt.trim() && meta.suggested_system_prompt) {
                      setFormSystemPrompt(meta.suggested_system_prompt);
                    }
                  }}
                />
              </div>

              {/* Section 3: AI System Prompt */}
              <div className="border-t border-slate-200 pt-5">
                <label className="text-[11px] font-medium uppercase tracking-wider text-slate-600 block mb-1.5">
                  Instruksi Sistem AI (Opsional)
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

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
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
        </ModalPortal>
      )}

      {/* Modal Create / Edit Workflow Stage */}
      {isStageModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  {editingStage
                    ? "Edit Tahapan Pekerjaan"
                    : "Tambah Tahapan Pekerjaan Baru"}
                </h3>
                <p className="text-xs font-normal text-slate-500 mt-0.5">
                  Perubahan tahapan akan otomatis tersedia di seluruh form & Tracker
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsStageModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 focus:outline-none"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-3.5">
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider text-slate-600 block mb-1">
                  Metode Pengadaan
                </label>
                <SearchableSelect
                  size="sm"
                  value={stageMethodInput}
                  onChange={setStageMethodInput}
                  allowCustomValue
                  customValueLabel={(q) => `Buat metode baru "${q}"`}
                  searchPlaceholder="Pilih atau ketik metode pengadaan..."
                  options={methodOptions}
                />
              </div>

              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider text-slate-600 block mb-1">
                  Nama Tahapan Pekerjaan
                </label>
                <input
                  type="text"
                  value={stageStepName}
                  onChange={(e) => setStageStepName(e.target.value)}
                  placeholder="Contoh: Klarifikasi Teknis & Kunjungan Lapangan"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-800 focus:border-[#0a4d8c] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium uppercase tracking-wider text-slate-600 block mb-1">
                    Kelompok Stage
                  </label>
                  <SearchableSelect
                    size="sm"
                    value={stageGroup}
                    onChange={setStageGroup}
                    searchPlaceholder="Cari stage..."
                    options={STAGE_GROUP_OPTIONS}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium uppercase tracking-wider text-slate-600 block mb-1">
                    Standar SLA (Hari)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={stageSlaDays}
                    onChange={(e) =>
                      setStageSlaDays(Math.max(1, Number(e.target.value) || 1))
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-800 focus:border-[#0a4d8c] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider text-slate-600 block mb-1">
                  Keterangan / Deliverable (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={stageDescription}
                  onChange={(e) => setStageDescription(e.target.value)}
                  placeholder="Ringkasan keluaran atau prasyarat tahapan ini..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-normal text-slate-800 focus:border-[#0a4d8c] focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsStageModalOpen(false)}
                className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveStage}
                disabled={isSavingStage}
                className="px-4 py-2 bg-[#0a4d8c] hover:bg-[#083b6c] text-white rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSavingStage ? (
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
                    <span>Simpan Tahapan</span>
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
