import { ArrowRight, FileText, PauseCircle, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { formatRupiah, formatRequestCode } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { TablePagination } from "@/components/widgets/TablePagination";
import {
  nextSortDirection,
  sortRecords,
  SortableTableHeader,
  SortDirection,
} from "@/components/widgets/SortableTableHeader";
import { TrackerListProps } from "./types";

export function TrackerList({
  filteredItems,
  timeStatusMap,
  documentsMap,
  guaranteesMap = {},
  openRequestDetail,
}: TrackerListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sort, setSort] = useState<{
    key: "title" | "status" | "pic" | "step" | "amount" | "sla";
    direction: SortDirection;
  }>({ key: "title", direction: null });
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const sortedItems = useMemo(
    () =>
      sortRecords(filteredItems, sort.direction, (item) => {
        if (sort.key === "title") return item.title;
        if (sort.key === "status") return item.operationalStatus;
        if (sort.key === "pic") return item.pic?.name || "";
        if (sort.key === "step") return item.currentStep;
        if (sort.key === "amount") return item.amount;
        return timeStatusMap[item.id] ?? "";
      }),
    [filteredItems, sort, timeStatusMap]
  );
  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    return sortedItems.slice(start, start + itemsPerPage);
  }, [sortedItems, itemsPerPage, safePage]);
  const toggleSort = (key: typeof sort.key) =>
    setSort((current) => ({
      key,
      direction: current.key === key ? nextSortDirection(current.direction) : "asc",
    }));

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
        <table className="w-full min-w-[940px] text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-medium uppercase tracking-wider text-slate-500">
            <tr>
              <SortableTableHeader
                label="Pekerjaan Pengadaan"
                direction={sort.key === "title" ? sort.direction : null}
                onClick={() => toggleSort("title")}
                className="px-5"
              />
              <SortableTableHeader
                label="Status"
                direction={sort.key === "status" ? sort.direction : null}
                onClick={() => toggleSort("status")}
              />
              <SortableTableHeader
                label="PIC"
                direction={sort.key === "pic" ? sort.direction : null}
                onClick={() => toggleSort("pic")}
              />
              <SortableTableHeader
                label="Tahap Saat Ini"
                direction={sort.key === "step" ? sort.direction : null}
                onClick={() => toggleSort("step")}
              />
              <SortableTableHeader
                label="Nilai"
                direction={sort.key === "amount" ? sort.direction : null}
                onClick={() => toggleSort("amount")}
              />
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500 whitespace-nowrap">
                Dokumen
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-500 whitespace-nowrap">
                Jaminan
              </th>
              <SortableTableHeader
                label="Status SLA"
                direction={sort.key === "sla" ? sort.direction : null}
                onClick={() => toggleSort("sla")}
              />
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedItems.map((item) => (
              <tr
                key={item.id}
                onClick={() => openRequestDetail(item.id)}
                className="cursor-pointer transition-colors hover:bg-slate-50/80"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <span
                      title={item.id}
                      className="text-[11px] font-mono font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200"
                    >
                      {formatRequestCode(item.id)}
                    </span>
                    <span className="text-[11px] text-slate-400">{item.department?.name}</span>
                  </div>
                  <div className="mt-1 text-sm font-medium text-slate-800">{item.title}</div>
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <div className="flex flex-col gap-1 items-start">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-normal ${
                        item.operationalStatus === "On Going"
                          ? "border-blue-200 bg-blue-50 text-[#0a4d8c]"
                          : "border-slate-200 bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.operationalStatus === "On Going"
                        ? "Berjalan"
                        : item.operationalStatus === "On Hold"
                        ? "Ditunda"
                        : "Batal"}
                    </span>
                    {item.operationalStatus === "On Hold" && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-normal whitespace-nowrap">
                        <PauseCircle size={11} className="text-slate-400" />
                        <span>SLA Dijeda</span>
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3.5 text-xs font-normal text-slate-600 whitespace-nowrap">
                  <div className="inline-flex items-center gap-2">
                    <UserAvatar name={item.pic?.name} userId={item.pic?.id} size="xs" />
                    <span>{item.pic?.name || "-"}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-xs font-normal text-slate-600 whitespace-nowrap">
                  {item.currentStep}
                </td>
                <td className="px-4 py-3.5 text-xs font-normal text-slate-700 whitespace-nowrap">
                  {formatRupiah(item.amount)}
                </td>
                <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                  {(() => {
                    const docStats = documentsMap[item.id] || { total: 0, valid: 0 };
                    if (docStats.total === 0)
                      return <span className="text-slate-400">-</span>;
                    const allValid = docStats.valid === docStats.total;
                    return (
                      <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                        <FileText
                          size={13}
                          className={allValid ? "text-[#0a4d8c]" : "text-slate-400"}
                        />
                        <span
                          className={`font-normal ${
                            allValid ? "text-[#0a4d8c]" : "text-slate-600"
                          }`}
                        >
                          {docStats.valid}/{docStats.total} Valid
                        </span>
                      </div>
                    );
                  })()}
                </td>
                <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                  {(() => {
                    const guarStats = guaranteesMap[item.id] || {
                      total: 0,
                      active: 0,
                      warning: 0,
                    };
                    if (guarStats.total === 0)
                      return <span className="text-slate-400">-</span>;
                    return (
                      <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                        <ShieldCheck size={13} className="text-[#0a4d8c]" />
                        <span className="font-normal text-slate-600">
                          {guarStats.total} Warkat
                        </span>
                      </div>
                    );
                  })()}
                </td>
                <td className="px-4 py-3.5 text-xs font-normal text-slate-600 whitespace-nowrap">
                  {timeStatusMap[item.id] ? (
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-normal whitespace-nowrap ${
                        timeStatusMap[item.id] === "Overdue"
                          ? "border-[#0a4d8c]/30 bg-blue-50 text-[#0a4d8c]"
                          : timeStatusMap[item.id] === "At Risk"
                          ? "border-slate-300 bg-slate-100 text-slate-700"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    >
                      {timeStatusMap[item.id] === "Overdue"
                        ? "Terlambat"
                        : timeStatusMap[item.id] === "At Risk"
                        ? "Mendekati"
                        : timeStatusMap[item.id] === "On Track"
                        ? "Sesuai Jadwal"
                        : timeStatusMap[item.id]}
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openRequestDetail(item.id);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-normal text-slate-600 transition hover:border-[#0a4d8c] hover:text-[#0a4d8c]"
                  >
                    <span>Detail</span>
                    <ArrowRight size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <TablePagination
          currentPage={safePage}
          totalPages={totalPages}
          totalItems={filteredItems.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          itemName="pekerjaan"
        />
      </div>
    </section>
  );
}

