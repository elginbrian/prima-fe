import { Eye, FileText } from "lucide-react";
import { useMemo, useState } from "react";
import { TablePagination } from "@/components/widgets/TablePagination";
import { nextSortDirection, sortRecords, SortableTableHeader, SortDirection } from "@/components/widgets/SortableTableHeader";
import { TrackerItem } from "./types";

import { TrackerListProps } from "./types";

export function TrackerList({ filteredItems, timeStatusMap, documentsMap, openRequestDetail }: TrackerListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sort, setSort] = useState<{ key: "title" | "status" | "pic" | "step" | "amount" | "sla"; direction: SortDirection }>({ key: "title", direction: null });
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const sortedItems = useMemo(() => sortRecords(filteredItems, sort.direction, item => {
    if (sort.key === "title") return item.title;
    if (sort.key === "status") return item.operationalStatus;
    if (sort.key === "pic") return item.pic?.name || "";
    if (sort.key === "step") return item.currentStep;
    if (sort.key === "amount") return item.amount;
    return timeStatusMap[item.id] ?? "";
  }), [filteredItems, sort, timeStatusMap]);
  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    return sortedItems.slice(start, start + itemsPerPage);
  }, [sortedItems, itemsPerPage, safePage]);
  const toggleSort = (key: typeof sort.key) => setSort(current => ({ key, direction: current.key === key ? nextSortDirection(current.direction) : "asc" }));

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Daftar Pekerjaan</h2>
          <p className="mt-1 text-xs text-slate-500">Tampilan ringkas untuk memantau banyak pekerjaan.</p>
        </div>
        <span className="text-xs font-semibold text-slate-500">{filteredItems.length} pekerjaan</span>
      </div>
      <div className="overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
        <table className="w-full min-w-[900px] text-left">
          <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <SortableTableHeader label="Pekerjaan" direction={sort.key === "title" ? sort.direction : null} onClick={() => toggleSort("title")} className="px-5" />
              <SortableTableHeader label="Status" direction={sort.key === "status" ? sort.direction : null} onClick={() => toggleSort("status")} />
              <SortableTableHeader label="PIC" direction={sort.key === "pic" ? sort.direction : null} onClick={() => toggleSort("pic")} />
              <SortableTableHeader label="Tahap" direction={sort.key === "step" ? sort.direction : null} onClick={() => toggleSort("step")} />
              <SortableTableHeader label="Nilai" direction={sort.key === "amount" ? sort.direction : null} onClick={() => toggleSort("amount")} />
              <th className="px-5 py-3 text-left">Dokumen</th>
              <SortableTableHeader label="SLA" direction={sort.key === "sla" ? sort.direction : null} onClick={() => toggleSort("sla")} />
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedItems.map(item => (
              <tr key={item.id} className="hover:bg-slate-50/70">
                <td className="px-5 py-3">
                  <div className="text-xs text-slate-400">{item.id}</div>
                  <div className="mt-1 text-sm font-medium text-slate-800">{item.title}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${item.operationalStatus === "On Going" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : item.operationalStatus === "On Hold" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                    {item.operationalStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">{item.pic?.name || "-"}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{item.currentStep}</td>
                <td className="px-4 py-3 text-xs font-medium text-slate-700">{item.amount}</td>
                <td className="px-5 py-3 text-xs">
                  {(() => {
                    const docStats = documentsMap[item.id] || { total: 0, valid: 0 };
                    if (docStats.total === 0) return <span className="text-slate-400 font-medium">0 Dokumen</span>;
                    const allValid = docStats.valid === docStats.total;
                    return (
                      <div className="flex items-center gap-1.5">
                        <FileText size={14} className={allValid ? "text-emerald-500" : "text-amber-500"} />
                        <span className={`font-semibold ${allValid ? "text-emerald-600" : "text-amber-600"}`}>
                          {docStats.valid}/{docStats.total} <span className="font-normal opacity-80">Valid</span>
                        </span>
                      </div>
                    );
                  })()}
                </td>
                <td className="px-4 py-3 text-xs font-medium text-slate-600">{timeStatusMap[item.id] ?? "-"}</td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => openRequestDetail(item.id)} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-[#0a4d8c] hover:text-[#0a4d8c]">
                    <Eye size={13} /> Buka Detail
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
