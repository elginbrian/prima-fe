"use client";

import { useState, useMemo, Fragment } from "react";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Inbox,
  Plus,
  UploadCloud,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { DocumentItem, DocumentStatus, ProcurementOperationalStatus } from "@/types";
import { DocumentFilterBar } from "@/components/widgets/documents/DocumentFilterBar";
import { DocumentStats } from "@/components/widgets/stats/DocumentStats";
import { DocumentPreviewModal } from "@/components/widgets/modals/DocumentPreviewModal";
import { TablePagination } from "@/components/widgets/TablePagination";
import {
  nextSortDirection,
  sortRecords,
  SortableTableHeader,
  SortDirection,
} from "@/components/widgets/SortableTableHeader";
import { useProcurement } from "@/context/ProcurementContext";
import { exportDocumentsToCsv } from "@/lib/exportUtils";
import {
  useDocuments,
  useProcurements,
} from "@/lib/query/hooks/procurement/useProcurement";
import { useValidationLogs } from "@/lib/query/hooks/procurement/useValidation";
import { TableSkeleton, UserAvatar, Spinner, AI_TIER_META } from "@/components/ui";
import { formatDateIndo, formatRequestCode } from "@/lib/utils";

function getDocBadgeClass(status: DocumentItem["status"]) {
  if (status === "Lulus Verifikasi") {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }
  if (status === "Tindak Lanjut FPP") {
    return "border-[#0a4d8c] bg-[#0a4d8c] text-white";
  }
  return "border-[#0a4d8c]/20 bg-[#e8f2fc] text-[#0a4d8c]";
}

