import React from "react";
import type { HistoryItem } from "@/types";
import type { ProcurementActivityDto } from "@/lib/api/procurement.api";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDateTimeIndo } from "@/lib/utils";

interface ActivityLogProps {
  activities?: ProcurementActivityDto[];
  history: HistoryItem[];
  isLoading?: boolean;
}

export function ActivityLog({ activities, history, isLoading }: ActivityLogProps) {
  const totalCount = activities ? activities.length : history.length;

  return (
    <section>
      <div className="flex items-end justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h4 className="text-sm font-bold text-slate-800">Log Audit & Histori Aktivitas</h4>
          <p className="mt-1 text-xs text-slate-500">
            Jejak audit resmi: perubahan tahap, penundaan (On Hold), dan deliverable pengadaan.
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-[#0a4d8c]">
          {isLoading ? "Memuat..." : `${totalCount} aktivitas`}
        </span>
      </div>

      {isLoading ? (
        <div className="relative mt-4 space-y-4 border-l-2 border-slate-200 pl-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5 py-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-64" />
            </div>
          ))}
        </div>
      ) : activities && activities.length > 0 ? (
        <div className="relative mt-4 space-y-4 border-l-2 border-slate-200 pl-5">
          {activities.map((act) => {
            const actionBadge =
              act.action === "CREATE"
                ? {
                    label: "Pengadaan Dibuat",
                    bg: "bg-blue-50 text-[#0a4d8c] border-blue-200",
                    dot: "bg-[#0a4d8c]",
                  }
                : act.action === "HANDOVER_PIC"
                ? {
                    label: `Handover PIC: ${act.new_state}`,
                    bg: "bg-blue-50 text-[#0a4d8c] border-blue-200 font-semibold",
                    dot: "bg-[#0a4d8c]",
                  }
                : act.action === "MOVE_STEP_OVERRIDE"
                ? {
                    label: `Override Tahap: ${act.new_state}`,
                    bg: "bg-rose-50 text-rose-700 border-rose-300 font-bold",
                    dot: "bg-rose-500",
                  }
                : act.action === "UPDATE_STATUS"
                ? {
                    label: `Status: ${act.new_state}`,
                    bg: "bg-slate-100 text-slate-700 border-slate-200",
                    dot: "bg-slate-500",
                  }
                : act.action === "MOVE_STAGE"
                ? {
                    label: `Stage: ${act.new_state}`,
                    bg: "bg-blue-50 text-blue-700 border-blue-200",
                    dot: "bg-[#0a4d8c]",
                  }
                : {
                    label: `Langkah: ${act.new_state}`,
                    bg: "bg-blue-50 text-[#0a4d8c] border-blue-100 font-medium",
                    dot: "bg-[#0a4d8c]",
                  };

            return (
              <div key={act.id} className="relative group">
                <span
                  className={`absolute -left-[27px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm ${actionBadge.dot}`}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${actionBadge.bg}`}
                  >
                    {actionBadge.label}
                  </span>
                  {act.user_name && (
                    <span className="text-[11px] font-semibold text-slate-700">
                      oleh {act.user_name}
                    </span>
                  )}
                  <time className="text-[10px] text-slate-400">
                    {act.created_at ? formatDateTimeIndo(act.created_at) : "-"}
                  </time>
                </div>
                {act.notes && (
                  <p className="mt-1 text-xs text-slate-600 bg-slate-50/80 p-2 rounded-lg border border-slate-100">
                    {act.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : history.length > 0 ? (
        <div className="relative mt-4 space-y-4 border-l border-slate-200 pl-5">
          {history.map((item) => (
            <div key={item.id} className="relative">
              <span
                className={`absolute -left-[25px] top-1.5 h-3 w-3 rounded-full border-2 border-white ${
                  item.category === "SLA"
                    ? "bg-[#0a4d8c]"
                    : item.category === "Jaminan"
                    ? "bg-[#0a4d8c]"
                    : item.category === "Dokumen"
                    ? "bg-blue-400"
                    : "bg-slate-400"
                }`}
              />
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-800">{item.title}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                  {item.category}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600">{item.description}</p>
              <time className="mt-1 block text-[10px] text-slate-400">
                {formatDateTimeIndo(item.createdAt)}
              </time>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
          Belum ada aktivitas yang tercatat untuk pekerjaan ini.
        </div>
      )}
    </section>
  );
}
