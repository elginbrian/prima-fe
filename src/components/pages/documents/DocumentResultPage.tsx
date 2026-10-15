"use client";

import { CheckCircle2, AlertTriangle, FileText, ArrowLeft, Download, Printer } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useProcurement } from "@/context/ProcurementContext";
import { useDocuments, useUpdateDocumentStatus } from "@/lib/query/hooks/procurement/useProcurement";
import { useToast } from "@/components/ui/Toast";
import { Spinner, Skeleton } from "@/components/ui";
import { formatDateIndo } from "@/lib/utils";

export default function DocumentResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { state, updateDocumentStatus } = useProcurement();
  const { data: documents = [], isLoading } = useDocuments();
  const updateDocMutation = useUpdateDocumentStatus();

  const docId = searchParams.get("id");
  const selectedDocument = documents.find(doc => doc.id === docId) ?? state.documents.find(doc => doc.id === docId) ?? documents[0] ?? state.documents[0];

  const handleFollowUp = async () => {
    if (selectedDocument) {
      try {
        await updateDocMutation.mutateAsync({ id: selectedDocument.id, status: "Tindak Lanjut FPP" });
        updateDocumentStatus(selectedDocument.id, "Tindak Lanjut FPP");
        toast.success("Dokumen berhasil diteruskan ke FPP untuk tindak lanjut.");
      } catch {
        updateDocumentStatus(selectedDocument.id, "Tindak Lanjut FPP");
        toast.info("Status dokumen berhasil diperbarui.");
      }
    }
    router.push('/dashboard/documents');
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pt-4 pb-12 min-h-[calc(100vh-140px)] flex flex-col">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-8 w-52 rounded-lg" />
          <div className="flex gap-3">
            <Skeleton className="h-9 w-32 rounded-lg" />
            <Skeleton className="h-9 w-44 rounded-lg" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col lg:flex-row flex-1 min-h-[500px]">
          <div className="w-full lg:w-[45%] bg-slate-50 border-r border-slate-200 p-6 space-y-4">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-[380px] w-full rounded-xl" />
          </div>
          <div className="w-full lg:w-[55%] p-6 space-y-6">
            <Skeleton className="h-20 w-full rounded-xl" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4 pb-12 min-h-[calc(100vh-140px)] flex flex-col">
      {/* Header Result */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button 
          onClick={() => router.push('/dashboard/documents')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium w-fit"
        >
          <ArrowLeft size={16} /> Kembali ke Daftar Dokumen
        </button>
        <div className="flex gap-3 print:hidden">
          <button 
            type="button"
            onClick={() => window.print()}
            title="Cetak atau Simpan sebagai PDF"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:border-[#0a4d8c] hover:text-[#0a4d8c] text-slate-700 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Printer size={16} /> Cetak / Simpan PDF
          </button>
          <button 
            type="button"
            onClick={handleFollowUp}
            disabled={updateDocMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0a4d8c] hover:bg-[#093e6f] text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            {updateDocMutation.isPending ? (
              <>
                <Spinner size="xs" className="border-white border-t-transparent" />
                <span>Memproses...</span>
              </>
            ) : (
              "Tindak Lanjut (Kirim ke FPP)"
            )}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col lg:flex-row flex-1">
        {/* Left Side: Document Preview */}
        <div className="w-full lg:w-[45%] bg-slate-50 border-r border-slate-200 p-6 flex flex-col">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Preview Dokumen</h2>
          <div className="flex-1 border-2 border-slate-200 rounded-xl flex flex-col bg-white overflow-hidden shadow-sm">
            {/* Mock PDF Viewer Header */}
            <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center justify-between shrink-0">
              <span className="text-xs font-semibold text-slate-600 truncate mr-4">{(selectedDocument?.fileUrl ? selectedDocument.fileUrl.split('/').pop() : "Dokumen_Evaluasi_Terbaru.pdf")}</span>
              <span className="text-xs text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">1 / 15</span>
            </div>
            {/* Mock PDF Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 relative overflow-hidden">
              <div className="absolute inset-x-8 inset-y-8 bg-white border border-slate-200 shadow-sm p-8 flex flex-col opacity-60">
                <div className="h-4 bg-slate-200 w-3/4 mb-6"></div>
                <div className="h-2 bg-slate-200 w-full mb-3"></div>
                <div className="h-2 bg-slate-200 w-5/6 mb-3"></div>
                <div className="h-2 bg-slate-200 w-full mb-3"></div>
                <div className="h-2 bg-slate-200 w-4/5 mb-8"></div>
                
                {/* Highlighted area for anomaly */}
                <div className="border-2 border-red-400 bg-red-50/50 p-2 mb-8 relative">
                  <div className="h-2 bg-red-200 w-full mb-2"></div>
                  <div className="h-2 bg-red-200 w-3/4"></div>
                  <span className="absolute -top-3 -right-3 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">!</span>
                </div>
                
                <div className="h-2 bg-slate-200 w-full mb-3"></div>
                <div className="h-2 bg-slate-200 w-5/6 mb-3"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Results */}
        <div className="w-full lg:w-[55%] flex flex-col">
          {/* Status Banner */}
          <div className="bg-blue-50 border-b border-blue-100 p-6 flex items-start sm:items-center gap-4 shrink-0">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-blue-100 text-[#0a4d8c]">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0a4d8c]">{selectedDocument?.status ?? "Menunggu Pemeriksaan"}</h2>
              <p className="text-sm text-blue-700/80 mt-1">{selectedDocument?.issues.length ?? 0} temuan tercatat pada pemeriksaan mock dokumen ini.</p>
            </div>
          </div>

          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-6 shrink-0">
            <div className="flex-1">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Informasi File</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <div>
                  <div className="font-semibold text-slate-800 text-sm">{(selectedDocument?.fileUrl ? selectedDocument.fileUrl.split('/').pop() : "Dokumen_Evaluasi_Terbaru.pdf")}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Diupload hari ini • 2.4 MB</div>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Tingkat Kepercayaan AI</h3>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-[#0a4d8c] leading-none">94%</span>
                <span className="text-xs text-slate-500 mb-1">Akurasi Verifikasi</span>
              </div>
            </div>
          </div>

          {selectedDocument?.extractedData && <div className="border-b border-slate-100 bg-blue-50/40 p-6">
            <div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-bold text-slate-800">Validasi Konsistensi Antar Dokumen</h3><p className="mt-1 text-xs text-slate-500">Data dari template {selectedDocument.documentKind ?? "dokumen"} dibandingkan dengan dokumen lain pada pekerjaan ini.</p></div><span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${selectedDocument.issues.length ? "border-amber-200 bg-amber-50 text-amber-700" : "border-blue-200 bg-blue-50 text-[#0a4d8c]"}`}>{selectedDocument.issues.length ? "Perlu review" : "Konsisten"}</span></div>
            <div className="mt-4 grid grid-cols-1 gap-3 text-xs sm:grid-cols-3"><div className="rounded-lg border border-blue-100 bg-white p-3"><div className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Nama pekerjaan</div><div className="mt-1 font-medium text-slate-700">{selectedDocument.extractedData.workName || "Belum ditemukan"}</div></div><div className="rounded-lg border border-blue-100 bg-white p-3"><div className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Nomor tender</div><div className="mt-1 font-medium text-slate-700">{selectedDocument.extractedData.tenderNumber || "Belum ditemukan"}</div></div><div className="rounded-lg border border-blue-100 bg-white p-3"><div className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Tanggal dokumen</div><div className="mt-1 font-medium text-slate-700">{selectedDocument.extractedData.documentDate ? formatDateIndo(selectedDocument.extractedData.documentDate) : "Belum ditemukan"}</div></div></div>
          </div>}

          {/* Findings */}
          <div className="p-6 bg-slate-50 flex-1">
            <h3 className="font-bold text-slate-800 mb-4">Rincian Temuan Pemeriksaan</h3>
            
            <div className="space-y-4">
              {selectedDocument?.issues.length ? selectedDocument.issues.map((issue, index) => (
                <div key={`${selectedDocument.id}-issue-${index}`} className="bg-white border border-blue-100 rounded-xl p-5 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#0a4d8c]"></div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-[#0a4d8c]"><AlertTriangle size={18} /></div>
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm">Temuan Pemeriksaan {index + 1}</h4>
                      <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{issue}</p>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="bg-white border border-blue-100 rounded-xl p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 text-[#0a4d8c]" size={18} />
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm">Tidak Ada Temuan</h4>
                      <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">Dokumen mock ini belum memiliki catatan pemeriksaan.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
