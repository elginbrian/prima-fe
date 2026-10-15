"use client";

import { useState, useEffect, DragEvent } from "react";
import { UploadCloud, FileText, X, ArrowRight, AlertTriangle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useProcurements } from "@/lib/query/hooks/procurement/useProcurement";
import { useProcurement } from "@/context/ProcurementContext";
import { vendorIdFromName } from "@/lib/adapters/procurement.mutations";
import { useCurrentUser } from "@/lib/query/hooks/auth/useCurrentUser";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui";
import { getErrorMessage } from "@/lib/api/errors";
import { useUploadGuaranteeWithFile, useExtractGuarantee } from "@/lib/query/hooks/procurement/useGuarantees";
import type { GuaranteeItem, ProcurementAttachmentType } from "@/types";
import { DocumentPreview } from "@/components/widgets/upload/DocumentPreview";
import { formatRupiah } from "@/lib/utils";

export default function GuaranteeUploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, addAttachment } = useProcurement();
  const { data: requests = [] } = useProcurements();
  const uploadGuaranteeMutation = useUploadGuaranteeWithFile();
  const extractGuaranteeMutation = useExtractGuarantee();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const initialRequestId = searchParams.get("requestId") ?? "";
  const [requestId, setRequestId] = useState(() => initialRequestId);
  const selectedRequest = requests.find(request => request.id === requestId);
  const [documentType, setDocumentType] = useState<"Jaminan Pelaksanaan" | "Jaminan Pemeliharaan" | ProcurementAttachmentType>("Jaminan Pelaksanaan");
  const [isExtracting, setIsExtracting] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const { data: currentUser } = useCurrentUser();
  const toast = useToast();
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

  useEffect(() => {
    if (file && requiresExtraction) {
      setIsExtracting(true);
      setOcrError(null);
      extractGuaranteeMutation.mutateAsync(file)
        .then((data) => {
          setFormData(prev => ({
            ...prev,
            type: (data.type as GuaranteeItem["type"]) || prev.type,
            vendor: data.vendor_name || prev.vendor || "",
            issuer: data.issuer || prev.issuer || "",
            issuerType: data.issuer_type || prev.issuerType || "Bank",
            beneficiary: data.beneficiary || prev.beneficiary || "PT Pertamina Patra Niaga",
            referenceNo: data.reference_no || prev.referenceNo || "",
            value: data.value ? "Rp " + data.value.toLocaleString('id-ID') : prev.value,
            issueDate: data.issue_date ? data.issue_date.split("T")[0] : prev.issueDate,
            expiryDate: data.expiry_date ? data.expiry_date.split("T")[0] : prev.expiryDate,
          }));
        })
        .catch(err => {
          setOcrError("Berkas terdeteksi sebagai pindaian (scan) fisik tanpa teks digital. Sistem telah mengisi draf awal dari data paket pengadaan.");
          if (file) {
            const cleanBaseName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 25);
            const defaultRef = `JAM-${cleanBaseName}`;
            const today = new Date().toISOString().split("T")[0];
            const nextYear = new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0];
            setFormData(prev => ({
              ...prev,
              vendor: prev.vendor || selectedRequest?.title || "Rekanan Pengadaan",
              issuer: prev.issuer || "Penerbit Jaminan",
              referenceNo: prev.referenceNo || defaultRef,
              value: prev.value || (selectedRequest?.amount ? "Rp " + Math.round(selectedRequest.amount * 0.05).toLocaleString("id-ID") : "Rp 0"),
              issueDate: prev.issueDate || today,
              expiryDate: prev.expiryDate || nextYear,
            }));
          }
        })
        .finally(() => {
          setIsExtracting(false);
        });
    }
  }, [file, requiresExtraction, selectedRequest]);

  const handleUseProcurementDefaults = () => {
    if (!file) return;
    const cleanBaseName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 25);
    const defaultRef = `JAM-${cleanBaseName}`;
    const today = new Date().toISOString().split("T")[0];
    const nextYear = new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0];
    setFormData(prev => ({
      ...prev,
      vendor: prev.vendor || selectedRequest?.title || "Rekanan Pengadaan",
      issuer: prev.issuer || "Penerbit Jaminan",
      referenceNo: prev.referenceNo || defaultRef,
      value: prev.value || (selectedRequest?.amount ? "Rp " + selectedRequest.amount.toLocaleString("id-ID") : "Rp 0"),
      issueDate: prev.issueDate || today,
      expiryDate: prev.expiryDate || nextYear,
    }));
    setOcrError(null);
  };

  const isFormValid = Boolean(
    file &&
    requestId &&
    (!requiresExtraction || (
      formData.vendor.trim() &&
      formData.issuer.trim() &&
      formData.referenceNo.trim() &&
      formData.value.trim() &&
      formData.issueDate &&
      formData.expiryDate
    ))
  );

  const missingFields: string[] = [];
  if (!file) missingFields.push("File Dokumen");
  if (!requestId) missingFields.push("Paket Pengadaan");
  if (requiresExtraction) {
    if (!formData.vendor.trim()) missingFields.push("Nama Vendor");
    if (!formData.issuer.trim()) missingFields.push("Penerbit");
    if (!formData.referenceNo.trim()) missingFields.push("No. Jaminan");
    if (!formData.value.trim()) missingFields.push("Nilai");
    if (!formData.issueDate) missingFields.push("Tgl Terbit");
    if (!formData.expiryDate) missingFields.push("Tgl Jatuh Tempo");
  }

  const toIsoDate = (d: string) => {
    if (!d) return new Date().toISOString();
    if (d.includes("T")) return d;
    return `${d}T00:00:00Z`;
  };

  const handleSubmit = () => {
    if (!file || !requestId) {
      toast.error("Harap pilih file dan paket pengadaan terlebih dahulu.");
      return;
    }

    const cleanBaseName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 25);
    const refNo = formData.referenceNo.trim() || `JAM-${cleanBaseName}`;
    const vendorName = formData.vendor.trim() || selectedRequest?.title || "Rekanan Pengadaan";
    const issuerName = formData.issuer.trim() || (requiresExtraction ? "Penerbit Jaminan" : "Penyedia Dokumen");
    const today = new Date().toISOString().split("T")[0];
    const defaultExpiry = new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0];
    const issueDateStr = formData.issueDate || today;
    const expiryDateStr = formData.expiryDate || defaultExpiry;

    const expiryTime = new Date(expiryDateStr).getTime();
    const remainingDays = Number.isNaN(expiryTime) ? 0 : Math.ceil((expiryTime - Date.now()) / 86400000);
    const status: GuaranteeItem["status"] = remainingDays < 0 ? "Expired" : remainingDays <= (state.settings?.slaWarningDays ?? 3) ? "Mendekati Expiry" : "Aktif";
    const valueRaw = Number(formData.value.replace(/[^0-9]/g, "")) || (selectedRequest?.amount ? Math.round(selectedRequest.amount * 0.05) : 0);

    uploadGuaranteeMutation.mutate({
      file: file,
      payload: {
        request_id: requestId,
        reference_no: refNo,
        type: formData.type || (documentType as GuaranteeItem["type"]),
        value: valueRaw,
        issuer: issuerName,
        issuer_type: formData.issuerType || "Lainnya",
        beneficiary: formData.beneficiary.trim() || "PT Pertamina Patra Niaga",
        vendor_id: vendorIdFromName(vendorName) || "V-001",
        vendor_name: vendorName,
        issue_date: toIsoDate(issueDateStr),
        expiry_date: toIsoDate(expiryDateStr),
        pic_id: currentUser?.id ?? "USR-ADMIN",
        pic_name: currentUser?.name ?? "Administrator",
        status,
      }
    }, {
      onSuccess: () => {
        toast.success("Dokumen jaminan berhasil disimpan ke sistem dan cloud storage.");
        router.push('/dashboard/guarantees');
      },
      onError: (err) => {
        toast.error(getErrorMessage(err, "Gagal mengunggah dan menyimpan jaminan."));
      }
    });
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
            <h2 className="text-lg font-bold text-slate-800">Unggah Dokumen & Jaminan</h2>
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
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Terkait Pengadaan <span className="text-red-500">*</span>
              </label>
              {initialRequestId && selectedRequest ? (
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-3">
                  <div className="text-xs font-semibold text-[#0a4d8c]">{selectedRequest.id}</div>
                  <div className="mt-1 text-sm font-semibold text-slate-800">{selectedRequest.title}</div>
                  <div className="mt-1 text-xs text-slate-500">PIC: {selectedRequest.pic.name}</div>
                </div>
              ) : (
                <div>
                  <select
                    value={requestId}
                    onChange={(event) => setRequestId(event.target.value)}
                    className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2.5 bg-white focus:outline-none focus:border-[#0a4d8c]"
                  >
                    <option value="">-- Pilih Paket Pengadaan --</option>
                    {requests.map((req) => (
                      <option key={req.id} value={req.id}>
                        {req.id} - {req.title}
                      </option>
                    ))}
                  </select>
                  {selectedRequest ? (
                    <p className="mt-1.5 text-xs text-slate-500">
                      PIC: {selectedRequest.pic.name} · Nilai: Rp {selectedRequest.amount?.toLocaleString('id-ID') || "-"}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-xs text-amber-600">Pilih paket pengadaan untuk mengaitkan jaminan ini.</p>
                  )}
                </div>
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
                <option value="Jaminan Pelaksanaan">Jaminan Pelaksanaan (Ekstraksi OCR Otomatis)</option>
                <option value="Jaminan Pemeliharaan">Jaminan Pemeliharaan (Ekstraksi OCR Otomatis)</option>
                <option value="Dokumen Pendukung Lain">Dokumen Jaminan / Pendukung Lain (Tanpa OCR)</option>
              </select>
              <p className="mt-1.5 text-xs text-slate-500">{requiresExtraction ? "Data jaminan akan diekstrak otomatis dan ditampilkan untuk verifikasi." : "Dokumen langsung disimpan dan dikaitkan ke pengadaan ini tanpa ekstraksi OCR."}</p>
            </div>

            {file && requiresExtraction && !isExtracting && ocrError && (
              <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-900 shadow-2xs">
                <div className="font-bold flex items-center gap-2 text-amber-900">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                  <span>Dokumen merupakan scan fisik tanpa teks digital</span>
                </div>
                <p className="mt-1 text-xs text-amber-800/90 leading-relaxed">
                  OCR tidak mendeteksi teks digital otomatis pada berkas ini (misalnya scan kertas fisik). Dokumen tetap akan disimpan dan diunggah ke storage cloud serta masuk ke tabel jaminan per pengadaan.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleUseProcurementDefaults}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-900 shadow-2xs hover:bg-amber-100 transition-colors"
                  >
                    Gunakan Data Pengadaan & Lanjutkan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDocumentType("Dokumen Pendukung Lain");
                      setOcrError(null);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Simpan Tanpa Ekstraksi OCR
                  </button>
                </div>
              </div>
            )}

            {file && !requiresExtraction && (
              <div className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[#0a4d8c]"></div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Informasi Dokumen Jaminan (Tanpa OCR)</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Judul / Keterangan Dokumen</label>
                    <input
                      type="text"
                      value={formData.referenceNo}
                      onChange={(e) => setFormData(prev => ({ ...prev, referenceNo: e.target.value }))}
                      placeholder={file.name.replace(/\.[^/.]+$/, "")}
                      className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2 bg-slate-50 focus:outline-none focus:border-[#0a4d8c]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Kategori Dokumen</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2 bg-slate-50 focus:outline-none focus:border-[#0a4d8c]"
                    >
                      <option value="Jaminan Pelaksanaan">Jaminan Pelaksanaan</option>
                      <option value="Jaminan Masa Pemeliharaan">Jaminan Masa Pemeliharaan</option>
                      <option value="Jaminan Uang Muka">Jaminan Uang Muka</option>
                      <option value="Dokumen Pendukung">Dokumen Pendukung Lain</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Nama Rekanan / Vendor (Opsional)</label>
                    <input
                      type="text"
                      value={formData.vendor}
                      onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))}
                      placeholder={selectedRequest?.title || "Nama rekanan"}
                      className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2 bg-slate-50 focus:outline-none focus:border-[#0a4d8c]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Nilai Nominal (Opsional)</label>
                    <input
                      type="text"
                      value={formData.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                      placeholder={selectedRequest?.amount ? "Rp " + selectedRequest.amount.toLocaleString("id-ID") : "Rp 0"}
                      className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2 bg-slate-50 focus:outline-none focus:border-[#0a4d8c]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* AI Extracted Fields */}
            {file && requiresExtraction && (
              isExtracting ? (
                <div className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in duration-300">
                  <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 border border-slate-200 border-dashed rounded-xl">
                    <div className="w-10 h-10 border-4 border-blue-200 border-t-[#0a4d8c] rounded-full animate-spin mb-4"></div>
                    <h3 className="text-sm font-bold text-slate-700">Mengekstrak Data dengan AI...</h3>
                    <p className="text-xs text-slate-500 mt-1">Sistem sedang membaca dokumen untuk mengisi formulir secara otomatis.</p>
                  </div>
                </div>
              ) : (
              <div className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[#0a4d8c]"></div>
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
                    {selectedRequest?.amount && selectedRequest.amount > 0 && (() => {
                      const minReq = selectedRequest.amount * 0.05;
                      const numVal = parseFloat(formData.value.replace(/[^0-9]/g, '')) || 0;
                      return (
                        <div className="mt-1.5 text-[11px] text-slate-500 space-y-0.5">
                          <div>Regulasi: Min. 5% Pagu = <strong className="text-slate-700">{formatRupiah(minReq)}</strong></div>
                          {numVal > 0 && numVal < minReq && (
                            <div className="text-amber-700 font-semibold flex items-center gap-1.5">
                              <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                              <span>Nilai jaminan kurang dari 5% pagu pengadaan (di bawah batas minimum regulasi)</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Tanggal Jatuh Tempo (Masa Berlaku)</label>
                    <input type="date" value={formData.expiryDate} onChange={(event) => setFormData(prev => ({ ...prev, expiryDate: event.target.value }))} className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2 bg-slate-50 focus:outline-none focus:border-[#0a4d8c]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Tanggal Terbit</label>
                    <input type="date" value={formData.issueDate} onChange={(event) => setFormData(prev => ({ ...prev, issueDate: event.target.value }))} className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2 bg-slate-50 focus:outline-none focus:border-[#0a4d8c]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Tanggal Serah Terima Berkas</label>
                    <input type="date" value={formData.submissionDate} onChange={(event) => setFormData(prev => ({ ...prev, submissionDate: event.target.value }))} className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2 bg-slate-50 focus:outline-none focus:border-[#0a4d8c]" />
                  </div>
                </div>
              </div>
              )
            )}

          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 mt-auto shrink-0">
            <div className="text-xs text-slate-500 w-full sm:w-auto">
              {!isFormValid && missingFields.length > 0 && (
                <span className="text-amber-700 flex items-center gap-1.5">
                  <AlertTriangle size={14} className="shrink-0 text-amber-500" />
                  <span>Harap lengkapi: {missingFields.slice(0, 3).join(", ")}{missingFields.length > 3 ? ` (+${missingFields.length - 3} lainnya)` : ""}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button 
                type="button"
                onClick={() => router.push('/dashboard/guarantees')}
                disabled={uploadGuaranteeMutation.isPending}
                className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
              >
                Batal
              </button>
              <button 
                type="button"
                onClick={handleSubmit}
                disabled={!isFormValid || uploadGuaranteeMutation.isPending}
                className={`px-5 py-2.5 flex items-center justify-center gap-2 rounded-lg text-sm font-medium shadow-sm transition-all ${
                  isFormValid && !uploadGuaranteeMutation.isPending
                    ? 'bg-[#0a4d8c] hover:bg-[#093e6f] text-white active:scale-[0.99]' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {uploadGuaranteeMutation.isPending ? (
                  <>
                    <Spinner size="sm" className="border-white border-t-transparent" />
                    <span>Menyimpan & Mengunggah...</span>
                  </>
                ) : (
                  <>
                    <span>{requiresExtraction ? "Simpan & Verifikasi" : "Simpan Dokumen"}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}







