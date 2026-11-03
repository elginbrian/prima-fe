import React from "react";
import {
  CheckCircle2,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  FileText,
  Sparkles,
  Plus,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { DocumentPreviewModal } from "@/components/widgets/modals/DocumentPreviewModal";
import type { ProcurementMilestone, DeadlineItem } from "@/types";
import type { GatekeeperCheckDto } from "@/lib/api/procurement.api";
import { getDeadlineTiming } from "@/lib/deadlineUtils";
import { formatDateIndo } from "@/lib/utils";

interface ProcurementTimelineProps {
  stage?: string;
  milestones: ProcurementMilestone[];
  slas: (DeadlineItem & { daysRemaining?: number })[];
  gatekeeperData?: GatekeeperCheckDto | null;
  expandedRelatedId: string | null;
  setExpandedRelatedId: React.Dispatch<React.SetStateAction<string | null>>;
  onAddSla: () => void;
  onEditSla: (id: string) => void;
  onOpenDocsTab?: () => void;
}

export function ProcurementTimeline({
  stage,
  milestones,
  slas,
  gatekeeperData,
  expandedRelatedId,
  setExpandedRelatedId,
  onAddSla,
  onEditSla,
  onOpenDocsTab,
}: ProcurementTimelineProps) {
  const [previewDoc, setPreviewDoc] = React.useState<{ id: string; title: string } | null>(null);

  const gatekeeperNotes = React.useMemo(() => {
    if (!gatekeeperData) return [];
    return [...(gatekeeperData.blockers || []), ...(gatekeeperData.warnings || [])];
  }, [gatekeeperData]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-slate-800">Urutan Tahapan & Jadwal SLA</h4>
            {stage && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-normal text-slate-600 border border-slate-200">
                {stage}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Alur berurutan dari tahap awal hingga selesai beserta target waktu (SLA) di setiap tahapan.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddSla}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-normal text-slate-700 transition hover:border-[#0a4d8c] hover:text-[#0a4d8c]"
        >
          <Plus size={13} className="text-[#0a4d8c]" />
          <span>Tambah Target SLA</span>
        </button>
      </div>

      <div className="relative mt-5 space-y-2.5">
        <div className="absolute bottom-5 left-[15px] top-5 w-px bg-slate-200" />
        {milestones.map((milestone, index) => {
          const isDone = milestone.status === "Done";
          const isCurrent = milestone.status === "In Progress";
          const milestoneSlas = slas.filter(
            (sla) => sla.milestone?.trim().toLowerCase() === milestone.step?.trim().toLowerCase()
          );
          const isAutoCleared =
            isDone &&
            (milestone.notes?.toLowerCase().includes("auto-clear") ||
              milestone.notes?.toLowerCase().includes("otomatis") ||
              milestone.documentId);

          return (
            <div key={milestone.id} className="relative flex gap-3.5 py-1">
              <div
                className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-4 border-white text-[11px] font-medium ${
                  isDone
                    ? "bg-[#0a4d8c] text-white"
                    : isCurrent
                    ? "bg-[#0a4d8c] text-white ring-4 ring-blue-100"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {isDone ? <CheckCircle2 size={14} /> : index + 1}
              </div>

              <div
                className={`min-w-0 flex-1 rounded-xl border px-4 py-3 transition-all ${
                  isCurrent
                    ? "border-[#0a4d8c]/30 bg-blue-50/30"
                    : isDone
                    ? "border-slate-200 bg-slate-50/40"
                    : "border-slate-100 bg-white"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-sm ${
                        isCurrent
                          ? "font-medium text-[#0a4d8c]"
                          : isDone
                          ? "font-medium text-slate-800"
                          : "font-normal text-slate-500"
                      }`}
                    >
                      {milestone.step}
                    </span>
                    {isAutoCleared && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-normal text-[#0a4d8c]">
                        <Sparkles size={10} />
                        <span>Otomatis dari Dokumen</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    {isCurrent && (
                      <button
                        type="button"
                        onClick={onAddSla}
                        className="text-[11px] font-normal text-[#0a4d8c] hover:underline"
                      >
                        + Atur SLA
                      </button>
                    )}
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-normal uppercase tracking-wider ${
                        isDone
                          ? "bg-slate-100 text-slate-600 border border-slate-200"
                          : isCurrent
                          ? "bg-[#0a4d8c] text-white"
                          : "bg-slate-50 text-slate-400 border border-slate-100"
                      }`}
                    >
                      {isDone ? "Selesai" : isCurrent ? "Tahap Aktif" : "Berikutnya"}
                    </span>
                  </div>
                </div>

                {milestone.notes && (
                  <p className="mt-1.5 text-xs text-slate-600 bg-white rounded-lg border border-slate-200/70 px-3 py-1.5 leading-relaxed">
                    {milestone.notes}
                  </p>
                )}

                {/* Inline Prerequisite / Document Notice on Current Step */}
                {isCurrent && gatekeeperNotes.length > 0 && (
                  <div className="mt-2.5 rounded-lg border border-blue-200/80 bg-white px-3 py-2 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <AlertCircle size={14} className="text-[#0a4d8c] shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="font-medium text-slate-700">
                          {gatekeeperNotes[0].title}:{" "}
                        </span>
                        <span className="text-slate-500">{gatekeeperNotes[0].description}</span>
                      </div>
                    </div>
                    {onOpenDocsTab && (
                      <button
                        type="button"
                        onClick={onOpenDocsTab}
                        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-normal text-[#0a4d8c] hover:border-[#0a4d8c] hover:bg-blue-50 transition-colors"
                      >
                        <span>Periksa Dokumen</span>
                        <ArrowRight size={11} />
                      </button>
                    )}
                  </div>
                )}

                {(milestone.date || milestone.pic || milestone.documentId) && (
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500">
                    {milestone.date && <span>Selesai: {formatDateIndo(milestone.date)}</span>}
                    {milestone.date && milestone.pic && <span>•</span>}
                    {milestone.pic && <span>PIC: {milestone.pic.name}</span>}
                    {milestone.documentId && (
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewDoc({
                            id: milestone.documentId!,
                            title: `${milestone.step} - Dokumen`,
                          })
                        }
                        className="inline-flex items-center gap-1 font-normal text-[#0a4d8c] hover:underline"
                      >
                        <FileText size={12} className="shrink-0" />
                        <span>Bukti Dokumen ({milestone.documentId})</span>
                      </button>
                    )}
                  </div>
                )}

                {milestoneSlas.length > 0 && (
                  <div className="mt-2.5 space-y-2">
                    {milestoneSlas.map((s) => {
                      const targetStr = s.targetDate ? formatDateIndo(s.targetDate) : "-";
                      const startStr = s.startDate ? formatDateIndo(s.startDate) : "";
                      const timing =
                        s.daysRemaining !== undefined && s.status
                          ? { daysRemaining: s.daysRemaining, status: s.status }
                          : getDeadlineTiming(s);

                      const isSlaAlert =
                        timing.status === "Overdue" ||
                        timing.status === "At Risk" ||
                        timing.daysRemaining < 0;

                      return (
                        <div
                          key={s.id}
                          className="overflow-hidden rounded-lg border border-slate-200 bg-white"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedRelatedId((current) =>
                                current === `sla-${s.id}` ? null : `sla-${s.id}`
                              )
                            }
                            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition hover:bg-slate-50"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <CalendarClock size={13} className="text-[#0a4d8c]" />
                                <span className="truncate text-xs font-normal text-slate-800">
                                  {s.taskName}
                                </span>
                              </div>
                              <div className="mt-0.5 text-[11px] text-slate-400">
                                Target: {targetStr} • PIC: {s.pic.name}
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <span
                                className={`text-[10px] font-normal px-2.5 py-0.5 rounded-full border ${
                                  isSlaAlert
                                    ? "bg-blue-50 text-[#0a4d8c] border-blue-200"
                                    : "bg-slate-50 text-slate-600 border-slate-200"
                                }`}
                              >
                                {timing.status === "Selesai"
                                  ? "Selesai"
                                  : timing.daysRemaining < 0 || timing.status === "Overdue"
                                  ? `Terlambat ${Math.abs(timing.daysRemaining)} hari`
                                  : timing.daysRemaining === 0
                                  ? "Hari ini"
                                  : `${timing.daysRemaining} hari tersisa`}
                              </span>
                              {expandedRelatedId === `sla-${s.id}` ? (
                                <ChevronDown size={14} className="text-slate-400" />
                              ) : (
                                <ChevronRight size={14} className="text-slate-400" />
                              )}
                            </div>
                          </button>

                          {expandedRelatedId === `sla-${s.id}` && (
                            <div className="border-t border-slate-100 bg-slate-50/70 px-3.5 py-2.5 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
                              <div className="space-y-1">
                                <div>
                                  <span className="text-slate-500">Target Waktu:</span>{" "}
                                  {startStr ? `${startStr} – ${targetStr}` : targetStr}
                                </div>
                                {timing.status === "Overdue" && s.overdueReason && (
                                  <div className="text-slate-700">
                                    Catatan Kendala: {s.overdueReason}
                                  </div>
                                )}
                                {s.nextAction && (
                                  <div>
                                    <span className="text-[#0a4d8c]">Tindak Lanjut:</span>{" "}
                                    {s.nextAction}
                                  </div>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => onEditSla(s.id)}
                                className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-normal text-slate-600 hover:border-[#0a4d8c] hover:text-[#0a4d8c]"
                              >
                                Edit Target SLA
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {previewDoc && (
        <DocumentPreviewModal
          title={previewDoc.title}
          fileId={previewDoc.id}
          fileType="document"
          fileName={previewDoc.id}
          metadata={[
            { label: "Tahapan", value: previewDoc.title },
            { label: "ID Dokumen", value: previewDoc.id },
          ]}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </section>
  );
}
