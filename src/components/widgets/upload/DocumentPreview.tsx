import { FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { DocumentPreviewProps } from "./types";

export function DocumentPreview({ file }: DocumentPreviewProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  return (
    <div className="flex-1 border-2 border-slate-200 rounded-xl flex flex-col bg-white overflow-hidden shadow-sm">
      {file && objectUrl ? (
        <>
          <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center justify-between shrink-0 z-10">
            <span className="text-xs font-semibold text-slate-600 truncate mr-4">{file.name}</span>
            <span className="text-xs text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
          </div>
          <div className="flex-1 relative bg-slate-50">
            <iframe src={objectUrl} className="absolute inset-0 w-full h-full border-0" title="Document Preview" />
            
            <div className="absolute bottom-6 left-0 w-full flex justify-center pointer-events-none">
              <div className="bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-full border border-emerald-200 flex items-center gap-1.5 shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                Dokumen Berhasil Ditampilkan
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center bg-slate-50">
          <FileText size={48} className="mb-4 opacity-30" />
          <p className="text-sm">Pilih file scan jaminan di panel sebelah kanan untuk melihat preview dokumen.</p>
        </div>
      )}
    </div>
  );
}
