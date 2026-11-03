import { SettingsTabProps } from "./types";

export function NotificationTab({ formData, handleChange, users }: SettingsTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <h2 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-2.5">
        Preferensi Notifikasi
      </h2>

      <div className="space-y-3.5">
        <div
          className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-white hover:border-[#0a4d8c]/50 transition-colors cursor-pointer"
          onClick={() => handleChange("emailNotifications", !formData.emailNotifications)}
        >
          <div>
            <div className="font-medium text-slate-800 text-sm">Notifikasi Email</div>
            <div className="text-xs font-normal text-slate-500 mt-0.5">
              Kirim ringkasan jadwal SLA dan daftar tindak lanjut harian ke email.
            </div>
          </div>
          <div
            className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${
              formData.emailNotifications ? "bg-[#0a4d8c]" : "bg-slate-200"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                formData.emailNotifications ? "left-6" : "left-1"
              }`}
            />
          </div>
        </div>

        <div
          className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-white hover:border-[#0a4d8c]/50 transition-colors cursor-pointer"
          onClick={() => handleChange("whatsappNotifications", !formData.whatsappNotifications)}
        >
          <div>
            <div className="font-medium text-slate-800 text-sm">Notifikasi WhatsApp</div>
            <div className="text-xs font-normal text-slate-500 mt-0.5">
              Kirim peringatan instan saat SLA mendekati batas waktu atau warkat jaminan mendekati kedaluwarsa.
            </div>
          </div>
          <div
            className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${
              formData.whatsappNotifications ? "bg-[#0a4d8c]" : "bg-slate-200"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                formData.whatsappNotifications ? "left-6" : "left-1"
              }`}
            />
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl bg-white overflow-hidden transition-all">
          <div
            className="flex items-center justify-between p-4 hover:bg-slate-50/60 transition-colors cursor-pointer"
            onClick={() => handleChange("autoEscalation", !formData.autoEscalation)}
          >
            <div>
              <div className="font-medium text-slate-800 text-sm">Eskalasi Otomatis ke Atasan</div>
              <div className="text-xs font-normal text-slate-500 mt-0.5">
                Otomatiskan pemberitahuan eskalasi pekerjaan jika jadwal SLA terlewat.
              </div>
            </div>
            <div
              className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${
                formData.autoEscalation ? "bg-[#0a4d8c]" : "bg-slate-200"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                  formData.autoEscalation ? "left-6" : "left-1"
                }`}
              />
            </div>
          </div>
          {formData.autoEscalation && (
            <div className="px-5 pb-5 pt-4 border-t border-slate-100 bg-slate-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                    Batas Hari Keterlambatan
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={14}
                      value={formData.autoEscalateDays || 3}
                      onChange={(e) =>
                        handleChange("autoEscalateDays", parseInt(e.target.value) || 3)
                      }
                      className="w-20 px-3 py-2 text-sm font-normal bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0a4d8c]"
                    />
                    <span className="text-xs font-normal text-slate-600">Hari</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                    Manajer Tujuan Eskalasi
                  </label>
                  <select
                    value={formData.escalationManagerId || ""}
                    onChange={(e) => handleChange("escalationManagerId", e.target.value)}
                    className="w-full px-3 py-2 text-sm font-normal bg-white text-slate-700 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0a4d8c]"
                  >
                    <option value="" disabled>
                      Pilih Manajer...
                    </option>
                    {users
                      ?.filter(
                        (u) =>
                          u.role.includes("Manager") ||
                          u.role.includes("Admin") ||
                          u.role.includes("Reviewer")
                      )
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
