"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, AlertCircle, CheckCircle2, XCircle, Sparkles, Eye } from "lucide-react";
import { DocumentItem, DocumentStatus } from "@/types";
import { useProcurement } from "@/context/ProcurementContext";
import { useUpdateDocumentStatus } from "@/lib/query/hooks/procurement/useProcurement";
import { useToast } from "@/components/ui/Toast";
import { getErrorMessage } from "@/lib/api/errors";
import { useRouter } from "next/navigation";
import { DocumentPreviewModal } from "./DocumentPreviewModal";

interface DocumentActionModalProps {
  doc: DocumentItem;
  onClose: () => void;
}

const STATUS_LABELS: { value: DocumentStatus; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "Lulus Verifikasi", label: "Lulus Verifikasi", icon: <CheckCircle2 size={14} />, color: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" },
  { value: "Catatan Procurement", label: "Catatan Procurement", icon: <AlertCircle size={14} />, color: "bg-blue-50 text-[#0a4d8c] border-blue-200 hover:bg-blue-100" },
  { value: "Tindak Lanjut FPP", label: "Tindak Lanjut FPP", icon: <XCircle size={14} />, color: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" },
];

export function DocumentActionModal({ doc, onClose }: DocumentActionModalProps) {
  const { updateDocumentStatus } = useProcurement();
  const updateDocMutation = useUpdateDocumentStatus();
  const toast = useToast();
  const router = useRouter();
  const [selected, setSelected] = useState<DocumentStatus>(doc.status);
  const [showPreview, setShowPreview] = useState<boolean>(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleSave = async () => {
    if (selected !== doc.status) {
      try {
        await updateDocMutation.mutateAsync({ id: doc.id, status: selected });
        updateDocumentStatus(doc.id, selected);
        toast.success(`Status dokumen berhasil diperbarui ke "${selected}"`);
      } catch (err) {
        toast.error(`Gagal memperbarui status dokumen: ${getErrorMessage(err)}`);
        return;
      }
    }
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex min-h-dvh items-center justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-6 sm:p-8 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300 ease-out"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5 gap-4">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-800 truncate">{doc.name}</h2>
            <p className="mt-1 text-xs text-slate-500">{doc.id} · {doc.type} · Diunggah: {doc.uploadDate}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Issues */}
          {doc.issues && doc.issues.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={15} className="text-red-500 shrink-0" />
                <h4 className="text-[13px] font-semibold text-slate-800">Temuan Pemeriksaan</h4>
              </div>
              <ul className="list-disc list-outside space-y-1.5 pl-5 text-[13px] text-slate-600 leading-relaxed">
                {doc.issues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Next Action */}
          {doc.nextAction && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={14} className="text-[#0a4d8c]" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0a4d8c]">Next Action</span>
              </div>
              <p className="text-[13px] text-slate-700 leading-relaxed">{doc.nextAction}</p>
            </div>
          )}

          {/* Status Update */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Update Status Dokumen</div>
            <div className="flex flex-wrap gap-2">
              {STATUS_LABELS.map(({ value, label, icon, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelected(value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${color} ${selected === value ? "ring-2 ring-offset-1 ring-current opacity-100" : "opacity-70"}`}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#0a4d8c] hover:underline"
            >
              <Eye size={14} />
              <span>Pratinjau File</span>
            </button>
            <button
              type="button"
              onClick={() => { router.push(`/dashboard/documents/result?id=${doc.id}`); onClose(); }}
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-[#0a4d8c] transition-colors font-medium"
            >
              <span className="underline underline-offset-4 decoration-slate-300">Hasil Pemeriksaan</span>
            </button>
          </div>
          <div className="flex gap-2.5">
            <button type="button" onClick={onClose} disabled={updateDocMutation.isPending} className="rounded-lg px-3.5 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200/50 disabled:opacity-50">Batal</button>
            <button type="button" onClick={handleSave} disabled={updateDocMutation.isPending} className="rounded-lg bg-[#0a4d8c] px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#093e6f] disabled:opacity-50">
              {updateDocMutation.isPending ? "Menyimpan..." : "Simpan Status"}
            </button>
          </div>
        </div>
      </div>
      {showPreview && (
        <DocumentPreviewModal
          title={doc.name}
          fileId={doc.id}
          fileType="document"
          directUrl={doc.fileUrl}
          fileName={doc.name}
          metadata={[
            { label: "Nomor Dokumen", value: doc.id },
            { label: "Tipe", value: doc.type },
            { label: "PIC", value: doc.pic.name },
            { label: "Tanggal Upload", value: doc.uploadDate },
            { label: "Status", value: doc.status },
          ]}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>,
    document.body
  );
}
