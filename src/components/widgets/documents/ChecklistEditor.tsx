"use client";

import { useState, useRef, useMemo } from "react";
import {
  Plus,
  Trash2,
  Sliders,
  UploadCloud,
  Scale,
  Percent,
  Sparkles,
  FileSpreadsheet,
} from "lucide-react";
import { useExtractCriteria } from "@/lib/query/hooks/procurement/useValidation";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui";
import type {
  ChecklistRuleItem,
  ExtractedCriteriaResponse,
} from "@/types/validation";

interface ChecklistEditorProps {
  items: ChecklistRuleItem[];
  onChange: (items: ChecklistRuleItem[]) => void;
  passingScore: number;
  onPassingScoreChange: (score: number) => void;
  showSourceBadges?: boolean;
  onCriteriaFileExtracted?: (meta: ExtractedCriteriaResponse) => void;
}

export function distributeWeightsEvenly(
  list: ChecklistRuleItem[]
): ChecklistRuleItem[] {
  if (list.length === 0) return list;
  const base = Math.floor((10000 / list.length)) / 100;
  return list.map((item, idx) => ({
    ...item,
    weight:
      idx === list.length - 1
        ? Number((100 - base * (list.length - 1)).toFixed(2))
        : base,
  }));
}

export function normalizeWeightsTo100(
  list: ChecklistRuleItem[]
): ChecklistRuleItem[] {
  if (list.length === 0) return list;
  const total = list.reduce((acc, it) => acc + Math.max(0, Number(it.weight) || 0), 0);
  if (total <= 0) return distributeWeightsEvenly(list);
  let running = 0;
  return list.map((item, idx) => {
    const raw = Math.max(0, Number(item.weight) || 0);
    if (idx === list.length - 1) {
      return {
        ...item,
        weight: Number(Math.max(0, 100 - running).toFixed(2)),
      };
    }
    const norm = Number(((raw / total) * 100).toFixed(2));
    running += norm;
    return { ...item, weight: norm };
  });
}

