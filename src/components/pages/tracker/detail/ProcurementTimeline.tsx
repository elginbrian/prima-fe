import React from "react";
import { CheckCircle2, CalendarClock, ChevronDown, ChevronRight, FileText } from "lucide-react";
import { DocumentPreviewModal } from "@/components/widgets/modals/DocumentPreviewModal";
import type { ProcurementMilestone, DeadlineItem } from "@/types";
import { getDeadlineTiming } from "@/lib/deadlineUtils";
import { formatDateIndo } from "@/lib/utils";

interface ProcurementTimelineProps {
  stage?: string;
  milestones: ProcurementMilestone[];
  visibleMilestones: ProcurementMilestone[];
  timelineStart: number;
  slas: (DeadlineItem & { daysRemaining?: number })[];
  expandedRelatedId: string | null;
  setExpandedRelatedId: React.Dispatch<React.SetStateAction<string | null>>;
  showFullTimeline: boolean;
  setShowFullTimeline: (val: boolean) => void;
  hasHiddenMilestones: boolean;
  onAddSla: () => void;
  onEditSla: (id: string) => void;
}

export function ProcurementTimeline({
  stage,
  milestones,
  visibleMilestones,
  timelineStart,
  slas,
  expandedRelatedId,
  setExpandedRelatedId,
  showFullTimeline,
  setShowFullTimeline,
  hasHiddenMilestones,
  onAddSla,
  onEditSla,
}: ProcurementTimelineProps) {
  const [previewDoc, setPreviewDoc] = React.useState<{ id: string; title: string } | null>(null);

  return (
    <section>
      <div className="flex items-end justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h4 className="text-sm font-bold text-slate-800">Timeline proses procurement</h4>
          <p className="mt-1 text-xs text-slate-500">
            Status setiap tahap Berita Acara dan deliverable terkait.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-[#0a4d8c]">
          {stage ?? "-"}
        </span>
      </div>
      <div className="relative mt-5 space-y-1">
        <div className="absolute bottom-5 left-[15px] top-5 w-px bg-slate-200" />
        {visibleMilestones.map((milestone, index) => {
          const milestoneIndex = timelineStart + index;
          const isDone = milestone.status === "Done";
          const isCurrent = milestone.status === "In Progress";
          const milestoneSlas = slas.filter(
            (sla) => sla.milestone?.trim().toLowerCase() === milestone.step?.trim().toLowerCase()
          );
          return (
            <div key={milestone.id} className="relative flex gap-4 py-2">
              <div
                className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-4 border-white text-[11px] font-bold ${
                  isDone
                    ? "bg-[#0a4d8c] text-white"
                    : isCurrent
                    ? "bg-[#0a4d8c] text-white ring-4 ring-blue-100"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {isDone ? <CheckCircle2 size={15} /> : milestoneIndex + 1}
              </div>
              <div
                className={`min-w-0 flex-1 rounded-lg border px-3 py-2.5 ${
                  isCurrent
                    ? "border-blue-200 bg-blue-50/60"
                    : isDone
                    ? "border-slate-200 bg-slate-50/60"
                    : "border-slate-100 bg-white"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`text-sm font-semibold ${
                      isCurrent ? "text-[#0a4d8c]" : "text-slate-700"
                    }`}
                  >
                    {milestone.step}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      isDone
                        ? "text-[#0a4d8c]"
                        : isCurrent
                        ? "text-[#0a4d8c]"
                        : "text-slate-400"
                    }`}
                  >
                    {isDone ? "Selesai" : isCurrent ? "Sedang berjalan" : "Berikutnya"}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500">
                  {milestone.date && <span>{formatDateIndo(milestone.date)}</span>}
                  {milestone.date && milestone.pic && <span>•</span>}
                  {milestone.pic && <span>PIC: {milestone.pic.name}</span>}
                  {milestone.documentId && (
                    <button
                      type="button"
                      onClick={() => setPreviewDoc({ id: milestone.documentId!, title: `${milestone.step} - Dokumen` })}
                      className="inline-flex items-center gap-1 font-semibold text-[#0a4d8c] hover:underline hover:text-blue-700 transition"
                    >
                      <FileText size={12} className="shrink-0" />
                      <span>Dokumen tertaut: {milestone.documentId}</span>
                    </button>
                  )}
                </div>

                {milestoneSlas.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {milestoneSlas.map((s) => {
                      const targetStr = s.targetDate ? formatDateIndo(s.targetDate) : "-";
                      const startStr = s.startDate ? formatDateIndo(s.startDate) : "-";
                      const timing = s.daysRemaining !== undefined && s.status
                        ? { daysRemaining: s.daysRemaining, status: s.status }
                        : getDeadlineTiming(s);

                      return (
                        <div
                          key={s.id}
                          className="overflow-hidden rounded-md border border-slate-200 bg-white/60"
                        >
                          <button
                            onClick={() =>
                              setExpandedRelatedId((current) =>
                                current === `sla-${s.id}` ? null : `sla-${s.id}`
                              )
                            }
                            className="flex w-full items-center justify-between gap-3 px-2.5 py-2 text-left transition hover:bg-white"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <CalendarClock size={14} className="text-slate-400" />
                                <span className="truncate text-xs font-semibold text-slate-700">
                                  {s.taskName}
                                </span>
                              </div>
                              <div className="mt-1 text-[11px] text-slate-500">
                                PIC: {s.pic.name} • Target: {targetStr}
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                                  timing.status === "On Track" || timing.status === "Selesai"
                                    ? "bg-blue-50 text-[#0a4d8c] border-blue-200"
                                    : timing.status === "At Risk"
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-red-50 text-red-700 border-red-200"
                                }`}
                              >
                                {timing.status === "Selesai"
                                  ? "Selesai"
                                  : timing.daysRemaining < 0 || timing.status === "Overdue"
                                  ? `${Math.abs(timing.daysRemaining)} hari lewat`
                                  : timing.daysRemaining === 0
                                  ? "Hari ini"
                                  : `${timing.daysRemaining} hari sisa`}
                              </span>
                              {expandedRelatedId === `sla-${s.id}` ? (
                                <ChevronDown size={14} className="text-slate-400" />
                              ) : (
                                <ChevronRight size={14} className="text-slate-400" />
                              )}
                            </div>
                          </button>
                          {expandedRelatedId === `sla-${s.id}` && (
                            <div className="border-t border-slate-100 bg-slate-50 px-3 py-3 text-[11px] text-slate-600">
                              <div>
                                <span className="font-semibold">SLA:</span> {startStr} s.d.{" "}
                                {targetStr} • Urgensi: {s.urgencyLevel}
                              </div>
                              {timing.status === "Overdue" && s.overdueReason && (
                                <div className="mt-1 text-red-600 font-medium">
                                  Alasan telat: {s.overdueReason}
                                </div>
                              )}
                            {s.nextAction && (
                              <div className="mt-1">
                                <span className="font-semibold text-[#0a4d8c]">Next Action:</span>{" "}
                                {s.nextAction}
                              </div>
                            )}
                            <button
                              onClick={() => onEditSla(s.id)}
                              className="mt-2 text-[#0a4d8c] font-semibold hover:underline"
                            >
                              Edit SLA
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                )}
                {!isDone && (
                  <button
                    type="button"
                    onClick={onAddSla}
                    className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-blue-200 bg-blue-50/50 py-2.5 text-[11px] font-bold text-[#0a4d8c] transition hover:bg-blue-100/50"
                  >
                    + Tambah SLA di tahapan ini
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {hasHiddenMilestones && (
        <button
          type="button"
          onClick={() => setShowFullTimeline(true)}
          className="mt-4 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0a4d8c]"
        >
          Tampilkan {milestones.length - visibleMilestones.length} tahapan lainnya
        </button>
      )}
      {showFullTimeline && milestones.length > 3 && (
        <button
          type="button"
          onClick={() => setShowFullTimeline(false)}
          className="mt-4 text-xs font-semibold text-[#0a4d8c] hover:underline"
        >
          Ringkas timeline
        </button>
      )}
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
