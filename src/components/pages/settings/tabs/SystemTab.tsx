import { SettingsTabProps } from "./types";
import { formatRupiah } from "@/lib/utils";

export function SystemTab({ formData, handleChange, users }: SettingsTabProps) {
  return (
    <div className="space-y-10 animate-in fade-in duration-200">
      {/* Workflow Section */}
      <section>
        <h2 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-2.5 mb-5">
          Otorisasi & Persetujuan
        </h2>

        <div className="mb-7">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Ambang Batas Nilai Persetujuan Otomatis
          </label>
          <p className="text-xs font-normal text-slate-500 mb-3">
            Pengadaan di atas nilai ini membutuhkan persetujuan berjenjang ekstra.
          </p>
          <div className="flex items-center max-w-sm">
            <span className="text-sm font-medium text-slate-500 bg-slate-50 border border-slate-200 border-r-0 px-3 py-2 rounded-l-lg">
              Rp
            </span>
            <input
              type="number"
              value={formData.approvalThreshold || 0}
              onChange={(e) =>
                handleChange("approvalThreshold", parseInt(e.target.value) || 0)
              }
              className="w-full px-3.5 py-2 border border-slate-200 rounded-r-lg focus:outline-none focus:border-[#0a4d8c] text-sm text-slate-800 font-normal"
            />
          </div>
          {Number(formData.approvalThreshold) > 0 && (
            <p className="mt-1.5 text-xs font-normal text-slate-500">
              Terbaca:{" "}
              <span className="font-medium text-slate-700">
                {formatRupiah(formData.approvalThreshold)}
              </span>
            </p>
          )}
        </div>

        <div className="pt-6 border-t border-slate-100">
          <h3 className="text-sm font-medium text-slate-800 mb-4">
            Penelaah Utama (Reviewer) per Departemen
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { id: "DEPT-IT", name: "IT Infrastructure" },
              { id: "DEPT-OPS", name: "Operations" },
              { id: "DEPT-HR", name: "Human Resources" },
              { id: "DEPT-GA", name: "General Affairs" },
            ].map((dept) => {
              const currentReviewer = formData.departmentReviewers?.[dept.id] || "";

              return (
                <div
                  key={dept.id}
                  className="bg-white border border-slate-200 rounded-lg p-4 hover:border-[#0a4d8c]/40 transition-colors"
                >
                  <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                    {dept.name}
                  </label>
                  <select
                    value={currentReviewer}
                    onChange={(e) => {
                      const newReviewers = { ...(formData.departmentReviewers || {}) };
                      newReviewers[dept.id] = e.target.value;
                      handleChange("departmentReviewers", newReviewers);
                    }}
                    className="w-full px-3 py-2 text-sm font-normal text-slate-700 border border-slate-200 rounded-md focus:outline-none focus:border-[#0a4d8c]"
                  >
                    <option value="" disabled>
                      Pilih Reviewer...
                    </option>
                    {users
                      ?.filter(
                        (u) =>
                          u.role.includes("Reviewer") ||
                          u.role.includes("Manager") ||
                          u.role.includes("Admin")
                      )
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SLA Section */}
      <section>
        <h2 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-2.5 mb-5">
          Toleransi & Peringatan SLA
        </h2>
        <div className="mb-7">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Ambang Batas Peringatan Risiko (At Risk)
          </label>
          <p className="text-xs font-normal text-slate-500 mb-3">
            Notifikasi peringatan akan muncul ketika batas waktu tersisa kurang dari jumlah hari berikut.
          </p>
          <div className="flex items-center gap-2.5">
            <input
              type="number"
              min={1}
              max={14}
              value={formData.slaWarningDays}
              onChange={(e) =>
                handleChange("slaWarningDays", parseInt(e.target.value) || 3)
              }
              className="w-20 px-3.5 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0a4d8c] text-sm text-slate-800 font-normal"
            />
            <span className="text-xs font-normal text-slate-600">
              Hari sebelum jatuh tempo
            </span>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100">
          <h3 className="text-sm font-medium text-slate-800 mb-4">
            Standar Durasi Tahapan (Milestone)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {[
              "Evaluasi Teknis",
              "Prakualifikasi",
              "Penyusunan Kontrak (Contracting)",
              "Tender / Sourcing",
            ].map((milestone) => {
              const currentDuration = formData.milestoneDurations?.[milestone] || 0;
              return (
                <div
                  key={milestone}
                  className="flex justify-between items-center bg-slate-50/70 p-3.5 rounded-lg border border-slate-200"
                >
                  <span className="text-xs font-normal text-slate-700">{milestone}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={currentDuration}
                      onChange={(e) => {
                        const newDurations = { ...(formData.milestoneDurations || {}) };
                        newDurations[milestone] = parseInt(e.target.value) || 0;
                        handleChange("milestoneDurations", newDurations);
                      }}
                      className="w-16 px-2.5 py-1 text-xs font-medium text-slate-800 text-right bg-white border border-slate-200 rounded-md focus:outline-none focus:border-[#0a4d8c]"
                    />
                    <span className="text-xs font-normal text-slate-500">Hari</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section>
        <h2 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-2.5 mb-5">
          Konfigurasi OCR & AI PRIMA
        </h2>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Tingkat Sensitivitas Verifikasi Dokumen
          </label>
          <p className="text-xs font-normal text-slate-500 mb-4">
            Menentukan tingkat ketelitian AI dalam membaca ketidaksesuaian isi dokumen pengadaan.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                id: "Low",
                label: "Rendah (Low)",
                desc: "Hanya menandai ketidaksesuaian substansi yang bersifat krusial.",
              },
              {
                id: "Medium",
                label: "Standar (Disarankan)",
                desc: "Keseimbangan optimal antara ketelitian substansi dan fleksibilitas format.",
              },
              {
                id: "High",
                label: "Ketat (High)",
                desc: "Memverifikasi kesesuaian klausul dan format dokumen secara ketat.",
              },
            ].map((lvl) => {
              const isSelected = formData.aiSensitivity === lvl.id;
              return (
                <div
                  key={lvl.id}
                  onClick={() => handleChange("aiSensitivity", lvl.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "border-[#0a4d8c] bg-[#e8f2fc]/50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? "border-[#0a4d8c]" : "border-slate-300"
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-[#0a4d8c]" />
                      )}
                    </div>
                    <h4 className="font-medium text-slate-800 text-xs">{lvl.label}</h4>
                  </div>
                  <p className="text-[11px] font-normal text-slate-500 leading-relaxed">
                    {lvl.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
