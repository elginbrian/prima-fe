import {
  GripVertical,
  Clock,
  ArrowRight,
  PauseCircle,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { TrackerStage, TrackerKanbanBoardProps } from "./types";
import { formatRupiah, formatRequestCode } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/UserAvatar";

const COLUMNS: {
  id: TrackerStage;
  title: string;
  color: string;
  bg: string;
  border: string;
  headerBg: string;
}[] = [
  {
    id: "On Going",
    title: "Berjalan (On Going)",
    color: "text-white",
    bg: "bg-white",
    border: "border-slate-200",
    headerBg: "bg-[#0a4d8c]",
  },
  {
    id: "On Hold",
    title: "Ditunda (On Hold)",
    color: "text-white",
    bg: "bg-white",
    border: "border-slate-200",
    headerBg: "bg-[#0a4d8c]",
  },
  {
    id: "Batal",
    title: "Dibatalkan",
    color: "text-white",
    bg: "bg-white",
    border: "border-slate-200",
    headerBg: "bg-[#0a4d8c]",
  },
];

export function TrackerKanbanBoard({
  itemsByStage,
  timeStatusMap,
  documentsMap = {},
  guaranteesMap = {},
  handleDragStart,
  handleDragOver,
  handleDrop,
  openRequestDetail,
}: TrackerKanbanBoardProps) {
  const nonEmptyColumnsCount = COLUMNS.filter((c) => itemsByStage[c.id].length > 0).length;

  return (
    <div className="min-h-[480px] overflow-x-auto pb-2 hide-scrollbar">
      <div className="flex min-w-[860px] items-start gap-4">
        {COLUMNS.map((col) => {
          const colItems = itemsByStage[col.id];
          const isEmpty = colItems.length === 0;
          const useTwoColCards = !isEmpty && nonEmptyColumnsCount === 1 && colItems.length > 1;

          return (
            <div
              key={col.id}
              className={`flex flex-col rounded-xl border ${col.border} ${col.bg} overflow-hidden shadow-2xs transition-all ${
                isEmpty ? "w-[220px] shrink-0" : "min-w-0 flex-1"
              }`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              {/* Column Header */}
              <div
                className={`flex items-center justify-between px-4 py-2.5 border-b border-[#093e6f] shrink-0 ${col.headerBg}`}
              >
                <div className="flex items-center gap-2">
                  <h3 className={`font-medium text-xs uppercase tracking-wider ${col.color}`}>
                    {col.title}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-white shadow-2xs text-[#0a4d8c]">
                    {colItems.length}
                  </span>
                </div>
              </div>

              {/* Column Body */}
              <div
                className={`p-3.5 ${
                  useTwoColCards
                    ? "grid grid-cols-1 md:grid-cols-2 gap-3.5"
                    : "space-y-3"
                }`}
              >
                {colItems.map((item) => {
                  const docInfo = documentsMap[item.id] || { total: 0, valid: 0 };
                  const guarInfo = guaranteesMap[item.id] || { total: 0, active: 0, warning: 0 };

                  return (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.id)}
                      onClick={() => openRequestDetail(item.id)}
                      className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer group hover:border-[#0a4d8c]/40 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              title={item.id}
                              className="text-[11px] font-mono font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200"
                            >
                              {formatRequestCode(item.id)}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {item.department?.name}
                            </span>
                            {item.operationalStatus === "On Hold" && (
                              <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-normal text-slate-600 border border-slate-200">
                                <PauseCircle size={10} className="text-slate-400" />
                                <span>SLA Dijeda</span>
                              </span>
                            )}
                          </div>
                          <GripVertical
                            size={14}
                            className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          />
                        </div>

                        <h4 className="font-medium text-slate-800 text-sm leading-snug line-clamp-2 mb-2.5 group-hover:text-[#0a4d8c] transition-colors">
                          {item.title}
                        </h4>

                        <div className="flex flex-wrap items-center gap-1.5 mb-3">
                          {docInfo.total > 0 && (
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-normal ${
                                docInfo.valid === docInfo.total
                                  ? "border-blue-200 bg-blue-50 text-[#0a4d8c]"
                                  : "border-slate-200 bg-slate-50 text-slate-600"
                              }`}
                            >
                              <FileText size={10} />
                              <span>
                                {docInfo.valid}/{docInfo.total} Dok
                              </span>
                            </span>
                          )}

                          {guarInfo.total > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-normal text-slate-600">
                              <ShieldCheck size={10} className="text-[#0a4d8c]" />
                              <span>{guarInfo.total} Jaminan</span>
                            </span>
                          )}

                          {timeStatusMap[item.id] && item.operationalStatus !== "Batal" && (
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-normal px-2 py-0.5 rounded-full border ${
                                timeStatusMap[item.id] === "Overdue"
                                  ? "bg-blue-50 text-[#0a4d8c] border-blue-200"
                                  : "bg-slate-50 text-slate-600 border-slate-200"
                              }`}
                            >
                              <Clock size={10} />
                              {timeStatusMap[item.id] === "Overdue"
                                ? "SLA Terlambat"
                                : timeStatusMap[item.id] === "At Risk"
                                ? "SLA Mendekati"
                                : "Sesuai Jadwal"}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-[11px] font-normal text-slate-600 mb-1">
                            <UserAvatar name={item.pic?.name} userId={item.pic?.id} size="xs" />
                            <span className="truncate">{item.pic?.name || "-"}</span>
                          </div>
                          <div className="text-[11px] font-normal text-slate-500 truncate">
                            {item.currentStep} · <span className="text-slate-700">{formatRupiah(item.amount)}</span>
                          </div>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-normal text-slate-600 group-hover:border-[#0a4d8c] group-hover:text-[#0a4d8c] transition-colors">
                          <span>Detail</span>
                          <ArrowRight size={12} />
                        </span>
                      </div>
                    </div>
                  );
                })}

                {isEmpty && (
                  <div className="h-32 flex items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <span className="text-xs text-slate-400 font-medium">Tidak ada pekerjaan</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

