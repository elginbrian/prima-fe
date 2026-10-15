import { SettingsTabProps } from "./types";
import { formatRupiah } from "@/lib/utils";

export function SystemTab({ formData, handleChange, users }: SettingsTabProps) {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Workflow Section */}
      <section>
        <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-6">Otorisasi & Persetujuan</h2>
        
        <div className="mb-8">
          <label className="block text-sm font-semibold text-slate-700 mb-1">Batas Nilai Persetujuan Otomatis (Threshold)</label>
          <p className="text-xs text-slate-500 mb-3">Pengadaan di atas nilai ini membutuhkan persetujuan berjenjang ekstra.</p>
          <div className="flex items-center max-w-sm">
            <span className="text-sm font-bold text-slate-500 bg-slate-50 border border-slate-200 border-r-0 px-3 py-2 rounded-l-lg">Rp</span>
            <input 
              type="number" 
              value={formData.approvalThreshold || 0} 
              onChange={(e) => handleChange("approvalThreshold", parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-slate-200 rounded-r-lg focus:outline-none focus:border-[#0a4d8c] focus:ring-1 focus:ring-[#0a4d8c] text-slate-800 font-medium" 
            />
          </div>
          {Number(formData.approvalThreshold) > 0 && (
            <p className="mt-1.5 text-xs text-slate-500">
              Terbaca: <strong className="font-semibold text-slate-700">{formatRupiah(formData.approvalThreshold)}</strong>
            </p>
          )}
        </div>

        <div className="pt-8 border-t border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800 mb-5">Default Reviewer per Departemen</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { id: "DEPT-IT", name: "IT Infrastructure" },
              { id: "DEPT-OPS", name: "Operations" },
              { id: "DEPT-HR", name: "Human Resources" },
              { id: "DEPT-GA", name: "General Affairs" }
            ].map((dept) => {
              const currentReviewer = formData.departmentReviewers?.[dept.id] || "";
              
              return (
                <div key={dept.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:border-[#0a4d8c]/50 transition-colors">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">{dept.name}</label>
                  <select
                    value={currentReviewer}
                    onChange={(e) => {
                      const newReviewers = { ...(formData.departmentReviewers || {}) };
                      newReviewers[dept.id] = e.target.value;
                      handleChange("departmentReviewers", newReviewers);
                    }}
                    className="w-full px-3 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-md focus:outline-none focus:border-[#0a4d8c] focus:ring-1 focus:ring-[#0a4d8c]"
                  >
                    <option value="" disabled>Pilih Reviewer...</option>
                    {users?.filter(u => u.role.includes("Reviewer") || u.role.includes("Manager") || u.role.includes("Admin")).map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
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
        <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-6">Toleransi & Peringatan SLA</h2>
        <div className="mb-8">
          <label className="block text-sm font-semibold text-slate-700 mb-1">Ambang Batas Peringatan (At Risk)</label>
          <p className="text-xs text-slate-500 mb-3">Notifikasi peringatan akan muncul ketika batas waktu tersisa kurang dari (X) hari.</p>
          <div className="flex items-center gap-3">
            <input 
              type="number" 
              min={1} 
              max={14}
              value={formData.slaWarningDays} 
              onChange={(e) => handleChange("slaWarningDays", parseInt(e.target.value) || 3)}
              className="w-24 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#0a4d8c] text-slate-800 font-medium" 
            />
            <span className="text-sm font-medium text-slate-600">Hari sebelum jatuh tempo</span>
          </div>
        </div>
        <div className="pt-8 border-t border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800 mb-5">Default Durasi Milestone (Referensi)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {["Evaluasi Teknis", "Prakualifikasi", "Contracting", "Tender / Sourcing"].map((milestone) => {
              const currentDuration = formData.milestoneDurations?.[milestone] || 0;
              return (
                <div key={milestone} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100 focus-within:border-[#0a4d8c] focus-within:ring-1 focus-within:ring-[#0a4d8c] transition-all">
                  <span className="text-sm text-slate-600 font-medium">{milestone}</span>
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
                      className="w-16 px-2 py-1 text-sm font-bold text-slate-800 text-right bg-white border border-slate-200 rounded-md focus:outline-none focus:border-[#0a4d8c]"
                    />
                    <span className="text-xs font-semibold text-slate-500">Hari</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section>
        <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-6">Konfigurasi OCR & AI PRIMA</h2>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Tingkat Sensitivitas Verifikasi Dokumen</label>
          <p className="text-xs text-slate-500 mb-5">Menentukan seberapa ketat AI dalam membaca ketidaksesuaian data (misal: beda format, typo nama).</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {["Low", "Medium", "High"].map((level) => (
              <div 
                key={level}
                onClick={() => handleChange("aiSensitivity", level)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.aiSensitivity === level ? 'border-[#0a4d8c] bg-blue-50/50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.aiSensitivity === level ? 'border-[#0a4d8c]' : 'border-slate-300'}`}>
                    {formData.aiSensitivity === level && <div className="w-2 h-2 rounded-full bg-[#0a4d8c]"></div>}
                  </div>
                </div>
                <h4 className="font-bold text-slate-800 text-sm">{level} {level === "Medium" && "(Disarankan)"}</h4>
                <p className="text-[11px] text-slate-500 mt-1">Pengaturan tingkat {level.toLowerCase()} untuk AI.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Theme Section */}
      <section>
        <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-6">Pengaturan Tampilan (Tema)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {["Light", "Dark", "System"].map((themeMode) => (
            <div 
              key={themeMode}
              onClick={() => handleChange("theme", themeMode)}
              className={`p-5 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center text-center gap-4 ${formData.theme === themeMode ? 'border-[#0a4d8c] bg-blue-50/50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}
            >
              <div className="w-20 h-14 border border-slate-200 rounded-lg shadow-sm overflow-hidden flex">
                {themeMode === "Light" && <div className="w-full h-full bg-slate-50 flex items-center justify-center"><div className="w-12 h-6 bg-white border border-slate-200 rounded-sm"></div></div>}
                {themeMode === "Dark" && <div className="w-full h-full bg-slate-900 flex items-center justify-center"><div className="w-12 h-6 bg-slate-800 border border-slate-700 rounded-sm"></div></div>}
                {themeMode === "System" && (
                  <>
                    <div className="w-1/2 h-full bg-slate-50 border-r border-slate-200 flex items-center justify-center"><div className="w-6 h-6 bg-white border border-slate-200 rounded-sm"></div></div>
                    <div className="w-1/2 h-full bg-slate-900 flex items-center justify-center"><div className="w-6 h-6 bg-slate-800 border border-slate-700 rounded-sm"></div></div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${formData.theme === themeMode ? 'border-[#0a4d8c]' : 'border-slate-300'}`}>
                  {formData.theme === themeMode && <div className="w-2 h-2 rounded-full bg-[#0a4d8c] animate-in zoom-in duration-200"></div>}
                </div>
                <span className="text-sm font-semibold text-slate-700">{themeMode} Mode</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
