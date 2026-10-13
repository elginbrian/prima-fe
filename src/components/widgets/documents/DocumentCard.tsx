import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FileText, AlertCircle, CheckCircle2, XCircle, Sparkles, FileSearch, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { DocumentItem, DocumentStatus } from "@/types";
import { useRouter } from "next/navigation";
import { useProcurement } from "@/context/ProcurementContext";
import { useToast } from "@/components/ui/Toast";

export function DocumentCard({ doc }: { doc: DocumentItem }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAiDraft, setShowAiDraft] = useState(false);
  const [mounted, setMounted] = useState(false);
  const toast = useToast();
  const defaultDraft = `Nomor: ${doc.id}\nPerihal: Tindak Lanjut Dokumen ${doc.name}\n\nSehubungan dengan hasil pemeriksaan sistem, ditemukan poin-poin berikut yang memerlukan tindak lanjut pada dokumen ${doc.name}:\n\n- ${doc.issues.join("\n- ")}\n\nNext Action yang direkomendasikan:\n${doc.nextAction}\n\nMohon agar dapat segera dilengkapi. Terima kasih.`;
  const [draftContent, setDraftContent] = useState(defaultDraft);
  const router = useRouter();
  const { updateDocumentStatus } = useProcurement();
  const hasIssues = doc.issues && doc.issues.length > 0;

  useEffect(() => {
    setDraftContent(`Nomor: ${doc.id}\nPerihal: Tindak Lanjut Dokumen ${doc.name}\n\nSehubungan dengan hasil pemeriksaan sistem, ditemukan poin-poin berikut yang memerlukan tindak lanjut pada dokumen ${doc.name}:\n\n- ${doc.issues.join("\n- ")}\n\nNext Action yang direkomendasikan:\n${doc.nextAction}\n\nMohon agar dapat segera dilengkapi. Terima kasih.`);
  }, [doc]);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case "Lulus Verifikasi": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Catatan Procurement": return "bg-blue-50 text-[#0a4d8c] border-blue-200";
      case "Tindak Lanjut FPP": return "bg-red-50 text-red-700 border-red-200";
    }
  };

  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case "Lulus Verifikasi": return <CheckCircle2 size={16} />;
      case "Catatan Procurement": return <AlertCircle size={16} />;
      case "Tindak Lanjut FPP": return <XCircle size={16} />;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        
        {/* Left Side: Info */}
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="hidden sm:flex p-3 bg-slate-50 border border-slate-100 rounded-lg">
            <FileText size={24} className="text-slate-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-semibold text-slate-800">{doc.name}</h3>
              <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium border ${getStatusColor(doc.status)}`}>
                {getStatusIcon(doc.status)}
                {doc.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5 text-[11px] sm:text-sm text-slate-500">
              <span className="font-medium text-slate-600">{doc.id}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span>Tipe: <span className="text-slate-700">{doc.type}</span></span>
              <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-300"></span>
              <span className="hidden sm:inline">Diunggah: {doc.uploadDate}</span>
              <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-300"></span>
              <span className="hidden sm:inline">PIC: {doc.pic.name}</span>
            </div>
            
            {/* Mobile Only Meta */}
            <div className="sm:hidden flex items-center gap-2 mt-1 text-[11px] text-slate-500">
              <span>{doc.uploadDate}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span>{doc.pic.name}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); router.push('/dashboard/documents/result'); }}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors tooltip-trigger" 
            title="Lihat Dokumen"
          >
            <Eye size={18} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); router.push('/dashboard/documents/result'); }}
            className="p-2 text-slate-400 hover:text-[#0a4d8c] hover:bg-blue-50 rounded-lg transition-colors tooltip-trigger" 
            title="Detail Pemeriksaan"
          >
            <FileSearch size={18} />
          </button>
        </div>
      </div>

      {/* Collapsed Warning Trigger */}
      {hasIssues && !isExpanded && (
        <div 
          className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center cursor-pointer group"
          onClick={() => setIsExpanded(true)}
        >
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 group-hover:text-[#0a4d8c] transition-colors">
            <AlertCircle size={14} className={doc.status === 'Tindak Lanjut FPP' ? 'text-red-500' : 'text-amber-500'} />
            <span>Lihat Temuan & Rekomendasi ({doc.issues.length})</span>
            <ChevronDown size={14} />
          </div>
        </div>
      )}

      {/* Expanded Next Action Area */}
      {hasIssues && isExpanded && (
        <div className="mt-5 pt-5 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Issues List */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className={doc.status === 'Tindak Lanjut FPP' ? 'text-red-500' : 'text-amber-500'} />
                  <h4 className="text-sm font-semibold text-slate-800">Temuan Pemeriksaan</h4>
                </div>
              </div>
              <ul className="list-disc list-outside text-sm text-slate-600 space-y-1.5 ml-4">
                {doc.issues.map((issue, idx) => (
                  <li key={idx} className="pl-1">{issue}</li>
                ))}
              </ul>
            </div>
            
            {/* Next Action Box */}
            {doc.nextAction && (
              <div className="flex-1 bg-gradient-to-br from-[#f8fbff] to-[#f0f6ff] border border-blue-100 rounded-xl p-4 shadow-sm relative">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-blue-800 uppercase tracking-widest">Next Action</h4>
                </div>
                <p className="text-sm text-blue-950 font-medium leading-relaxed">{doc.nextAction}</p>
                
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {doc.canGenerateAiDraft && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowAiDraft(true); }}
                      className="flex items-center gap-2 bg-white border border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm"
                    >
                      <Sparkles size={16} className="text-blue-500" />
                      <span>Generate Draft dengan AI</span>
                    </button>
                  )}
                  {doc.status !== "Lulus Verifikasi" && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); updateDocumentStatus(doc.id, "Lulus Verifikasi"); }}
                      className="flex items-center gap-2 bg-white border border-slate-300 hover:border-emerald-400 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm"
                    >
                      <CheckCircle2 size={16} className="text-slate-400 group-hover:text-emerald-500" />
                      <span>Override: Tandai Lulus Verifikasi</span>
                    </button>
                  )}
                </div>
              </div>
            )}
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

      {/* AI Draft Modal */}
      {mounted && showAiDraft && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm pointer-events-auto transition-all" onClick={() => setShowAiDraft(false)}>
          <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] pointer-events-auto animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-blue-500" />
                <h3 className="font-bold text-slate-800 text-sm">AI Draft Generator</h3>
              </div>
              <button onClick={() => setShowAiDraft(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto">
              <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 mb-4 flex items-start gap-3">
                <AlertCircle size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 leading-relaxed">
                  Draft di bawah ini di-generate secara otomatis berdasarkan catatan pemeriksaan. Silakan tinjau dan edit draft ini sebelum digunakan.
                </p>
              </div>
              
              <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">Draft Konten (Editable)</label>
              <textarea 
                className="w-full h-[300px] p-4 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono leading-relaxed resize-none"
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
              ></textarea>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
              <button 
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(draftContent);
                    toast.success("Draft berhasil disalin ke clipboard!");
                  } catch {
                    toast.info("Draft telah siap digunakan.");
                  }
                  setShowAiDraft(false);
                }}
                className="px-4 py-2 bg-[#0a4d8c] hover:bg-[#093e6f] text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
              >
                Salin Draft Konten
              </button>
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
}
