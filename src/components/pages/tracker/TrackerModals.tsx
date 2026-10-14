import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, PlusCircle, AlertCircle } from "lucide-react";
import { DeadlineItem, ProcurementStep, BaseUser, Department } from "@/types";
import { useUsers } from "@/lib/query/hooks/users/useUsers";
import { parseRupiah, type AddRequestFormValues } from "@/lib/adapters/procurement.mutations";
import { Spinner } from "@/components/ui";

const DEPARTMENT_OPTIONS = [
  { id: "DEPT-IT", name: "IT Infrastructure" },
  { id: "DEPT-OPS", name: "Operations" },
  { id: "DEPT-HR", name: "Human Resources" },
  { id: "DEPT-CRE", name: "Creative" },
  { id: "DEPT-GA", name: "General Affairs" },
];

const PROCUREMENT_STEPS: ProcurementStep[] = [
  "Rapat Pra-Tender",
  "Pengumuman Pengadaan",
  "Prebid Meeting",
  "Pemasukan Dokumen Penawaran",
  "Pembukaan Penawaran",
  "Evaluasi Dokumen Penawaran",
  "Sosialisasi e-Auction",
  "Negosiasi e-Auction",
  "Negosiasi Manual",
  "Laporan Hasil Pemilihan",
  "Pengumuman Pemenang",
  "Penunjukan Pemenang",
];

export function DeadlineEditor({ deadline, onClose, onSave, isSaving = false, errorMessage }: { deadline: DeadlineItem; onClose: () => void; onSave: (changes: Partial<DeadlineItem>) => void; isSaving?: boolean; errorMessage?: string | null }) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const { data: users } = useUsers();
  const [formError, setFormError] = useState<string | null>(null);
  
  if (typeof document === 'undefined') return null;
  
  const initialStartDate = deadline.startDate ? String(deadline.startDate).split("T")[0] : "";
  const initialTargetDate = deadline.targetDate ? String(deadline.targetDate).split("T")[0] : "";

  return createPortal(
    <div className="fixed inset-0 z-[100] flex min-h-dvh items-center justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300" onClick={onClose}>
      <form 
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300 ease-out" 
        onClick={(event) => event.stopPropagation()} 
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const startDate = String(formData.get("startDate") || "").trim();
          const targetDate = String(formData.get("targetDate") || "").trim();
          if (startDate && targetDate && targetDate < startDate) {
            setFormError("Target selesai tidak boleh lebih awal dari tanggal mulai.");
            return;
          }
          setFormError(null);
          const picId = String(formData.get("pic"));
          onSave({
            taskName: String(formData.get("taskName")),
            pic: { 
              id: picId, 
              name: users?.find(u => u.id === picId)?.name || deadline.pic.name 
            },
            milestone: String(formData.get("milestone")),
            startDate: startDate || undefined,
            targetDate,
            nextAction: String(formData.get("nextAction")),
            overdueReason: String(formData.get("overdueReason")),
          });
        }}
      >
        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
          <div>
            <h2 className="text-base font-bold text-slate-800">Edit SLA Pekerjaan</h2>
            <p className="mt-1 text-xs text-slate-500">Atur rentang waktu dan tindak lanjut SLA.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>
        <div className="grid gap-5 p-6 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Nama aktivitas</span><input required name="taskName" defaultValue={deadline.taskName} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50" /></label>
          <label><span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">PIC</span>
            <select required name="pic" defaultValue={deadline.pic.id} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50">
              {users?.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </label>
          <label><span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Milestone</span><input required name="milestone" defaultValue={deadline.milestone} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50" /></label>
          <label><span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Tanggal mulai</span><input type="date" name="startDate" defaultValue={initialStartDate} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50" /></label>
          <label><span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Target selesai</span><input required type="date" name="targetDate" defaultValue={initialTargetDate} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50" /></label>
          <label className="sm:col-span-2"><span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Next action</span><textarea required name="nextAction" rows={3} defaultValue={deadline.nextAction ?? ""} className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50" /></label>
          <label className="sm:col-span-2"><span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Alasan keterlambatan</span><textarea name="overdueReason" rows={2} defaultValue={deadline.overdueReason ?? ""} placeholder="Diisi bila SLA melewati target selesai" className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50" /></label>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
          {(formError || errorMessage) && <p role="alert" className="mr-auto self-center text-xs font-semibold text-red-600">{formError || errorMessage}</p>}
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200/50">Batal</button>
          <button type="submit" disabled={isSaving} className="flex items-center gap-1.5 rounded-lg bg-[#0a4d8c] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#093e6f] hover:shadow disabled:cursor-not-allowed disabled:opacity-60">{isSaving && <Spinner size="xs" color="white" />}<span>{isSaving ? "Menyimpan..." : "Simpan SLA"}</span></button>
        </div>
      </form>
    </div>
  , document.body);
}

