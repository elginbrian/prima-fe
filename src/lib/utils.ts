import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculateDaysBetween(startDateStr: string, endDateStr?: string): number {
  const start = new Date(startDateStr).getTime();
  const end = endDateStr ? new Date(endDateStr).getTime() : Date.now();
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function calculateDaysRemaining(targetDateStr: string): number {
  if (!targetDateStr) return 0;
  const cleanStr = String(targetDateStr).trim().split(/[\sT]/)[0];
  const parts = cleanStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return 0;
  const targetMidnight = Date.UTC(parts[0], parts[1] - 1, parts[2]);
  const now = new Date();
  const todayMidnight = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((targetMidnight - todayMidnight) / 86400000);
}

export function toCleanDateString(val?: string | null): string {
  if (!val) return "";
  return String(val).trim().split(/[\sT]/)[0] || "";
}

export function formatRupiah(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") return "Rp 0";
  const num = typeof amount === "number" ? amount : Number(String(amount).replace(/[^0-9.-]/g, ""));
  if (isNaN(num)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const MONTHS_LONG = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export function formatDateIndo(dateStr?: string | null, format: "short" | "long" = "short"): string {
  if (!dateStr || dateStr === "-") return "-";
  const clean = String(dateStr).trim().split(/[\sT]/)[0];
  const parts = clean.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return String(dateStr);
  const [year, monthNum, day] = parts;
  if (monthNum < 1 || monthNum > 12) return String(dateStr);
  const dayStr = String(day).padStart(2, "0");
  const monthName = format === "long" ? MONTHS_LONG[monthNum - 1] : MONTHS_SHORT[monthNum - 1];
  return `${dayStr} ${monthName} ${year}`;
}

export function formatDateTimeIndo(dateTimeStr?: string | null): string {
  if (!dateTimeStr || dateTimeStr === "-") return "-";
  try {
    const d = new Date(dateTimeStr);
    if (isNaN(d.getTime())) return formatDateIndo(dateTimeStr);
    const datePart = formatDateIndo(dateTimeStr);
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${datePart}, ${hours}:${minutes}`;
  } catch {
    return formatDateIndo(dateTimeStr);
  }
}

export function formatRelativeTimeIndo(dateTimeStr?: string | null): string {
  if (!dateTimeStr || dateTimeStr === "-") return "-";
  try {
    const d = new Date(dateTimeStr);
    if (isNaN(d.getTime())) return formatDateIndo(dateTimeStr);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.round((today.getTime() - target.getTime()) / 86400000);

    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const timeStr = `${hours}:${minutes}`;

    if (diffDays === 0) return `Hari ini, ${timeStr}`;
    if (diffDays === 1) return `Kemarin, ${timeStr}`;
    return `${formatDateIndo(dateTimeStr)}, ${timeStr}`;
  } catch {
    return formatDateIndo(dateTimeStr);
  }
}

