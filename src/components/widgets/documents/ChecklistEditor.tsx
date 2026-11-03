"use client";

import { useState } from "react";
import { Plus, Trash2, Sliders } from "lucide-react";
import type { ChecklistRuleItem } from "@/types/validation";

interface ChecklistEditorProps {
  items: ChecklistRuleItem[];
  onChange: (items: ChecklistRuleItem[]) => void;
  passingScore: number;
  onPassingScoreChange: (score: number) => void;
}

export function ChecklistEditor({
  items,
  onChange,
  passingScore,
  onPassingScoreChange,
}: ChecklistEditorProps) {
  const [newItemText, setNewItemText] = useState("");
  const [newIsMandatory, setNewIsMandatory] = useState(true);
  const [newItemCategory] = useState("Umum");

  const handleAddItem = () => {
    const trimmed = newItemText.trim();
    if (!trimmed) return;

    const newItem: ChecklistRuleItem = {
      category: newItemCategory,
      item: trimmed,
      is_mandatory: newIsMandatory,
      weight: 25,
      severity_on_failure: newIsMandatory ? "ERROR" : "WARNING",
    };

    onChange([...items, newItem]);
    setNewItemText("");
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
    onChange(items.filter((_, idx) => idx !== index));
  };

  return (
    <div className="space-y-4">
      {/* Ambang Batas Skor (Passing Threshold Slider) */}
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

      {/* Checklist Items List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Kriteria yang Divalidasi ({items.length})
          </label>
          <span className="text-[11px] text-slate-500 font-normal">
            {items.filter((i) => i.is_mandatory).length} Wajib ·{" "}
            {items.filter((i) => !i.is_mandatory).length} Opsional
          </span>
        </div>

        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-5 text-center text-xs font-normal text-slate-500">
            Belum ada butir kriteria. Pilih template di atas atau tambahkan kriteria baru di bawah.
          </div>
        ) : (
          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-all"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
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
                  </div>
                  <p className="text-xs font-normal text-slate-800 leading-snug break-words">
                    {item.item}
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Hapus kriteria"
                  onClick={() => handleRemoveItem(idx)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition-colors shrink-0 focus:outline-none"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Item Input */}
      <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-2">
        <div className="text-[11px] font-medium uppercase tracking-wider text-slate-600 flex items-center gap-1">
          <Plus size={12} className="text-[#0a4d8c]" />
          Tambah Kriteria Kustom
        </div>
        <div className="flex gap-2">
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
            placeholder="Contoh: Memuat klausul denda keterlambatan 1 permil per hari..."
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-normal text-slate-800 placeholder:text-slate-400 focus:border-[#0a4d8c] focus:outline-none"
          />
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
        <div className="flex items-center gap-4 text-[11px] text-slate-600 pt-1">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={newIsMandatory}
              onChange={(e) => setNewIsMandatory(e.target.checked)}
              className="rounded border-slate-300 accent-[#0a4d8c]"
            />
            <span className="font-normal text-slate-700">
              Tandai sebagai syarat wajib
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
