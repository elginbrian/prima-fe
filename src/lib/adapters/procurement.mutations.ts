/**
 * Mutation mappers — FE (camelCase domain types) → BE (snake_case payloads).
 *
 * The read direction lives in procurement.adapter.ts. Keeping the write direction
 * here (typed, no `as any`) prevents silent 422s / ignored fields on the API.
 */
import type { DeadlineItem } from "@/types";
import type {
  CreateProcurementPayload,
  DeadlineDto,
} from "@/lib/api/procurement.api";

// ─── Currency parsing ────────────────────────────────────────────────────

const SUFFIX_MULTIPLIER: Array<[RegExp, number]> = [
  [/\s*(triliun|t)$/, 1e12],
  [/\s*(miliar|milyar|m)$/, 1e9],
  [/\s*(juta|jt)$/, 1e6],
  [/\s*(ribu|rb|k)$/, 1e3],
];

/**
 * Parse Indonesian-style rupiah input into a number.
 *  "1.500.000"      → 1500000
 *  "Rp 150 Jt"      → 150000000
 *  "Rp 150,5 Jt"    → 150500000
 *  "2,5 M"          → 2500000000
 * Returns null when the input cannot be understood.
 */
export function parseRupiah(input: string): number | null {
  let text = input.toLowerCase().replace(/rp\.?/g, "").trim();
  if (!text) return null;

  let multiplier = 1;
  for (const [pattern, value] of SUFFIX_MULTIPLIER) {
    if (pattern.test(text)) {
      multiplier = value;
      text = text.replace(pattern, "").trim();
      break;
    }
  }

  let numeric: string;
  if (multiplier > 1) {
    // With a unit suffix, "," or "." is a decimal separator ("150,5 jt").
    numeric = text.replace(/[^\d.,]/g, "").replace(",", ".");
    const parts = numeric.split(".");
    if (parts.length > 2) numeric = parts.slice(0, -1).join("") + "." + parts[parts.length - 1];
  } else {
    // Plain number: "." / "," are thousand separators; a trailing ",dd" is decimals.
    numeric = text.replace(/,\d{1,2}$/, "").replace(/[^\d]/g, "");
  }

  const value = Number(numeric);
  if (!numeric || Number.isNaN(value)) return null;
  return Math.round(value * multiplier);
}

// ─── Procurement ─────────────────────────────────────────────────────────

/** Deterministic vendor id so the same vendor name always maps to the same id. */
export function vendorIdFromName(name: string): string {
  const slug = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `VND-${slug || "UNKNOWN"}`;
}

export interface AddRequestFormValues {
  title: string;
  fppNumber: string;
  picId: string;
  picName: string;
  amount: number;
  departmentId: string;
  departmentName: string;
  isUrgent: boolean;
  method?: string;
}

export function requestFormToCreatePayload(values: AddRequestFormValues): CreateProcurementPayload {
  return {
    title: values.title.trim(),
    pic_id: values.picId,
    pic_name: values.picName,
    // The FPP number identifies the requesting document; BE stores it as the FPP reference.
    fpp_id: values.fppNumber.trim(),
    fpp_name: values.fppNumber.trim(),
    amount: values.amount,
    department_id: values.departmentId,
    department_name: values.departmentName,
    is_urgent: values.isUrgent,
    procurement_method: values.method || "Tender Terbuka",
  };
}

// ─── Deadlines / SLA ─────────────────────────────────────────────────────

function cleanDateOrNull(val: string | null | undefined): string | null {
  if (!val) return null;
  const clean = String(val).trim().split(/[\sT]/)[0];
  return clean || null;
}

export function deadlineToCreatePayload(deadline: Omit<DeadlineItem, "id">): Partial<DeadlineDto> {
  const cleanTarget = cleanDateOrNull(deadline.targetDate);
  const cleanStart = cleanDateOrNull(deadline.startDate);
  return {
    request_id: deadline.requestId,
    task_name: deadline.taskName,
    milestone: deadline.milestone,
    pic_id: deadline.pic.id,
    pic_name: deadline.pic.name,
    department_id: deadline.department.id,
    department_name: deadline.department.name,
    start_date: cleanStart ? `${cleanStart}T00:00:00Z` : undefined,
    target_date: cleanTarget ? `${cleanTarget}T00:00:00Z` : deadline.targetDate,
    status: deadline.status,
    urgency_level: deadline.urgencyLevel,
    next_action: deadline.nextAction,
    overdue_reason: deadline.overdueReason,
  };
}

/** Only fields present in `changes` are sent, so BE `exclude_unset` keeps the rest intact. */
export function deadlineChangesToUpdatePayload(changes: Partial<DeadlineItem>): Partial<DeadlineDto> {
  const payload: Partial<DeadlineDto> = {};
  if (changes.taskName !== undefined) payload.task_name = changes.taskName;
  if (changes.milestone !== undefined) payload.milestone = changes.milestone;
  if (changes.pic !== undefined) {
    payload.pic_id = changes.pic.id;
    payload.pic_name = changes.pic.name;
  }
  if (changes.department !== undefined) {
    payload.department_id = changes.department.id;
    payload.department_name = changes.department.name;
  }
  if (changes.startDate !== undefined) {
    const cleanStart = cleanDateOrNull(changes.startDate);
    payload.start_date = cleanStart ? `${cleanStart}T00:00:00Z` : (null as any);
  }
  if (changes.targetDate !== undefined) {
    const cleanTarget = cleanDateOrNull(changes.targetDate);
    if (cleanTarget) payload.target_date = `${cleanTarget}T00:00:00Z`;
  }
  if (changes.status !== undefined) payload.status = changes.status;
  if (changes.urgencyLevel !== undefined) payload.urgency_level = changes.urgencyLevel;
  if (changes.nextAction !== undefined) payload.next_action = changes.nextAction;
  if (changes.overdueReason !== undefined) payload.overdue_reason = changes.overdueReason;
  return payload;
}

