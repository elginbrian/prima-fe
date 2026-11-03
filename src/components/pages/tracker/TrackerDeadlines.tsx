import { useMemo, useState } from "react";
import { TablePagination } from "@/components/widgets/TablePagination";
import {
  nextSortDirection,
  sortRecords,
  SortableTableHeader,
  SortDirection,
} from "@/components/widgets/SortableTableHeader";
import { TableSkeleton, UserAvatar } from "@/components/ui";
import { formatDateIndo } from "@/lib/utils";

import { TrackerDeadlinesProps } from "./types";

export function TrackerDeadlines({
  deadlines,
  requests,
  openRequestDetail,
  setEditingDeadlineId,
  isLoading,
}: TrackerDeadlinesProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [sort, setSort] = useState<{
    key: "work" | "pic" | "period" | "status";
    direction: SortDirection;
  }>({ key: "work", direction: null });

  const filteredDeadlines = useMemo(() => {
    return showOverdueOnly
      ? deadlines.filter((d) => d.status === "Overdue" || d.status === "At Risk")
      : deadlines;
  }, [deadlines, showOverdueOnly]);

  const totalPages = Math.max(1, Math.ceil(filteredDeadlines.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);

  const sortedDeadlines = useMemo(
    () =>
      sortRecords(filteredDeadlines, sort.direction, (deadline) => {
        if (sort.key === "work")
          return (
            requests.find((request) => request.id === deadline.requestId)?.title ??
            deadline.requestId
          );
        if (sort.key === "pic") return deadline.pic?.name || "";
        if (sort.key === "period") return deadline.targetDate;
        return deadline.status;
      }),
    [filteredDeadlines, requests, sort]
  );

  const paginatedDeadlines = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    return sortedDeadlines.slice(start, start + itemsPerPage);
  }, [sortedDeadlines, itemsPerPage, safePage]);

  const toggleSort = (key: typeof sort.key) =>
    setSort((current) => ({
      key,
      direction: current.key === key ? nextSortDirection(current.direction) : "asc",
    }));

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-medium text-slate-800">Jadwal Target SLA Tahapan</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Target waktu penyelesaian di setiap tahapan pengadaan.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs font-normal text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showOverdueOnly}
              onChange={(e) => setShowOverdueOnly(e.target.checked)}
              className="rounded border-slate-300 text-[#0a4d8c] focus:ring-[#0a4d8c]"
            />
            Hanya Mendekati & Terlambat
          </label>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-normal text-slate-600">
            {filteredDeadlines.length} jadwal
          </span>
        </div>
      </div>

      <div className="overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-medium uppercase tracking-wider text-slate-500">
            <tr>
              <SortableTableHeader
                label="Tugas & Tahapan"
                direction={sort.key === "work" ? sort.direction : null}
                onClick={() => toggleSort("work")}
                className="px-5"
              />
              <SortableTableHeader
                label="PIC"
                direction={sort.key === "pic" ? sort.direction : null}
                onClick={() => toggleSort("pic")}
              />
              <SortableTableHeader
                label="Target Jatuh Tempo"
                direction={sort.key === "period" ? sort.direction : null}
                onClick={() => toggleSort("period")}
              />
              <SortableTableHeader
                label="Status Waktu"
                direction={sort.key === "status" ? sort.direction : null}
                onClick={() => toggleSort("status")}
              />
              <th className="px-5 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-slate-500 whitespace-nowrap">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-0">
                  <TableSkeleton rows={4} columns={5} />
                </td>
              </tr>
            ) : paginatedDeadlines.length > 0 ? (
              paginatedDeadlines.map((deadline) => {
                const request = requests.find((item) => item.id === deadline.requestId);
                const isDone = deadline.status === "Selesai";
                const isOverdue = deadline.status === "Overdue" || (!isDone && deadline.daysRemaining < 0);
                const isAtRisk = deadline.status === "At Risk";

                const statusText = isDone
                  ? "Selesai"
                  : isOverdue
                  ? `Terlambat ${Math.abs(deadline.daysRemaining)} hari`
                  : deadline.daysRemaining === 0
                  ? "Hari ini"
                  : `${deadline.daysRemaining} hari tersisa`;

                return (
                  <tr key={deadline.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => openRequestDetail(deadline.requestId)}
                        className="text-left hover:text-[#0a4d8c] focus:outline-none"
                      >
                        <div className="text-xs sm:text-[13px] font-medium text-slate-800">
                          {deadline.taskName}
                        </div>
                        <div className="mt-0.5 text-[11px] font-normal text-slate-500">
                          {request?.title ?? deadline.requestId} · {deadline.milestone}
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-normal text-slate-600 whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <UserAvatar name={deadline.pic?.name} userId={deadline.pic?.id} size="xs" />
                        <span>{deadline.pic?.name || "-"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-normal text-slate-600 whitespace-nowrap">
                      {deadline.startDate ? (
                        <span>
                          {formatDateIndo(deadline.startDate)} –{" "}
                          {formatDateIndo(deadline.targetDate)}
                        </span>
                      ) : (
                        <span>{deadline.targetDate ? formatDateIndo(deadline.targetDate) : "-"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-normal ${
                          isOverdue || isAtRisk
                            ? "border-blue-200 bg-blue-50 text-[#0a4d8c]"
                            : "border-slate-200 bg-slate-50 text-slate-600"
                        }`}
                      >
                        {statusText}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setEditingDeadlineId(deadline.id)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-normal text-slate-600 hover:border-[#0a4d8c] hover:text-[#0a4d8c]"
                      >
                        Atur SLA
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-xs text-slate-500">
                  Tidak ada jadwal SLA yang ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <TablePagination
          currentPage={safePage}
          totalPages={totalPages}
          totalItems={filteredDeadlines.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          itemName="jadwal SLA"
        />
      </div>
    </section>
  );
}
