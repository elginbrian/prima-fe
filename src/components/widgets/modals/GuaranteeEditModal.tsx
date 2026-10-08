"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { GuaranteeItem } from "@/types";
import { useProcurement } from "@/context/ProcurementContext";
import { useUpdateGuarantee } from "@/lib/query/hooks/procurement/useGuarantees";

interface GuaranteeEditModalProps {
  guarantee: GuaranteeItem;
  onClose: () => void;
}

export function GuaranteeEditModal({ guarantee, onClose }: GuaranteeEditModalProps) {
  const updateGuarantee = useUpdateGuarantee();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex min-h-dvh items-center justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <form
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300 ease-out"
        onClick={e => e.stopPropagation()}
        onSubmit={e => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          updateGuarantee.mutate({
            id: guarantee.id,
            payload: {
              issuer_type: fd.get("issuerType") as string,
              issuer: String(fd.get("issuer")),
              reference_no: String(fd.get("referenceNo")),
              beneficiary: String(fd.get("beneficiary")),
              vendor_id: "VND-EDIT",
              vendor_name: String(fd.get("vendor")),
              value: Number(String(fd.get("value")).replace(/\D/g, "")),
              issue_date: String(fd.get("issueDate")),
              expiry_date: String(fd.get("expiryDate")),
            }
          });
          onClose();
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
          <div>
            <h2 className="text-base font-bold text-slate-800">Perbarui Data Jaminan</h2>
            <p className="mt-1 text-xs text-slate-500">{guarantee.referenceNo} · {guarantee.type}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="grid gap-5 p-6 sm:grid-cols-2">
          <label>
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Jenis penerbit</span>
            <select name="issuerType" defaultValue={guarantee.issuerType ?? "Bank"} className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50">
              <option>Bank</option>
              <option>Asuransi</option>
              <option>Lainnya</option>
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Nama penerbit</span>
            <input required name="issuer" defaultValue={guarantee.issuer} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50" />
          </label>
          <label>
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Nomor jaminan</span>
            <input required name="referenceNo" defaultValue={guarantee.referenceNo} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50" />
          </label>
          <label>
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Penerima jaminan</span>
            <input name="beneficiary" defaultValue={guarantee.beneficiary ?? ""} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50" />
          </label>
          <label>
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Vendor</span>
            <input required name="vendor" defaultValue={guarantee.vendor.name} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50" />
          </label>
          <label>
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Nilai jaminan</span>
            <input required name="value" defaultValue={guarantee.value} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50" />
          </label>
          <label>
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Tanggal terbit</span>
            <input required type="date" name="issueDate" defaultValue={guarantee.issueDate} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50" />
          </label>
          <label>
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Expiry date</span>
            <input required type="date" name="expiryDate" defaultValue={guarantee.expiryDate} className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50" />
          </label>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/80 p-6">
          <button type="button" onClick={onClose} className="rounded-lg px-5 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200/50">Batal</button>
          <button type="submit" className="rounded-lg bg-[#0a4d8c] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#093e6f] hover:shadow">Simpan Perbaruan</button>
        </div>
      </form>
    </div>,
    document.body
  );
}
