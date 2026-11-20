"use client";

import { useState, useMemo } from "react";
import {
  Check,
  Copy,
  GitBranch,
  Plus,
  Trash2,
  X,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { ModalPortal, SearchableSelect, Spinner } from "@/components/ui";
import { STAGE_GROUP_OPTIONS } from "./templateConstants";
import type { WorkflowStage } from "@/types/validation";

export interface DraftMethodStageRow {
  tempId: string;
  step_name: string;
  stage_group: string;
  default_sla_days: number;
  description: string;
}

interface CreateMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingMethods: string[];
  allStages: WorkflowStage[];
  onSaveMethod: (
    methodName: string,
    stages: Omit<DraftMethodStageRow, "tempId">[]
  ) => Promise<void>;
  isSaving?: boolean;
}

function makeEmptyRow(
  stepName = "",
  stageGroup = "Sourcing",
  slaDays = 5,
  description = ""
): DraftMethodStageRow {
  return {
    tempId: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    step_name: stepName,
    stage_group: stageGroup,
    default_sla_days: slaDays,
    description,
  };
}

export function CreateMethodModal({
  isOpen,
  onClose,
  existingMethods,
  allStages,
  onSaveMethod,
  isSaving = false,
}: CreateMethodModalProps) {
  const [methodName, setMethodName] = useState("");
  const [copyFromMethod, setCopyFromMethod] = useState("NONE");
  const [rows, setRows] = useState<DraftMethodStageRow[]>([
    makeEmptyRow("Penyusunan KAK & Spesifikasi", "Persiapan", 5),
    makeEmptyRow("Pengumuman & Undangan", "Sourcing", 5),
    makeEmptyRow("Evaluasi Penawaran & Negosiasi", "Evaluasi", 5),
    makeEmptyRow("Penetapan & Penunjukan Pemenang", "Contracting", 3),
  ]);
  const [errorText, setErrorText] = useState<string | null>(null);

  const copyOptions = useMemo(
    () => [
      { value: "NONE", label: "Susun Tahapan Custom dari Awal" },
      ...existingMethods.map((m) => ({
        value: m,
        label: `Salin struktur dari: ${m}`,
      })),
    ],
    [existingMethods]
  );

  if (!isOpen) return null;

  const handleApplyTemplateCopy = (sourceMethod: string) => {
    setCopyFromMethod(sourceMethod);
    if (sourceMethod === "NONE") {
      setRows([
        makeEmptyRow("Penyusunan KAK & Spesifikasi", "Persiapan", 5),
        makeEmptyRow("Pengumuman & Undangan", "Sourcing", 5),
        makeEmptyRow("Evaluasi Penawaran & Negosiasi", "Evaluasi", 5),
        makeEmptyRow("Penetapan & Penunjukan Pemenang", "Contracting", 3),
      ]);
      return;
    }

    const templateStages = allStages
      .filter((s) => s.procurement_method === sourceMethod)
      .sort((a, b) => a.order_index - b.order_index);

    if (templateStages.length > 0) {
      setRows(
        templateStages.map((s) =>
          makeEmptyRow(
            s.step_name,
            s.stage_group,
            s.default_sla_days ?? 5,
            s.description || ""
          )
        )
      );
    }
  };

  const handleAddRow = () => {
    setRows((prev) => [...prev, makeEmptyRow("", "Sourcing", 5)]);
  };

  const handleRemoveRow = (tempId: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.tempId !== tempId));
  };

  const handleMoveRow = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= rows.length) return;
    setRows((prev) => {
      const copy = [...prev];
      [copy[idx], copy[target]] = [copy[target], copy[idx]];
      return copy;
    });
  };

  const handleUpdateRow = (
    tempId: string,
    field: keyof Omit<DraftMethodStageRow, "tempId">,
    value: string | number
  ) => {
    setRows((prev) =>
      prev.map((r) => (r.tempId === tempId ? { ...r, [field]: value } : r))
    );
  };

  const handleSubmit = async () => {
    const cleanMethod = methodName.trim();
    if (!cleanMethod) {
      setErrorText("Nama metode pengadaan baru wajib diisi.");
      return;
    }

    if (
      existingMethods.some(
        (m) => m.toLowerCase() === cleanMethod.toLowerCase()
      )
    ) {
      setErrorText(
        `Metode "${cleanMethod}" sudah terdaftar. Gunakan nama metode lain.`
      );
      return;
    }

    const validStages = rows
      .map((r) => ({
        step_name: r.step_name.trim(),
        stage_group: r.stage_group,
        default_sla_days: Math.max(1, Number(r.default_sla_days) || 5),
        description: r.description.trim(),
      }))
      .filter((r) => r.step_name.length > 0);

    if (validStages.length === 0) {
      setErrorText("Tambahkan minimal 1 tahapan pekerjaan yang memiliki nama.");
      return;
    }

    setErrorText(null);
    await onSaveMethod(cleanMethod, validStages);
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8f2fc] text-[#0a4d8c]">
                <GitBranch size={17} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Buat Metode Pengadaan Baru
                </h3>
                <p className="text-xs font-normal text-slate-500 mt-0.5">
                  Tambahkan metode pengadaan custom beserta urutan tahapan pekerjaannya
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 focus:outline-none"
            >
              <X size={16} />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
            {/* Method Name & Copy Template */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 block mb-1.5">
                  Nama Metode Pengadaan Baru <span className="text-[#0a4d8c]">*</span>
                </label>
                <input
                  type="text"
                  value={methodName}
                  onChange={(e) => setMethodName(e.target.value)}
                  placeholder="Contoh: Tender Cepat / Kontrak Payung"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-[#0a4d8c] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 block mb-1.5">
                  <span className="inline-flex items-center gap-1">
                    <Copy size={11} className="text-[#0a4d8c]" />
                    Acuan Tahapan Awal
                  </span>
                </label>
                <SearchableSelect
                  size="sm"
                  value={copyFromMethod}
                  onChange={handleApplyTemplateCopy}
                  options={copyOptions}
                  searchPlaceholder="Pilih acuan tahapan..."
                />
              </div>
            </div>

            {/* Stages Builder List */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-800">
                    Daftar Tahapan Pekerjaan ({rows.length} Tahapan)
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Susun urutan tahapan dari awal hingga selesai untuk metode ini
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddRow}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#0a4d8c]/25 bg-[#e8f2fc] px-3 py-1.5 text-xs font-semibold text-[#0a4d8c] hover:bg-[#dcebfa] transition-colors"
                >
                  <Plus size={13} />
                  <span>Tambah Baris Tahapan</span>
                </button>
              </div>

              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin">
                {rows.map((row, idx) => (
                  <div
                    key={row.tempId}
                    className="flex flex-col sm:flex-row sm:items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/60 p-3"
                  >
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0a4d8c] text-white text-[11px] font-semibold">
                        {idx + 1}
                      </span>
                    </div>

                    <div className="grid flex-1 grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-6">
                        <input
                          type="text"
                          value={row.step_name}
                          onChange={(e) =>
                            handleUpdateRow(
                              row.tempId,
                              "step_name",
                              e.target.value
                            )
                          }
                          placeholder="Nama tahapan pekerjaan..."
                          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#0a4d8c] focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <SearchableSelect
                          size="sm"
                          value={row.stage_group}
                          onChange={(val) =>
                            handleUpdateRow(row.tempId, "stage_group", val)
                          }
                          options={STAGE_GROUP_OPTIONS}
                          searchPlaceholder="Stage..."
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <div
                          className="flex items-center rounded-lg border border-slate-200 bg-white px-2 py-1.5"
                          title="Target SLA (Hari)"
                        >
                          <input
                            type="number"
                            min={1}
                            max={180}
                            value={row.default_sla_days}
                            onChange={(e) =>
                              handleUpdateRow(
                                row.tempId,
                                "default_sla_days",
                                Math.max(1, Number(e.target.value) || 1)
                              )
                            }
                            className="w-full text-center text-xs text-slate-800 focus:outline-none"
                          />
                          <span className="text-[10px] text-slate-400 ml-0.5">
                            hr
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveRow(idx, -1)}
                        className="rounded-md border border-slate-200 bg-white p-1 text-slate-500 hover:border-[#0a4d8c] hover:text-[#0a4d8c] disabled:opacity-30"
                        title="Naikkan urutan"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === rows.length - 1}
                        onClick={() => handleMoveRow(idx, 1)}
                        className="rounded-md border border-slate-200 bg-white p-1 text-slate-500 hover:border-[#0a4d8c] hover:text-[#0a4d8c] disabled:opacity-30"
                        title="Turunkan urutan"
                      >
                        <ArrowDown size={12} />
                      </button>
                      <button
                        type="button"
                        disabled={rows.length <= 1}
                        onClick={() => handleRemoveRow(row.tempId)}
                        className="rounded-md border border-slate-200 bg-white p-1 text-slate-400 hover:border-slate-300 hover:text-slate-700 disabled:opacity-30"
                        title="Hapus baris"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {errorText && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-medium text-red-700">
                {errorText}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="px-4 py-2 bg-[#0a4d8c] hover:bg-[#083b6c] text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Spinner
                    size="xs"
                    className="border-white border-t-transparent"
                  />
                  <span>Menyimpan Metode...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Simpan Metode & Tahapan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
