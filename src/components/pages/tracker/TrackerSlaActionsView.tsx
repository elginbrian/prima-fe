"use client";

import { useState, useMemo } from "react";
import { CheckSquare, ShieldAlert, ListTodo, Clock } from "lucide-react";
import { ActionPriority, ActionSource, DeadlineItem, ProcurementRequest } from "@/types";
import { ActionFilterBar } from "@/components/widgets/next-action/ActionFilterBar";
import { ActionRow } from "@/components/widgets/next-action/ActionRow";
import { TablePagination } from "@/components/widgets/TablePagination";
import {
  nextSortDirection,
  sortRecords,
  SortableTableHeader,
  SortDirection,
} from "@/components/widgets/SortableTableHeader";
import { useActions } from "@/lib/query/hooks/procurement/useActions";
import { useEvaluateSla } from "@/lib/query/hooks";
import { useToast } from "@/components/ui/Toast";
import { TableSkeleton } from "@/components/ui";
import { getErrorMessage } from "@/lib/api/errors";
import { exportActionsToCsv } from "@/lib/exportUtils";
import { TrackerDeadlines } from "./TrackerDeadlines";

interface TrackerSlaActionsViewProps {
  deadlines: (DeadlineItem & { daysRemaining: number })[];
  requests: ProcurementRequest[];
  openRequestDetail: (id: string) => void;
  setEditingDeadlineId: (id: string) => void;
  isLoadingDeadlines?: boolean;
}

