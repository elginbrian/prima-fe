"use client";

import { useState, useMemo } from "react";
import {
  ArrowUp,
  ArrowDown,
  Check,
  Clock,
  Edit3,
  GitBranch,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  useWorkflowStages,
  useCreateWorkflowStage,
  useUpdateWorkflowStage,
  useReorderWorkflowStages,
  useDeleteWorkflowStage,
} from "@/lib/query/hooks/procurement/useValidation";
import { useToast } from "@/components/ui/Toast";
import {
  Spinner,
  Skeleton,
  SearchableSelect,
  ModalPortal,
} from "@/components/ui";
import {
  STAGE_GROUP_OPTIONS,
  DEFAULT_PROCUREMENT_METHODS,
} from "./templateConstants";
import {
  CreateMethodModal,
  type DraftMethodStageRow,
} from "./CreateMethodModal";
import type { WorkflowStage } from "@/types/validation";

export default function WorkflowStagesPage() {
  const toast = useToast();

  const { data: allStages = [], isLoading: isLoadingStages } =
    useWorkflowStages();
  const createStageMutation = useCreateWorkflowStage();
  const updateStageMutation = useUpdateWorkflowStage();
  const reorderStagesMutation = useReorderWorkflowStages();
  const deleteStageMutation = useDeleteWorkflowStage();

  const [selectedMethod, setSelectedMethod] = useState("Tender Terbuka");
  const [stageSearch, setStageSearch] = useState("");

  // Modal for creating a brand new Procurement Method + its custom stages
  const [isCreateMethodModalOpen, setIsCreateMethodModalOpen] = useState(false);
  const [isCreatingMethodBatch, setIsCreatingMethodBatch] = useState(false);

  // Modal for adding/editing a single stage inside a method
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<WorkflowStage | null>(null);
  const [stageMethodInput, setStageMethodInput] = useState("Tender Terbuka");
  const [stageStepName, setStageStepName] = useState("");
  const [stageGroup, setStageGroup] = useState("Sourcing");
  const [stageSlaDays, setStageSlaDays] = useState(5);
  const [stageDescription, setStageDescription] = useState("");

  const availableMethods = useMemo(() => {
    const set = new Set<string>(DEFAULT_PROCUREMENT_METHODS);
    allStages.forEach((s) => {
      if (s.procurement_method) set.add(s.procurement_method);
    });
    return Array.from(set);
  }, [allStages]);

  const methodOptions = useMemo(
    () => availableMethods.map((m) => ({ value: m, label: m })),
    [availableMethods]
  );

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
    const methodVal = stageMethodInput.trim() || selectedMethod;
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
        toast.success(
          `Tahapan '${stageStepName.trim()}' berhasil diperbarui.`
        );
      } else {
        await createStageMutation.mutateAsync({
          procurement_method: methodVal,
          step_name: stageStepName.trim(),
          stage_group: stageGroup,
          default_sla_days: stageSlaDays,
          description: stageDescription.trim() || undefined,
        });
        setSelectedMethod(methodVal);
        toast.success(
          `Tahapan '${stageStepName.trim()}' berhasil ditambahkan.`
        );
      }
      setIsStageModalOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Gagal menyimpan tahapan pekerjaan.");
    }
  };

  const handleSaveNewMethodWithStages = async (
    newMethodName: string,
    stagesToCreate: Omit<DraftMethodStageRow, "tempId">[]
  ) => {
    setIsCreatingMethodBatch(true);
    try {
      for (let i = 0; i < stagesToCreate.length; i++) {
        const stg = stagesToCreate[i];
        await createStageMutation.mutateAsync({
          procurement_method: newMethodName,
          step_name: stg.step_name,
          stage_group: stg.stage_group,
          order_index: i,
          default_sla_days: stg.default_sla_days,
          description: stg.description || undefined,
        });
      }
      setSelectedMethod(newMethodName);
      setIsCreateMethodModalOpen(false);
      toast.success(
        `Metode pengadaan "${newMethodName}" beserta ${stagesToCreate.length} tahapan berhasil dibuat.`
      );
    } catch (err: any) {
      toast.error(err?.message || "Gagal membuat metode pengadaan baru.");
    } finally {
      setIsCreatingMethodBatch(false);
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

  const isSavingStage =
    createStageMutation.isPending || updateStageMutation.isPending;

  return (
    <div className="flex flex-col gap-4 pb-12">
      {/* Top Bar: Method Summary Chips on Left + "Buat Metode Pengadaan Baru" on Right */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {availableMethods.map((method) => {
            const count = allStages.filter(
              (s) => s.procurement_method === method
            ).length;
            const isSelected = method === selectedMethod;
            return (
              <button
                key={method}
                type="button"
                onClick={() => setSelectedMethod(method)}
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all focus:outline-none ${
                  isSelected
                    ? "border-[#0a4d8c] bg-[#0a4d8c] text-white shadow-2xs"
                    : "border-slate-200 bg-white text-slate-600 hover:border-[#0a4d8c]/40 hover:bg-[#f4f8fd] hover:text-[#0a4d8c]"
                }`}
              >
                <GitBranch size={13} />
                <span>{method}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setIsCreateMethodModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a4d8c] px-4 py-2 text-xs font-medium text-white shadow-2xs transition hover:bg-[#083b6c] focus:outline-none"
        >
          <Plus size={14} />
          <span>Buat Metode Pengadaan Baru</span>
        </button>
      </div>

      {/* Filter & Add Stage for Current Method Bar */}
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

      {/* Stages List for Selected Method */}
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

      {/* Popup Modal: Buat Metode Pengadaan Baru */}
      <CreateMethodModal
        isOpen={isCreateMethodModalOpen}
        onClose={() => setIsCreateMethodModalOpen(false)}
        existingMethods={availableMethods}
        allStages={allStages}
        onSaveMethod={handleSaveNewMethodWithStages}
        isSaving={isCreatingMethodBatch}
      />

      {/* Popup Modal: Tambah / Edit 1 Tahapan Pekerjaan */}
      {isStageModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">
                    {editingStage
                      ? "Edit Tahapan Pekerjaan"
                      : "Tambah Tahapan Pekerjaan"}
                  </h3>
                  <p className="text-xs font-normal text-slate-500 mt-0.5">
                    Tambahkan tahapan ke dalam metode pengadaan yang dipilih
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
                        setStageSlaDays(
                          Math.max(1, Number(e.target.value) || 1)
                        )
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
