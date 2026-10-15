import { useState } from "react";
import { ChevronDown, ChevronRight, FileText, Folder, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import type { DocumentItem } from "@/types";
import { DocumentGroupRowProps } from "./types";
import { DocumentPreviewModal } from "../modals/DocumentPreviewModal";
import { formatDateIndo } from "@/lib/utils";

function statusClass(status: DocumentItem["status"]) {
  if (status === "Lulus Verifikasi") return "bg-blue-50 text-[#0a4d8c] border-blue-200";
  if (status === "Tindak Lanjut FPP") return "bg-red-50 text-red-700 border-red-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

export function DocumentGroupRow({ request, documents }: DocumentGroupRowProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [expandedDocumentId, setExpandedDocumentId] = useState<string | null>(null);
  const [previewDocument, setPreviewDocument] = useState<DocumentItem | null>(null);

  const readyCount = documents.filter((document) => document.status === "Lulus Verifikasi").length;
  const attentionCount = documents.length - readyCount;

  return (
    <>
      <tr
        onClick={() => setExpanded((value) => !value)}
        className={`cursor-pointer transition-colors hover:bg-blue-50/40 ${
          expanded ? "bg-blue-50/30" : ""
        }`}
      >
        <td className="px-4 py-4">
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                expanded ? "bg-[#0a4d8c] text-white" : "bg-blue-50 text-[#0a4d8c]"
              }`}
            >
              <Folder size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-slate-800">
                <span>{request.title}</span>
                <span
                  className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${
                    request.operationalStatus === "On Going"
                      ? "border-blue-200 bg-blue-50 text-[#0a4d8c]"
                      : request.operationalStatus === "On Hold"
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {request.operationalStatus}
                </span>
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                {request.id} · {request.department.name} · {request.currentStep}
              </div>
            </div>
          </div>
        </td>
        <td className="px-4 py-4 text-sm font-semibold text-slate-700">{documents.length} dokumen</td>
        <td className="px-4 py-4 text-sm text-slate-600">{request.pic.name}</td>
        <td className="px-4 py-4">
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-[#0a4d8c]">
              {readyCount} lulus
            </span>
            {attentionCount > 0 && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                {attentionCount} perlu review
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-4 text-right text-slate-400">
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={5} className="border-b border-slate-200 bg-slate-50/70 p-0">
            <div className="space-y-2 px-5 py-4 sm:px-16">
              {documents.map((document) => (
                <div key={document.id}>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      setExpandedDocumentId((current) => (current === document.id ? null : document.id));
                    }}
                    className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-[#0a4d8c]/40 hover:bg-blue-50/40"
                  >
                    <FileText className="shrink-0 text-slate-400" size={17} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] font-medium text-slate-800">{document.name}</div>
                      <div className="mt-1 truncate text-[11px] text-slate-500">
                        {document.type} ·{" "}
                        {document.fileUrl ? document.fileUrl.split("/").pop() : "File belum tersedia"} ·{" "}
                        {formatDateIndo(document.uploadDate)}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusClass(
                        document.status
                      )}`}
                    >
                      {document.status}
                    </span>
                    {expandedDocumentId === document.id ? (
                      <ChevronDown className="shrink-0 text-slate-400" size={16} />
                    ) : (
                      <ChevronRight className="shrink-0 text-slate-400" size={16} />
                    )}
                  </button>

                  {expandedDocumentId === document.id && (
                    <div className="border-x border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-12">
                      {document.issues.length > 0 ? (
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Temuan pemeriksaan
                          </div>
                          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-slate-600">
                            {document.issues.map((issue, index) => (
                              <li key={`${document.id}-issue-${index}`}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="text-xs text-[#0a4d8c]">Tidak ada temuan pemeriksaan.</div>
                      )}
                      {document.nextAction && (
                        <div className="mt-3 text-xs text-slate-600">
                          <span className="font-semibold text-[#0a4d8c]">Next Action:</span>{" "}
                          {document.nextAction}
                        </div>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-3 pt-1 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => setPreviewDocument(document)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-[#0a4d8c] hover:text-[#0a4d8c] transition-colors"
                        >
                          <Eye size={13} className="text-[#0a4d8c]" />
                          Pratinjau Dokumen Asli
                        </button>
                        <button
                          type="button"
                          onClick={() => router.push(`/dashboard/documents/result?id=${document.id}`)}
                          className="text-xs font-semibold text-[#0a4d8c] hover:underline"
                        >
                          Buka hasil pemeriksaan &rarr;
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}

      {/* In-App Document Preview Modal */}
      {previewDocument && (
        <DocumentPreviewModal
          title={previewDocument.name}
          fileId={previewDocument.id}
          fileType="document"
          directUrl={previewDocument.fileUrl}
          fileName={previewDocument.name}
          metadata={[
            { label: "Nomor / Kode", value: previewDocument.id },
            { label: "Pengadaan", value: request.title },
            { label: "Tipe Dokumen", value: previewDocument.type },
            { label: "PIC Dokumen", value: previewDocument.pic.name },
            { label: "Tanggal Unggah", value: formatDateIndo(previewDocument.uploadDate) },
            { label: "Status Verifikasi", value: previewDocument.status },
          ]}
          onClose={() => setPreviewDocument(null)}
        />
      )}
    </>
  );
}
