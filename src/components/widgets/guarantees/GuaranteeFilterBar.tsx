import { Search, Filter, Download } from "lucide-react";
import { SearchableSelect } from "@/components/ui";
import { GuaranteeFilterBarProps } from "./types";

const GUARANTEE_TYPE_OPTIONS = [
  { value: "All", label: "Semua Tipe" },
  { value: "Jaminan Pelaksanaan", label: "Pelaksanaan" },
  { value: "Jaminan Masa Pemeliharaan", label: "Pemeliharaan" },
  { value: "Jaminan Uang Muka", label: "Uang Muka" },
];

const GUARANTEE_STATUS_OPTIONS = [
  { value: "All", label: "Semua Status" },
  { value: "Aktif", label: "Aktif" },
  { value: "Mendekati Expiry", label: "Mendekati Jatuh Tempo" },
  { value: "Expired", label: "Kedaluwarsa" },
  { value: "Klaim Diajukan", label: "Klaim Diajukan" },
  { value: "Dikembalikan", label: "Dikembalikan" },
];

export function GuaranteeFilterBar({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  onExport,
}: GuaranteeFilterBarProps) {
  return (
    <div className="flex flex-col xl:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
      <div className="relative w-full flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
        <input
          type="text"
          placeholder="Cari referensi warkat, vendor, bank penerbit, atau judul pekerjaan..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0a4d8c] focus:ring-1 focus:ring-[#0a4d8c]"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
        <Filter className="hidden sm:block text-slate-400 shrink-0" size={16} />
        <SearchableSelect
          size="sm"
          className="w-full sm:w-40"
          value={typeFilter}
          onChange={setTypeFilter}
          searchPlaceholder="Cari tipe..."
          options={GUARANTEE_TYPE_OPTIONS}
        />
        <SearchableSelect
          size="sm"
          className="w-full sm:w-48"
          value={statusFilter}
          onChange={(val) => setStatusFilter(val as any)}
          searchPlaceholder="Cari status..."
          options={GUARANTEE_STATUS_OPTIONS}
        />
        {onExport && (
          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-[#0a4d8c] hover:text-[#0a4d8c] transition-colors"
            title="Unduh Rekapitulasi Jaminan ke Excel (CSV)"
          >
            <Download size={14} className="text-[#0a4d8c]" />
            <span>Ekspor</span>
          </button>
        )}
      </div>
    </div>
  );
}
