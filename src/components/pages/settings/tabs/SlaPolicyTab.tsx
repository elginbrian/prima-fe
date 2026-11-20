"use client";

import { Clock, ShieldAlert } from "lucide-react";
import { SettingsTabProps } from "./types";
import { SearchableSelect } from "@/components/ui";

export function SlaPolicyTab({
  formData,
  handleChange,
  users,
}: SettingsTabProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Section 1: SLA Risk Warning Threshold */}
      <section className="space-y-4">
        <div className="flex items-start gap-3 border-b border-slate-100 pb-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e8f2fc] text-[#0a4d8c]">
            <Clock size={16} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Ambang Batas Peringatan Risiko SLA (At Risk)
            </h2>
            <p className="mt-0.5 text-xs font-normal text-slate-500">
              Menentukan kapan status SLA, Tracker, Warkat Jaminan, dan notifikasi mulai ditandai mendekati jatuh tempo.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-2">
            Rentang Peringatan Sebelum Jatuh Tempo
          </label>
          <div className="flex items-center gap-2.5">
            <input
              type="number"
              min={1}
              max={14}
              value={formData.slaWarningDays}
              onChange={(e) =>
                handleChange("slaWarningDays", parseInt(e.target.value, 10) || 3)
              }
              className="w-24 px-3.5 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#0a4d8c] text-sm text-slate-800 font-medium"
            />
            <span className="text-xs font-normal text-slate-600">
              Hari sebelum tanggal target SLA / kedaluwarsa jaminan
            </span>
          </div>
        </div>
      </section>

      {/* Section 2: Auto Escalation Policy */}
      <section className="space-y-4">
        <div className="flex items-start gap-3 border-b border-slate-100 pb-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e8f2fc] text-[#0a4d8c]">
            <ShieldAlert size={16} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Eskalasi Otomatis ke Atasan
            </h2>
            <p className="mt-0.5 text-xs font-normal text-slate-500">
              Mengotomatiskan eskalasi tugas saat evaluasi SLA menemukan keterlambatan melewati batas hari yang ditetapkan.
            </p>
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl bg-white overflow-hidden transition-all">
          <div className="flex items-center justify-between gap-4 p-4 sm:p-5">
            <div>
              <div className="font-medium text-slate-900 text-sm">
                Aktifkan Eskalasi SLA Otomatis
              </div>
              <div className="text-xs font-normal text-slate-500 mt-0.5">
                Saat evaluasi SLA dijalankan, pekerjaan yang terlambat melewati toleransi otomatis dieskalasi ke Manajer Tujuan.
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={formData.autoEscalation}
              onClick={() =>
                handleChange("autoEscalation", !formData.autoEscalation)
              }
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#0a4d8c]/30 ${
                formData.autoEscalation ? "bg-[#0a4d8c]" : "bg-slate-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-2xs transition-transform ${
                  formData.autoEscalation ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {formData.autoEscalation && (
            <div className="px-4 sm:px-5 pb-5 pt-4 border-t border-slate-100 bg-slate-50/50">
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
                        handleChange(
                          "autoEscalateDays",
                          parseInt(e.target.value, 10) || 3
                        )
                      }
                      className="w-24 px-3 py-2 text-sm font-normal bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0a4d8c]"
                    />
                    <span className="text-xs font-normal text-slate-600">
                      Hari setelah lewat jatuh tempo
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                    Manajer Tujuan Eskalasi
                  </label>
                  <SearchableSelect
                    value={formData.escalationManagerId || ""}
                    onChange={(val) => handleChange("escalationManagerId", val)}
                    placeholder="Pilih Manajer..."
                    searchPlaceholder="Cari nama atau peran manajer..."
                    options={(users ?? [])
                      .filter(
                        (u) =>
                          u.role.includes("Manager") ||
                          u.role.includes("Admin") ||
                          u.role.includes("Reviewer")
                      )
                      .map((u) => ({
                        value: u.id,
                        label: `${u.name} (${u.role})`,
                        keywords: `${u.name} ${u.role}`,
                      }))}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
