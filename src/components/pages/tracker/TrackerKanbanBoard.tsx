import { GripVertical, AlertCircle, Clock, Eye } from "lucide-react";
import { TrackerItem, TrackerStage } from "./types";
import { calculateDaysBetween } from "@/lib/utils";
import { TrackerStatsPanel } from "./TrackerStatsPanel";

import { TrackerKanbanBoardProps } from "./types";
const COLUMNS: { id: TrackerStage; title: string; color: string; bg: string; border: string; headerBg: string }[] = [
  { id: "On Going", title: "On Going", color: "text-white", bg: "bg-white", border: "border-slate-200", headerBg: "bg-[#0a4d8c]" },
  { id: "On Hold", title: "On Hold", color: "text-white", bg: "bg-white", border: "border-slate-200", headerBg: "bg-[#0a4d8c]" },
  { id: "Batal", title: "Batal", color: "text-white", bg: "bg-white", border: "border-slate-200", headerBg: "bg-[#0a4d8c]" },
];

export function TrackerKanbanBoard({
  totalItemsCount, onGoingCount, onHoldCount, cancelledCount, itemsByStage, timeStatusMap,
  expandedCardId, setExpandedCardId, handleDragStart, handleDragOver, handleDrop, openRequestDetail, onAddRequest
}: TrackerKanbanBoardProps) {
  return (
    <div className="h-[calc(100vh-240px)] min-h-[600px] overflow-x-auto overflow-y-hidden pb-1 hide-scrollbar">
      <div className="flex h-full min-w-[1080px] gap-5 pb-1">
        {/* Statistics Panel (reusable) */}
        <div className="flex w-[280px] shrink-0 flex-col">
          <TrackerStatsPanel
            totalItemsCount={totalItemsCount}
            onGoingCount={onGoingCount}
            onHoldCount={onHoldCount}
            cancelledCount={cancelledCount}
            onAddRequest={onAddRequest}
          />
        </div>

        {COLUMNS.map(col => (
          <div 
            key={col.id} 
            className={`flex min-w-0 flex-1 flex-col rounded-xl border ${col.border} ${col.bg} overflow-hidden`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            {/* Column Header */}
            <div className={`flex items-center justify-between px-4 py-2.5 border-b border-[#093e6f] shrink-0 ${col.headerBg}`}>
              <div className="flex items-center gap-2">
                <h3 className={`font-bold text-[13px] uppercase tracking-wider ${col.color}`}>{col.title}</h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white shadow-sm text-[#0a4d8c]">
                  {itemsByStage[col.id].length}
                </span>
              </div>
            </div>

            {/* Column Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-12 hide-scrollbar">
              {itemsByStage[col.id].map(item => (
                <div 
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  onClick={() => setExpandedCardId(expandedCardId === item.id ? null : item.id)}
                  className={`bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-[#0a4d8c]/30 ${expandedCardId === item.id ? "p-4 ring-2 ring-blue-100" : "px-3 py-2.5"}`}
                >
                  <div className={`flex items-start justify-between ${expandedCardId === item.id ? "mb-2" : "mb-1"}`}>
                    <div className="text-[11px] font-medium text-slate-400 tracking-wider">{item.id}</div>
                    <GripVertical size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  <h4 className={`font-semibold text-slate-800 text-[13px] leading-snug line-clamp-2 ${expandedCardId === item.id ? "mb-3" : ""}`}>
                    {item.title}
                  </h4>
                  {expandedCardId === item.id && <div className="flex flex-col gap-2 mb-4 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">PIC</span>
                      <span className="font-medium text-slate-700 truncate max-w-[120px] text-right">{item.pic?.name || "-"}</span>
                    </div>

                  <div className="mb-3 rounded-lg border border-blue-100 bg-blue-50/60 px-2.5 py-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[#0a4d8c]">Tahap Berita Acara</div>
                    <div className="mt-0.5 text-[11px] font-medium leading-snug text-slate-700">{item.currentStep}</div>
                  </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Nilai</span>
                      <span className="font-semibold text-[#0a4d8c]">{item.amount}</span>
                    </div>
                  </div>}
                  
                  {expandedCardId === item.id && <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                    {item.operationalStatus === "Batal" ? (
                      <div className="flex items-center gap-1.5 text-red-600 text-[11px] font-semibold">
                        <AlertCircle size={14} />
                        <span>Dibatalkan</span>
                      </div>
                    ) : item.operationalStatus === "On Hold" ? (
                      <div className="flex items-center gap-1.5 text-amber-700 text-[11px] font-semibold">
                        <Clock size={14} />
                        <span>Ditahan</span>
                      </div>
                    ) : item.isUrgent ? (
                      <div className="flex items-center gap-1.5 text-red-700 text-[11px] font-medium bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                        <AlertCircle size={14} />
                        <span>Urgent ({calculateDaysBetween(item.stageStartedAt)} hr)</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium">
                        <Clock size={14} />
                        <span>{calculateDaysBetween(item.stageStartedAt)} hr di tahap ini</span>
                      </div>
                    )}
                    
                    {timeStatusMap[item.id] && item.operationalStatus !== "Batal" && (
                      <div className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        timeStatusMap[item.id] === 'Overdue'
                          ? 'bg-red-50 text-red-600 border-red-200'
                          : timeStatusMap[item.id] === 'At Risk'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        <Clock size={10} />
                        {timeStatusMap[item.id]}
                      </div>
                    )}
                    </div>
                    <button 
                      onClick={(event) => { event.stopPropagation(); openRequestDetail(item.id); }}
                      title="Buka detail pekerjaan"
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition-colors hover:border-[#0a4d8c] hover:bg-blue-50 hover:text-[#0a4d8c]"
                    >
                      <Eye size={13} />
                      <span>Buka Detail</span>
                    </button>
                  </div>}
                </div>
              ))}
              
              {itemsByStage[col.id].length === 0 && (
                <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-300/50 rounded-xl bg-white/30">
                  <span className="text-xs text-slate-400 font-medium">Kosong</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