export function DeadlineCreator({ requestId, pic, department, onClose, onSave, isSaving = false, errorMessage }: { requestId: string; pic: BaseUser; department: Department; onClose: () => void; onSave: (deadline: Omit<DeadlineItem, "id">) => void; isSaving?: boolean; errorMessage?: string | null }) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const { data: users } = useUsers();
  const [formError, setFormError] = useState<string | null>(null);
  const todayDate = new Date().toISOString().split("T")[0];

  if (typeof document === 'undefined') return null;
  
  return createPortal(
    <div className="fixed inset-0 z-[100] flex min-h-dvh items-center justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300" onClick={onClose}>
      <form className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300 ease-out" onClick={(event) => event.stopPropagation()} onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const startDate = String(formData.get("startDate") || "").trim();
        const targetDate = String(formData.get("targetDate") || "").trim();
        if (startDate && targetDate && targetDate < startDate) { setFormError("Target selesai tidak boleh lebih awal dari tanggal mulai."); return; }
        setFormError(null);
        const picId = String(formData.get("pic"));
        onSave({ 
          requestId, 
          taskName: String(formData.get("taskName")), 
          milestone: String(formData.get("milestone")), 
          pic: { id: picId, name: users?.find(u => u.id === picId)?.name || "" }, 
          department, 
          startDate: startDate || undefined, 
          targetDate, 
          status: "On Track", 
          urgencyLevel: formData.get("urgencyLevel") as DeadlineItem["urgencyLevel"], 
          nextAction: String(formData.get("nextAction")), 
          overdueReason: String(formData.get("overdueReason")) 
        });
      }}>
        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
          <div>
            <h2 className="text-base font-bold text-slate-800">Tambah SLA untuk Pekerjaan</h2>
            <p className="mt-1 text-xs text-slate-500">Isi aktivitas terlebih dahulu, lalu atur periode SLA.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>
        <div className="grid gap-5 p-6 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Nama aktivitas</span><input required autoFocus name="taskName" placeholder="Contoh: Rapat pra-tender" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50" /></label>
          <label><span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">PIC</span>
            <select required name="pic" defaultValue={pic.id} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50">
              {users?.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </label>
          <label><span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Milestone</span><select required name="milestone" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50">{PROCUREMENT_STEPS.map(step => <option key={step} value={step}>{step}</option>)}</select></label>
          <label><span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Tanggal mulai</span><input required type="date" name="startDate" defaultValue={todayDate} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50" /></label>
          <label><span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Target selesai</span><input required type="date" name="targetDate" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50" /></label>
          <label><span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Urgensi</span><select name="urgencyLevel" defaultValue="Medium" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50"><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></label>
          <label className="sm:col-span-2"><span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Next action</span><textarea required name="nextAction" rows={3} placeholder="Tindakan yang harus dilakukan PIC" className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50" /></label>
          <label className="sm:col-span-2"><span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Alasan keterlambatan</span><textarea name="overdueReason" rows={2} placeholder="Opsional; isi bila target nantinya terlambat" className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50" /></label>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
          {(formError || errorMessage) && <p role="alert" className="mr-auto self-center text-xs font-semibold text-red-600">{formError || errorMessage}</p>}
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200/50">Batal</button>
          <button type="submit" disabled={isSaving} className="flex items-center gap-1.5 rounded-lg bg-[#0a4d8c] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#093e6f] hover:shadow disabled:cursor-not-allowed disabled:opacity-60">{isSaving && <Spinner size="xs" color="white" />}<span>{isSaving ? "Menyimpan..." : "Simpan SLA"}</span></button>
        </div>
      </form>
    </div>
  , document.body);
}