export default function DocumentsPage() {
  const router = useRouter();
  const { state } = useProcurement();
  const { data: serverRequests = [] } = useProcurements();
  const requests = serverRequests.length > 0 ? serverRequests : state.requests;
  const { data: serverDocs, isLoading: isLoadingDocs } = useDocuments();
  const { data: validationLogs = [] } = useValidationLogs();

  const documents = useMemo(() => {
    const baseDocs = serverDocs ?? [];
    const existingDocIds = new Set(baseDocs.map((d) => d.id));
    const logByDocId = new Map(
      validationLogs
        .filter((l) => Boolean(l.document_id))
        .map((l) => [l.document_id!, l])
    );

    const enrichedBaseDocs: DocumentItem[] = baseDocs.map((d) => {
      const matchedLog = logByDocId.get(d.id);
      if (!matchedLog) return d;
      return {
        ...d,
        processingStatus: matchedLog.processing_status ?? "completed",
        aiTierRequested: matchedLog.ai_tier_requested,
        aiTierUsed: matchedLog.ai_tier_used,
        aiModelUsed: matchedLog.ai_model_used,
        aiFallbackNotice: matchedLog.ai_fallback_notice,
        errorMessage: matchedLog.error_message,
      };
    });

    // Include standalone validation logs that haven't been published to `documents` table yet
    const standaloneDocs: DocumentItem[] = validationLogs
      .filter((l) => !l.document_id || !existingDocIds.has(l.document_id))
      .map((l) => {
        const procStatus = l.processing_status ?? "completed";
        const mappedStatus: DocumentStatus =
          l.compliance_status === "Lulus Verifikasi"
            ? "Lulus Verifikasi"
            : l.compliance_status === "Perlu Perbaikan" || procStatus === "failed"
            ? "Tindak Lanjut FPP"
            : "Catatan Procurement";
        return {
          id: l.id,
          requestId: l.request_id || "",
          name: l.document_name,
          type: "Wajib",
          documentKind: (l.profile_name ||
            "Kerangka Acuan Kerja (KAK) & Spesifikasi Teknis") as DocumentItem["documentKind"],
          status: mappedStatus,
          uploadDate: l.created_at,
          pic: {
            id: "USR-ADMIN",
            name: l.validated_by_name || "Administrator",
          },
          issues:
            procStatus === "processing"
              ? []
              : procStatus === "failed"
              ? [l.error_message || "Gagal memproses analisis AI."]
              : l.checklist_count > l.passed_count
              ? [
                  `${
                    l.checklist_count - l.passed_count
                  } dari ${l.checklist_count} kriteria checklist perlu perhatian (Skor ${Math.round(
                    l.overall_score
                  )}/100)`,
                ]
              : [],
          nextAction:
            procStatus === "processing"
              ? "Sedang dianalisis oleh AI di latar belakang..."
              : procStatus === "failed"
              ? "Buka detail laporan untuk menjalankan Evaluasi Ulang AI."
              : l.request_id
              ? "Buka laporan validasi untuk detail evaluasi."
              : "Belum ditautkan ke pekerjaan — buka laporan validasi untuk menerbitkan.",
          fileUrl: l.document_file_url || undefined,
          processingStatus: procStatus,
          aiTierRequested: l.ai_tier_requested,
          aiTierUsed: l.ai_tier_used,
          aiModelUsed: l.ai_model_used,
          aiFallbackNotice: l.ai_fallback_notice,
          errorMessage: l.error_message,
        };
      });

    return [...standaloneDocs, ...enrichedBaseDocs];
  }, [serverDocs, validationLogs]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | "All">("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [workStatusFilter, setWorkStatusFilter] = useState<
    ProcurementOperationalStatus | "All"
  >("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [previewDocument, setPreviewDocument] = useState<DocumentItem | null>(
    null
  );
  const [sort, setSort] = useState<{
    key: "name" | "request" | "type" | "pic" | "status";
    direction: SortDirection;
  }>({ key: "name", direction: null });

  const readyCount = documents.filter(
    (d) => d.status === "Lulus Verifikasi"
  ).length;
  const attnCount = documents.filter(
    (d) => d.status === "Catatan Procurement"
  ).length;
  const notReadyCount = documents.filter(
    (d) => d.status === "Tindak Lanjut FPP"
  ).length;
  const totalCount = documents.length;

  const readyPct = totalCount ? (readyCount / totalCount) * 100 : 0;
  const attnPct = totalCount ? (attnCount / totalCount) * 100 : 0;

  const [prevFilters, setPrevFilters] = useState({
    searchQuery,
    statusFilter,
    typeFilter,
    workStatusFilter,
  });
  if (
    searchQuery !== prevFilters.searchQuery ||
    statusFilter !== prevFilters.statusFilter ||
    typeFilter !== prevFilters.typeFilter ||
    workStatusFilter !== prevFilters.workStatusFilter
  ) {
    setPrevFilters({ searchQuery, statusFilter, typeFilter, workStatusFilter });
    setCurrentPage(1);
  }

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const request = requests.find((item) => item.id === doc.requestId);
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        doc.name.toLowerCase().includes(q) ||
        doc.pic.name.toLowerCase().includes(q) ||
        doc.requestId.toLowerCase().includes(q) ||
        (request?.title.toLowerCase().includes(q) ?? false);
      const matchesStatus =
        statusFilter === "All" || doc.status === statusFilter;
      const matchesType = typeFilter === "All" || doc.type === typeFilter;
      const matchesWorkStatus =
        workStatusFilter === "All" ||
        request?.operationalStatus === workStatusFilter;

      return matchesSearch && matchesStatus && matchesType && matchesWorkStatus;
    });
  }, [
    documents,
    requests,
    searchQuery,
    statusFilter,
    typeFilter,
    workStatusFilter,
  ]);

  const sortedDocuments = useMemo(
    () =>
      sortRecords(filteredDocuments, sort.direction, (doc) => {
        const req = requests.find((r) => r.id === doc.requestId);
        if (sort.key === "name") return doc.name;
        if (sort.key === "request") return req?.title || doc.requestId;
        if (sort.key === "type") return doc.type;
        if (sort.key === "pic") return doc.pic.name;
        return doc.status;
      }),
    [filteredDocuments, requests, sort]
  );

  const totalPages = Math.ceil(sortedDocuments.length / itemsPerPage);

  const paginatedDocuments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedDocuments.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedDocuments, currentPage, itemsPerPage]);

  const toggleSort = (key: typeof sort.key) =>
    setSort((current) => ({
      key,
      direction:
        current.key === key ? nextSortDirection(current.direction) : "asc",
    }));

  const previewRequest = previewDocument
    ? requests.find((r) => r.id === previewDocument.requestId)
    : undefined;

  return (
    <div className="flex flex-col gap-4 pb-12">
      {/* 1. Compact Operational Action Bar (replaces oversized hero banner) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e8f2fc] text-[#0a4d8c]">
            <FileCheck2 size={16} />
          </div>
          <p className="text-xs text-slate-600 truncate">
            Unggah dokumen untuk validasi checklist AI berbobot atau kelola template standar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => router.push("/dashboard/documents/templates")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition hover:border-[#0a4d8c] hover:text-[#0a4d8c] focus:outline-none"
          >
            <BookOpen size={14} className="text-[#0a4d8c]" />
            <span>Template & Tahapan</span>
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/documents/upload")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a4d8c] px-4 py-2 text-xs font-medium text-white shadow-2xs transition hover:bg-[#083b6c] focus:outline-none"
          >
            <UploadCloud size={14} />
            <span>Validasi Dokumen Baru</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Summary & Quick Filter Cards */}
      <DocumentStats
        totalCount={totalCount}
        readyCount={readyCount}
        attnCount={attnCount}
        notReadyCount={notReadyCount}
        readyPct={readyPct}
        attnPct={attnPct}
        activeFilter={statusFilter}
        onSelectFilter={setStatusFilter}
      />

      {/* 3. Search & Filter Bar */}
      <DocumentFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        workStatusFilter={workStatusFilter}
        setWorkStatusFilter={setWorkStatusFilter}
        onExport={() => exportDocumentsToCsv(filteredDocuments, requests)}
      />

      {/* 3. Flat, Direct Documents Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                <SortableTableHeader
                  label="Dokumen Pengadaan"
                  direction={sort.key === "name" ? sort.direction : null}
                  onClick={() => toggleSort("name")}
                />
                <SortableTableHeader
                  label="Pekerjaan Terikat"
                  direction={sort.key === "request" ? sort.direction : null}
                  onClick={() => toggleSort("request")}
                />
                <SortableTableHeader
                  label="Kategori"
                  direction={sort.key === "type" ? sort.direction : null}
                  onClick={() => toggleSort("type")}
                />
                <SortableTableHeader
                  label="PIC & Unggahan"
                  direction={sort.key === "pic" ? sort.direction : null}
                  onClick={() => toggleSort("pic")}
                />
                <SortableTableHeader
                  label="Status Verifikasi"
                  direction={sort.key === "status" ? sort.direction : null}
                  onClick={() => toggleSort("status")}
                />
                <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-slate-500 whitespace-nowrap">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoadingDocs ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <TableSkeleton rows={5} columns={6} />
                  </td>
                </tr>
              ) : paginatedDocuments.length > 0 ? (
                paginatedDocuments.map((doc) => {
                  const req = requests.find((r) => r.id === doc.requestId);
                  const isExpanded = expandedDocId === doc.id;
                  const issueCount = doc.issues?.length || 0;

                  return (
                    <Fragment key={doc.id}>
                      <tr
                        onClick={() =>
                          setExpandedDocId((cur) =>
                            cur === doc.id ? null : doc.id
                          )
                        }
                        className={`cursor-pointer transition-colors hover:bg-slate-50/80 ${
                          isExpanded ? "bg-slate-50/60" : ""
                        }`}
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e8f2fc] text-[#0a4d8c]">
                              <FileText size={15} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[13px] font-medium text-slate-900 line-clamp-1">
                                {doc.name}
                              </div>
                              <div className="mt-0.5 text-[11px] font-normal text-slate-500">
                                {doc.processingStatus === "processing"
                                  ? `Sedang dianalisis AI (${
                                      AI_TIER_META[doc.aiTierRequested || "cekatan"]?.label ||
                                      "Cekatan"
                                    })...`
                                  : doc.processingStatus === "failed"
                                  ? "Analisis gagal — buka hasil untuk evaluasi ulang"
                                  : issueCount > 0
                                  ? `${issueCount} catatan pemeriksaan`
                                  : "Tidak ada catatan temuan"}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          {doc.requestId ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/dashboard/overview/${encodeURIComponent(
                                    doc.requestId
                                  )}?tab=docs-guarantees`
                                );
                              }}
                              className="group text-left focus:outline-none"
                            >
                              <div className="text-xs font-normal text-slate-800 group-hover:text-[#0a4d8c] line-clamp-1">
                                {req?.title ||
                                  `Pengadaan ${formatRequestCode(doc.requestId)}`}
                              </div>
                              <div className="mt-0.5 text-[11px] font-normal text-[#0a4d8c] group-hover:underline">
                                {formatRequestCode(doc.requestId)}
                              </div>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/dashboard/documents/result?id=${encodeURIComponent(
                                    doc.id
                                  )}`
                                );
                              }}
                              className="group text-left focus:outline-none"
                            >
                              <div className="text-xs font-normal text-slate-500">
                                Belum Ditautkan ke Pekerjaan
                              </div>
                              <div className="mt-0.5 text-[11px] font-medium text-[#0a4d8c] group-hover:underline">
                                Tautkan / Terbitkan &rarr;
                              </div>
                            </button>
                          )}
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-normal text-slate-600">
                            {doc.type}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <UserAvatar
                              name={doc.pic.name}
                              userId={doc.pic.id}
                              size="sm"
                            />
                            <div>
                              <div className="text-xs font-normal text-slate-800">
                                {doc.pic.name}
                              </div>
                              <div className="text-[11px] font-normal text-slate-500">
                                {formatDateIndo(doc.uploadDate)}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {doc.processingStatus === "processing" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#0a4d8c]/25 bg-[#e8f2fc] px-2.5 py-0.5 text-[11px] font-medium text-[#0a4d8c]">
                              <Spinner size="xs" />
                              <span>Sedang Dianalisis</span>
                            </span>
                          ) : doc.processingStatus === "failed" ? (
                            <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-medium text-red-700">
                              Gagal Analisis
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-normal ${getDocBadgeClass(
                                doc.status
                              )}`}
                            >
                              {doc.status}
                            </span>
                          )}
                        </td>

                        <td
                          className="px-4 py-3.5 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPreviewDocument(doc)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-[#0a4d8c] hover:text-[#0a4d8c] transition-colors focus:outline-none"
                              title="Pratinjau Dokumen"
                            >
                              <Eye size={13} />
                              <span className="hidden sm:inline">Pratinjau</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/dashboard/documents/result?id=${encodeURIComponent(
                                    doc.id
                                  )}`
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-[#0a4d8c] hover:border-[#0a4d8c] hover:bg-[#e8f2fc]/40 transition-colors focus:outline-none"
                            >
                              <span>Hasil</span>
                              <ArrowRight size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedDocId((cur) =>
                                  cur === doc.id ? null : doc.id
                                )
                              }
                              className="p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
                              aria-label="Detail temuan"
                            >
                              {isExpanded ? (
                                <ChevronDown size={15} />
                              ) : (
                                <ChevronRight size={15} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td
                            colSpan={6}
                            className="border-b border-slate-200 bg-slate-50/70 px-6 py-3.5"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                              <div className="space-y-1.5 flex-1">
                                <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                                  Ringkasan Temuan Pemeriksaan
                                </div>
                                {doc.issues && doc.issues.length > 0 ? (
                                  <ul className="list-disc space-y-1 pl-4 text-xs font-normal leading-relaxed text-slate-600">
                                    {doc.issues.map((issue, idx) => (
                                      <li key={`${doc.id}-issue-${idx}`}>
                                        {issue}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-xs font-normal text-slate-600">
                                    Seluruh kriteria pemeriksaan dokumen telah terpenuhi tanpa catatan.
                                  </p>
                                )}
                                {doc.nextAction && (
                                  <div className="pt-1 text-xs font-normal text-slate-600">
                                    <span className="font-medium text-[#0a4d8c]">
                                      Tindak Lanjut:
                                    </span>{" "}
                                    {doc.nextAction}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    router.push(
                                      `/dashboard/overview/${encodeURIComponent(
                                        doc.requestId
                                      )}?tab=docs-guarantees`
                                    )
                                  }
                                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-[#0a4d8c] hover:text-[#0a4d8c] transition-colors focus:outline-none"
                                >
                                  Buka Pekerjaan
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    router.push(
                                      `/dashboard/documents/result?id=${encodeURIComponent(
                                        doc.id
                                      )}`
                                    )
                                  }
                                  className="rounded-lg bg-[#0a4d8c] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#083b6c] transition-colors focus:outline-none"
                                >
                                  Buka Laporan Validasi
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6}>
                    <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
                      <Inbox size={36} className="text-slate-300 mb-3" />
                      <p className="text-sm font-medium text-slate-700">
                        Dokumen tidak ditemukan
                      </p>
                      <p className="mt-1 text-xs font-normal text-slate-500">
                        Ubah filter status atau unggah dokumen baru untuk mulai memvalidasi.
                      </p>
                      <button
                        type="button"
                        onClick={() => router.push("/dashboard/documents/upload")}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#0a4d8c] px-4 py-2 text-xs font-medium text-white hover:bg-[#083b6c] transition-colors"
                      >
                        <Plus size={14} />
                        Validasi Dokumen Baru
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <TablePagination
            currentPage={currentPage}
            totalPages={Math.max(totalPages, 1)}
            totalItems={sortedDocuments.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            itemName="dokumen"
          />
        </div>
      </div>

      {/* Document Preview Modal */}
      {previewDocument && (
        <DocumentPreviewModal
          title={previewDocument.name}
          fileId={previewDocument.id}
          fileType="document"
          directUrl={previewDocument.fileUrl}
          fileName={previewDocument.name}
          metadata={[
            { label: "Nomor / Kode", value: previewDocument.id },
            {
              label: "Pekerjaan",
              value:
                previewRequest?.title ||
                formatRequestCode(previewDocument.requestId),
            },
            { label: "Tipe Dokumen", value: previewDocument.type },
            { label: "PIC Dokumen", value: previewDocument.pic.name },
            {
              label: "Tanggal Unggah",
              value: formatDateIndo(previewDocument.uploadDate),
            },
            { label: "Status Verifikasi", value: previewDocument.status },
          ]}
          onClose={() => setPreviewDocument(null)}
        />
      )}
    </div>
  );
}
