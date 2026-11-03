import React, { useState } from "react";
import {
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Eye,
  Edit3,
  RotateCw,
  CalendarCheck,
  ShieldAlert,
  AlertTriangle,
  Upload,
} from "lucide-react";
import type { GuaranteeItem } from "@/types";
import { calculateDaysRemaining, formatDateIndo, formatRupiah } from "@/lib/utils";
import { DocumentPreviewModal } from "@/components/widgets/modals/DocumentPreviewModal";
import { GuaranteeEditModal } from "@/components/widgets/modals/GuaranteeEditModal";
import { GuaranteeLifecycleModal } from "@/components/widgets/modals/GuaranteeLifecycleModal";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

interface RelatedGuaranteesProps {
  guars: GuaranteeItem[];
  selectedRequestId: string | null;
  expandedRelatedId: string | null;
  setExpandedRelatedId: React.Dispatch<React.SetStateAction<string | null>>;
  router: AppRouterInstance;
}

function statusBadgeClass(status: GuaranteeItem["status"]) {
  if (status === "Aktif") return "bg-slate-100 text-slate-700 border-slate-200";
  if (status === "Expired" || status === "Mendekati Expiry" || status === "Klaim Diajukan") {
    return "bg-blue-50 text-[#0a4d8c] border-blue-200";
  }
  return "bg-slate-50 text-slate-500 border-slate-200";
}

