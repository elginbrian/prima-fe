"use client";

import type { MetricCardProps } from "./types";

export function MetricCard({ title, value, subtext, tone, icon }: MetricCardProps) {
  const toneClasses = {
    primary: "bg-blue-50 text-[#0a4d8c]",
    success: "bg-blue-50/80 text-[#0a4d8c]",
    info: "bg-slate-100 text-slate-700",
    warning: "bg-slate-100 text-slate-700",
  } as const;

  return (
    <div className="h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-600">{title}</span>
        <span className={`rounded-xl p-2 ${toneClasses[tone]}`}>{icon}</span>
      </div>
      <div className="text-2xl font-bold tracking-tight text-slate-900">{value}</div>
      <div className="mt-2 text-xs text-slate-500">{subtext}</div>
    </div>
  );
}

export default MetricCard;
