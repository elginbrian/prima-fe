import { PauseCircle } from "lucide-react";
import type { ProcurementOperationalStatus } from "@/types";

interface StatusReasonPanelProps {
  status: ProcurementOperationalStatus;
  reasonDraft: string;
  setReasonDraft: (val: string) => void;
  onSave: () => void;
}

/** Reason input shown for non-"On Going" statuses, plus the SLA-paused notice for "On Hold". */
export function StatusReasonPanel({ status, reasonDraft, setReasonDraft, onSave }: StatusReasonPanelProps) {
  return (
    <div className="mt-4 border-t border-blue-100 pt-4">
      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
        Alasan status {status}
      </label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          value={reasonDraft}
          onChange={(event) => setReasonDraft(event.target.value)}
          placeholder={status === "On Hold" ? "Contoh: menunggu persetujuan anggaran tambahan" : "Contoh: kebutuhan dibatalkan peminta"}
          className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-[#0a4d8c] focus:outline-none"
        />
        <button
          type="button"
          onClick={onSave}
          className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-[#0a4d8c] hover:bg-blue-50"
        >
          Simpan Alasan
        </button>
      </div>
      {status === "On Hold" && (
        <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/90 p-3 text-xs text-amber-900">
          <PauseCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span className="font-bold">Perhitungan SLA Sedang Dijeda (Paused):</span>
            <p className="mt-0.5 text-[11px] leading-relaxed text-amber-800">
              Pengadaan berstatus <strong>On Hold</strong>. Jam kerja dan penalti batas waktu SLA dibekukan sementara.
              Saat status kembali diaktifkan ke <strong>On Going</strong>, seluruh target tanggal deadline aktif akan diperpanjang secara otomatis sesuai durasi penundaan.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
