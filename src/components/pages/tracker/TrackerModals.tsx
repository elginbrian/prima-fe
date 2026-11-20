import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, PlusCircle, AlertCircle } from "lucide-react";
import { DeadlineItem, BaseUser, Department } from "@/types";
import { useUsers } from "@/lib/query/hooks/users/useUsers";
import { useWorkflowStages } from "@/lib/query/hooks/procurement/useValidation";
import { parseRupiah, type AddRequestFormValues } from "@/lib/adapters/procurement.mutations";
import { Spinner, SearchableSelect } from "@/components/ui";

const DEPARTMENT_OPTIONS = [
  { id: "DEPT-IT", name: "IT Infrastructure" },
  { id: "DEPT-OPS", name: "Operations" },
  { id: "DEPT-HR", name: "Human Resources" },
  { id: "DEPT-CRE", name: "Creative" },
  { id: "DEPT-GA", name: "General Affairs" },
];

const FALLBACK_STEPS = [
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

const URGENCY_OPTIONS = [
  { value: "Low", label: "Rendah (Low)" },
  { value: "Medium", label: "Sedang (Medium)" },
  { value: "High", label: "Tinggi (High)" },
  { value: "Critical", label: "Kritis (Critical)" },
];

const PRIORITY_OPTIONS = [
  { value: "Normal", label: "Normal" },
  { value: "Urgent", label: "Urgent (Prioritas Tinggi)" },
];

export function DeadlineEditor({
  deadline,
  onClose,
  onSave,
  isSaving = false,
  errorMessage,
}: {
  deadline: DeadlineItem;
  onClose: () => void;
  onSave: (changes: Partial<DeadlineItem>) => void;
  isSaving?: boolean;
  errorMessage?: string | null;
}) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const { data: users } = useUsers();
  const [selectedPicId, setSelectedPicId] = useState(deadline.pic.id);
  const [formError, setFormError] = useState<string | null>(null);

  if (typeof document === "undefined") return null;

  const initialStartDate = deadline.startDate
    ? String(deadline.startDate).trim().split(/[\sT]/)[0]
    : "";
  const initialTargetDate = deadline.targetDate
    ? String(deadline.targetDate).trim().split(/[\sT]/)[0]
    : "";

  const userOptions = (users ?? []).map((u) => ({
    value: u.id,
    label: u.name,
    description: u.role,
    keywords: `${u.name} ${u.role || ""} ${u.id}`,
  }));

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex min-h-dvh items-center justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
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
          onSave({
            taskName: String(formData.get("taskName")),
            pic: {
              id: selectedPicId,
              name:
                users?.find((u) => u.id === selectedPicId)?.name ||
                deadline.pic.name,
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
            <p className="mt-1 text-xs text-slate-500">
              Atur rentang waktu dan tindak lanjut SLA.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>
        <div className="grid gap-5 p-6 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Nama aktivitas
            </span>
            <input
              required
              name="taskName"
              defaultValue={deadline.taskName}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50"
            />
          </label>
          <div>
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              PIC
            </span>
            <SearchableSelect
              value={selectedPicId}
              onChange={setSelectedPicId}
              placeholder="Pilih PIC..."
              searchPlaceholder="Cari nama PIC..."
              options={userOptions}
            />
          </div>
          <label>
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Milestone
            </span>
            <input
              required
              name="milestone"
              defaultValue={deadline.milestone}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50"
            />
          </label>
          <label>
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Tanggal mulai
            </span>
            <input
              type="date"
              name="startDate"
              defaultValue={initialStartDate}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50"
            />
          </label>
          <label>
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Target selesai
            </span>
            <input
              required
              type="date"
              name="targetDate"
              defaultValue={initialTargetDate}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50"
            />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Tindak lanjut
            </span>
            <textarea
              required
              name="nextAction"
              rows={3}
              defaultValue={deadline.nextAction ?? ""}
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50"
            />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Alasan keterlambatan
            </span>
            <textarea
              name="overdueReason"
              rows={2}
              defaultValue={deadline.overdueReason ?? ""}
              placeholder="Diisi bila SLA melewati target selesai"
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50"
            />
          </label>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
          {(formError || errorMessage) && (
            <p role="alert" className="mr-auto self-center text-xs font-semibold text-red-600">
              {formError || errorMessage}
            </p>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200/50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-lg bg-[#0a4d8c] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#093e6f] hover:shadow disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving && <Spinner size="xs" color="white" />}
            <span>{isSaving ? "Menyimpan..." : "Simpan SLA"}</span>
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}

export function DeadlineCreator({
  requestId,
  pic,
  department,
  onClose,
  onSave,
  isSaving = false,
  errorMessage,
}: {
  requestId: string;
  pic: BaseUser;
  department: Department;
  onClose: () => void;
  onSave: (deadline: Omit<DeadlineItem, "id">) => void;
  isSaving?: boolean;
  errorMessage?: string | null;
}) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const { data: users } = useUsers();
  const { data: workflowStages = [] } = useWorkflowStages();
  const [selectedPicId, setSelectedPicId] = useState(pic.id);
  const [selectedMilestone, setSelectedMilestone] = useState("Rapat Pra-Tender");
  const [selectedUrgency, setSelectedUrgency] = useState<DeadlineItem["urgencyLevel"]>("Medium");
  const [formError, setFormError] = useState<string | null>(null);
  const todayDate = new Date().toISOString().split("T")[0];

  const milestoneOptions = useMemo(() => {
    const seen = new Set<string>();
    const list: { value: string; label: string; description?: string }[] = [];
    workflowStages.forEach((s) => {
      if (!seen.has(s.step_name)) {
        seen.add(s.step_name);
        list.push({
          value: s.step_name,
          label: s.step_name,
          description: `${s.stage_group} · ${s.procurement_method}`,
        });
      }
    });
    if (list.length === 0) {
      FALLBACK_STEPS.forEach((step) => list.push({ value: step, label: step }));
    }
    return list;
  }, [workflowStages]);

  const userOptions = (users ?? []).map((u) => ({
    value: u.id,
    label: u.name,
    description: u.role,
    keywords: `${u.name} ${u.role || ""} ${u.id}`,
  }));

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex min-h-dvh items-center justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
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
          onSave({
            requestId,
            taskName: String(formData.get("taskName")),
            milestone: selectedMilestone,
            pic: {
              id: selectedPicId,
              name: users?.find((u) => u.id === selectedPicId)?.name || pic.name,
            },
            department,
            startDate: startDate || undefined,
            targetDate,
            status: "On Track",
            urgencyLevel: selectedUrgency,
            nextAction: String(formData.get("nextAction")),
          });
        }}
      >
        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Tambah SLA untuk Pekerjaan
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Isi aktivitas terlebih dahulu, lalu atur periode SLA.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>
        <div className="grid gap-5 p-6 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Nama aktivitas
            </span>
            <input
              required
              autoFocus
              name="taskName"
              placeholder="Contoh: Rapat pra-tender"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50"
            />
          </label>
          <div>
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              PIC
            </span>
            <SearchableSelect
              value={selectedPicId}
              onChange={setSelectedPicId}
              placeholder="Pilih PIC..."
              searchPlaceholder="Cari nama PIC..."
              options={userOptions}
            />
          </div>
          <div>
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Milestone / Tahapan
            </span>
            <SearchableSelect
              value={selectedMilestone}
              onChange={setSelectedMilestone}
              allowCustomValue
              placeholder="Pilih tahapan..."
              searchPlaceholder="Cari atau ketik tahapan..."
              options={milestoneOptions}
            />
          </div>
          <label>
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Tanggal mulai
            </span>
            <input
              required
              type="date"
              name="startDate"
              defaultValue={todayDate}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50"
            />
          </label>
          <label>
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Target selesai
            </span>
            <input
              required
              type="date"
              name="targetDate"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50"
            />
          </label>
          <div>
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Urgensi
            </span>
            <SearchableSelect
              value={selectedUrgency}
              onChange={(val) =>
                setSelectedUrgency(val as DeadlineItem["urgencyLevel"])
              }
              searchPlaceholder="Cari urgensi..."
              options={URGENCY_OPTIONS}
            />
          </div>
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Tindak lanjut
            </span>
            <textarea
              required
              name="nextAction"
              rows={3}
              placeholder="Tindakan yang harus dilakukan PIC"
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50"
            />
          </label>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
          {(formError || errorMessage) && (
            <p role="alert" className="mr-auto self-center text-xs font-semibold text-red-600">
              {formError || errorMessage}
            </p>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200/50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-lg bg-[#0a4d8c] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#093e6f] hover:shadow disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving && <Spinner size="xs" color="white" />}
            <span>{isSaving ? "Menyimpan..." : "Simpan SLA"}</span>
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}

export function AddRequestModal({
  onClose,
  onSave,
  isSaving = false,
  errorMessage,
}: {
  onClose: () => void;
  onSave: (values: AddRequestFormValues) => void;
  isSaving?: boolean;
  errorMessage?: string | null;
}) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const { data: users } = useUsers();
  const { data: workflowStages = [] } = useWorkflowStages();
  const [selectedPicId, setSelectedPicId] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("DEPT-IT");
  const [selectedMethod, setSelectedMethod] = useState("Tender Terbuka");
  const [selectedPriority, setSelectedPriority] = useState("Normal");
  const [formError, setFormError] = useState<string | null>(null);

  const methodOptions = useMemo(() => {
    const counts = new Map<string, number>();
    workflowStages.forEach((s) => {
      counts.set(s.procurement_method, (counts.get(s.procurement_method) || 0) + 1);
    });
    if (counts.size === 0) {
      return [
        { value: "Tender Terbuka", label: "Tender Terbuka (12 Tahapan)" },
        { value: "Pemilihan Langsung", label: "Pemilihan Langsung (8 Tahapan)" },
        { value: "Penunjukan Langsung", label: "Penunjukan Langsung (4 Tahapan)" },
      ];
    }
    return Array.from(counts.entries()).map(([method, count]) => ({
      value: method,
      label: `${method} (${count} Tahapan)`,
    }));
  }, [workflowStages]);

  const userOptions = (users ?? []).map((u) => ({
    value: u.id,
    label: u.name,
    description: u.role,
    keywords: `${u.name} ${u.role || ""} ${u.id}`,
  }));

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex min-h-dvh items-center justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-request-title"
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0a4d8c]">
              <PlusCircle size={20} />
            </div>
            <div>
              <h3 id="add-request-title" className="text-base font-bold text-slate-800">
                Tambah Paket Pengadaan Baru
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Inisiasi paket pekerjaan pengadaan baru
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const amount = parseRupiah(String(formData.get("amount")));
            if (amount === null || amount <= 0) {
              setFormError(
                "Nilai pengadaan tidak valid. Contoh: 150000000, Rp 150.000.000, atau 150 Jt."
              );
              return;
            }
            const picName = users?.find((u) => u.id === selectedPicId)?.name;
            if (!picName) {
              setFormError("PIC tidak ditemukan. Pilih PIC dari daftar.");
              return;
            }
            const department = DEPARTMENT_OPTIONS.find(
              (d) => d.id === selectedDepartmentId
            );
            if (!department) {
              setFormError("Pilih fungsi / departemen.");
              return;
            }
            setFormError(null);
            onSave({
              title: String(formData.get("title")),
              fppNumber: String(formData.get("fpp")),
              picId: selectedPicId,
              picName,
              amount,
              departmentId: department.id,
              departmentName: department.name,
              method: selectedMethod || "Tender Terbuka",
              isUrgent: selectedPriority === "Urgent",
            });
          }}
        >
          <div className="p-6">
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-blue-600" />
              <p className="text-xs leading-relaxed text-blue-800">
                Pastikan informasi yang dimasukkan sudah sesuai dengan dokumen pendukung (FPP). Request baru akan otomatis masuk ke tahap{" "}
                <strong className="font-bold">Persiapan</strong> dengan urutan tahapan sesuai konfigurasi metode pengadaan.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-2">
              <div className="col-span-2">
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Judul Pengadaan <span className="text-[#0a4d8c]">*</span>
                </label>
                <input
                  required
                  name="title"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50"
                  placeholder="Contoh: Pengadaan Perangkat Jaringan (Router/Switch)"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Nomor FPP <span className="text-[#0a4d8c]">*</span>
                </label>
                <input
                  required
                  name="fpp"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50"
                  placeholder="Contoh: FPP-2026-0801"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  PIC Procurement <span className="text-[#0a4d8c]">*</span>
                </label>
                <SearchableSelect
                  value={selectedPicId}
                  onChange={setSelectedPicId}
                  placeholder="Pilih PIC..."
                  searchPlaceholder="Cari nama PIC..."
                  options={userOptions}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Nilai Pengadaan <span className="text-[#0a4d8c]">*</span>
                </label>
                <input
                  required
                  name="amount"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-all focus:border-[#0a4d8c] focus:outline-none focus:ring-4 focus:ring-blue-100/50"
                  placeholder="Contoh: 150000000, Rp 150.000.000, atau 150 Jt"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Fungsi / Departemen <span className="text-[#0a4d8c]">*</span>
                </label>
                <SearchableSelect
                  value={selectedDepartmentId}
                  onChange={setSelectedDepartmentId}
                  searchPlaceholder="Cari departemen..."
                  options={DEPARTMENT_OPTIONS.map((d) => ({
                    value: d.id,
                    label: d.name,
                  }))}
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Metode Pengadaan <span className="text-[#0a4d8c]">*</span>
                </label>
                <SearchableSelect
                  value={selectedMethod}
                  onChange={setSelectedMethod}
                  searchPlaceholder="Cari metode pengadaan..."
                  options={methodOptions}
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Tingkat Prioritas <span className="text-[#0a4d8c]">*</span>
                </label>
                <SearchableSelect
                  value={selectedPriority}
                  onChange={setSelectedPriority}
                  searchPlaceholder="Cari prioritas..."
                  options={PRIORITY_OPTIONS}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/80 p-6">
            {(formError || errorMessage) && (
              <p role="alert" className="mr-auto text-xs font-semibold text-red-600">
                {formError || errorMessage}
              </p>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200/50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-lg bg-[#0a4d8c] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#093e6f] hover:shadow disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PlusCircle size={16} />
              {isSaving ? "Menyimpan..." : "Buat Request Baru"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
