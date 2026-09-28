import { useCurrentUser } from "@/lib/query/hooks/auth/useCurrentUser";

export function ProfileTab() {
  const { data: currentUser } = useCurrentUser();

  if (!currentUser) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Informasi Pengguna</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nama Lengkap</label>
          <input type="text" disabled defaultValue={currentUser.name} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 font-medium cursor-not-allowed" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fungsi / Departemen</label>
          <input type="text" disabled defaultValue={currentUser.department?.name ?? "-"} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 font-medium cursor-not-allowed" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Pertamina</label>
          <input type="email" disabled defaultValue={currentUser.email} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 font-medium cursor-not-allowed" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Peran (Role)</label>
          <input type="text" disabled defaultValue={currentUser.role} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 font-medium cursor-not-allowed" />
        </div>
      </div>
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-4 text-sm text-blue-800">
        Untuk mengubah profil, Anda harus memperbarui data di portal HRIS MyPertamina.
      </div>
    </div>
  );
}
