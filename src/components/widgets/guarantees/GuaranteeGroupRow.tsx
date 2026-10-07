import { useState } from "react";
import { ChevronDown, ChevronRight, FileText, Folder, Eye, Upload, XCircle } from "lucide-react";
import type { GuaranteeItem, ProcurementRequest } from "@/types";
import { useRouter } from "next/navigation";
import { calculateDaysRemaining } from "@/lib/utils";

import { GuaranteeGroupRowProps } from "./types";

function statusClass(status: GuaranteeItem["status"]) {
  if (status === "Aktif") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "Expired") return "bg-red-50 text-red-700 border-red-200";
  return "bg-blue-50 text-[#0a4d8c] border-blue-200";
}

export function GuaranteeGroupRow({ request, guarantees, onEdit }: GuaranteeGroupRowProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [expandedGuaranteeId, setExpandedGuaranteeId] = useState<string | null>(null);
  const [previewingGuaranteeId, setPreviewingGuaranteeId] = useState<string | null>(null);
  const expiredCount = guarantees.filter(guarantee => guarantee.status === "Expired").length;
  const attentionCount = guarantees.filter(guarantee => guarantee.status === "Mendekati Expiry").length;
  const latestExpiry = guarantees.reduce((latest, guarantee) => guarantee.expiryDate < latest ? guarantee.expiryDate : latest, guarantees[0]?.expiryDate || "-");

  return (
    <>
      <tr
        onClick={() => setExpanded(value => !value)}
        className={`cursor-pointer transition-colors hover:bg-blue-50/40 ${expanded ? "bg-blue-50/30" : ""}`}
      >
        <td className="px-4 py-4">
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${expanded ? "bg-[#0a4d8c] text-white" : "bg-blue-50 text-[#0a4d8c]"}`}>
              <Folder size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-slate-800">{request.title}</div>
              <div className="mt-1 text-[11px] text-slate-500">{request.id} · {request.department.name} · {request.pic.name}</div>
            </div>
          </div>
        </td>
        <td className="px-4 py-4 text-sm font-semibold text-slate-700">{guarantees.length} jaminan</td>
        <td className="px-4 py-4 text-sm text-slate-600">{guarantees.map(guarantee => guarantee.value).join(" · ")}</td>
        <td className="px-4 py-4 text-sm font-medium text-slate-700">{latestExpiry}</td>
        <td className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-wrap gap-1.5">
              {expiredCount > 0 && <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">{expiredCount} expired</span>}
              {attentionCount > 0 && <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-[#0a4d8c]">{attentionCount} mendekati</span>}
              {expiredCount === 0 && attentionCount === 0 && <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Aman</span>}
            </div>
          </div>
        </td>
        <td className="px-4 py-4 text-right">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              router.push(`/dashboard/guarantees/upload?requestId=${request.id}`);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a4d8c] px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#093e6f]"
          >
            <Upload size={14} />
            Upload Jaminan
          </button>
        </td>
        <td className="px-2 py-4">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setExpanded(value => !value);
            }}
            aria-label={expanded ? "Tutup isi folder" : "Buka isi folder"}
            aria-expanded={expanded}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-[#0a4d8c] hover:text-[#0a4d8c]"
          >
            {expanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="border-b border-slate-200 bg-slate-50/70 p-0">
            <div className="space-y-2 px-5 py-4 sm:px-16">
              {guarantees.length === 0 && <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-5 text-center text-xs text-slate-500">Belum ada jaminan pada pengadaan ini. Gunakan tombol Upload Jaminan untuk menambahkan dokumen pertama.</div>}
              {guarantees.map(guarantee => (
                <div key={guarantee.id}>
                  <button onClick={() => setExpandedGuaranteeId(current => current === guarantee.id ? null : guarantee.id)} className="flex w-full flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-[#0a4d8c]/40 hover:bg-blue-50/40 sm:flex-row sm:items-center">
                    <FileText className="shrink-0 text-slate-400" size={17} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] font-medium text-slate-800">{guarantee.referenceNo} · {guarantee.type}</div>
                      <div className="mt-1 text-[11px] text-slate-500">{guarantee.vendor.name} · {guarantee.issuer} · Terbit {guarantee.issueDate} · Expiry {guarantee.expiryDate}</div>
                    </div>
                    <div className="text-sm font-medium text-slate-700">{guarantee.value}</div>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusClass(guarantee.status)}`}>{guarantee.status}</span>
                    {expandedGuaranteeId === guarantee.id ? <ChevronDown className="shrink-0 text-slate-400" size={16} /> : <ChevronRight className="shrink-0 text-slate-400" size={16} />}
                  </button>
                  {expandedGuaranteeId === guarantee.id && (
                    <div className="border-x border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-12">
                      <div className="grid grid-cols-1 gap-3 text-xs text-slate-600 sm:grid-cols-3">
                        <div><div className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Referensi</div><div className="mt-1">{guarantee.referenceNo}</div></div>
                        <div><div className="font-bold uppercase tracking-wider text-[10px] text-slate-400">PIC</div><div className="mt-1">{guarantee.pic.name}</div></div>
                        <div><div className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Hari tersisa</div><div className="mt-1">{calculateDaysRemaining(guarantee.expiryDate) < 0 ? `Terlewat ${Math.abs(calculateDaysRemaining(guarantee.expiryDate))} hari` : `${calculateDaysRemaining(guarantee.expiryDate)} hari lagi`}</div></div>
                        <div><div className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Penerbit</div><div className="mt-1">{guarantee.issuerType ? `${guarantee.issuerType} · ` : ""}{guarantee.issuer}</div></div>
                        <div className="sm:col-span-2"><div className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Penerima jaminan</div><div className="mt-1">{guarantee.beneficiary || "Belum diisi"}</div></div>
                      </div>
                      {guarantee.nextAction && <div className="mt-3 text-xs text-slate-600"><span className="font-semibold text-[#0a4d8c]">Next Action:</span> {guarantee.nextAction}</div>}
                      <button type="button" onClick={() => onEdit(guarantee)} className="mt-3 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-[#0a4d8c] hover:bg-blue-100">Koreksi Data Ekstraksi</button>
                      {guarantee.fileUrl && <button type="button" onClick={() => setPreviewingGuaranteeId(guarantee.id)} className="ml-2 mt-3 inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-[#0a4d8c] hover:text-[#0a4d8c]"><Eye size={13} /> Lihat Dokumen Asli</button>}
                      {previewingGuaranteeId === guarantee.id && <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2"><div className="flex min-w-0 items-center gap-2"><FileText size={15} className="shrink-0 text-[#0a4d8c]" /><span className="truncate text-xs font-semibold text-slate-700">{guarantee.fileUrl ? guarantee.fileUrl.split('/').pop() : "File belum tersedia"}</span></div><button type="button" onClick={() => setPreviewingGuaranteeId(null)} aria-label="Tutup preview dokumen" className="text-slate-400 hover:text-slate-700"><XCircle size={16} /></button></div><div className="relative h-96 overflow-hidden bg-slate-100"><iframe src={guarantee.fileUrl} className="w-full h-full border-0" title="Document Preview" /></div></div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

