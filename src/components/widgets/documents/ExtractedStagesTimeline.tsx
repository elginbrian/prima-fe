"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  Sparkles,
  Building2,
  Wallet,
  Layers,
  Edit3,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check,
} from "lucide-react";
import type { ExtractedProject, ExtractedStage } from "@/types/validation";
import { formatRupiah } from "@/lib/utils";

interface ExtractedStagesTimelineProps {
  project: ExtractedProject;
  editable?: boolean;
  onChangeStages?: (stages: ExtractedStage[]) => void;
}

export function ExtractedStagesTimeline({
  project,
  editable = false,
  onChangeStages,
}: ExtractedStagesTimelineProps) {
  const stages = project.stages || [];
  const autoClearedCount = stages.filter((s) => s.auto_cleared).length;
  const [isEditing, setIsEditing] = useState(false);
  const [newStepName, setNewStepName] = useState("");

  const handleRename = (idx: number, step: string) => {
    if (!onChangeStages) return;
    onChangeStages(stages.map((s, i) => (i === idx ? { ...s, step } : s)));
  };

  const handleToggleStatus = (idx: number) => {
    if (!onChangeStages) return;
    const cycle: ExtractedStage["status"][] = ["Pending", "In Progress", "Done"];
    onChangeStages(
      stages.map((s, i) => {
        if (i !== idx) return s;
        const nextStatus = cycle[(cycle.indexOf(s.status) + 1) % cycle.length];
        return {
          ...s,
          status: nextStatus,
          auto_cleared: nextStatus === "Done" ? s.auto_cleared : false,
        };
      })
    );
  };

  const handleMove = (idx: number, dir: -1 | 1) => {
    if (!onChangeStages) return;
    const target = idx + dir;
    if (target < 0 || target >= stages.length) return;
    const copy = [...stages];
    [copy[idx], copy[target]] = [copy[target], copy[idx]];
    onChangeStages(copy);
  };

  const handleDelete = (idx: number) => {
    if (!onChangeStages) return;
    onChangeStages(stages.filter((_, i) => i !== idx));
  };

  const handleAddStage = () => {
    const trimmed = newStepName.trim();
    if (!trimmed || !onChangeStages) return;
    onChangeStages([
      ...stages,
      {
        step: trimmed,
        status: "Pending",
        auto_cleared: false,
        notes: null,
      },
    ]);
    setNewStepName("");
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Sparkles size={15} className="text-[#0a4d8c]" />
            Ekstraksi Proyek & Tahapan Pekerjaan
          </h3>
          <p className="text-xs font-normal text-slate-500">
            AI memetakan pekerjaan dan tahapan — dapat disesuaikan sebelum diterbitkan
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {autoClearedCount > 0 && (
            <span className="text-xs font-normal text-[#0a4d8c] bg-[#e8f2fc] px-3 py-1 rounded-full border border-[#0a4d8c]/20 flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-[#0a4d8c]" />
              {autoClearedCount} Selesai Otomatis
            </span>
          )}
          {editable && onChangeStages && (
            <button
              type="button"
              onClick={() => setIsEditing((prev) => !prev)}
              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                isEditing
                  ? "border-[#0a4d8c] bg-[#0a4d8c] text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-[#0a4d8c] hover:text-[#0a4d8c]"
              }`}
            >
              {isEditing ? <Check size={12} /> : <Edit3 size={12} />}
              <span>{isEditing ? "Selesai Edit" : "Edit Tahapan"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Consolidated Project Meta Strip */}
      <div className="rounded-lg border border-slate-200 bg-slate-50/70 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
        <div className="p-3 space-y-0.5">
          <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Layers size={11} className="text-[#0a4d8c]" />
            Judul Proyek
          </div>
          <div className="text-xs font-medium text-slate-800 break-words">
            {project.title}
          </div>
        </div>

        <div className="p-3 space-y-0.5">
          <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Wallet size={11} className="text-[#0a4d8c]" />
            Estimasi Nilai / HPS
          </div>
          <div className="text-xs font-medium text-[#0a4d8c]">
            {project.estimated_amount > 0
              ? formatRupiah(project.estimated_amount)
              : "Sesuai Pagu KAK"}
          </div>
        </div>

        <div className="p-3 space-y-0.5">
          <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Building2 size={11} className="text-[#0a4d8c]" />
            Metode &amp; Fungsi
          </div>
          <div className="text-xs font-medium text-slate-800">
            {project.suggested_method} ·{" "}
            <span className="text-slate-500 font-normal">
              {project.department_name}
            </span>
          </div>
        </div>
      </div>

      {/* Unified Stages Stepper */}
      <div className="space-y-2.5 pt-1">
        <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
          Alur Tahapan Pekerjaan ({stages.length} Tahapan)
        </div>

        <div className="rounded-lg border border-slate-200 divide-y divide-slate-100 bg-white overflow-hidden">
          {stages.map((stage, idx) => {
            const isDone = stage.status === "Done" || stage.auto_cleared;
            const isInProgress = stage.status === "In Progress";

            return (
              <div
                key={idx}
                className={`flex items-start gap-3 px-3.5 py-2.5 transition-colors ${
                  stage.auto_cleared
                    ? "bg-slate-50/70"
                    : isInProgress
                    ? "bg-[#f4f8fd]"
                    : "bg-white"
                }`}
              >
                <div className="pt-0.5 shrink-0">
                  {stage.auto_cleared || isDone ? (
                    <div className="h-6 w-6 rounded-full bg-[#e8f2fc] text-[#0a4d8c] flex items-center justify-center text-xs">
                      <CheckCircle2 size={14} />
                    </div>
                  ) : isInProgress ? (
                    <div className="h-6 w-6 rounded-full bg-[#0a4d8c] text-white flex items-center justify-center text-xs">
                      <Clock size={13} />
                    </div>
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-normal text-xs">
                      {idx + 1}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {isEditing ? (
                      <input
                        type="text"
                        value={stage.step}
                        onChange={(e) => handleRename(idx, e.target.value)}
                        className="flex-1 min-w-[160px] rounded border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-800 focus:border-[#0a4d8c] focus:outline-none"
                      />
                    ) : (
                      <span className="text-xs font-medium text-slate-800 break-words">
                        {stage.step}
                      </span>
                    )}

                    <div className="flex items-center gap-1.5">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(idx)}
                            className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-[#0a4d8c] hover:bg-[#e8f2fc]"
                            title="Klik untuk mengganti status tahap"
                          >
                            {isDone ? "Selesai" : isInProgress ? "Aktif" : "Menunggu"}
                          </button>
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMove(idx, -1)}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                            title="Geser ke atas"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            type="button"
                            disabled={idx === stages.length - 1}
                            onClick={() => handleMove(idx, 1)}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                            title="Geser ke bawah"
                          >
                            <ArrowDown size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(idx)}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            title="Hapus tahapan"
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      ) : stage.auto_cleared ? (
                        <span className="text-[10px] font-normal text-[#0a4d8c] bg-[#e8f2fc] px-2.5 py-0.5 rounded-full border border-[#0a4d8c]/20 flex items-center gap-1">
                          <Sparkles size={10} />
                          Selesai Otomatis
                        </span>
                      ) : isInProgress ? (
                        <span className="text-[10px] font-normal text-white bg-[#0a4d8c] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Clock size={10} />
                          Tahap Aktif
                        </span>
                      ) : (
                        <span className="text-[10px] font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          Menunggu
                        </span>
                      )}
                    </div>
                  </div>
                  {stage.notes && (
                    <p className="text-[11px] font-normal text-slate-500">
                      {stage.notes}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {isEditing && (
          <div className="flex gap-2 pt-1">
            <input
              type="text"
              value={newStepName}
              onChange={(e) => setNewStepName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddStage();
                }
              }}
              placeholder="Tambah tahapan pekerjaan baru..."
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-normal text-slate-800 placeholder:text-slate-400 focus:border-[#0a4d8c] focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddStage}
              disabled={!newStepName.trim()}
              className="inline-flex items-center gap-1 rounded-lg bg-[#0a4d8c] px-3 py-2 text-xs font-medium text-white hover:bg-[#083b6c] disabled:opacity-50"
            >
              <Plus size={13} />
              <span>Tambah</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
