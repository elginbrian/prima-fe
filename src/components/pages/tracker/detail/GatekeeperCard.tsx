import { CheckCircle2, ShieldAlert, AlertTriangle } from "lucide-react";
import type { GatekeeperCheckDto } from "@/lib/api/procurement.api";

/** Quality Gate card: shows whether the procurement can advance, plus blockers and warnings. */
export function GatekeeperCard({ data }: { data: GatekeeperCheckDto }) {
  const ready = data.is_ready_to_advance;

  return (
    <div className={`mt-4 rounded-xl border p-4 text-xs transition-all ${
      ready
        ? "border-blue-200 bg-blue-50/60 text-slate-800"
        : "border-slate-200 bg-slate-50 text-slate-800 shadow-xs"
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 rounded-lg p-2 ${ready ? "bg-blue-100 text-[#0a4d8c]" : "bg-rose-50 text-rose-600 border border-rose-200"}`}>
            {ready ? <CheckCircle2 size={18} /> : <ShieldAlert size={18} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">
                {ready
                  ? "Quality Gate: Prasyarat Lengkap"
                  : `Quality Gate: Prasyarat Tertahan (${data.blockers.length} Kendala)`}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                ready
                  ? "bg-blue-100 text-[#0a4d8c]"
                  : "bg-rose-100 text-rose-700 border border-rose-200"
              }`}>
                {ready ? "Siap Lanjut" : "Perlu Tindakan"}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-600">
              {ready
                ? `Seluruh dokumen wajib (${data.mandatory_documents_verified}/${data.mandatory_documents_total}) telah diverifikasi dan jaminan valid untuk tahap ini.`
                : `Tahap '${data.current_step}' membutuhkan penyelesaian prasyarat sebelum dapat dimajukan.`}
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2 text-[11px]">
          <span className="font-semibold text-slate-500">Verifikasi BA:</span>
          <span className="font-bold text-slate-700 bg-white/90 px-2 py-1 rounded-md border border-slate-200 shadow-2xs">
            {data.mandatory_documents_verified} / {data.mandatory_documents_total}
          </span>
        </div>
      </div>

      {data.blockers.length > 0 && (
        <div className="mt-3.5 pt-3 border-t border-slate-200 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Daftar Kendala Yang Memblokir:</div>
          {data.blockers.map((b, idx) => (
            <div key={idx} className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
              <ShieldAlert size={16} className="text-rose-600 shrink-0 mt-0.5" />
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
        <div className="mt-2.5 pt-2 border-t border-slate-200 space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Peringatan:</div>
          {data.warnings.map((w, idx) => (
            <div key={idx} className="flex items-start gap-2 bg-white p-2 rounded-lg border border-slate-200 text-[11px]">
              <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
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
