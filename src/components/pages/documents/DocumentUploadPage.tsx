"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, UploadCloud, FileText, ArrowRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useProcurement } from "@/context/ProcurementContext";
import { useProcurements } from "@/lib/query/hooks/procurement/useProcurement";
import { documentsApi } from "@/lib/api/documents.api";
import { useCurrentUser } from "@/lib/query/hooks/auth/useCurrentUser";
import { useToast } from "@/components/ui/Toast";
import type { DocumentItem, DocumentKind, DocumentType, ProcurementStep } from "@/types";
import { DocumentPreview } from "@/components/widgets/upload/DocumentPreview";
import { ValidationSimulationModal } from "@/components/widgets/upload/ValidationSimulationModal";

const VALIDATION_RULES: Record<DocumentKind, string[]> = {
  "Surat Penawaran": ["Nama pekerjaan", "Nomor tender", "Tanggal dokumen"],
  "Surat Pernyataan": ["Nama pekerjaan", "Nomor tender", "Tanggal dokumen"],
  "RKS": ["Nama pekerjaan", "Nomor tender", "Tanggal dokumen"],
  "Pakta Integritas": ["Nama pekerjaan", "Tanggal dokumen"],
  "TKDN": ["Nama pekerjaan", "Nomor tender", "Tanggal dokumen"],
  "Lainnya": ["Nama pekerjaan", "Nomor tender", "Tanggal dokumen"],
};

