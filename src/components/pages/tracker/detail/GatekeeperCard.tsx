import { CheckCircle2, ShieldAlert, AlertTriangle } from "lucide-react";
import type { GatekeeperCheckDto } from "@/lib/api/procurement.api";

/** Quality Gate card: shows whether the procurement can advance, plus blockers and warnings. */
export function GatekeeperCard({ data }: { data: GatekeeperCheckDto }) {
  const hasBlockers = !data.is_ready_to_advance || data.blockers.length > 0;
  const hasUnverifiedDocs =
    data.mandatory_documents_total > 0 &&
    data.mandatory_documents_verified < data.mandatory_documents_total;
  const hasWarnings = data.warnings.length > 0 || hasUnverifiedDocs;

  return (
    <div
      className={`rounded-xl border p-4 text-xs transition-all ${
        hasBlockers
          ? "border-rose-200 bg-rose-50/40 text-slate-800 shadow-2xs"
          : hasWarnings
          ? "border-amber-200 bg-amber-50/50 text-slate-800 shadow-2xs"
          : "border-emerald-200 bg-emerald-50/40 text-slate-800"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 rounded-lg p-2 ${
              hasBlockers
                ? "bg-rose-100 text-rose-600 border border-rose-200"
                : hasWarnings
                ? "bg-amber-100 text-amber-700 border border-amber-200"
                : "bg-emerald-100 text-emerald-700 border border-emerald-200"
            }`}
          >
            {hasBlockers ? (
              <ShieldAlert size={18} />
            ) : hasWarnings ? (
              <AlertTriangle size={18} />
            ) : (
              <CheckCircle2 size={18} />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-sm text-slate-800">
                {hasBlockers
                  ? `Prasyarat Tahap Tertahan (${data.blockers.length} Kendala)`
                  : hasWarnings
                  ? "Tahap Berjalan dengan Catatan Dokumen"
                  : "Prasyarat Tahap Lengkap"}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  hasBlockers
                    ? "bg-rose-100 text-rose-700 border border-rose-200"
                    : hasWarnings
                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                    : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                }`}
              >
                {hasBlockers
                  ? "Tertahan"
                  : hasWarnings
                  ? "Perlu Verifikasi"
                  : "Siap Lanjut"}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-600">
              {hasBlockers
                ? `Tahap '${data.current_step}' membutuhkan penyelesaian kendala wajib sebelum dapat dimajukan.`
                : hasWarnings
                ? `Dokumen terverifikasi penuh: ${data.mandatory_documents_verified} dari ${data.mandatory_documents_total} dokumen. Pastikan catatan pemeriksaan diselesaikan sebelum tahap evaluasi.`
                : data.mandatory_documents_total > 0
                ? `Seluruh dokumen wajib (${data.mandatory_documents_verified}/${data.mandatory_documents_total}) telah lulus verifikasi untuk tahap ini.`
                : "Tidak ada kendala pemblokir pada tahap ini."}
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2 text-[11px]">
          <span className="font-semibold text-slate-500">Dokumen Lulus:</span>
          <span className="font-bold text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
            {data.mandatory_documents_verified} / {data.mandatory_documents_total}
          </span>
        </div>
      </div>

      {data.blockers.length > 0 && (
        <div className="mt-3.5 pt-3 border-t border-rose-200/60 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-800">
            Kendala yang Memblokir:
          </div>
          {data.blockers.map((b, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-rose-200 shadow-2xs"
            >
              <ShieldAlert size={15} className="text-rose-600 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-800">{b.title}</div>
                <div className="text-[11px] text-slate-600 mt-0.5">{b.description}</div>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-rose-50 text-rose-700 rounded border border-rose-200 shrink-0">
                {b.category}
              </span>
            </div>
          ))}
        </div>
      )}

      {data.warnings.length > 0 && (
        <div className="mt-2.5 pt-2.5 border-t border-amber-200/60 space-y-1.5">
          {data.warnings.map((w, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 bg-white/90 p-2.5 rounded-lg border border-amber-200/80 text-[11px]"
            >
              <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-slate-800">{w.title}:</span>{" "}
                <span className="text-slate-600">{w.description}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

