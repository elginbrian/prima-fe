"use client";

import { useState, useMemo } from "react";
import {
  Inbox,
  Eye,
  Edit3,
  RotateCw,
  CalendarCheck,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { GuaranteeItem, GuaranteeStatus, ProcurementRequest } from "@/types";
import { GuaranteeFilterBar } from "@/components/widgets/guarantees/GuaranteeFilterBar";
import { TablePagination } from "@/components/widgets/TablePagination";
import {
  nextSortDirection,
  sortRecords,
  SortableTableHeader,
  SortDirection,
} from "@/components/widgets/SortableTableHeader";
import { useProcurement } from "@/context/ProcurementContext";
import { GuaranteeEditModal } from "@/components/widgets/modals/GuaranteeEditModal";
import { DocumentPreviewModal } from "@/components/widgets/modals/DocumentPreviewModal";
import { GuaranteeLifecycleModal } from "@/components/widgets/modals/GuaranteeLifecycleModal";
import { exportGuaranteesToCsv } from "@/lib/exportUtils";
import {
  calculateDaysRemaining,
  formatDateIndo,
  formatRupiah,
  formatRequestCode,
} from "@/lib/utils";
import { TableSkeleton } from "@/components/ui";

interface TrackerGuaranteesViewProps {
  requests: ProcurementRequest[];
  guarantees: GuaranteeItem[];
  isLoading?: boolean;
  globalSearchQuery?: string;
  departmentFilter?: string;
  openRequestDetail: (requestId: string) => void;
}

function statusBadgeStyle(status: GuaranteeItem["status"]) {
  if (status === "Aktif") return "bg-slate-100 text-slate-700 border-slate-200";
  if (status === "Mendekati Expiry" || status === "Expired" || status === "Klaim Diajukan") {
    return "bg-blue-50 text-[#0a4d8c] border-blue-200";
  }
  return "bg-slate-50 text-slate-500 border-slate-200";
}

export function TrackerGuaranteesView({
  requests,
  guarantees,
  isLoading,
  globalSearchQuery = "",
  departmentFilter = "All",
  openRequestDetail,
}: TrackerGuaranteesViewProps) {
  const { state } = useProcurement();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<GuaranteeStatus | "All">("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [editingGuarantee, setEditingGuarantee] = useState<GuaranteeItem | null>(null);
  const [previewGuarantee, setPreviewGuarantee] = useState<GuaranteeItem | null>(null);
  const [lifecycleGuarantee, setLifecycleGuarantee] = useState<{
    guarantee: GuaranteeItem;
    action: "amend" | "release" | "claim";
  } | null>(null);

  const [sort, setSort] = useState<{
    key: "ref" | "project" | "issuer" | "value" | "expiry" | "status";
    direction: SortDirection;
  }>({ key: "expiry", direction: null });

  const effectiveSearch = (searchQuery || globalSearchQuery).trim().toLowerCase();

  const requestMap = useMemo(() => {
    const map: Record<string, ProcurementRequest> = {};
    requests.forEach((r) => {
      map[r.id] = r;
    });
    return map;
  }, [requests]);

  const allGuarantees = useMemo(() => {
    const list = [...guarantees];
    state.attachments.forEach((att) => {
      if (
        !list.some(
          (g) => g.id === att.id || (g.requestId === att.requestId && g.referenceNo === att.name)
        )
      ) {
        list.push({
          id: att.id,
          requestId: att.requestId,
          referenceNo: att.name || "DOK-PENDUKUNG",
          type: (att.type as any) || "Jaminan Pelaksanaan",
          value: 0,
          issuer: "Penyedia Dokumen",
          issuerType: "Lainnya",
          beneficiary: "PT Pertamina Patra Niaga",
          vendor: { id: att.uploadedBy.id, name: att.uploadedBy.name },
          issueDate: att.uploadedAt || new Date().toISOString().split("T")[0],
          expiryDate: "-",
          pic: att.uploadedBy,
          status: "Aktif",
          fileUrl: att.fileUrl,
          mimeType: att.mimeType,
        });
      }
    });
    return list;
  }, [guarantees, state.attachments]);

  const filteredGuarantees = useMemo(() => {
    return allGuarantees.filter((item) => {
      const req = requestMap[item.requestId];
      const matchesDept =
        departmentFilter === "All" || !req || req.department.name === departmentFilter;
      const matchesSearch =
        !effectiveSearch ||
        item.referenceNo.toLowerCase().includes(effectiveSearch) ||
        item.vendor.name.toLowerCase().includes(effectiveSearch) ||
        item.issuer.toLowerCase().includes(effectiveSearch) ||
        (req?.title || "").toLowerCase().includes(effectiveSearch) ||
        item.requestId.toLowerCase().includes(effectiveSearch);
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      const matchesType = typeFilter === "All" || item.type === typeFilter;
      return matchesDept && matchesSearch && matchesStatus && matchesType;
    });
  }, [allGuarantees, requestMap, departmentFilter, effectiveSearch, statusFilter, typeFilter]);

  const sortedGuarantees = useMemo(
    () =>
      sortRecords(filteredGuarantees, sort.direction, (g) => {
        if (sort.key === "ref") return g.referenceNo;
        if (sort.key === "project") return requestMap[g.requestId]?.title ?? g.requestId;
        if (sort.key === "issuer") return g.issuer;
        if (sort.key === "value") return g.value;
        if (sort.key === "expiry") return g.expiryDate || "9999-12-31";
        return g.status;
      }),
    [filteredGuarantees, sort, requestMap]
  );

  const totalPages = Math.max(1, Math.ceil(sortedGuarantees.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedGuarantees = useMemo(() => {
    const startIndex = (safePage - 1) * itemsPerPage;
    return sortedGuarantees.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedGuarantees, safePage, itemsPerPage]);

  const toggleSort = (key: typeof sort.key) =>
    setSort((current) => ({
      key,
      direction: current.key === key ? nextSortDirection(current.direction) : "asc",
    }));

  return (
    <div className="space-y-4">
      <GuaranteeFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        onExport={() => exportGuaranteesToCsv(allGuarantees)}
      />

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
          <table className="w-full min-w-[900px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                <SortableTableHeader
                  label="No. Warkat & Jenis"
                  direction={sort.key === "ref" ? sort.direction : null}
                  onClick={() => toggleSort("ref")}
                  className="px-5"
                />
                <SortableTableHeader
                  label="Pekerjaan & Vendor"
                  direction={sort.key === "project" ? sort.direction : null}
                  onClick={() => toggleSort("project")}
                />
                <SortableTableHeader
                  label="Penerbit"
                  direction={sort.key === "issuer" ? sort.direction : null}
                  onClick={() => toggleSort("issuer")}
                />
                <SortableTableHeader
                  label="Nilai Warkat"
                  direction={sort.key === "value" ? sort.direction : null}
                  onClick={() => toggleSort("value")}
                />
                <SortableTableHeader
                  label="Jatuh Tempo"
                  direction={sort.key === "expiry" ? sort.direction : null}
                  onClick={() => toggleSort("expiry")}
                />
                <SortableTableHeader
                  label="Status"
                  direction={sort.key === "status" ? sort.direction : null}
                  onClick={() => toggleSort("status")}
                />
                <th className="py-3 px-5 text-right text-[11px] font-medium uppercase tracking-wider text-slate-500 whitespace-nowrap">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <TableSkeleton rows={5} columns={7} />
                  </td>
                </tr>
              ) : paginatedGuarantees.length > 0 ? (
                paginatedGuarantees.map((g) => {
                  const req = requestMap[g.requestId];
                  const daysRemaining = calculateDaysRemaining(g.expiryDate);
                  const isExpanded = expandedId === g.id;

                  return (
                    <tr key={g.id} className="group">
                      <td colSpan={7} className="p-0">
                        <div
                          onClick={() => setExpandedId(isExpanded ? null : g.id)}
                          className={`grid grid-cols-[1.3fr_1.6fr_1fr_1fr_1fr_0.9fr_auto] items-center gap-2 px-5 py-3.5 cursor-pointer transition-colors hover:bg-slate-50/80 ${
                            isExpanded ? "bg-slate-50/60" : ""
                          }`}
                        >
                          {/* 1. No Warkat & Jenis */}
                          <div className="min-w-0 pr-2">
                            <div className="text-xs font-mono font-normal text-slate-800 truncate">
                              {g.referenceNo}
                            </div>
                            <div className="mt-0.5 text-[11px] font-normal text-slate-500 truncate">
                              {g.type}
                            </div>
                          </div>

                          {/* 2. Pekerjaan & Vendor */}
                          <div className="min-w-0 pr-2">
                            <div className="text-xs font-medium text-slate-800 truncate">
                              {req?.title ?? formatRequestCode(g.requestId)}
                            </div>
                            <div className="mt-0.5 text-[11px] font-normal text-slate-500 truncate">
                              {g.vendor.name}
                            </div>
                          </div>

                          {/* 3. Penerbit */}
                          <div className="min-w-0 pr-2 text-xs font-normal text-slate-600 truncate">
                            {g.issuer}
                          </div>

                          {/* 4. Nilai */}
                          <div className="whitespace-nowrap pr-2">
                            <div className="text-xs font-normal text-slate-700">
                              {formatRupiah(g.value)}
                            </div>
                            {(g.isThresholdCompliant === false || g.thresholdWarning) && (
                              <span className="mt-0.5 inline-block text-[10px] font-normal text-[#0a4d8c]">
                                &lt; 5% Pagu
                              </span>
                            )}
                          </div>

                          {/* 5. Jatuh Tempo */}
                          <div className="whitespace-nowrap pr-2">
                            <div className="text-xs font-normal text-slate-700">
                              {formatDateIndo(g.expiryDate)}
                            </div>
                            <div className="mt-0.5 text-[10px] font-normal text-slate-400">
                              {daysRemaining < 0
                                ? `Lewat ${Math.abs(daysRemaining)} hari`
                                : `${daysRemaining} hari tersisa`}
                            </div>
                          </div>

                          {/* 6. Status */}
                          <div className="whitespace-nowrap pr-2">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-normal ${statusBadgeStyle(
                                g.status
                              )}`}
                            >
                              {g.status === "Mendekati Expiry"
                                ? "Mendekati"
                                : g.status === "Expired"
                                ? "Kedaluwarsa"
                                : g.status}
                            </span>
                          </div>

                          {/* 7. Aksi */}
                          <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewGuarantee(g);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-normal text-slate-600 hover:border-[#0a4d8c] hover:text-[#0a4d8c] transition-colors"
                            >
                              <Eye size={13} />
                              <span>Pratinjau</span>
                            </button>
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400">
                              {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                            </span>
                          </div>
                        </div>

                        {/* Expanded Action Drawer */}
                        {isExpanded && (
                          <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500">
                              <span>
                                Kode Pekerjaan:{" "}
                                <span className="font-mono text-slate-700">
                                  {formatRequestCode(g.requestId)}
                                </span>
                              </span>
                              <span>•</span>
                              <span>PIC: {g.pic.name}</span>
                              <span>•</span>
                              <span>Terbit: {formatDateIndo(g.issueDate)}</span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openRequestDetail(g.requestId)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-normal text-slate-600 hover:border-[#0a4d8c] hover:text-[#0a4d8c]"
                              >
                                <ExternalLink size={12} />
                                <span>Buka Pekerjaan</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingGuarantee(g)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-normal text-slate-600 hover:border-[#0a4d8c] hover:text-[#0a4d8c]"
                              >
                                <Edit3 size={12} />
                                <span>Koreksi Data</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setLifecycleGuarantee({ guarantee: g, action: "amend" })
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-normal text-slate-600 hover:border-[#0a4d8c] hover:text-[#0a4d8c]"
                              >
                                <RotateCw size={12} />
                                <span>Perpanjang</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setLifecycleGuarantee({ guarantee: g, action: "release" })
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-normal text-slate-600 hover:border-[#0a4d8c] hover:text-[#0a4d8c]"
                              >
                                <CalendarCheck size={12} />
                                <span>BAST / Kembalikan</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setLifecycleGuarantee({ guarantee: g, action: "claim" })
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-normal text-[#0a4d8c] hover:bg-blue-100"
                              >
                                <ShieldAlert size={12} />
                                <span>Klaim</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7}>
                    <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                      <Inbox size={40} className="text-slate-300 mb-2.5" />
                      <p className="text-sm font-medium text-slate-700">
                        Tidak ada warkat jaminan ditemukan
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Sesuaikan kata kunci pencarian atau unggah warkat jaminan baru.
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
            totalItems={filteredGuarantees.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            itemName="warkat jaminan"
          />
        </div>
      </div>

      {editingGuarantee && (
        <GuaranteeEditModal
          guarantee={editingGuarantee}
          onClose={() => setEditingGuarantee(null)}
        />
      )}

      {previewGuarantee && (
        <DocumentPreviewModal
          title={`Jaminan: ${previewGuarantee.referenceNo}`}
          fileId={previewGuarantee.id}
          fileType="guarantee"
          directUrl={previewGuarantee.fileUrl}
          fileName={`${previewGuarantee.referenceNo}.pdf`}
          metadata={[
            { label: "Nomor Jaminan", value: previewGuarantee.referenceNo },
            { label: "Jenis Jaminan", value: previewGuarantee.type },
            { label: "Vendor", value: previewGuarantee.vendor.name },
            {
              label: "Penerbit",
              value: `${previewGuarantee.issuerType || ""} ${previewGuarantee.issuer}`,
            },
            { label: "Nilai", value: formatRupiah(previewGuarantee.value) },
            {
              label: "Masa Berlaku",
              value: `${formatDateIndo(previewGuarantee.issueDate)} s/d ${formatDateIndo(
                previewGuarantee.expiryDate
              )}`,
            },
            { label: "Status Jaminan", value: previewGuarantee.status },
          ]}
          onClose={() => setPreviewGuarantee(null)}
        />
      )}

      {lifecycleGuarantee && (
        <GuaranteeLifecycleModal
          guarantee={lifecycleGuarantee.guarantee}
          initialAction={lifecycleGuarantee.action}
          onClose={() => setLifecycleGuarantee(null)}
        />
      )}
    </div>
  );
}