export default function DocumentUploadPage() {
  const router = useRouter();
  const { state, addDocument } = useProcurement();
  const { data: serverRequests = [] } = useProcurements();
  const requests = serverRequests.length > 0 ? serverRequests : state.requests;
  const { data: currentUser } = useCurrentUser();
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [docType, setDocType] = useState<DocumentType | "">("");
  const [documentKind, setDocumentKind] = useState<DocumentKind | "">("");
  const [extractedData, setExtractedData] = useState({ workName: "", tenderNumber: "", documentDate: "" });
  const [notes, setNotes] = useState("");
  const [requestId, setRequestId] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  
  const isD1Doc = ["Surat Penawaran", "Surat Pernyataan", "Pakta Integritas"].includes(documentKind);
  const suggestedRequest = useMemo(() => {
    const normalizedWorkName = extractedData.workName.trim().toLowerCase();
    if (!normalizedWorkName) return null;
    return requests
      .map(request => {
        const title = request.title.toLowerCase();
        const exact = title === normalizedWorkName;
        const contains = title.includes(normalizedWorkName) || normalizedWorkName.includes(title);
        const matchingWords = normalizedWorkName.split(/\s+/).filter(word => word.length > 2 && title.includes(word)).length;
        const score = exact ? 98 : contains ? 88 : Math.min(80, matchingWords * 18);
        return { request, score };
      })
      .filter(candidate => candidate.score >= 36)
      .sort((a, b) => b.score - a.score)[0] ?? null;
  }, [extractedData.workName, state.requests]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6 pt-4 pb-12 min-h-[calc(100vh-140px)] flex flex-col">
      <button
        type="button"
        onClick={() => router.push("/dashboard/documents")}
        className="inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-[#0a4d8c]"
      >
        <ArrowLeft size={16} />
        Kembali ke Pemeriksaan Dokumen
      </button>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row flex-1">
        
        <div className="w-full md:w-1/2 bg-slate-50 border-r border-slate-200 p-6 flex flex-col">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Preview Dokumen</h2>
          <DocumentPreview file={file} />
        </div>

        <div className="w-full md:w-1/2 flex flex-col">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800">Upload Dokumen Pra-Tender</h2>
            <p className="text-sm text-slate-500 mt-1">Sistem PRIMA membantu memverifikasi kelengkapan dan konsistensi dokumen.</p>
          </div>
          
          <div className="p-6 space-y-5 flex-1">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Terkait Pekerjaan <span className="text-red-500">*</span></label>
              <select 
                value={requestId}
                onChange={(e) => setRequestId(e.target.value)}
                className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2.5 focus:outline-none focus:border-[#0a4d8c] focus:ring-1 focus:ring-[#0a4d8c] bg-white"
              >
                <option value="">Pilih pekerjaan atau gunakan hasil pencocokan...</option>
                <option value="REQ-2026-101">REQ-2026-101 – Pengadaan Server Rack 42U</option>
                <option value="REQ-2026-102">REQ-2026-102 – Lisensi Software Design Suite</option>
                <option value="REQ-2026-103">REQ-2026-103 – Renovasi Ruang Meeting Lt. 4</option>
                <option value="REQ-2026-104">REQ-2026-104 – Pengadaan Laptop (10 Unit)</option>
                <option value="REQ-2026-108">REQ-2026-108 – Upgrade Bandwidth Internet HO</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Jenis Dokumen <span className="text-red-500">*</span></label>
                <select 
                  value={documentKind}
                  onChange={(e) => setDocumentKind(e.target.value as DocumentKind)}
                  className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2.5 focus:outline-none focus:border-[#0a4d8c] focus:ring-1 focus:ring-[#0a4d8c] bg-white"
                >
                  <option value="">Pilih spesifikasi...</option>
                  <option value="Surat Penawaran">Surat Penawaran</option>
                  <option value="Surat Pernyataan">Surat Pernyataan</option>
                  <option value="Pakta Integritas">Pakta Integritas</option>
                  <option value="RKS">Rencana Kerja & Syarat (RKS)</option>
                  <option value="TKDN">Sertifikat TKDN</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Template Validasi <span className="text-red-500">*</span></label>
              <select value={documentKind} onChange={(e) => setDocumentKind(e.target.value as DocumentKind)} className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2.5 focus:outline-none focus:border-[#0a4d8c] focus:ring-1 focus:ring-[#0a4d8c] bg-white">
                <option value="" disabled>Pilih template dokumen...</option>
                <option>Surat Penawaran</option><option>Surat Pengajuan</option><option>RKS</option><option>Pakta Integritas</option><option>TKDN</option><option>Lainnya</option>
              </select>
              <p className="mt-1.5 text-xs text-slate-500">Informasi berikut akan dibandingkan dengan dokumen lain pada pekerjaan yang sama.</p>
            </div>

            {documentKind && <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
              <div><h3 className="text-xs font-bold uppercase tracking-wider text-[#0a4d8c]">Informasi untuk Validasi Konsistensi</h3><p className="mt-1 text-xs text-slate-500">Template {documentKind} akan memeriksa: {VALIDATION_RULES[documentKind].join(", ")}.</p></div>
              <input value={extractedData.workName} onChange={(e) => setExtractedData(data => ({ ...data, workName: e.target.value }))} placeholder="Nama pekerjaan dalam dokumen" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#0a4d8c] focus:outline-none" />
              <div className="grid grid-cols-2 gap-3"><input value={extractedData.tenderNumber} onChange={(e) => setExtractedData(data => ({ ...data, tenderNumber: e.target.value }))} placeholder="Nomor tender" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#0a4d8c] focus:outline-none" /><input type="date" value={extractedData.documentDate} onChange={(e) => setExtractedData(data => ({ ...data, documentDate: e.target.value }))} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#0a4d8c] focus:outline-none" /></div>
              {suggestedRequest && <div className="flex flex-col gap-3 rounded-lg border border-blue-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-xs font-semibold text-slate-800">Rekomendasi pencocokan pekerjaan</div><div className="mt-1 text-xs text-slate-600">{suggestedRequest.request.id} · {suggestedRequest.request.title} <span className="ml-1 font-semibold text-[#0a4d8c]">{suggestedRequest.score}% cocok</span></div></div><button type="button" onClick={() => setRequestId(suggestedRequest.request.id)} className="shrink-0 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#0a4d8c] hover:bg-blue-100">Gunakan Pekerjaan Ini</button></div>}
              {requestId && <p className="text-xs text-slate-500">Pekerjaan terpilih: <span className="font-semibold text-slate-700">{state.requests.find(request => request.id === requestId)?.title}</span>. Anda tetap dapat menggantinya secara manual.</p>}
            </div>}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Catatan Tambahan (Opsional)</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2.5 focus:outline-none focus:border-[#0a4d8c] focus:ring-1 focus:ring-[#0a4d8c] bg-white resize-none"
                placeholder="Tambahkan instruksi khusus untuk pemeriksa..."
                rows={2}
              ></textarea>
            </div>

            {/* Upload Area */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Pilih File <span className="text-red-500">*</span></label>
              <div 
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors ${isDragging ? 'border-[#0a4d8c] bg-blue-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {file ? (
                  <div className="flex flex-col items-center text-center w-full">
                    <p className="text-sm font-medium text-[#0a4d8c] mb-3">1 File Terpilih</p>
                    <button 
                      onClick={() => setFile(null)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <X size={14} /> Ganti File
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-white text-slate-400 rounded-full flex items-center justify-center mb-3 shadow-sm border border-slate-100">
                      <UploadCloud size={24} />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-1">Tarik & Lepas File</h3>
                    <p className="text-xs text-slate-500 mb-4">PDF, DOCX, XLSX (Max. 20MB)</p>
                    
                    <label className="cursor-pointer bg-white border border-[#0a4d8c] text-[#0a4d8c] hover:bg-blue-50 px-4 py-2 rounded-lg text-xs font-medium transition-colors">
                      <span>Telusuri Komputer</span>
                      <input type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={handleFileChange} />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 mt-auto">
            <button 
              onClick={() => router.push('/dashboard/documents')}
              className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              Batal
            </button>
            <button 
              onClick={() => {
                if (!file || !docType || !documentKind || !requestId) return;
                
                if (isD1Doc) {
                  setIsSimulating(true);
                  return;
                }

                const consistencyIssues = state.documents
                  .filter(document => document.requestId === requestId && document.extractedData)
                  .flatMap(document => {
                    const data = document.extractedData!;
                    const issues: string[] = [];
                    if (extractedData.workName && data.workName && extractedData.workName.trim().toLowerCase() !== data.workName.trim().toLowerCase()) issues.push(`Nama pekerjaan berbeda dengan ${document.name}.`);
                    if (extractedData.tenderNumber && data.tenderNumber && extractedData.tenderNumber.trim().toLowerCase() !== data.tenderNumber.trim().toLowerCase()) issues.push(`Nomor tender berbeda dengan ${document.name}.`);
                    return issues;
                  });

                const docName = file.name.replace(/\.[^/.]+$/, "");
                const today = new Date().toISOString().split("T")[0];
                const status = consistencyIssues.length ? "Catatan Procurement" : "Lulus Verifikasi";
                const nextActionText = consistencyIssues.length ? "Periksa dan samakan informasi yang berbeda sebelum dokumen diproses." : notes || "Informasi dokumen konsisten dengan data yang tersedia. Tetap lakukan review Procurement.";
                const step = ((requests.find(request => request.id === requestId) || state.requests.find(request => request.id === requestId))?.currentStep || "Penyusunan RKS / Spesifikasi Teknis") as ProcurementStep;

                documentsApi.add({
                  request_id: requestId,
                  name: docName,
                  type: docType as DocumentType,
                  document_kind: documentKind as DocumentKind,
                  status,
                  upload_date: today,
                  pic_id: currentUser?.id || "USR-ADMIN",
                  pic_name: currentUser?.name || "Administrator",
                  issues: consistencyIssues,
                  next_action: nextActionText,
                  procurement_step: step,
                  document_date: extractedData.documentDate || today,
                  document_number: extractedData.tenderNumber || undefined,
                  file_url: `/uploads/${file.name}`,
                  mime_type: file.type || "application/pdf",
                }).then((res) => {
                  const created = res.data;
                  const newDoc: DocumentItem = {
                    id: created.id,
                    requestId: created.request_id,
                    name: created.name,
                    type: created.type as DocumentType,
                    documentKind: (created.document_kind as DocumentKind) || (documentKind as DocumentKind),
                    status: (created.status as any) || status,
                    uploadDate: created.upload_date,
                    pic: { id: created.pic_id, name: created.pic_name },
                    issues: created.issues || [],
                    nextAction: created.next_action || nextActionText,
                    procurementStep: created.procurement_step as ProcurementStep | undefined,
                    documentDate: created.document_date,
                    canGenerateAiDraft: true,
                    fileUrl: created.file_url,
                    mimeType: created.mime_type,
                    extractedData,
                  };
                  addDocument(newDoc);
                  toast.success("Dokumen berhasil disimpan ke sistem.");
                  router.push(`/dashboard/documents/result?id=${created.id}`);
                }).catch(() => {
                  const fallbackDoc: DocumentItem = {
                    id: `DOC-${Date.now()}`,
                    requestId,
                    name: docName,
                    type: docType as DocumentType,
                    documentKind: documentKind as DocumentKind,
                    status,
                    uploadDate: today,
                    pic: { id: currentUser?.id || "USR-ADMIN", name: currentUser?.name || "Administrator" },
                    issues: consistencyIssues,
                    nextAction: nextActionText,
                    procurementStep: step,
                    documentDate: today,
                    canGenerateAiDraft: true,
                    fileUrl: `/uploads/${file.name}`,
                    mimeType: file.type || "application/octet-stream",
                    extractedData,
                  };
                  addDocument(fallbackDoc);
                  router.push(`/dashboard/documents/result?id=${fallbackDoc.id}`);
                });
              }}
              disabled={!file || !docType || !documentKind || !requestId}
              className={`px-5 py-2.5 flex items-center gap-2 rounded-lg text-sm font-medium shadow-sm transition-all ${
                (file && docType && documentKind && requestId) 
                  ? isD1Doc 
                    ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                    : 'bg-[#0a4d8c] hover:bg-[#093e6f] text-white' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>{isD1Doc ? "Simulasi Validasi D1 (AI)" : "Mulai Pemeriksaan AI"}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
      
      <ValidationSimulationModal 
        isOpen={isSimulating}
        onClose={() => setIsSimulating(false)}
        documentKind={documentKind}
        file={file}
        workName={extractedData.workName}
        onComplete={(findings, isValid) => {
          setIsSimulating(false);
          const docName = file!.name.replace(/\.[^/.]+$/, "");
          const status = isValid ? "Lulus Verifikasi" : "Catatan Procurement";
          const nextAction = isValid ? "Informasi dokumen lengkap dan valid." : "Harap lengkapi atau perbaiki bagian yang menjadi temuan.";
          const procurementStep = ((requests.find(request => request.id === requestId) || state.requests.find(request => request.id === requestId))?.currentStep || "Penyusunan RKS / Spesifikasi Teknis") as ProcurementStep;
          const today = new Date().toISOString().split("T")[0];

          documentsApi.add({
            request_id: requestId,
            name: docName,
            type: docType as DocumentType,
            document_kind: documentKind as DocumentKind,
            status,
            upload_date: today,
            pic_id: currentUser?.id || "USR-ADMIN",
            pic_name: currentUser?.name || "Administrator",
            issues: findings,
            next_action: nextAction,
            procurement_step: procurementStep,
            document_date: extractedData.documentDate || today,
            document_number: extractedData.tenderNumber || undefined,
            file_url: `/uploads/${file!.name}`,
            mime_type: file!.type || "application/pdf",
          }).then((res) => {
            const created = res.data;
            const newDoc: DocumentItem = {
              id: created.id,
              requestId: created.request_id,
              name: created.name,
              type: created.type as DocumentType,
              documentKind: (created.document_kind as DocumentKind) || (documentKind as DocumentKind),
              status: (created.status as any) || status,
              uploadDate: created.upload_date,
              pic: { id: created.pic_id, name: created.pic_name },
              issues: created.issues || [],
              nextAction: created.next_action || nextAction,
              procurementStep: created.procurement_step as ProcurementStep | undefined,
              documentDate: created.document_date,
              canGenerateAiDraft: true,
              fileUrl: created.file_url,
              mimeType: created.mime_type,
              extractedData,
            };
            addDocument(newDoc);
            toast.success("Dokumen pra-tender berhasil disimpan ke database sistem.");
            router.push(`/dashboard/documents/result?id=${created.id}`);
          }).catch(() => {
            const fallbackDoc: DocumentItem = {
              id: `DOC-${Date.now()}`,
              requestId,
              name: docName,
              type: docType as DocumentType,
              documentKind: documentKind as DocumentKind,
              status,
              uploadDate: today,
              pic: { id: currentUser?.id || "USR-ADMIN", name: currentUser?.name || "Administrator" },
              issues: findings,
              nextAction,
              procurementStep,
              documentDate: today,
              canGenerateAiDraft: true,
              fileUrl: `/uploads/${file!.name}`,
              mimeType: file!.type || "application/octet-stream",
              extractedData,
            };
            addDocument(fallbackDoc);
            router.push(`/dashboard/documents/result?id=${fallbackDoc.id}`);
          });
        }}
      />
    </div>
  );
}
