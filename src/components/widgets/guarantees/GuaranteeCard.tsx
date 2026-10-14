import { useState } from "react";
import { Shield, AlertTriangle, ShieldCheck, ShieldAlert, Clock, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { GuaranteeItem, GuaranteeStatus } from "@/types";
import { calculateDaysRemaining } from "@/lib/utils";

export function GuaranteeCard({ guarantee }: { guarantee: GuaranteeItem }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasAction = !!guarantee.nextAction;

  const getStatusStyle = (status: GuaranteeStatus) => {
    switch (status) {
      case "Aktif": 
        return { color: "bg-blue-50 text-[#0a4d8c] border-blue-200", icon: <ShieldCheck size={16} /> };
      case "Mendekati Expiry": 
        return { color: "bg-amber-50 text-amber-700 border-amber-200", icon: <AlertTriangle size={16} /> };
      case "Expired": 
        return { color: "bg-red-50 text-red-700 border-red-200", icon: <ShieldAlert size={16} /> };
      case "Klaim Diajukan":
        return { color: "bg-rose-50 text-rose-700 border-rose-300", icon: <ShieldAlert size={16} /> };
      case "Dikembalikan":
        return { color: "bg-slate-100 text-slate-700 border-slate-300", icon: <ShieldCheck size={16} /> };
      default:
        return { color: "bg-blue-50 text-[#0a4d8c] border-blue-200", icon: <Shield size={16} /> };
    }
  };

  const statusStyle = getStatusStyle(guarantee.status);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* Left Side: Info */}
        <div className="flex items-start gap-3 sm:gap-4 w-full sm:w-auto">
          <div className="hidden sm:flex p-3 bg-slate-50 border border-slate-100 rounded-lg">
            <Shield size={24} className="text-slate-400" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-semibold text-slate-800">{guarantee.type}</h3>
              <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium border ${statusStyle.color}`}>
                {statusStyle.icon}
                {guarantee.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5 text-[11px] sm:text-sm text-slate-500">
              <span className="font-medium text-slate-600">{guarantee.referenceNo}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span className="font-semibold text-slate-700">Rp {typeof guarantee.value === 'number' ? guarantee.value.toLocaleString('id-ID') : guarantee.value}</span>
              {(guarantee.isThresholdCompliant === false || guarantee.thresholdWarning) && (
                <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 flex items-center gap-1 shadow-2xs">
                  <AlertTriangle size={12} className="text-amber-600 shrink-0" />
                  <span>{guarantee.thresholdWarning || "Nilai < 5% Pagu"}</span>
                </span>
              )}
              <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-300"></span>
              <span className="hidden sm:inline">PIC: {guarantee.pic.name}</span>
            </div>
            
            {/* Mobile Only Meta */}
            <div className="sm:hidden flex items-center gap-2 mt-1 text-[11px] text-slate-500">
              <span>PIC: {guarantee.pic.name}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Expiry info */}
        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-lg sm:rounded-none">
          <div className="flex items-center gap-1.5 text-slate-600 mb-0 sm:mb-1">
            <Clock size={14} className="text-slate-400" />
            <span className="text-[11px] sm:text-xs font-medium">Jatuh Tempo:</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-slate-800">{guarantee.expiryDate}</div>
            <div className={`text-xs font-medium mt-0.5 ${
              guarantee.status === 'Expired' ? 'text-red-600' : 
              guarantee.status === 'Mendekati Expiry' ? 'text-amber-600' : 'text-[#0a4d8c]'
            }`}>
              {calculateDaysRemaining(guarantee.expiryDate) < 0 ? `Terlewat ${Math.abs(calculateDaysRemaining(guarantee.expiryDate))} hari` : `${calculateDaysRemaining(guarantee.expiryDate)} hari lagi`}
            </div>
          </div>
        </div>
      </div>

      {/* Collapsed Warning Trigger */}
      {hasAction && !isExpanded && (
        <div 
          className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center cursor-pointer group"
          onClick={() => setIsExpanded(true)}
        >
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 group-hover:text-[#0a4d8c] transition-colors">
            <AlertTriangle size={14} className={guarantee.status === 'Expired' ? 'text-red-500' : 'text-amber-500'} />
            <span>Lihat Rekomendasi Tindakan</span>
            <ChevronDown size={14} />
          </div>
        </div>
      )}

      {/* Expanded Next Action Area */}
      {hasAction && isExpanded && (
        <div className="mt-5 pt-5 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex bg-blue-50/60 border border-blue-200/80 rounded-xl p-4 shadow-sm relative">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-[#0a4d8c]" />
                <h4 className="text-xs font-bold text-[#0a4d8c] uppercase tracking-widest">Next Action</h4>
              </div>
              <p className="text-sm text-slate-800 font-medium leading-relaxed">{guarantee.nextAction}</p>
              
              <button className="mt-4 flex items-center gap-2 bg-[#0a4d8c] hover:bg-[#093e6f] text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm">
                <span>Tandai Sudah Dikoordinasikan</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 flex justify-center">
            <button 
              onClick={() => setIsExpanded(false)} 
              className="text-xs font-medium text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
            >
              Tutup Detail <ChevronUp size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
