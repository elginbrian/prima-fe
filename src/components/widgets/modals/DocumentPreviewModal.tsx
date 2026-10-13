"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
  AlertCircle,
  Loader2,
  Info,
  ShieldCheck,
} from "lucide-react";
import { documentsApi, guaranteesApi } from "@/lib/api/procurement.api";
import { getErrorMessage } from "@/lib/api/errors";

export interface DocumentPreviewMetadataItem {
  label: string;
  value: React.ReactNode;
}

export interface DocumentPreviewModalProps {
  title: string;
  fileId?: string;
  fileType: "document" | "guarantee" | "url";
  directUrl?: string;
  fileName?: string;
  metadata?: DocumentPreviewMetadataItem[];
  onClose: () => void;
}

export function DocumentPreviewModal({
  title,
  fileId,
  fileType,
  directUrl,
  fileName,
  metadata = [],
  onClose,
}: DocumentPreviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(directUrl || null);
  const [resolvedFileName, setResolvedFileName] = useState<string>(fileName || title);
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [showMetadata, setShowMetadata] = useState<boolean>(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Fetch presigned URL if fileId is provided
  useEffect(() => {
    let isMounted = true;
    async function loadViewUrl() {
      if (directUrl && (!fileId || fileType === "url")) {
        setResolvedUrl(directUrl);
        setLoading(false);
        return;
      }

      if (!fileId) {
        if (directUrl) {
          setResolvedUrl(directUrl);
        } else {
          setError("ID atau tautan dokumen tidak ditemukan.");
        }
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        if (fileType === "document") {
          const res = await documentsApi.getViewUrl(fileId);
          if (isMounted) {
            setResolvedUrl(res.data.view_url);
            if (res.data.file_name) setResolvedFileName(res.data.file_name);
          }
        } else if (fileType === "guarantee") {
          const res = await guaranteesApi.getViewUrl(fileId);
          if (isMounted) {
            setResolvedUrl(res.data.view_url);
            if (res.data.file_name) setResolvedFileName(res.data.file_name);
          }
        }
      } catch (err) {
        if (isMounted) {
          // If view-url endpoint fails, check if fallback directUrl exists
          if (directUrl) {
            setResolvedUrl(directUrl);
          } else {
            setError(getErrorMessage(err, "Gagal memuat dokumen."));
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadViewUrl();
    return () => {
      isMounted = false;
    };
  }, [fileId, fileType, directUrl]);

  const isImage = (url?: string | null, name?: string) => {
    const str = (url || name || "").toLowerCase().split("?")[0];
    return str.endsWith(".png") || str.endsWith(".jpg") || str.endsWith(".jpeg") || str.endsWith(".webp");
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleResetZoom = () => setZoom(100);
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex h-full max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900 text-white shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/90 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0a4d8c] text-white shadow-sm">
              <FileText size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-white sm:text-base">{title}</h2>
              <p className="truncate text-[11px] text-slate-400">
                {resolvedFileName} · <span className="text-emerald-400 font-medium">Tautan Aman Presigned</span>
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center rounded-lg border border-slate-700/60 bg-slate-800/80 p-0.5">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                title="Perkecil"
                className="rounded-md p-1.5 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-30"
              >
                <ZoomOut size={15} />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                title="Reset Zoom"
                className="px-2 text-xs font-semibold text-slate-300 hover:text-white"
              >
                {zoom}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                title="Perbesar"
                className="rounded-md p-1.5 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-30"
              >
                <ZoomIn size={15} />
              </button>
            </div>

            {/* Rotate */}
            <button
              type="button"
              onClick={handleRotate}
              title="Putar Dokumen 90°"
              className="rounded-lg border border-slate-700/60 bg-slate-800/80 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <RotateCw size={15} />
            </button>

            {/* Toggle Metadata */}
            {metadata.length > 0 && (
              <button
                type="button"
                onClick={() => setShowMetadata((prev) => !prev)}
                title="Informasi Dokumen"
                className={`rounded-lg border p-2 transition-colors ${
                  showMetadata
                    ? "border-[#0a4d8c] bg-[#0a4d8c] text-white"
                    : "border-slate-700/60 bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <Info size={15} />
              </button>
            )}

            {/* Open in new tab */}
            {resolvedUrl && (
              <a
                href={resolvedUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Buka Dokumen di Tab Baru"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <ExternalLink size={14} />
                <span>Tab Baru</span>
              </a>
            )}

            {/* Download Button */}
            {resolvedUrl && (
              <a
                href={resolvedUrl}
                download={resolvedFileName}
                target="_blank"
                rel="noopener noreferrer"
                title="Unduh Berkas"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a4d8c] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#083c6d] transition-all"
              >
                <Download size={14} />
                <span className="hidden sm:inline">Unduh</span>
              </a>
            )}

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              title="Tutup (Esc)"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors ml-1"
            >
              <X size={19} />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="relative flex flex-1 overflow-hidden bg-slate-950">
          {/* Main Viewer Area */}
          <div className="relative flex flex-1 items-center justify-center overflow-auto p-4 sm:p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 size={36} className="animate-spin text-[#0a4d8c]" />
                <p className="text-sm font-medium">Memuat pratinjau dokumen aman...</p>
                <p className="text-xs text-slate-500">Menghubungkan ke secure presigned storage</p>
              </div>
            ) : error ? (
              <div className="max-w-md rounded-2xl border border-red-900/50 bg-red-950/40 p-6 text-center shadow-lg">
                <AlertCircle size={36} className="mx-auto mb-3 text-red-400" />
                <h3 className="text-base font-bold text-red-200">Tidak Dapat Menampilkan Pratinjau</h3>
                <p className="mt-1 text-xs text-red-300/80 leading-relaxed">{error}</p>
                {resolvedUrl && (
                  <div className="mt-4">
                    <a
                      href={resolvedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-red-800 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
                    >
                      <Download size={14} />
                      Coba Buka / Unduh Berkas Langsung
                    </a>
                  </div>
                )}
              </div>
            ) : resolvedUrl ? (
              <div
                className="flex h-full w-full items-center justify-center transition-transform duration-200"
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transformOrigin: "center center",
                }}
              >
                {isImage(resolvedUrl, resolvedFileName) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolvedUrl}
                    alt={title}
                    className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
                  />
                ) : (
                  <iframe
                    src={`${resolvedUrl}#toolbar=1&navpanes=0`}
                    title={title}
                    className="h-full w-full rounded-lg border border-slate-800 bg-white shadow-2xl"
                  />
                )}
              </div>
            ) : null}
          </div>

          {/* Right Metadata Drawer */}
          {showMetadata && metadata.length > 0 && (
            <aside className="w-80 shrink-0 border-l border-slate-800 bg-slate-900/95 p-5 text-slate-300 shadow-xl overflow-y-auto animate-in slide-in-from-right duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Informasi Berkas</h3>
                <button
                  type="button"
                  onClick={() => setShowMetadata(false)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="mt-4 space-y-4 text-xs">
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-500">Nama Dokumen</div>
                  <div className="mt-0.5 font-semibold text-white break-words">{title}</div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-500">Nama Berkas</div>
                  <div className="mt-0.5 text-slate-300 break-words font-mono text-[11px]">{resolvedFileName}</div>
                </div>

                {metadata.map((item, index) => (
                  <div key={index}>
                    <div className="text-[10px] font-bold uppercase text-slate-500">{item.label}</div>
                    <div className="mt-0.5 text-slate-200">{item.value}</div>
                  </div>
                ))}

                <div className="mt-6 rounded-xl border border-blue-900/40 bg-blue-950/40 p-3 text-[11px] leading-relaxed text-blue-200/90">
                  <div className="flex items-center gap-1.5 font-semibold text-blue-300 mb-1">
                    <ShieldCheck size={14} className="text-blue-400 shrink-0" />
                    Akses Aman Terenkripsi
                  </div>
                  Dokumen ini diakses melalui Amazon S3 Presigned URL dengan kedaluwarsa 30 menit. Tidak ada dokumen publik tanpa otorisasi.
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
