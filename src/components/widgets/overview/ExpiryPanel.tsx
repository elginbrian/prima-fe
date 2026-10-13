"use client";

import { CalendarClock } from "lucide-react";

export function ExpiryPanel() {
  const items = [
    { label: "Kontrak vendor A", date: "12 Sep 2026" },
    { label: "Jaminan proyek 3", date: "18 Sep 2026" },
    { label: "Pekerjaan pengadaan", date: "27 Sep 2026" },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="rounded-xl bg-blue-50 p-2 text-[#0a4d8c]">
          <CalendarClock size={16} />
        </div>
        <p className="text-sm font-semibold text-slate-800">Jatuh Tempo</p>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition-colors duration-200 hover:bg-[#f8fafc] hover:border-slate-300"
          >
            <span className="text-sm text-slate-700">{item.label}</span>
            <span className="text-xs font-medium text-slate-500">{item.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ExpiryPanel;
