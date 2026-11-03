import { Building2 } from "lucide-react";
import type { DepartmentComplianceDto } from "@/lib/api/procurement.api";

interface DepartmentComplianceWidgetProps {
  departmentCompliance: DepartmentComplianceDto[];
}

export function DepartmentComplianceWidget({
  departmentCompliance,
}: DepartmentComplianceWidgetProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-2">
          <Building2 className="text-[#0a4d8c]" size={16} />
          <h3 className="text-sm font-medium text-slate-800">
            Kepatuhan SLA per Departemen
          </h3>
        </div>
        <span className="text-[11px] font-normal text-slate-400">Lintas Fungsi</span>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        {departmentCompliance.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <p className="text-xs">Belum ada data SLA per departemen.</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {departmentCompliance.map((dept, idx) => {
              const rate = dept.compliance_rate;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-normal text-slate-700">{dept.department}</span>
                      <span className="text-[11px] text-slate-400">
                        ({dept.total_deadlines} tugas)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {dept.overdue > 0 && (
                        <span className="text-[10px] text-slate-500 font-normal bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {dept.overdue} terlambat
                        </span>
                      )}
                      <span className="font-medium text-slate-800">{rate}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        rate >= 85 ? "bg-[#0a4d8c]" : "bg-slate-400"
                      }`}
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-6 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#0a4d8c]" /> &gt;= 85% Sesuai Target
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-400" /> &lt; 85% Perlu Perhatian
          </span>
        </div>
      </div>
    </div>
  );
}