export function ChecklistEditor({
  items,
  onChange,
  passingScore,
  onPassingScoreChange,
  showSourceBadges = false,
  onCriteriaFileExtracted,
}: ChecklistEditorProps) {
  const toast = useToast();
  const extractMutation = useExtractCriteria();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newItemText, setNewItemText] = useState("");
  const [newGuidance, setNewGuidance] = useState("");
  const [newIsMandatory, setNewIsMandatory] = useState(true);
  const [newItemWeight, setNewItemWeight] = useState<string>("");
  const [hasManualWeights, setHasManualWeights] = useState(false);
  const [uploadMergeMode, setUploadMergeMode] = useState<"replace" | "append">("replace");

  const totalWeight = useMemo(
    () =>
      Number(
        items
          .reduce((sum, i) => sum + Math.max(0, Number(i.weight) || 0), 0)
          .toFixed(2)
      ),
    [items]
  );

  const isExact100 = Math.abs(totalWeight - 100) < 0.05;

  const handleAddItem = () => {
    const trimmed = newItemText.trim();
    if (!trimmed) return;

    const parsedWeight = parseFloat(newItemWeight);
    const hasExplicitWeight = !Number.isNaN(parsedWeight) && parsedWeight > 0;

    const newItem: ChecklistRuleItem = {
      category: "Umum",
      item: trimmed,
      guidance: newGuidance.trim() || undefined,
      is_mandatory: newIsMandatory,
      weight: hasExplicitWeight ? parsedWeight : 0,
      severity_on_failure: newIsMandatory ? "ERROR" : "WARNING",
      source: "custom",
    };

    const nextList = [...items, newItem];
    if (hasExplicitWeight || hasManualWeights) {
      setHasManualWeights(true);
      if (!hasExplicitWeight) {
        const remaining = Math.max(5, Number((100 - totalWeight).toFixed(2)));
        nextList[nextList.length - 1].weight = remaining;
      }
      onChange(nextList);
    } else {
      onChange(distributeWeightsEvenly(nextList));
    }

    setNewItemText("");
    setNewGuidance("");
    setNewItemWeight("");
  };

  const handleWeightChange = (index: number, rawVal: string) => {
    const parsed = rawVal === "" ? 0 : Math.max(0, Math.min(100, parseFloat(rawVal) || 0));
    setHasManualWeights(true);
    const updated = items.map((item, idx) =>
      idx === index ? { ...item, weight: parsed } : item
    );
    onChange(updated);
  };

  const handleGuidanceChange = (index: number, val: string) => {
    const updated = items.map((item, idx) =>
      idx === index ? { ...item, guidance: val || undefined } : item
    );
    onChange(updated);
  };

  const handleToggleMandatory = (index: number) => {
    const updated = items.map((item, idx) => {
      if (idx === index) {
        const nextMandatory = !item.is_mandatory;
        return {
          ...item,
          is_mandatory: nextMandatory,
          severity_on_failure: nextMandatory
            ? ("ERROR" as const)
            : ("WARNING" as const),
        };
      }
      return item;
    });
    onChange(updated);
  };

  const handleRemoveItem = (index: number) => {
    const remaining = items.filter((_, idx) => idx !== index);
    if (!hasManualWeights && remaining.length > 0) {
      onChange(distributeWeightsEvenly(remaining));
    } else {
      onChange(remaining);
    }
  };

  const handleEqualizeWeights = () => {
    setHasManualWeights(false);
    onChange(distributeWeightsEvenly(items));
    toast.success("Bobot kriteria telah dibagi rata ke 100%.");
  };

  const handleNormalizeWeights = () => {
    onChange(normalizeWeightsTo100(items));
    toast.success("Bobot kriteria berhasil dinormalisasi proporsional menjadi 100%.");
  };

  const handleUploadCriteriaFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const uploaded = e.target.files?.[0];
    e.target.value = "";
    if (!uploaded) return;

    try {
      toast.info(`Mengekstrak daftar kriteria dari '${uploaded.name}' dengan AI...`);
      const extracted = await extractMutation.mutateAsync(uploaded);
      const extractedRules: ChecklistRuleItem[] = (
        extracted.checklist_rules || []
      ).map((r) => ({
        ...r,
        source: "custom",
      }));

      if (extractedRules.length === 0) {
        toast.warning("Tidak ada kriteria yang terdeteksi dari file tersebut.");
        return;
      }

      if (uploadMergeMode === "append" && items.length > 0) {
        onChange(normalizeWeightsTo100([...items, ...extractedRules]));
      } else {
        onChange(normalizeWeightsTo100(extractedRules));
      }
      setHasManualWeights(true);
      onCriteriaFileExtracted?.(extracted);
      toast.success(
        `Berhasil mengekstrak ${extractedRules.length} kriteria beserta bobotnya dari '${uploaded.name}'.`
      );
    } catch (err: any) {
      toast.error(
        err?.message || "Gagal mengekstrak kriteria dari file yang diunggah."
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Upload Criteria File Bar */}
      <div className="rounded-lg border border-dashed border-[#0a4d8c]/35 bg-[#f4f8fd] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#0a4d8c] border border-[#0a4d8c]/20">
            <FileSpreadsheet size={15} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-[#0a4d8c] flex items-center gap-1.5">
              <span>Upload File Daftar Kriteria (Otomatis Ekstrak AI)</span>
            </div>
            <p className="text-[11px] font-normal text-slate-600 mt-0.5 leading-snug">
              Unggah file PDF, DOCX, XLSX, CSV, atau gambar matriks kriteria agar daftar kriteria & bobotnya terisi otomatis tanpa ketik manual.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {items.length > 0 && (
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-[10px]">
              <button
                type="button"
                onClick={() => setUploadMergeMode("replace")}
                className={`rounded-md px-2 py-1 font-medium transition-colors ${
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
                className={`rounded-md px-2 py-1 font-medium transition-colors ${
                  uploadMergeMode === "append"
                    ? "bg-[#0a4d8c] text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Tambah
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.png,.jpg,.jpeg"
            onChange={handleUploadCriteriaFile}
            className="hidden"
          />
          <button
            type="button"
            disabled={extractMutation.isPending}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a4d8c] px-3 py-2 text-xs font-medium text-white hover:bg-[#083b6c] transition-colors disabled:opacity-60 focus:outline-none"
          >
            {extractMutation.isPending ? (
              <>
                <Spinner size="xs" className="border-white border-t-transparent" />
                <span>Mengekstrak...</span>
              </>
            ) : (
              <>
                <UploadCloud size={14} />
                <span>Upload Kriteria</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Ambang Batas Skor (Passing Threshold Slider) */}
      <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Sliders size={12} className="text-[#0a4d8c]" />
            Ambang Batas Skor Kelayakan
          </label>
          <span className="font-medium text-[#0a4d8c] text-xs bg-[#e8f2fc] px-2 py-0.5 rounded border border-[#0a4d8c]/20">
            {passingScore}%
          </span>
        </div>
        <input
          type="range"
          min="50"
          max="100"
          step="5"
          value={passingScore}
          onChange={(e) => onPassingScoreChange(Number(e.target.value))}
          className="w-full accent-[#0a4d8c] cursor-pointer"
        />
        <div className="flex justify-between text-[10px] font-normal text-slate-400">
          <span>50% (Fleksibel)</span>
          <span className="font-medium text-slate-600">
            80% (Standar Pertamina)
          </span>
          <span>100% (Ketat)</span>
        </div>
      </div>

      {/* 3. Checklist Items List with Right-Hand Weight Column (%) */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Kriteria & Bobot ({items.length})
            </label>
            {items.length > 0 && (
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                  isExact100
                    ? "border-slate-200 bg-slate-100 text-slate-700"
                    : "border-[#0a4d8c]/30 bg-[#e8f2fc] text-[#0a4d8c]"
                }`}
              >
                <Percent size={10} />
                <span>Total Bobot: {totalWeight}%</span>
              </span>
            )}
          </div>

          {items.length > 0 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleEqualizeWeights}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-normal text-slate-600 hover:border-[#0a4d8c] hover:text-[#0a4d8c] transition-colors"
                title="Bagi rata 100% ke seluruh kriteria"
              >
                <Scale size={11} />
                <span>Bagi Rata</span>
              </button>
              {!isExact100 && (
                <button
                  type="button"
                  onClick={handleNormalizeWeights}
                  className="inline-flex items-center gap-1 rounded-md border border-[#0a4d8c]/30 bg-[#e8f2fc] px-2 py-1 text-[11px] font-medium text-[#0a4d8c] hover:bg-[#d8e8fa] transition-colors"
                  title="Normalisasi proporsional agar total tepat 100%"
                >
                  <Sparkles size={11} />
                  <span>Normalisasi ke 100%</span>
                </button>
              )}
            </div>
          )}
        </div>

        {items.length > 0 && !isExact100 && (
          <p className="text-[11px] font-normal text-[#0a4d8c] bg-[#f4f8fd] border border-[#0a4d8c]/20 rounded-lg px-3 py-1.5">
            Total bobot saat ini <span className="font-medium">{totalWeight}%</span>. Anda dapat klik <span className="font-medium">Normalisasi ke 100%</span> sekarang, atau sistem akan menormalisasinya secara proporsional otomatis saat perhitungan skor AI.
          </p>
        )}

        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-5 text-center text-xs font-normal text-slate-500">
            Belum ada butir kriteria. Pilih template standar, unggah file kriteria di atas, atau tambahkan kriteria kustom di bawah.
          </div>
        ) : (
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-all"
              >
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-normal text-slate-400">
                      #{idx + 1}
                    </span>
                    {item.category && item.category !== "Umum" && (
                      <span className="text-[10px] font-normal text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        {item.category}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleToggleMandatory(idx)}
                      className={`text-[10px] font-normal px-2 py-0.5 rounded-full border transition-colors focus:outline-none ${
                        item.is_mandatory
                          ? "bg-[#e8f2fc] text-[#0a4d8c] border-[#0a4d8c]/20"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                      title="Klik untuk mengubah status Wajib / Opsional"
                    >
                      {item.is_mandatory ? "Wajib" : "Opsional"}
                    </button>
                    {showSourceBadges && item.source && (
                      <span
                        className={`text-[10px] font-normal px-2 py-0.5 rounded-full border ${
                          item.source === "template"
                            ? "border-slate-200 bg-slate-50 text-slate-500"
                            : "border-[#0a4d8c]/25 bg-white text-[#0a4d8c]"
                        }`}
                      >
                        {item.source === "template" ? "Template" : "Kustom"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-normal text-slate-800 leading-snug break-words">
                    {item.item}
                  </p>
                  <input
                    type="text"
                    value={item.guidance || ""}
                    onChange={(e) => handleGuidanceChange(idx, e.target.value)}
                    placeholder="Panduan / target pembanding opsional (mis. Maksimal 12 bulan kalender)..."
                    className="w-full rounded border border-transparent bg-slate-50/70 px-2 py-1 text-[11px] font-normal text-slate-600 placeholder:text-slate-400 hover:border-slate-200 focus:border-[#0a4d8c] focus:bg-white focus:outline-none transition-colors"
                  />
                </div>

                {/* Right Column: Weight (%) input + Delete */}
                <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
                      Bobot
                    </span>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.5"
                        aria-label={`Bobot kriteria ${idx + 1} dalam persen`}
                        value={item.weight ?? 0}
                        onChange={(e) => handleWeightChange(idx, e.target.value)}
                        className="w-16 rounded-lg border border-slate-200 bg-slate-50 py-1 pl-2 pr-5 text-right text-xs font-medium text-[#0a4d8c] focus:border-[#0a4d8c] focus:bg-white focus:outline-none"
                      />
                      <span className="pointer-events-none absolute right-2 text-[11px] font-normal text-slate-400">
                        %
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label="Hapus kriteria"
                    onClick={() => handleRemoveItem(idx)}
                    className="mt-3 text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition-colors shrink-0 focus:outline-none"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Add New Custom Item Input */}
      <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-2">
        <div className="text-[11px] font-medium uppercase tracking-wider text-slate-600 flex items-center gap-1">
          <Plus size={12} className="text-[#0a4d8c]" />
          Tambah Kriteria Kustom
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddItem();
              }
            }}
            placeholder="Contoh: Jangka waktu pelaksanaan sesuai atau lebih cepat dari KAK (maks. 12 bulan)..."
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-normal text-slate-800 placeholder:text-slate-400 focus:border-[#0a4d8c] focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <div className="relative flex items-center">
              <input
                type="number"
                min={0}
                max={100}
                step="1"
                value={newItemWeight}
                onChange={(e) => setNewItemWeight(e.target.value)}
                placeholder="Auto"
                title="Kosongkan untuk bagi rata otomatis"
                className="w-20 rounded-lg border border-slate-200 bg-white py-2 pl-2.5 pr-6 text-right text-xs font-normal text-slate-800 placeholder:text-slate-400 focus:border-[#0a4d8c] focus:outline-none"
              />
              <span className="pointer-events-none absolute right-2 text-[11px] text-slate-400">
                %
              </span>
            </div>
            <button
              type="button"
              onClick={handleAddItem}
              disabled={!newItemText.trim()}
              className="rounded-lg bg-[#0a4d8c] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[#083b6c] disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center gap-1 focus:outline-none"
            >
              <Plus size={13} />
              Tambah
            </button>
          </div>
        </div>
        <input
          type="text"
          value={newGuidance}
          onChange={(e) => setNewGuidance(e.target.value)}
          placeholder="Panduan / target pembanding untuk AI (opsional, mis. 12 bulan <= 13 bulan = Memenuhi)"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-normal text-slate-700 placeholder:text-slate-400 focus:border-[#0a4d8c] focus:outline-none"
        />
        <div className="flex items-center gap-4 text-[11px] text-slate-600 pt-0.5">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={newIsMandatory}
              onChange={(e) => setNewIsMandatory(e.target.checked)}
              className="rounded border-slate-300 accent-[#0a4d8c]"
            />
            <span className="font-normal text-slate-700">
              Tandai sebagai syarat wajib (Mandatory)
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
