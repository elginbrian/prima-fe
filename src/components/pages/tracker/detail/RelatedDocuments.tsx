import React, { useState } from "react";
import { FileText, Plus, Eye, ExternalLink, ShieldCheck } from "lucide-react";
import type { DocumentItem } from "@/types";
import { formatDateIndo } from "@/lib/utils";
import { DocumentPreviewModal } from "@/components/widgets/modals/DocumentPreviewModal";
import { DocumentActionModal } from "@/components/widgets/modals/DocumentActionModal";
import { UserAvatar } from "@/components/ui/UserAvatar";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

interface RelatedDocumentsProps {
  docs: DocumentItem[];
  selectedRequestId?: string | null;
  expandedRelatedId?: string | null;
  setExpandedRelatedId?: React.Dispatch<React.SetStateAction<string | null>>;
  router: AppRouterInstance;
}

export function RelatedDocuments({
  docs,
  selectedRequestId,
  router,
}: RelatedDocumentsProps) {
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [actionDoc, setActionDoc] = useState<DocumentItem | null>(null);

  if (docs.length === 0) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3">
        <div className="flex items-center gap-2.5 text-xs text-slate-600">
          <FileText size={15} className="text-[#0a4d8c] shrink-0" />
          <span>
            <strong className="font-medium text-slate-800">Dokumen Pengadaan (0):</strong>{" "}
            Belum ada berkas yang tertaut pada pekerjaan ini.
          </span>
        </div>
        <button
          type="button"
          onClick={() =>
            router.push(
              selectedRequestId
                ? `/dashboard/documents/upload?requestId=${selectedRequestId}`
                : "/dashboard/documents/upload"
            )
          }
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a4d8c] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#093e6f] transition-colors shrink-0"
        >
          <Plus size={13} />
          <span>Unggah &amp; Periksa Dokumen</span>
        </button>
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-3.5">
        <div>
          <div className="flex items-center gap-2 text-slate-800 font-medium text-sm">
            <FileText size={16} className="text-[#0a4d8c]" />
            <span>Dokumen Pengadaan ({docs.length})</span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Berkas tender (KAK, HPS, Berita Acara, Kontrak) beserta status verifikasi kelayakan AI.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            router.push(
              selectedRequestId
                ? `/dashboard/documents/upload?requestId=${selectedRequestId}`
                : "/dashboard/documents/upload"
            )
          }
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a4d8c] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#093e6f] transition-colors"
        >
          <Plus size={13} />
          <span>Unggah & Periksa Dokumen</span>
        </button>
      </div>

      {docs.length > 0 ? (
        <div className="space-y-3">
          {docs.map((d) => {
            const isGuaranteeLike = d.name.toLowerCase().includes("jaminan");
            return (
              <div
                key={d.id}
                className="rounded-xl border border-slate-200 bg-slate-50/30 p-4 transition hover:border-slate-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-slate-800">{d.name}</span>
                      {d.documentKind && (
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-normal text-slate-600 border border-slate-200">
                          {d.documentKind}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                      <span>Kategori: {d.type} • Diunggah {formatDateIndo(d.uploadDate)} oleh</span>
                      <UserAvatar name={d.pic?.name || "Admin"} userId={d.pic?.id} size="xs" />
                      <span className="text-slate-700">{d.pic?.name || "Admin"}</span>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 self-start text-[11px] font-normal px-2.5 py-0.5 rounded-full border ${
                      d.status === "Lulus Verifikasi"
                        ? "bg-blue-50 text-[#0a4d8c] border-blue-200"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {d.status}
                  </span>
                </div>

                {(d.issues.length > 0 || d.nextAction) && (
                  <div className="mt-3 rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-xs text-slate-600 space-y-1">
                    {d.issues.length > 0 && (
                      <div>
                        <span className="font-medium text-slate-700">Catatan Pemeriksaan: </span>
                        {d.issues.join(" ")}
                      </div>
                    )}
                    {d.nextAction && (
                      <div>
                        <span className="font-medium text-[#0a4d8c]">Tindak Lanjut: </span>
                        {d.nextAction}
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(d)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-normal text-slate-600 hover:border-[#0a4d8c] hover:text-[#0a4d8c] transition-colors"
                  >
                    <Eye size={13} className="text-[#0a4d8c]" />
                    <span>Pratinjau</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionDoc(d)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-normal text-slate-600 hover:border-[#0a4d8c] hover:text-[#0a4d8c] transition-colors"
                  >
                    <span>Perbarui Status / Revisi</span>
                  </button>
                  {isGuaranteeLike && selectedRequestId && (
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/dashboard/overview/guarantees/upload?requestId=${selectedRequestId}`
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-normal text-[#0a4d8c] hover:bg-blue-100 transition-colors"
                    >
                      <ShieldCheck size={13} />
                      <span>Daftarkan ke Warkat Jaminan</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => router.push(`/dashboard/documents/result?id=${d.id}`)}
                    className="inline-flex items-center gap-1 text-xs font-normal text-[#0a4d8c] hover:underline sm:ml-auto"
                  >
                    <span>Lihat Hasil Pemeriksaan AI</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-xs text-slate-500 py-8 text-center bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
          Belum ada dokumen pengadaan yang tertaut pada pekerjaan ini.
        </div>
      )}

      {previewDoc && (
        <DocumentPreviewModal
          title={previewDoc.name}
          fileId={previewDoc.id}
          fileType="document"
          directUrl={previewDoc.fileUrl}
          fileName={`${previewDoc.name}.pdf`}
          metadata={[
            { label: "Nama Dokumen", value: previewDoc.name },
            { label: "Kategori", value: previewDoc.type },
            { label: "Status", value: previewDoc.status },
            { label: "Tanggal Unggah", value: formatDateIndo(previewDoc.uploadDate) },
          ]}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {actionDoc && (
        <DocumentActionModal doc={actionDoc} onClose={() => setActionDoc(null)} />
      )}
    </section>
  );
}