export function TrackerSlaActionsView({
  deadlines,
  requests,
  openRequestDetail,
  setEditingDeadlineId,
  isLoadingDeadlines,
}: TrackerSlaActionsViewProps) {
  const { data: actions = [], isLoading: isLoadingActions } = useActions();
  const evaluateSlaMutation = useEvaluateSla();
  const toast = useToast();

  const [subView, setSubView] = useState<"actions" | "deadlines">("actions");
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<ActionSource | "All">("All");
  const [priorityFilter, setPriorityFilter] = useState<ActionPriority | "All">("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sort, setSort] = useState<{
    key: "title" | "source" | "assignee" | "dueDate" | "status";
    direction: SortDirection;
  }>({ key: "title", direction: null });

  const escalatedCount = actions.filter(
    (d) => d.actionType === "Eskalasi" || d.title.includes("[ESKALASI MANAJER]")
  ).length;

  const handleSyncSla = async () => {
    try {
      const res = await evaluateSlaMutation.mutateAsync();
      const d = res.data;
      toast.success(
        `Evaluasi SLA selesai: ${d.total_evaluated} tugas diperiksa (${d.on_track} sesuai jadwal, ${d.overdue} terlambat).`
      );
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal menjalankan sinkronisasi SLA"));
    }
  };

  const filteredActions = useMemo(() => {
    return actions.filter((item) => {
      const matchesSearch =
        item.referenceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.assignee?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSource = sourceFilter === "All" || item.source === sourceFilter;
      const matchesPriority = priorityFilter === "All" || item.priority === priorityFilter;

      return matchesSearch && matchesSource && matchesPriority;
    });
  }, [actions, searchQuery, sourceFilter, priorityFilter]);

  const sortedActions = useMemo(
    () =>
      sortRecords(filteredActions, sort.direction, (item) => {
        if (sort.key === "assignee") return item.assignee?.name || "";
        return item[sort.key];
      }),
    [filteredActions, sort]
  );

  const totalPages = Math.max(1, Math.ceil(sortedActions.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedActions = useMemo(() => {
    const startIndex = (safePage - 1) * itemsPerPage;
    return sortedActions.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedActions, safePage, itemsPerPage]);

  const toggleSort = (key: typeof sort.key) =>
    setSort((current) => ({
      key,
      direction: current.key === key ? nextSortDirection(current.direction) : "asc",
    }));

  return (
    <div className="space-y-4">
      {/* Segmented View Switcher & Escalation Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-2xs self-start">
          <button
            type="button"
            onClick={() => setSubView("actions")}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors focus:outline-none ${
              subView === "actions"
                ? "bg-[#0a4d8c] text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <ListTodo size={14} />
            <span>Daftar Tindak Lanjut ({actions.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSubView("deadlines")}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors focus:outline-none ${
              subView === "deadlines"
                ? "bg-[#0a4d8c] text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Clock size={14} />
            <span>Jadwal Target SLA ({deadlines.length})</span>
          </button>
        </div>

        {escalatedCount > 0 && subView === "actions" && (
          <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50/50 px-3.5 py-2 text-xs text-slate-700">
            <ShieldAlert size={15} className="text-[#0a4d8c] shrink-0" />
            <span>
              Terdapat <strong className="font-medium text-[#0a4d8c]">{escalatedCount} tindak lanjut</strong> dalam eskalasi manajerial.
            </span>
            <button
              type="button"
              onClick={() => setPriorityFilter(priorityFilter === "High" ? "All" : "High")}
              className="shrink-0 rounded-md border border-blue-200 bg-white px-2.5 py-1 text-[11px] font-medium text-[#0a4d8c] hover:bg-blue-50 transition-colors"
            >
              {priorityFilter === "High" ? "Tampilkan Semua" : "Filter Prioritas"}
            </button>
          </div>
        )}
      </div>

      {subView === "actions" ? (
        <div className="space-y-4">
          <ActionFilterBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            sourceFilter={sourceFilter}
            setSourceFilter={setSourceFilter}
            priorityFilter={priorityFilter}
            setPriorityFilter={setPriorityFilter}
            onExport={() => exportActionsToCsv(filteredActions)}
            onSyncSla={handleSyncSla}
            isSyncingSla={evaluateSlaMutation.isPending}
          />

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    <SortableTableHeader
                      label="Tindak Lanjut & Pekerjaan"
                      direction={sort.key === "title" ? sort.direction : null}
                      onClick={() => toggleSort("title")}
                      className="px-5"
                    />
                    <SortableTableHeader
                      label="Sumber"
                      direction={sort.key === "source" ? sort.direction : null}
                      onClick={() => toggleSort("source")}
                    />
                    <SortableTableHeader
                      label="Penanggung Jawab"
                      direction={sort.key === "assignee" ? sort.direction : null}
                      onClick={() => toggleSort("assignee")}
                    />
                    <SortableTableHeader
                      label="Batas Waktu"
                      direction={sort.key === "dueDate" ? sort.direction : null}
                      onClick={() => toggleSort("dueDate")}
                    />
                    <SortableTableHeader
                      label="Status"
                      direction={sort.key === "status" ? sort.direction : null}
                      onClick={() => toggleSort("status")}
                      className="px-5"
                    />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingActions ? (
                    <tr>
                      <td colSpan={5} className="p-0">
                        <TableSkeleton rows={5} columns={5} />
                      </td>
                    </tr>
                  ) : paginatedActions.length > 0 ? (
                    paginatedActions.map((item) => (
                      <ActionRow
                        key={item.id}
                        item={item}
                        onOpenRequestDetail={openRequestDetail}
                      />
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5}>
                        <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                          <CheckSquare size={40} className="text-slate-300 mb-2.5" />
                          <p className="text-sm font-medium text-slate-700">
                            Semua tindak lanjut sudah selesai
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Tidak ada tugas yang menunggu saat ini.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <TablePagination
                currentPage={safePage}
                totalPages={totalPages}
                totalItems={filteredActions.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                itemName="tindakan"
              />
            </div>
          </div>
        </div>
      ) : (
        <TrackerDeadlines
          deadlines={deadlines}
          requests={requests}
          openRequestDetail={openRequestDetail}
          setEditingDeadlineId={setEditingDeadlineId}
          isLoading={isLoadingDeadlines}
        />
      )}
    </div>
  );
}
