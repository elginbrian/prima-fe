import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

export type SortDirection = "asc" | "desc" | null;

export function nextSortDirection(direction: SortDirection): SortDirection {
  return direction === null ? "asc" : direction === "asc" ? "desc" : null;
}

export function sortRecords<T>(records: T[], direction: SortDirection, getValue: (record: T) => string | number) {
  if (!direction) return records;
  return [...records].sort((left, right) => {
    const leftValue = getValue(left);
    const rightValue = getValue(right);
    const comparison = typeof leftValue === "number" && typeof rightValue === "number"
      ? leftValue - rightValue
      : String(leftValue).localeCompare(String(rightValue), "id", { numeric: true, sensitivity: "base" });
    return direction === "asc" ? comparison : -comparison;
  });
}

export function SortableTableHeader({ label, direction, onClick, className = "" }: { label: string; direction: SortDirection; onClick: () => void; className?: string }) {
  const Icon = direction === "asc" ? ArrowUp : direction === "desc" ? ArrowDown : ArrowUpDown;
  const sortLabel = direction === "asc" ? "menaik" : direction === "desc" ? "menurun" : "default";

  return (
    <th className={`px-4 py-3 whitespace-nowrap ${className}`} aria-sort={direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none"}>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1.5 rounded text-left text-[11px] font-medium uppercase tracking-wider text-slate-500 whitespace-nowrap hover:text-[#0a4d8c] focus:outline-none"
        title={`Urutkan ${label}: ${sortLabel}`}
      >
        <span>{label}</span>
        <Icon size={13} className={direction ? "text-[#0a4d8c]" : "text-slate-400"} />
      </button>
    </th>
  );
}