export function AddRequestModal({ onClose, onSave, isSaving = false, errorMessage }: { onClose: () => void; onSave: (values: AddRequestFormValues) => void; isSaving?: boolean; errorMessage?: string | null }) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const { data: users } = useUsers();
  const [formError, setFormError] = useState<string | null>(null);

  if (typeof document === 'undefined') return null;
  
  return createPortal(
    <div className="fixed inset-0 z-[100] flex min-h-dvh items-center justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="add-request-title" className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300 ease-out" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0a4d8c]">
              <PlusCircle size={20} />
            </div>
            <div>
              <h3 id="add-request-title" className="text-base font-bold text-slate-800">Tambah Request Baru</h3>
              <p className="mt-0.5 text-xs text-slate-500">Inisiasi pekerjaan pengadaan baru</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const picId = String(formData.get("pic"));
          const amount = parseRupiah(String(formData.get("amount")));
          if (amount === null || amount <= 0) {
            setFormError("Nilai pengadaan tidak valid. Contoh: 150000000, Rp 150.000.000, atau 150 Jt.");
            return;
          }
          const picName = users?.find(u => u.id === picId)?.name;
          if (!picName) {
            setFormError("PIC tidak ditemukan. Pilih PIC dari daftar.");
            return;
          }
          const department = DEPARTMENT_OPTIONS.find(d => d.id === String(formData.get("department")));
          if (!department) {
            setFormError("Pilih fungsi / departemen.");
            return;
          }
          setFormError(null);
          onSave({
            title: String(formData.get("title")),
            fppNumber: String(formData.get("fpp")),
            picId,
            picName,
            amount,
            departmentId: department.id,
            departmentName: department.name,
            method: String(formData.get("method") || "Tender Terbuka"),
            isUrgent: String(formData.get("priority")) === "Urgent",
          });
        }}>
          <div className="p-6">
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-blue-600" />
              <p className="text-xs leading-relaxed text-blue-800">
                Pastikan informasi yang dimasukkan sudah sesuai dengan dokumen pendukung (FPP). Request baru akan otomatis masuk ke tahap <strong className="font-bold">Persiapan</strong> dengan jumlah tahapan sesuai metode pengadaan yang dipilih.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-2">
              <div className="col-span-2">
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Judul Pengadaan <span className="text-red-500">*</span></label>
                <input required name="title" className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50" placeholder="Contoh: Pengadaan Perangkat Jaringan (Router/Switch)" />
              </div>
              
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Nomor FPP <span className="text-red-500">*</span></label>
                <input required name="fpp" className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50" placeholder="Contoh: FPP-2026-0801" />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">PIC Procurement <span className="text-red-500">*</span></label>
                <select required name="pic" className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50">
                  <option value="">Pilih PIC</option>
                  {users?.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Nilai Pengadaan <span className="text-red-500">*</span></label>
                <input required name="amount" className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50" placeholder="Contoh: 150000000, Rp 150.000.000, atau 150 Jt" />
              </div>
              
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Fungsi / Departemen <span className="text-red-500">*</span></label>
                <select required name="department" className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50">
                  {DEPARTMENT_OPTIONS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Metode Pengadaan <span className="text-red-500">*</span></label>
                <select required name="method" defaultValue="Tender Terbuka" className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50">
                  <option value="Tender Terbuka">Tender Terbuka (12 Tahapan)</option>
                  <option value="Pemilihan Langsung">Pemilihan Langsung (8 Tahapan)</option>
                  <option value="Penunjukan Langsung">Penunjukan Langsung (4 Tahapan)</option>
                </select>
              </div>
              
              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Tingkat Prioritas <span className="text-red-500">*</span></label>
                <select required name="priority" className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50">
                  <option value="Normal">Normal</option>
                  <option value="Urgent">Urgent (Prioritas Tinggi)</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/80 p-6">
            {(formError || errorMessage) && <p role="alert" className="mr-auto text-xs font-semibold text-red-600">{formError || errorMessage}</p>}
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200/50">Batal</button>
            <button type="submit" disabled={isSaving} className="flex items-center gap-2 rounded-lg bg-[#0a4d8c] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#093e6f] hover:shadow disabled:cursor-not-allowed disabled:opacity-60">
              <PlusCircle size={16} />
              {isSaving ? "Menyimpan..." : "Buat Request Baru"}
            </button>
          </div>
        </form>
      </div>
    </div>
  , document.body);
}
