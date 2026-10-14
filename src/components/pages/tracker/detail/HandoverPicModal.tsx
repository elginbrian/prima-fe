import { ArrowRightLeft } from "lucide-react";
import { Spinner } from "@/components/ui";

interface HandoverPicModalProps {
  currentPic: { id: string; name: string };
  usersList?: Array<{ id: string; name: string; role?: string; email?: string }>;
  targetPicId: string;
  setTargetPicId: (val: string) => void;
  handoverNotes: string;
  setHandoverNotes: (val: string) => void;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

export function HandoverPicModal({
  currentPic,
  usersList,
  targetPicId,
  setTargetPicId,
  handoverNotes,
  setHandoverNotes,
  isSubmitting,
  onCancel,
  onSubmit,
}: HandoverPicModalProps) {
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-blue-100 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-blue-50 p-2.5 text-[#0a4d8c]">
            <ArrowRightLeft size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-base font-bold text-slate-800">Delegasi & Handover PIC</h4>
            <p className="mt-1 text-xs text-slate-500">
              Alihkan tanggung jawab pengadaan kepada personel lain secara resmi. Perubahan akan dicatat pada Log Audit.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
          <div>
            PIC Saat Ini: <strong className="text-slate-800">{currentPic.name}</strong> ({currentPic.id})
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pilih PIC Baru <span className="text-red-500">*</span>
            </label>
            <select
              value={targetPicId}
              onChange={(e) => setTargetPicId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-[#0a4d8c] focus:outline-none"
            >
              <option value="">-- Pilih Personel PIC --</option>
              {usersList
                ?.filter((u) => u.id !== currentPic.id)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role || u.email || u.id})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Serah Terima (Handover Notes) <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={handoverNotes}
              onChange={(e) => setHandoverNotes(e.target.value)}
              placeholder="Contoh: Delegasi tugas karena cuti dinas s.d 25 Oktober 2026. File warkat asli tersimpan di lemari arsip lt. 3."
              className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-700 focus:border-[#0a4d8c] focus:outline-none"
            />
          </div>
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
            disabled={isSubmitting || !targetPicId || !handoverNotes.trim()}
            onClick={onSubmit}
            className="flex items-center gap-1.5 rounded-lg bg-[#0a4d8c] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#093e6f] disabled:opacity-50"
          >
            {isSubmitting && <Spinner size="xs" color="white" />}
            <span>{isSubmitting ? "Memproses..." : "Konfirmasi Delegasi"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
