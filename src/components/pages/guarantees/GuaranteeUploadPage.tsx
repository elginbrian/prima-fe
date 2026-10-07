"use client";

import { useState, DragEvent } from "react";
import { UploadCloud, FileText, X, ArrowRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useProcurement } from "@/context/ProcurementContext";
import { useUploadGuaranteeWithFile } from "@/lib/query/hooks/procurement/useGuarantees";
import type { GuaranteeItem, ProcurementAttachmentType } from "@/types";
import { DocumentPreview } from "@/components/widgets/upload/DocumentPreview";

export default function GuaranteeUploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, addAttachment } = useProcurement();
  const uploadGuaranteeMutation = useUploadGuaranteeWithFile();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [requestId] = useState(() => searchParams.get("requestId") ?? "");
  const selectedRequest = state.requests.find(request => request.id === requestId);
  const [documentType, setDocumentType] = useState<"Jaminan Pelaksanaan" | "Jaminan Pemeliharaan" | ProcurementAttachmentType>("Jaminan Pelaksanaan");
  const [formData, setFormData] = useState({
    type: "Jaminan Pelaksanaan" as GuaranteeItem["type"],
    vendor: "",
    issuer: "",
    issuerType: "Bank" as GuaranteeItem["issuerType"],
    beneficiary: "",
    referenceNo: "",
    value: "",
    issueDate: "",
    submissionDate: "",
    expiryDate: "",
  });
  const requiresExtraction = documentType === "Jaminan Pelaksanaan" || documentType === "Jaminan Pemeliharaan";

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
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
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row flex-1">
        
        {/* Left Side: Document Preview */}
        <div className="w-full md:w-1/2 bg-slate-50 border-r border-slate-200 p-6 flex flex-col">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Preview Dokumen</h2>
          <DocumentPreview file={file} />        </div>

        {/* Right Side: Upload Form */}
        <div className="w-full md:w-1/2 flex flex-col">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800">Upload Dokumen & Jaminan</h2>
            <p className="text-sm text-slate-500 mt-1">Pilih jenis dokumen terlebih dahulu. OCR hanya digunakan untuk jaminan yang memerlukan ekstraksi.</p>
          </div>
          
          <div className="p-6 space-y-5 flex-1 overflow-y-auto">
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
                    <p className="text-xs text-slate-500 mb-4">PDF, JPG, PNG (Max. 10MB)</p>
                    
                    <label className="cursor-pointer bg-white border border-[#0a4d8c] text-[#0a4d8c] hover:bg-blue-50 px-4 py-2 rounded-lg text-xs font-medium transition-colors">
                      <span>Telusuri Komputer</span>
                      <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Terkait Pengadaan</label>
              {selectedRequest ? (
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-3">
                  <div className="text-xs font-semibold text-[#0a4d8c]">{selectedRequest.id}</div>
                  <div className="mt-1 text-sm font-semibold text-slate-800">{selectedRequest.title}</div>
                  <div className="mt-1 text-xs text-slate-500">PIC: {selectedRequest.pic.name}</div>
                </div>
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">Pilih pengadaan dari halaman Jaminan untuk menambahkan dokumen.</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Jenis Dokumen <span className="text-red-500">*</span></label>
              <select
                value={documentType}
                onChange={(event) => {
                  const nextType = event.target.value as typeof documentType;
                  setDocumentType(nextType);
                  if (nextType === "Jaminan Pelaksanaan" || nextType === "Jaminan Pemeliharaan") {
                    setFormData(prev => ({ ...prev, type: nextType === "Jaminan Pemeliharaan" ? "Jaminan Masa Pemeliharaan" : "Jaminan Pelaksanaan" }));
                  }
                }}
                className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2.5 bg-white focus:outline-none focus:border-[#0a4d8c]"
              >
                <option value="Jaminan Pelaksanaan">Jaminan Pelaksanaan — ekstraksi OCR</option>
                <option value="Jaminan Pemeliharaan">Jaminan Pemeliharaan — ekstraksi OCR</option>
                <option value="Dokumen Pendukung Lain">Dokumen Pendukung Lain — simpan tanpa ekstraksi</option>
              </select>
              <p className="mt-1.5 text-xs text-slate-500">{requiresExtraction ? "Data jaminan akan ditampilkan untuk diperiksa dan dikoreksi manual." : "File disimpan pada pekerjaan tanpa menjalankan ekstraksi OCR."}</p>
            </div>

            {/* AI Extracted Fields (Mock) */}
            {file && requiresExtraction && (
              <div className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hasil Ekstraksi Otomatis</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Jenis Jaminan</label>
                    <select value={formData.type} onChange={(event) => setFormData(prev => ({ ...prev, type: event.target.value as GuaranteeItem["type"] }))} className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2 bg-slate-50 focus:outline-none focus:border-[#0a4d8c]">
                      <option>Jaminan Pelaksanaan</option>
                      <option>Jaminan Masa Pemeliharaan</option>
                      <option>Jaminan Uang Muka</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Nama Vendor / Principal</label>
                    <input type="text" value={formData.vendor} onChange={(event) => setFormData(prev => ({ ...prev, vendor: event.target.value }))} placeholder="Nama vendor / principal" className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2 bg-slate-50 focus:outline-none focus:border-[#0a4d8c]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Jenis Penerbit</label>
                    <select value={formData.issuerType} onChange={(event) => setFormData(prev => ({ ...prev, issuerType: event.target.value as GuaranteeItem["issuerType"] }))} className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2 bg-slate-50 focus:outline-none focus:border-[#0a4d8c]"><option value="Bank">Bank</option><option value="Asuransi">Asuransi</option><option value="Lainnya">Lainnya</option></select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Nama Penerbit</label>
                    <input type="text" value={formData.issuer} onChange={(event) => setFormData(prev => ({ ...prev, issuer: event.target.value }))} placeholder="Bank / asuransi penerbit" className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2 bg-slate-50 focus:outline-none focus:border-[#0a4d8c]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Nomor Referensi</label>
                    <input type="text" value={formData.referenceNo} onChange={(event) => setFormData(prev => ({ ...prev, referenceNo: event.target.value }))} placeholder="Nomor referensi" className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2 bg-slate-50 focus:outline-none focus:border-[#0a4d8c]" />
                  </div>
                  <div><label className="block text-xs font-medium text-slate-500 mb-1">Penerima Jaminan</label><input type="text" value={formData.beneficiary} onChange={(event) => setFormData(prev => ({ ...prev, beneficiary: event.target.value }))} placeholder="Contoh: PT Pertamina Patra Niaga" className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2 bg-slate-50 focus:outline-none focus:border-[#0a4d8c]" /></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Nilai Jaminan</label>
                    <input type="text" value={formData.value} onChange={(event) => setFormData(prev => ({ ...prev, value: event.target.value }))} placeholder="Rp 5.000.000.000" className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2 bg-slate-50 focus:outline-none focus:border-[#0a4d8c]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Berlaku Sampai (Jatuh Tempo)</label>
                    <input type="date" value={formData.expiryDate} onChange={(event) => setFormData(prev => ({ ...prev, expiryDate: event.target.value }))} className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2 bg-slate-50 focus:outline-none focus:border-[#0a4d8c]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Tanggal Terbit</label>
                    <input type="date" value={formData.issueDate} onChange={(event) => setFormData(prev => ({ ...prev, issueDate: event.target.value }))} className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2 bg-slate-50 focus:outline-none focus:border-[#0a4d8c]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Tanggal Penyerahan</label>
                    <input type="date" value={formData.submissionDate} onChange={(event) => setFormData(prev => ({ ...prev, submissionDate: event.target.value }))} className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2 bg-slate-50 focus:outline-none focus:border-[#0a4d8c]" />
                  </div>
                </div>
              </div>
            )}

          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 mt-auto shrink-0">
            <button 
              onClick={() => router.push('/dashboard/guarantees')}
              className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              Batal
            </button>
            <button 
              onClick={() => {
                if (!file) return;
                if (!requiresExtraction) {
                  addAttachment({
                    id: `ATT-${Date.now()}`,
                    requestId,
                    type: documentType as ProcurementAttachmentType,
                    name: documentType,
                    uploadedAt: new Date().toISOString().split("T")[0],
                    uploadedBy: { id: "ADMIN", name: "P3 - Admin" },
                    fileUrl: "/mock-docs/" + file.name,
                    mimeType: file.type,
                  });
                  router.push('/dashboard/guarantees');
                  return;
                }
                const expiryTime = new Date(formData.expiryDate).getTime();
                const remainingDays = Number.isNaN(expiryTime) ? 0 : Math.ceil((expiryTime - Date.now()) / 86400000);
                const status: GuaranteeItem["status"] = remainingDays < 0 ? "Expired" : remainingDays <= state.settings.slaWarningDays ? "Mendekati Expiry" : "Aktif";
                const valueRaw = Number(formData.value.replace(/[^0-9]/g, "")) || 0;
                uploadGuaranteeMutation.mutate({ file: file, payload: { request_id: requestId, reference_no: formData.referenceNo, type: formData.type, value: valueRaw, issuer: formData.issuer, issuer_type: formData.issuerType, beneficiary: formData.beneficiary, vendor_id: "VND-NEW", vendor_name: formData.vendor, issue_date: formData.issueDate + "T00:00:00Z", expiry_date: formData.expiryDate + "T00:00:00Z", pic_id: "ADMIN", pic_name: "P3 - Admin", status } as any }, { onSuccess: () => router.push('/dashboard/guarantees') }); }} disabled={!file || !requestId || uploadGuaranteeMutation.isPending || (requiresExtraction && (!formData.vendor || !formData.issuer || !formData.referenceNo || !formData.value || !formData.issueDate || !formData.expiryDate))}
              className={`px-5 py-2.5 flex items-center gap-2 rounded-lg text-sm font-medium shadow-sm transition-all ${
                file && requestId && (!requiresExtraction || (formData.vendor && formData.issuer && formData.referenceNo && formData.value && formData.issueDate && formData.expiryDate)) ? 'bg-[#0a4d8c] hover:bg-[#093e6f] text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>{requiresExtraction ? "Simpan & Verifikasi" : "Simpan Dokumen"}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

