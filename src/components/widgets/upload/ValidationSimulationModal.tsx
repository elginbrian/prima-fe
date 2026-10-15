import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, CheckCircle2, XCircle, FileSearch, ShieldCheck, AlertTriangle, ArrowRight } from "lucide-react";
import type { DocumentKind } from "@/types";

interface ValidationSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (findings: string[], isValid: boolean) => void;
  documentKind: DocumentKind | "";
  file: File | null;
  workName: string;
}

export function ValidationSimulationModal({ isOpen, onClose, onComplete, documentKind, file, workName }: ValidationSimulationModalProps) {
  const [step, setStep] = useState<"init" | "scanning" | "validating" | "result">("init");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [checks, setChecks] = useState<{ id: string; text: string; status: "pending" | "passed" | "failed" }[]>([]);

  useEffect(() => {
    if (isOpen) {
      setStep("init");
      setProgress(0);
      setChecks([]);
      
      // Initialize checks based on document kind
      const initialChecks = [
        { id: "read", text: "Membaca teks dari dokumen (OCR)", status: "pending" as const },
        { id: "signature", text: "Memeriksa keberadaan tanda tangan & meterai", status: "pending" as const },
        { id: "work", text: `Mencocokkan nama pekerjaan: "${workName || 'Tidak ada'}"`, status: "pending" as const },
        { id: "format", text: "Memverifikasi standar format perusahaan", status: "pending" as const },
      ];
      setChecks(initialChecks);

      // Start simulation
      const timer = setTimeout(() => {
        setStep("scanning");
        setStatusText("Mengekstrak informasi teks...");
        
        let p = 0;
        const interval = setInterval(() => {
          p += Math.random() * 15;
          if (p >= 100) {
            clearInterval(interval);
            setProgress(100);
            
            setTimeout(() => {
              setStep("validating");
              setStatusText("Mencocokkan dengan aturan...");
              runValidationChecks(initialChecks);
            }, 500);
          } else {
            setProgress(p);
          }
        }, 300);

      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isOpen, documentKind, workName]);

  const runValidationChecks = (initialChecks: any[]) => {
    let currentCheckIdx = 0;
    
    const checkInterval = setInterval(() => {
      if (currentCheckIdx >= initialChecks.length) {
        clearInterval(checkInterval);
        setTimeout(() => setStep("result"), 800);
        return;
      }
      
      setChecks(prev => {
        const next = [...prev];
        // Simulate a failure on the 4th check (format) randomly, or if workName is empty
        const isFailed = (currentCheckIdx === 2 && !workName) || (currentCheckIdx === 3 && Math.random() > 0.7);
        next[currentCheckIdx].status = isFailed ? "failed" : "passed";
        return next;
      });
      
      currentCheckIdx++;
    }, 800);
  };

  if (!isOpen) return null;

  const hasFailed = checks.some(c => c.status === "failed");
  const isFinished = step === "result";

  return createPortal(
    <div className="fixed inset-0 z-[100] flex min-h-dvh items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-300">
        
        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[#0a4d8c]">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Validasi AI PRIMA</h3>
            <p className="text-[11px] text-slate-500">{file?.name ?? "document.pdf"}</p>
          </div>
        </div>

        <div className="p-6">
          {/* Progress Section */}
          {!isFinished ? (
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[#0a4d8c]">{statusText || "Menyiapkan..."}</span>
                <span className="text-slate-500">{Math.floor(progress)}%</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div 
                  className="h-full rounded-full bg-[#0a4d8c] transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className={`mb-6 rounded-xl border p-4 text-center ${hasFailed ? "border-amber-200 bg-amber-50" : "border-blue-200 bg-blue-50/70"}`}>
              <div className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full ${hasFailed ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-[#0a4d8c]"}`}>
                {hasFailed ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
              </div>
              <h4 className={`text-sm font-bold ${hasFailed ? "text-amber-800" : "text-[#0a4d8c]"}`}>
                {hasFailed ? "Validasi Selesai dengan Temuan" : "Dokumen Lulus Verifikasi"}
              </h4>
              <p className={`mt-1 text-xs ${hasFailed ? "text-amber-700" : "text-slate-600"}`}>
                {hasFailed ? "Sistem menemukan beberapa ketidaksesuaian yang perlu diperiksa manual." : "Semua syarat kelengkapan dokumen terpenuhi. Anda dapat melanjutkan proses."}
              </p>
            </div>
          )}

          {/* Checks List */}
          <div className="space-y-3">
            {checks.map(check => (
              <div key={check.id} className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {check.status === "pending" && <div className="flex h-4 w-4 items-center justify-center rounded-full border border-slate-200 bg-slate-50"><Loader2 size={10} className="animate-spin text-slate-400" /></div>}
                  {check.status === "passed" && <CheckCircle2 size={16} className="text-[#0a4d8c]" />}
                  {check.status === "failed" && <XCircle size={16} className="text-amber-500" />}
                </div>
                <div className={`text-xs ${check.status === "pending" ? "text-slate-400" : check.status === "passed" ? "text-slate-700" : "font-medium text-amber-700"}`}>
                  {check.text}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex justify-end gap-3">
          {!isFinished ? (
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
              Batalkan
            </button>
          ) : (
            <>
              {hasFailed && (
                <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
                  Ubah File
                </button>
              )}
              <button 
                type="button" 
                onClick={() => {
                  const findings = checks.filter(c => c.status === "failed").map(c => c.text);
                  onComplete(findings, !hasFailed);
                }} 
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold text-white transition ${hasFailed ? "bg-amber-600 hover:bg-amber-700" : "bg-[#0a4d8c] hover:bg-[#093e6f]"}`}
              >
                {hasFailed ? "Tetap Simpan & Lanjutkan" : "Simpan Dokumen"}
                <ArrowRight size={14} />
              </button>
            </>
          )}
        </div>
        
      </div>
    </div>,
    document.body
  );
}
