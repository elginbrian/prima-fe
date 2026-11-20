"use client";

import { useState, useEffect, useMemo, useCallback, DragEvent } from "react";
import {
  UploadCloud,
  X,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useProcurements } from "@/lib/query/hooks/procurement/useProcurement";
import { useProcurement } from "@/context/ProcurementContext";
import { vendorIdFromName } from "@/lib/adapters/procurement.mutations";
import { useCurrentUser } from "@/lib/query/hooks/auth/useCurrentUser";
import { useToast } from "@/components/ui/Toast";
import { Spinner, SearchableSelect } from "@/components/ui";
import { getErrorMessage } from "@/lib/api/errors";
import {
  useUploadGuaranteeWithFile,
  useExtractGuarantee,
} from "@/lib/query/hooks/procurement/useGuarantees";
import type { GuaranteeItem, ProcurementAttachmentType } from "@/types";
import { DocumentPreview } from "@/components/widgets/upload/DocumentPreview";
import { formatRupiah, formatRequestCode } from "@/lib/utils";

type UploadDocType =
  | "Jaminan Pelaksanaan"
  | "Jaminan Pemeliharaan"
  | "Jaminan Uang Muka"
  | "Kontrak"
  | "Surat Penawaran"
  | ProcurementAttachmentType;

const UPLOAD_DOC_TYPE_OPTIONS: { value: UploadDocType; label: string; description: string }[] = [
  {
    value: "Jaminan Pelaksanaan",
    label: "Jaminan Pelaksanaan (Ekstraksi OCR AI)",
    description: "Bank Garansi / Surety Bond pelaksanaan kontrak",
  },
  {
    value: "Jaminan Pemeliharaan",
    label: "Jaminan Masa Pemeliharaan (Ekstraksi OCR AI)",
    description: "Warkat jaminan selama masa retensi / pemeliharaan",
  },
  {
    value: "Jaminan Uang Muka",
    label: "Jaminan Uang Muka (Ekstraksi OCR AI)",
    description: "Warkat jaminan pembayaran uang muka",
  },
  {
    value: "Kontrak",
    label: "Dokumen Kontrak / SPK (Ekstraksi OCR AI)",
    description: "Ekstrak nomor kontrak, nilai, vendor, dan jangka waktu",
  },
  {
    value: "Surat Penawaran",
    label: "Surat Penawaran Vendor (Ekstraksi OCR AI)",
    description: "Ekstrak nomor surat, nilai penawaran, dan masa berlaku",
  },
  {
    value: "Dokumen Pendukung Lain",
    label: "Dokumen Jaminan / Pendukung Lain (Tanpa OCR)",
    description: "Simpan langsung tanpa ekstraksi otomatis",
  },
];

const GUARANTEE_KIND_OPTIONS = [
  { value: "Jaminan Pelaksanaan", label: "Jaminan Pelaksanaan" },
  { value: "Jaminan Masa Pemeliharaan", label: "Jaminan Masa Pemeliharaan" },
  { value: "Jaminan Uang Muka", label: "Jaminan Uang Muka" },
  { value: "Dokumen Pendukung", label: "Dokumen Pendukung Lain" },
];

const ISSUER_TYPE_OPTIONS = [
  { value: "Bank", label: "Bank" },
  { value: "Asuransi", label: "Asuransi" },
  { value: "Lainnya", label: "Lainnya" },
];

