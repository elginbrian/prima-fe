"use client";

import { useState, useMemo } from "react";
import {
  BookOpen,
  Edit3,
  Filter,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useValidationProfiles,
  useDeleteValidationProfile,
} from "@/lib/query/hooks/procurement/useValidation";
import { useToast } from "@/components/ui/Toast";
import { Skeleton, SearchableSelect } from "@/components/ui";
import { formatDateIndo } from "@/lib/utils";
import {
  DOCUMENT_KIND_OPTIONS,
  SCOPE_OPTIONS,
} from "./templateConstants";
import type { ValidationProfile } from "@/types/validation";

export default function ValidationTemplatesPage() {
  const router = useRouter();
  const toast = useToast();

  const { data: profiles = [], isLoading } = useValidationProfiles();
  const deleteMutation = useDeleteValidationProfile();

  const [searchQuery, setSearchQuery] = useState("");
  const [kindFilter, setKindFilter] = useState("All");
  const [scopeFilter, setScopeFilter] = useState("All");

  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(q) ||
        p.document_kind.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false);
      const matchesKind =
        kindFilter === "All" || p.document_kind === kindFilter;
      const matchesScope = scopeFilter === "All" || p.scope === scopeFilter;
      return matchesSearch && matchesKind && matchesScope;
    });
  }, [profiles, searchQuery, kindFilter, scopeFilter]);

  const handleDeleteProfile = async (profile: ValidationProfile) => {
    try {
      await deleteMutation.mutateAsync(profile.id);
      toast.success(`Template '${profile.name}' berhasil dinonaktifkan.`);
    } catch (err: any) {
      toast.error(err?.message || "Gagal menghapus template.");
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-12">
      {/* Top Bar: Template Count Info + Create Template Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs">
          <BookOpen size={14} className="text-[#0a4d8c]" />
          <span>Template Kriteria Standar</span>
          <span className="rounded-full bg-[#e8f2fc] px-2 py-0.5 text-[10px] font-semibold text-[#0a4d8c]">
            {profiles.length}
          </span>
        </div>

        <button
          type="button"
          onClick={() => router.push("/dashboard/documents/templates/form")}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a4d8c] px-4 py-2 text-xs font-medium text-white shadow-2xs transition hover:bg-[#083b6c] focus:outline-none"
        >
          <Plus size={14} />
          <span>Buat Template Standar</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full xl:w-96 flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Cari nama template, jenis dokumen, atau deskripsi standar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0a4d8c] focus:ring-1 focus:ring-[#0a4d8c]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
          <Filter className="hidden sm:block text-slate-400 shrink-0" size={16} />
          <SearchableSelect
            size="sm"
            className="w-full sm:w-52"
            value={kindFilter}
            onChange={setKindFilter}
            searchPlaceholder="Cari jenis dokumen..."
            options={[
              { value: "All", label: "Semua Jenis Dokumen" },
              ...DOCUMENT_KIND_OPTIONS.map((k) => ({ value: k, label: k })),
            ]}
          />

          <SearchableSelect
            size="sm"
            className="w-full sm:w-48"
            value={scopeFilter}
            onChange={setScopeFilter}
            searchPlaceholder="Cari cakupan..."
            options={[
              { value: "All", label: "Semua Cakupan" },
              ...SCOPE_OPTIONS,
            ]}
          />
        </div>
      </div>

      {/* Template Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredProfiles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProfiles.map((profile) => {
            const ruleCount = profile.checklist_rules?.length || 0;
            const mandatoryCount = (profile.checklist_rules || []).filter(
              (r) => r.is_mandatory
            ).length;

            return (
              <div
                key={profile.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col justify-between gap-4 hover:border-slate-300 transition-all"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e8f2fc] text-[#0a4d8c]">
                        <BookOpen size={15} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-slate-900 leading-snug">
                          {profile.name}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-normal text-slate-500">
                          <span>{profile.document_kind}</span>
                          <span>·</span>
                          <span>{profile.scope}</span>
                          {profile.target_stage_to_clear && (
                            <>
                              <span>·</span>
                              <span className="text-[#0a4d8c] inline-flex items-center gap-1">
                                <Sparkles size={10} />
                                {profile.target_stage_to_clear}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className="shrink-0 inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
                      Lulus &ge; {profile.passing_score_threshold}%
                    </span>
                  </div>

                  {profile.description && (
                    <p className="text-xs font-normal text-slate-600 leading-relaxed line-clamp-2">
                      {profile.description}
                    </p>
                  )}

                  <div className="border-t border-slate-100 pt-2.5 space-y-1.5">
                    <div className="text-[11px] font-medium text-slate-500">
                      {ruleCount} Kriteria Berbobot ({mandatoryCount} Wajib)
                    </div>
                    <ul className="space-y-1 text-xs font-normal text-slate-600">
                      {(profile.checklist_rules || [])
                        .slice(0, 3)
                        .map((rule, idx) => (
                          <li
                            key={idx}
                            className="flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#0a4d8c]/70 shrink-0" />
                              <span className="truncate">{rule.item}</span>
                            </div>
                            <span className="shrink-0 text-[11px] font-medium text-slate-500">
                              {rule.weight ?? 0}%
                            </span>
                          </li>
                        ))}
                      {ruleCount > 3 && (
                        <li className="text-[11px] text-slate-400 pl-3.5">
                          +{ruleCount - 3} kriteria lainnya
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <span className="text-[11px] font-normal text-slate-400">
                    Diperbarui {formatDateIndo(profile.updated_at)}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/dashboard/documents/templates/form?id=${encodeURIComponent(
                            profile.id
                          )}`
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-[#0a4d8c] hover:text-[#0a4d8c] transition-colors focus:outline-none"
                    >
                      <Edit3 size={12} />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProfile(profile)}
                      disabled={deleteMutation.isPending}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:border-slate-300 hover:text-slate-800 transition-colors focus:outline-none"
                      title="Nonaktifkan Template"
                    >
                      <Trash2 size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/dashboard/documents/upload?profileId=${encodeURIComponent(
                            profile.id
                          )}`
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a4d8c] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#083b6c] transition-colors focus:outline-none"
                    >
                      <Sparkles size={12} />
                      <span>Gunakan Template</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center space-y-3">
          <BookOpen size={32} className="mx-auto text-slate-300" />
          <div className="text-sm font-medium text-slate-700">
            Template standar tidak ditemukan
          </div>
          <p className="text-xs font-normal text-slate-500 max-w-md mx-auto">
            Belum ada template standar yang sesuai dengan filter pencarian, atau buat template baru untuk memulai.
          </p>
          <button
            type="button"
            onClick={() => router.push("/dashboard/documents/templates/form")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a4d8c] px-4 py-2 text-xs font-medium text-white hover:bg-[#083b6c] transition-colors"
          >
            <Plus size={14} />
            Buat Template Standar Baru
          </button>
        </div>
      )}
    </div>
  );
}
