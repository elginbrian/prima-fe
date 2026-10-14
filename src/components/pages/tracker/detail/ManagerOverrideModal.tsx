import { ShieldAlert } from "lucide-react";
import type { ProcurementStep } from "@/types";
import type { GatekeeperCheckDto } from "@/lib/api/procurement.api";
import { Spinner } from "@/components/ui";

interface ManagerOverrideModalProps {
  pendingStep: ProcurementStep;
  gatekeeperData?: GatekeeperCheckDto;
  overrideReason: string;
  setOverrideReason: (val: string) => void;
  isOverriding: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ManagerOverrideModal({
  pendingStep,
  gatekeeperData,
  overrideReason,
  setOverrideReason,
  isOverriding,
  onCancel,
  onConfirm,
}: ManagerOverrideModalProps) {
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-rose-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-rose-100 p-2.5 text-rose-600">
            <ShieldAlert size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-base font-bold text-slate-800">
              Otorisasi Manager (Gatekeeper Override)
            </h4>
            <p className="mt-1 text-xs text-slate-600">
              Tahap pengadaan ini memiliki kendala prasyarat yang belum terselesaikan. Memindahkan tahap ke{" "}
              <strong>&apos;{pendingStep}&apos;</strong> memerlukan otorisasi manajerial dan akan tercatat permanen pada Log Audit.
            </p>
          </div>
        </div>

        {gatekeeperData?.blockers && gatekeeperData.blockers.length > 0 && (
          <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50/60 p-3.5 space-y-2 max-h-48 overflow-y-auto">
            <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
              Kendala Aktif:
            </div>
            {gatekeeperData.blockers.map((b, i) => (
              <div key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                <span className="text-rose-500 font-bold">•</span>
                <span>
                  <strong>{b.title}</strong>: {b.description}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Alasan Otorisasi / Override <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            placeholder="Contoh: Disetujui Manager Procurement berdasarkan Memo No. MEMO-123 karena verifikasi fisik paralel."
            className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:border-[#0a4d8c] focus:outline-none focus:ring-1 focus:ring-[#0a4d8c]"
          />
        </div>

        <div className="mt-6 flex justify-end gap-2.5 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isOverriding || !overrideReason.trim()}
            onClick={onConfirm}
            className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
          >
            {isOverriding && <Spinner size="xs" color="white" />}
            <span>{isOverriding ? "Menyimpan..." : "Konfirmasi Override & Lanjutkan"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