export function RelatedGuarantees({
  guars,
  selectedRequestId,
  expandedRelatedId,
  setExpandedRelatedId,
  router,
}: RelatedGuaranteesProps) {
  const [previewGuarantee, setPreviewGuarantee] = useState<GuaranteeItem | null>(null);
  const [editingGuarantee, setEditingGuarantee] = useState<GuaranteeItem | null>(null);
  const [lifecycleGuarantee, setLifecycleGuarantee] = useState<{
    guarantee: GuaranteeItem;
    action: "amend" | "release" | "claim";
  } | null>(null);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-3.5">
        <div>
          <div className="flex items-center gap-2 text-slate-800 font-medium text-sm">
            <ShieldCheck size={16} className="text-[#0a4d8c]" />
            <span>Warkat Jaminan Bank / Asuransi ({guars.length})</span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Monitoring masa berlaku jaminan pelaksanaan/pemeliharaan, kepatuhan nilai minimum 5% pagu, perpanjangan, BAST, dan klaim.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              router.push(
                selectedRequestId
                  ? `/dashboard/overview/guarantees/upload?requestId=${selectedRequestId}`
                  : "/dashboard/overview/guarantees/upload"
              )
            }
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a4d8c] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#093e6f] transition-colors"
          >
            <Upload size={13} />
            <span>Unggah Warkat Jaminan</span>
          </button>
        </div>
      </div>

      {guars.length > 0 ? (
        <div className="space-y-2.5">
          {guars.map((g) => {
            const daysRemaining = calculateDaysRemaining(g.expiryDate);
            const isExpanded = expandedRelatedId === `guarantee-${g.id}`;

            return (
              <div key={g.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedRelatedId((current) =>
                      current === `guarantee-${g.id}` ? null : `guarantee-${g.id}`
                    )
                  }
                  className="flex w-full flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/40 p-3.5 text-left transition hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-xs font-medium text-slate-800">
                        {g.referenceNo} · {g.type}
                      </span>
                      {(g.isThresholdCompliant === false || g.thresholdWarning) && (
                        <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-normal text-[#0a4d8c] inline-flex items-center gap-1">
                          <AlertTriangle size={10} />
                          <span>{g.thresholdWarning || "Nilai < 5% Pagu"}</span>
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      {g.vendor.name} • {g.issuer} • Jatuh tempo: {formatDateIndo(g.expiryDate)}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2.5">
                    <span className="text-xs font-normal text-slate-700">{formatRupiah(g.value)}</span>
                    <span
                      className={`text-[10px] font-normal px-2.5 py-0.5 rounded-full border ${statusBadgeClass(
                        g.status
                      )}`}
                    >
                      {g.status === "Mendekati Expiry"
                        ? "Mendekati Jatuh Tempo"
                        : g.status === "Expired"
                        ? "Kedaluwarsa"
                        : g.status}
                    </span>
                    {isExpanded ? (
                      <ChevronDown size={15} className="text-slate-400" />
                    ) : (
                      <ChevronRight size={15} className="text-slate-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-200 bg-white px-4 py-3.5 text-xs text-slate-600 space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <div className="font-medium uppercase tracking-wider text-[10px] text-slate-400">
                          Nomor Referensi
                        </div>
                        <div className="mt-0.5 font-mono font-normal text-slate-800">
                          {g.referenceNo}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium uppercase tracking-wider text-[10px] text-slate-400">
                          Penerbit & Jenis
                        </div>
                        <div className="mt-0.5">
                          {g.issuerType ? `${g.issuerType} · ` : ""}
                          {g.issuer}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium uppercase tracking-wider text-[10px] text-slate-400">
                          Masa Berlaku
                        </div>
                        <div className="mt-0.5 font-normal">
                          {daysRemaining < 0
                            ? `Terlewat ${Math.abs(daysRemaining)} hari`
                            : `${daysRemaining} hari tersisa (${formatDateIndo(g.expiryDate)})`}
                        </div>
                      </div>
                    </div>

                    {(g.isThresholdCompliant === false || g.thresholdWarning) && (
                      <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700">
                        <AlertTriangle size={14} className="text-[#0a4d8c] shrink-0 mt-0.5" />
                        <div>
                          <div className="font-medium">Ketentuan Nilai Minimum Jaminan:</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {g.thresholdWarning ||
                              `Nilai jaminan ini di bawah batas ketentuan regulasi (minimal 5% pagu pengadaan: ${formatRupiah(
                                g.minRequiredValue
                              )}).`}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Lifecycle Action Buttons Toolbar */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setPreviewGuarantee(g)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-normal text-slate-600 hover:border-[#0a4d8c] hover:text-[#0a4d8c] transition-colors"
                      >
                        <Eye size={13} className="text-[#0a4d8c]" />
                        <span>Lihat Dokumen Asli</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingGuarantee(g)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-normal text-slate-600 hover:border-[#0a4d8c] hover:text-[#0a4d8c] transition-colors"
                      >
                        <Edit3 size={13} />
                        <span>Koreksi Data</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setLifecycleGuarantee({ guarantee: g, action: "amend" })}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-normal text-slate-600 hover:border-[#0a4d8c] hover:text-[#0a4d8c] transition-colors"
                      >
                        <RotateCw size={13} className="text-slate-400" />
                        <span>Perpanjang (Addendum)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setLifecycleGuarantee({ guarantee: g, action: "release" })}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-normal text-slate-600 hover:border-[#0a4d8c] hover:text-[#0a4d8c] transition-colors"
                      >
                        <CalendarCheck size={13} className="text-slate-400" />
                        <span>Pengembalian (BAST)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setLifecycleGuarantee({ guarantee: g, action: "claim" })}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-normal text-[#0a4d8c] hover:bg-blue-100 transition-colors"
                      >
                        <ShieldAlert size={13} />
                        <span>Klaim Jaminan</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-xs text-slate-500 py-8 text-center bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
          Belum ada warkat jaminan yang tertaut pada pekerjaan ini.
        </div>
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
            { label: "Penerbit", value: `${previewGuarantee.issuerType || ""} ${previewGuarantee.issuer}` },
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

      {editingGuarantee && (
        <GuaranteeEditModal
          guarantee={editingGuarantee}
          onClose={() => setEditingGuarantee(null)}
        />
      )}

      {lifecycleGuarantee && (
        <GuaranteeLifecycleModal
          guarantee={lifecycleGuarantee.guarantee}
          initialAction={lifecycleGuarantee.action}
          onClose={() => setLifecycleGuarantee(null)}
        />
      )}
    </section>
  );
}
