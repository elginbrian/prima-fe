"use client";

import { BellRing } from "lucide-react";

export function AlertsPanel() {
  const alerts = [
    { title: "Penelaahan vendor baru", detail: "3 vendor menunggu validasi dokumen", tone: "amber" },
    { title: "Dokumen kontrak", detail: "2 kontrak berakhir dalam 7 hari", tone: "rose" },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="rounded-xl bg-blue-50 p-2 text-[#0a4d8c]">
          <BellRing size={16} />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">Peringatan</p>
        </div>
      </div>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.title}
            className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 p-3 transition-colors duration-200 hover:bg-[#f8fafc] hover:border-slate-300"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-slate-800">{alert.title}</p>
              <span className={`mt-1 h-2.5 w-2.5 rounded-full ${alert.tone === "amber" ? "bg-amber-400" : "bg-rose-400"}`} />
            </div>
            <p className="mt-1 text-xs text-slate-500">{alert.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AlertsPanel;