export default function GuaranteeUploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state } = useProcurement();
  const { data: requests = [] } = useProcurements();
  const uploadGuaranteeMutation = useUploadGuaranteeWithFile();
  const extractGuaranteeMutation = useExtractGuarantee();

  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const initialRequestId = searchParams.get("requestId") ?? "";
  const [requestId, setRequestId] = useState(() => initialRequestId);
  const selectedRequest = requests.find((request) => request.id === requestId);
  const [documentType, setDocumentType] = useState<UploadDocType>("Jaminan Pelaksanaan");
  const [isExtracting, setIsExtracting] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrHintMeta, setOcrHintMeta] = useState<{
    durationText?: string | null;
    projectTitle?: string | null;
  } | null>(null);
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

  const requiresExtraction = documentType !== "Dokumen Pendukung Lain";

  const requestOptions = useMemo(
    () => [
      { value: "", label: "-- Pilih Paket Pengadaan --" },
      ...requests.map((req) => ({
        value: req.id,
        label: `${formatRequestCode(req.id)} - ${req.title}`,
        description: `PIC: ${req.pic.name} · Nilai: Rp ${req.amount?.toLocaleString("id-ID") || "-"}`,
        keywords: `${req.id} ${req.title} ${req.pic.name}`,
      })),
    ],
    [requests]
  );

  const runOcrExtraction = useCallback(
    async (targetFile: File) => {
      setIsExtracting(true);
      setOcrError(null);
      setOcrHintMeta(null);
      try {
        const data: any = await extractGuaranteeMutation.mutateAsync(targetFile);
        setFormData((prev) => ({
          ...prev,
          type: (data.type as GuaranteeItem["type"]) || prev.type,
          vendor: data.vendor_name || prev.vendor || "",
          issuer: data.issuer || prev.issuer || "",
          issuerType: data.issuer_type || prev.issuerType || "Bank",
          beneficiary:
            data.beneficiary || prev.beneficiary || "PT Pertamina Patra Niaga",
          referenceNo: data.reference_no || prev.referenceNo || "",
          value: data.value
            ? "Rp " + Number(data.value).toLocaleString("id-ID")
            : prev.value,
          issueDate: data.issue_date
            ? String(data.issue_date).split("T")[0]
            : prev.issueDate,
          expiryDate: data.expiry_date
            ? String(data.expiry_date).split("T")[0]
            : prev.expiryDate,
        }));
        if (data.duration_text || data.project_title) {
          setOcrHintMeta({
            durationText: data.duration_text,
            projectTitle: data.project_title,
          });
        }
        toast.success("Ekstraksi OCR AI selesai. Silakan verifikasi data di formulir.");
      } catch (err) {
        setOcrError(
          getErrorMessage(
            err,
            "OCR AI tidak dapat membaca sebagian/seluruh berkas. Anda dapat mencoba ulang OCR atau melengkapi kolom secara manual."
          )
        );
      } finally {
        setIsExtracting(false);
      }
    },
    [extractGuaranteeMutation, toast]
  );

  useEffect(() => {
    if (file && requiresExtraction) {
      void runOcrExtraction(file);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, requiresExtraction]);

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

  const isFormValid = Boolean(
    file &&
      requestId &&
      (!requiresExtraction ||
        (formData.vendor.trim() &&
          formData.issuer.trim() &&
          formData.referenceNo.trim() &&
          formData.value.trim() &&
          formData.issueDate &&
          formData.expiryDate))
  );

  const missingFields: string[] = [];
  if (!file) missingFields.push("File Dokumen");
  if (!requestId) missingFields.push("Paket Pengadaan");
  if (requiresExtraction) {
    if (!formData.vendor.trim()) missingFields.push("Nama Vendor");
    if (!formData.issuer.trim()) missingFields.push("Penerbit");
    if (!formData.referenceNo.trim()) missingFields.push("No. Referensi");
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

    const cleanBaseName = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 25);
    const refNo = formData.referenceNo.trim() || `JAM-${cleanBaseName}`;
    const vendorName =
      formData.vendor.trim() || selectedRequest?.title || "Rekanan Pengadaan";
    const issuerName =
      formData.issuer.trim() ||
      (requiresExtraction ? "Penerbit Jaminan" : "Penyedia Dokumen");
    const today = new Date().toISOString().split("T")[0];
    const defaultExpiry = new Date(Date.now() + 365 * 86400000)
      .toISOString()
      .split("T")[0];
    const issueDateStr = formData.issueDate || today;
    const expiryDateStr = formData.expiryDate || defaultExpiry;

    const expiryTime = new Date(expiryDateStr).getTime();
    const remainingDays = Number.isNaN(expiryTime)
      ? 0
      : Math.ceil((expiryTime - Date.now()) / 86400000);
    const status: GuaranteeItem["status"] =
      remainingDays < 0
        ? "Expired"
        : remainingDays <= (state.settings?.slaWarningDays ?? 3)
        ? "Mendekati Expiry"
        : "Aktif";
    const valueRaw = Number(formData.value.replace(/[^0-9]/g, "")) || 0;

    uploadGuaranteeMutation.mutate(
      {
        file,
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
        },
      },
      {
        onSuccess: () => {
          toast.success(
            "Dokumen jaminan berhasil disimpan dan dikaitkan ke paket pekerjaan."
          );
          if (requestId) {
            router.push(
              `/dashboard/overview/${encodeURIComponent(requestId)}?tab=docs-guarantees`
            );
          } else {
            router.push("/dashboard/overview?lens=guarantees");
          }
        },
        onError: (err) => {
          toast.error(
            getErrorMessage(err, "Gagal mengunggah dan menyimpan jaminan.")
          );
        },
      }
    );
  };

  return (
    <div className="space-y-4 pt-2 pb-12 flex flex-col">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() =>
            initialRequestId
              ? router.push(
                  `/dashboard/overview/${encodeURIComponent(
                    initialRequestId
                  )}?tab=docs-guarantees`
                )
              : router.push("/dashboard/overview?lens=guarantees")
          }
          className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-[#0a4d8c] focus:outline-none"
        >
          <ArrowLeft size={14} />
          {initialRequestId
            ? "Kembali ke Detail Pekerjaan"
            : "Kembali ke Warkat Jaminan"}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col lg:flex-row">
        {/* Left Side: Dropzone (when no file) OR Live Document Preview (when file chosen) */}
        <div className="w-full lg:w-5/12 bg-slate-50/70 border-b lg:border-b-0 lg:border-r border-slate-200 p-5 sm:p-6 flex flex-col space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              1. Berkas Dokumen D2
            </h2>
            {file && (
              <div className="flex items-center gap-2">
                {requiresExtraction && !isExtracting && (
                  <button
                    type="button"
                    onClick={() => void runOcrExtraction(file)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#0a4d8c] hover:underline focus:outline-none"
                  >
                    <RefreshCw size={12} />
                    <span>Ekstrak Ulang</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:underline focus:outline-none"
                >
                  <X size={13} />
                  <span>Ganti</span>
                </button>
              </div>
            )}
          </div>

          {!file ? (
            <div
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center min-h-[340px] transition-all cursor-pointer ${
                isDragging
                  ? "border-[#0a4d8c] bg-[#e8f2fc]/60"
                  : "border-slate-300 bg-white hover:border-[#0a4d8c]/60 hover:bg-slate-50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="w-11 h-11 bg-[#e8f2fc] text-[#0a4d8c] rounded-xl flex items-center justify-center mb-3 border border-[#0a4d8c]/20">
                <UploadCloud size={22} />
              </div>
              <h3 className="text-sm font-medium text-slate-800 mb-1">
                Tarik &amp; Lepas Berkas ke Sini
              </h3>
              <p className="text-xs font-normal text-slate-500 text-center max-w-xs mb-4 leading-relaxed">
                Bank Garansi, Kontrak/SPK, atau Surat Penawaran — PDF, DOCX, JPG, PNG (Maks. 10MB)
              </p>

              <label className="cursor-pointer bg-[#0a4d8c] hover:bg-[#083b6c] text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2">
                <span>Telusuri Komputer</span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-[420px]">
              <DocumentPreview file={file} />
            </div>
          )}

          <div className="flex items-center gap-1.5 text-[11px] font-normal text-slate-500">
            <Sparkles size={12} className="text-[#0a4d8c] shrink-0" />
            <span>Ekstraksi OCR Gemini AI mengisi otomatis nomor, nilai, vendor &amp; masa berlaku.</span>
          </div>
        </div>

        {/* Right Side: Clean Form + Sticky Action Bar */}
        <div className="w-full lg:w-7/12 flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm sm:text-base font-semibold text-slate-800">
              2. Pengaitan &amp; Verifikasi Data Jaminan / Dokumen
            </h2>
            <p className="text-xs font-normal text-slate-500 mt-0.5">
              Pilih paket pengadaan dan kategori dokumen, lalu periksa hasil ekstraksi OCR.
            </p>
          </div>

          <div className="p-6 space-y-5 flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-1.5">
                  Terkait Pengadaan <span className="text-[#0a4d8c]">*</span>
                </label>
                {initialRequestId && selectedRequest ? (
                  <div className="rounded-lg border border-[#0a4d8c]/20 bg-[#f4f8fd] px-3 py-2">
                    <div className="text-[11px] font-medium text-[#0a4d8c]">
                      {formatRequestCode(selectedRequest.id)}
                    </div>
                    <div className="text-xs font-medium text-slate-800 line-clamp-1">
                      {selectedRequest.title}
                    </div>
                  </div>
                ) : (
                  <div>
                    <SearchableSelect
                      size="sm"
                      value={requestId}
                      onChange={setRequestId}
                      allowClear={Boolean(requestId)}
                      placeholder="-- Pilih Paket Pengadaan --"
                      searchPlaceholder="Cari kode, nama pekerjaan, atau PIC..."
                      options={requestOptions}
                    />
                    {selectedRequest && (
                      <p className="mt-1 text-[11px] font-normal text-slate-500 truncate">
                        PIC: {selectedRequest.pic.name} · Pagu: Rp{" "}
                        {selectedRequest.amount?.toLocaleString("id-ID") || "-"}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-1.5">
                  Jenis Dokumen <span className="text-[#0a4d8c]">*</span>
                </label>
                <SearchableSelect
                  size="sm"
                  value={documentType}
                  onChange={(val) => {
                    const nextType = val as UploadDocType;
                    setDocumentType(nextType);
                    if (
                      nextType === "Jaminan Pelaksanaan" ||
                      nextType === "Jaminan Pemeliharaan" ||
                      nextType === "Jaminan Uang Muka"
                    ) {
                      setFormData((prev) => ({
                        ...prev,
                        type:
                          nextType === "Jaminan Pemeliharaan"
                            ? "Jaminan Masa Pemeliharaan"
                            : nextType,
                      }));
                    }
                  }}
                  searchPlaceholder="Cari jenis dokumen..."
                  options={UPLOAD_DOC_TYPE_OPTIONS}
                />
              </div>
            </div>

            {ocrHintMeta && (ocrHintMeta.projectTitle || ocrHintMeta.durationText) && (
              <div className="rounded-lg border border-[#0a4d8c]/20 bg-[#f4f8fd] px-3.5 py-2.5 text-xs text-slate-700 space-y-1">
                <div className="font-medium text-[#0a4d8c] flex items-center gap-1.5">
                  <Sparkles size={13} />
                  <span>Info Tambahan Terdeteksi OCR</span>
                </div>
                {ocrHintMeta.projectTitle && (
                  <div className="text-[11px]">
                    Paket Proyek: <span className="font-medium">{ocrHintMeta.projectTitle}</span>
                  </div>
                )}
                {ocrHintMeta.durationText && (
                  <div className="text-[11px]">
                    Jangka Waktu: <span className="font-medium">{ocrHintMeta.durationText}</span>
                  </div>
                )}
              </div>
            )}

            {file && requiresExtraction && !isExtracting && ocrError && (
              <div
                role="alert"
                className="rounded-xl border border-[#0a4d8c]/20 bg-[#f4f8fd] p-4 text-xs text-slate-700"
              >
                <div className="font-medium flex items-center gap-2 text-[#0a4d8c]">
                  <AlertTriangle size={15} className="text-[#0a4d8c] shrink-0" />
                  <span>Ekstraksi OCR AI Memerlukan Perhatian</span>
                </div>
                <p className="mt-1 text-xs font-normal text-slate-600 leading-relaxed">
                  {ocrError}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void runOcrExtraction(file)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#0a4d8c]/30 bg-white px-3 py-1.5 text-xs font-medium text-[#0a4d8c] hover:bg-[#e8f2fc] transition-colors"
                  >
                    <RefreshCw size={12} />
                    Coba Ekstraksi OCR Lagi
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDocumentType("Dokumen Pendukung Lain");
                      setOcrError(null);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Simpan Tanpa Ekstraksi OCR
                  </button>
                </div>
              </div>
            )}

            {!file && (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-500">
                Unggah berkas dokumen di panel kiri — kolom verifikasi akan muncul otomatis setelah file dibaca.
              </div>
            )}

            {file && !requiresExtraction && (
              <div className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[#0a4d8c]"></div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Informasi Dokumen (Tanpa OCR)
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Judul / Keterangan Dokumen
                    </label>
                    <input
                      type="text"
                      value={formData.referenceNo}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          referenceNo: e.target.value,
                        }))
                      }
                      placeholder={file.name.replace(/\.[^/.]+$/, "")}
                      className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2 bg-slate-50 focus:outline-none focus:border-[#0a4d8c]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Kategori Dokumen
                    </label>
                    <SearchableSelect
                      size="sm"
                      value={formData.type}
                      onChange={(val) =>
                        setFormData((prev) => ({
                          ...prev,
                          type: val as any,
                        }))
                      }
                      searchPlaceholder="Cari kategori..."
                      options={GUARANTEE_KIND_OPTIONS}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Nama Rekanan / Vendor (Opsional)
                    </label>
                    <input
                      type="text"
                      value={formData.vendor}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          vendor: e.target.value,
                        }))
                      }
                      placeholder={selectedRequest?.title || "Nama rekanan"}
                      className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2 bg-slate-50 focus:outline-none focus:border-[#0a4d8c]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Nilai Nominal (Opsional)
                    </label>
                    <input
                      type="text"
                      value={formData.value}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          value: e.target.value,
                        }))
                      }
                      placeholder={
                        selectedRequest?.amount
                          ? "Rp " + selectedRequest.amount.toLocaleString("id-ID")
                          : "Rp 0"
                      }
                      className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2 bg-slate-50 focus:outline-none focus:border-[#0a4d8c]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* AI Extracted Fields */}
            {file &&
              requiresExtraction &&
              (isExtracting ? (
                <div className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in duration-300">
                  <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 border border-slate-200 border-dashed rounded-xl">
                    <div className="w-10 h-10 border-4 border-blue-200 border-t-[#0a4d8c] rounded-full animate-spin mb-4"></div>
                    <h3 className="text-sm font-bold text-slate-700">
                      Mengekstrak Data dengan Gemini OCR AI...
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Sistem sedang membaca teks & tabel dokumen secara langsung.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-[#0a4d8c]"></div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Hasil Ekstraksi Otomatis
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Jenis Jaminan / Dokumen
                      </label>
                      <SearchableSelect
                        size="sm"
                        value={formData.type}
                        onChange={(val) =>
                          setFormData((prev) => ({
                            ...prev,
                            type: val as GuaranteeItem["type"],
                          }))
                        }
                        allowCustomValue
                        searchPlaceholder="Cari jenis jaminan..."
                        options={[
                          { value: "Jaminan Pelaksanaan", label: "Jaminan Pelaksanaan" },
                          {
                            value: "Jaminan Masa Pemeliharaan",
                            label: "Jaminan Masa Pemeliharaan",
                          },
                          { value: "Jaminan Penawaran", label: "Jaminan Penawaran" },
                          { value: "Jaminan Uang Muka", label: "Jaminan Uang Muka" },
                          { value: "Kontrak", label: "Kontrak / SPK" },
                          { value: "Surat Penawaran", label: "Surat Penawaran" },
                        ]}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Nama Vendor / Principal
                      </label>
                      <input
                        type="text"
                        value={formData.vendor}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            vendor: event.target.value,
                          }))
                        }
                        placeholder="Nama vendor / principal"
                        className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2 bg-slate-50 focus:outline-none focus:border-[#0a4d8c]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Jenis Penerbit
                      </label>
                      <SearchableSelect
                        size="sm"
                        value={formData.issuerType || "Bank"}
                        onChange={(val) =>
                          setFormData((prev) => ({
                            ...prev,
                            issuerType: val as GuaranteeItem["issuerType"],
                          }))
                        }
                        searchPlaceholder="Cari jenis penerbit..."
                        options={ISSUER_TYPE_OPTIONS}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Nama Penerbit
                      </label>
                      <input
                        type="text"
                        value={formData.issuer}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            issuer: event.target.value,
                          }))
                        }
                        placeholder="Bank / asuransi penerbit"
                        className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2 bg-slate-50 focus:outline-none focus:border-[#0a4d8c]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Nomor Referensi / Kontrak
                      </label>
                      <input
                        type="text"
                        value={formData.referenceNo}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            referenceNo: event.target.value,
                          }))
                        }
                        placeholder="Nomor referensi"
                        className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2 bg-slate-50 focus:outline-none focus:border-[#0a4d8c]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Penerima Jaminan / Pemberi Kerja
                      </label>
                      <input
                        type="text"
                        value={formData.beneficiary}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            beneficiary: event.target.value,
                          }))
                        }
                        placeholder="Contoh: PT Pertamina Patra Niaga"
                        className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2 bg-slate-50 focus:outline-none focus:border-[#0a4d8c]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Nilai Nominal
                      </label>
                      <input
                        type="text"
                        value={formData.value}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            value: event.target.value,
                          }))
                        }
                        placeholder="Rp 5.000.000.000"
                        className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2 bg-slate-50 focus:outline-none focus:border-[#0a4d8c]"
                      />
                      {selectedRequest?.amount &&
                        selectedRequest.amount > 0 &&
                        (() => {
                          const minReq = selectedRequest.amount * 0.05;
                          const numVal =
                            parseFloat(formData.value.replace(/[^0-9]/g, "")) || 0;
                          return (
                            <div className="mt-1.5 text-[11px] text-slate-500 space-y-0.5">
                              <div>
                                Regulasi: Min. 5% Pagu ={" "}
                                <span className="font-medium text-slate-700">
                                  {formatRupiah(minReq)}
                                </span>
                              </div>
                              {numVal > 0 && numVal < minReq && (
                                <div className="text-[#0a4d8c] font-medium flex items-center gap-1.5">
                                  <AlertTriangle
                                    size={13}
                                    className="text-[#0a4d8c] shrink-0"
                                  />
                                  <span>Nilai jaminan kurang dari 5% pagu pengadaan</span>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Tanggal Jatuh Tempo (Masa Berlaku)
                      </label>
                      <input
                        type="date"
                        value={formData.expiryDate}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            expiryDate: event.target.value,
                          }))
                        }
                        className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2 bg-slate-50 focus:outline-none focus:border-[#0a4d8c]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Tanggal Terbit / Efektif
                      </label>
                      <input
                        type="date"
                        value={formData.issueDate}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            issueDate: event.target.value,
                          }))
                        }
                        className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2 bg-slate-50 focus:outline-none focus:border-[#0a4d8c]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Tanggal Serah Terima Berkas
                      </label>
                      <input
                        type="date"
                        value={formData.submissionDate}
                        onChange={(event) =>
                          setFormData((prev) => ({
                            ...prev,
                            submissionDate: event.target.value,
                          }))
                        }
                        className="w-full border border-slate-200 rounded-lg text-sm px-3 py-2 bg-slate-50 focus:outline-none focus:border-[#0a4d8c]"
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>

          <div className="sticky bottom-0 z-10 px-6 py-3.5 bg-white/95 backdrop-blur-xs border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 mt-auto shrink-0">
            <div className="text-xs text-slate-500 w-full sm:w-auto">
              {!isFormValid && missingFields.length > 0 && (
                <span className="text-slate-600 flex items-center gap-1.5">
                  <AlertTriangle size={13} className="shrink-0 text-[#0a4d8c]" />
                  <span>
                    Lengkapi: {missingFields.slice(0, 3).join(", ")}
                    {missingFields.length > 3
                      ? ` (+${missingFields.length - 3} lainnya)`
                      : ""}
                  </span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => router.push("/dashboard/overview?lens=guarantees")}
                disabled={uploadGuaranteeMutation.isPending}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isFormValid || uploadGuaranteeMutation.isPending}
                className={`px-5 py-2 flex items-center justify-center gap-2 rounded-lg text-xs font-medium shadow-2xs transition-all ${
                  isFormValid && !uploadGuaranteeMutation.isPending
                    ? "bg-[#0a4d8c] hover:bg-[#083b6c] text-white active:scale-[0.99]"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                {uploadGuaranteeMutation.isPending ? (
                  <>
                    <Spinner
                      size="xs"
                      className="border-white border-t-transparent"
                    />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {requiresExtraction
                        ? "Simpan & Verifikasi"
                        : "Simpan Dokumen"}
                    </span>
                    <ArrowRight size={14} />
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
