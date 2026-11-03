"use client";

import { useMemo } from "react";
import { BookOpen, ShieldCheck, Sparkles } from "lucide-react";
import type { ValidationProfile } from "@/types/validation";

interface ValidationProfileSelectorProps {
  profiles: ValidationProfile[];
  selectedProfileId: string;
  onSelectProfile: (profile: ValidationProfile | null) => void;
  isLoading?: boolean;
}

export function ValidationProfileSelector({
  profiles,
  selectedProfileId,
  onSelectProfile,
  isLoading = false,
}: ValidationProfileSelectorProps) {
  const selectedProfile = useMemo(
    () => profiles.find((p) => p.id === selectedProfileId) ?? null,
    [profiles, selectedProfileId]
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <BookOpen size={13} className="text-[#0a4d8c]" />
          Pustaka Standar Dokumen (Template Acuan)
        </label>
        {selectedProfile && (
          <span className="text-[10px] font-normal text-[#0a4d8c] bg-[#e8f2fc] px-2 py-0.5 rounded-full border border-[#0a4d8c]/20 flex items-center gap-1">
            <ShieldCheck size={11} />
            Standar Pertamina Aktif
          </span>
        )}
      </div>

      <div className="relative">
        <select
          value={selectedProfileId}
          disabled={isLoading}
          onChange={(e) => {
            const val = e.target.value;
            if (!val) {
              onSelectProfile(null);
            } else {
              const found = profiles.find((p) => p.id === val) ?? null;
              onSelectProfile(found);
            }
          }}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-normal text-slate-800 transition-colors focus:border-[#0a4d8c] focus:outline-none disabled:opacity-60"
        >
          <option value="">-- Kustom Mandiri (Tanpa Template Master) --</option>
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.name} ({profile.document_kind})
            </option>
          ))}
        </select>
      </div>

      {selectedProfile ? (
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-[#0a4d8c] font-medium">
            <span>Jenis: {selectedProfile.document_kind}</span>
            <span>Target Lulus: &ge; {selectedProfile.passing_score_threshold}%</span>
          </div>
          {selectedProfile.description && (
            <p className="text-[11px] font-normal text-slate-600 line-clamp-2">
              {selectedProfile.description}
            </p>
          )}
          {selectedProfile.target_stage_to_clear && (
            <div className="text-[11px] text-slate-600 flex items-center gap-1 font-normal">
              <Sparkles size={11} className="text-[#0a4d8c]" />
              Tahap terkait:{" "}
              <span className="font-medium text-slate-800">
                {selectedProfile.target_stage_to_clear}
              </span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-[11px] font-normal text-slate-500">
          Pilih template standar di atas untuk mengisi daftar kriteria otomatis, atau tambahkan kriteria kustom di bawah.
        </p>
      )}
    </div>
  );
}
