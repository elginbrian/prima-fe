"use client";

import { useState, useMemo } from "react";
import { CheckSquare, AlertTriangle, ShieldAlert } from "lucide-react";
import { ActionPriority, ActionSource } from "@/types";
import { ActionFilterBar } from "@/components/widgets/next-action/ActionFilterBar";
import { ActionStats } from "@/components/widgets/stats/ActionStats";
import { ActionRow } from "@/components/widgets/next-action/ActionRow";
import { TablePagination } from "@/components/widgets/TablePagination";
import { nextSortDirection, sortRecords, SortableTableHeader, SortDirection } from "@/components/widgets/SortableTableHeader";
import { useActions } from "@/lib/query/hooks/procurement/useActions";
import { useEvaluateSla } from "@/lib/query/hooks";
import { useToast } from "@/components/ui/Toast";
import { getErrorMessage } from "@/lib/api/errors";
import { exportActionsToCsv } from "@/lib/exportUtils";

export default function NextActionPage() {
  const { data: actions = [], isLoading } = useActions();
  const evaluateSlaMutation = useEvaluateSla();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<ActionSource | "All">("All");
  const [priorityFilter, setPriorityFilter] = useState<ActionPriority | "All">("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sort, setSort] = useState<{ key: "title" | "source" | "assignee" | "dueDate" | "status"; direction: SortDirection }>({ key: "title", direction: null });

  const escalatedCount = actions.filter(d => d.actionType === "Eskalasi" || d.title.includes("[ESKALASI MANAJER]")).length;
  const highCount = actions.filter(d => d.priority === "High").length;
  const mediumCount = actions.filter(d => d.priority === "Medium").length;
  const lowCount = actions.filter(d => d.priority === "Low").length;
  const totalCount = actions.length;
  
  const highPct = totalCount ? (highCount / totalCount) * 100 : 0;
  const mediumPct = totalCount ? (mediumCount / totalCount) * 100 : 0;

  const handleSyncSla = async () => {
    try {
      const res = await evaluateSlaMutation.mutateAsync();
      const d = res.data;
      toast.success(`Evaluasi SLA Selesai: ${d.total_evaluated} tugas dievaluasi (${d.on_track} On Track, ${d.at_risk} At Risk, ${d.overdue} Overdue, ${d.escalated} Dieskalasi).`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal menjalankan sinkronisasi SLA"));
    }
  };

  const [prevFilters, setPrevFilters] = useState({ searchQuery, sourceFilter, priorityFilter });
  if (searchQuery !== prevFilters.searchQuery || sourceFilter !== prevFilters.sourceFilter || priorityFilter !== prevFilters.priorityFilter) {
    setPrevFilters({ searchQuery, sourceFilter, priorityFilter });
    setCurrentPage(1);
  }

  const filteredActions = useMemo(() => {
    return actions.filter((item) => {
      const matchesSearch = item.referenceId.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (item.assignee?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSource = sourceFilter === "All" || item.source === sourceFilter;
      const matchesPriority = priorityFilter === "All" || item.priority === priorityFilter;
      
      return matchesSearch && matchesSource && matchesPriority;
    });
  }, [actions, searchQuery, sourceFilter, priorityFilter]);

  const sortedActions = useMemo(() => sortRecords(filteredActions, sort.direction, item => {
    if (sort.key === "assignee") return item.assignee?.name || "";
    return item[sort.key];
  }), [filteredActions, sort]);
  const totalPages = Math.ceil(sortedActions.length / itemsPerPage);
  
  const paginatedActions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedActions.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedActions, currentPage, itemsPerPage]);
  const toggleSort = (key: typeof sort.key) => setSort(current => ({ key, direction: current.key === key ? nextSortDirection(current.direction) : "asc" }));

  return (
    <div className="space-y-6 pb-12">
      <ActionStats
        totalCount={totalCount}
        highCount={highCount}
        mediumCount={mediumCount}
        lowCount={lowCount}
        highPct={highPct}
        mediumPct={mediumPct}
      />

      {/* Managerial Escalation Alert Banner */}
      {escalatedCount > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-xs shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
              <ShieldAlert size={20} />
            </div>
            <div>
              <p className="font-semibold text-rose-900">
                Perhatian: Terdapat {escalatedCount} Tindak Lanjut dalam Status Eskalasi Manajerial
              </p>
              <p className="text-rose-700">
                Batas toleransi SLA terlampaui. Tugas-tugas ini memerlukan persetujuan arahan dan pengisian Action Recovery Plan.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPriorityFilter(priorityFilter === "High" ? "All" : "High")}
            className="shrink-0 rounded-lg bg-rose-600 px-3 py-1.5 font-medium text-white shadow hover:bg-rose-700 transition-colors"
          >
            {priorityFilter === "High" ? "Tampilkan Semua" : "Filter Eskalasi Prioritas"}
          </button>
        </div>
      )}

      {/* Search and Filter */}
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

      {/* Actions List (Table Layout) */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <SortableTableHeader label="Tindakan & Ref" direction={sort.key === "title" ? sort.direction : null} onClick={() => toggleSort("title")} />
                <SortableTableHeader label="Sumber & Tipe" direction={sort.key === "source" ? sort.direction : null} onClick={() => toggleSort("source")} />
                <SortableTableHeader label="Assignee" direction={sort.key === "assignee" ? sort.direction : null} onClick={() => toggleSort("assignee")} />
                <SortableTableHeader label="Batas Waktu" direction={sort.key === "dueDate" ? sort.direction : null} onClick={() => toggleSort("dueDate")} />
                <SortableTableHeader label="Status" direction={sort.key === "status" ? sort.direction : null} onClick={() => toggleSort("status")} />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">{isLoading ? (<tr><td colSpan={5}><div className="flex justify-center p-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1d4ed8]/20 border-t-[#1d4ed8]" /></div></td></tr>) : paginatedActions.length > 0 ? (
                paginatedActions.map((item) => (
                  <ActionRow key={item.id} item={item} />
                ))
              ) : (
                <tr>
                  <td colSpan={5}>
                    <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                      <CheckSquare size={48} className="text-slate-300 mb-4" />
                      <p className="text-lg font-medium text-slate-700">Semua tindakan sudah selesai!</p>
                      <p className="text-sm">Tidak ada tugas yang menunggu saat ini.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          <TablePagination 
            currentPage={currentPage}
            totalPages={Math.max(totalPages, 1)}
            totalItems={filteredActions.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            itemName="tindakan"
          />
        </div>
      </div>
    </div>
  );
}
