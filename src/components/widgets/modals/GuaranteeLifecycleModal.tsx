"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ShieldCheck,
  ShieldAlert,
  CalendarCheck,
  RotateCw,
  AlertTriangle,
  ArrowRight,
  FileCheck2,
} from "lucide-react";
import { GuaranteeItem } from "@/types";
import {
  useAmendGuarantee,
  useReleaseGuarantee,
  useClaimGuarantee,
} from "@/lib/query/hooks/procurement/useGuarantees";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { getErrorMessage } from "@/lib/api/errors";

export interface GuaranteeLifecycleModalProps {
  guarantee: GuaranteeItem;
  initialAction?: "amend" | "release" | "claim";
  onClose: () => void;
}

export function GuaranteeLifecycleModal({
  guarantee,
  initialAction = "amend",
  onClose,
}: GuaranteeLifecycleModalProps) {
  const [activeTab, setActiveTab] = useState<"amend" | "release" | "claim">(initialAction);
  const toast = useToast();

  const amendMutation = useAmendGuarantee();
  const releaseMutation = useReleaseGuarantee();
  const claimMutation = useClaimGuarantee();

  const isSubmitting =
    amendMutation.isPending || releaseMutation.isPending || claimMutation.isPending;

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleAmendSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const amendmentNo = String(fd.get("amendment_no") || "").trim();
    const newExpiryDate = String(fd.get("new_expiry_date") || "").trim();
    const newValueStr = String(fd.get("new_value") || "").replace(/\D/g, "");
    const newValue = newValueStr ? Number(newValueStr) : undefined;
    const amendmentReason = String(fd.get("amendment_reason") || "").trim();

    if (!amendmentNo || !newExpiryDate) {
      toast.error("Nomor perpanjangan dan tanggal expiry baru wajib diisi.");
      return;
    }

    try {
      await amendMutation.mutateAsync({
        id: guarantee.id,
        payload: {
          amendment_no: amendmentNo,
          new_expiry_date: `${newExpiryDate}T00:00:00Z`,
          new_value: newValue,
          amendment_reason: amendmentReason,
        },
      });
      toast.success(`Jaminan ${guarantee.referenceNo} berhasil diperpanjang hingga ${newExpiryDate}.`);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal memperpanjang jaminan."));
    }
  };

  const handleReleaseSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const bastNo = String(fd.get("bast_no") || "").trim();
    const releaseNotes = String(fd.get("release_notes") || "").trim();

    if (!bastNo) {
      toast.error("Nomor BAST serah terima wajib diisi.");
      return;
    }

    try {
      await releaseMutation.mutateAsync({
        id: guarantee.id,
        payload: {
          bast_no: bastNo,
          release_notes: releaseNotes,
        },
      });
      toast.success(`Jaminan ${guarantee.referenceNo} berhasil ditandai telah dikembalikan.`);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal memproses pengembalian jaminan."));
    }
  };

  const handleClaimSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const claimLetterNo = String(fd.get("claim_letter_no") || "").trim();
    const claimReason = String(fd.get("claim_reason") || "").trim();
    const claimAmountStr = String(fd.get("claim_amount") || "").replace(/\D/g, "");
    const claimAmount = claimAmountStr ? Number(claimAmountStr) : guarantee.value;

    if (!claimLetterNo || !claimReason) {
      toast.error("Nomor surat klaim dan alasan wanprestasi wajib diisi.");
      return;
    }

    try {
      await claimMutation.mutateAsync({
        id: guarantee.id,
        payload: {
          claim_letter_no: claimLetterNo,
          claim_reason: claimReason,
          claim_amount: claimAmount,
        },
      });
      toast.success(`Klaim jaminan ${guarantee.referenceNo} berhasil diajukan.`);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal memproses pengajuan klaim jaminan."));
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex min-h-dvh items-center justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-[#0a4d8c]">
                Modul D2
              </span>
              <h2 className="text-base font-bold text-slate-800">Siklus & Aksi Jaminan</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {guarantee.referenceNo} · {guarantee.type} · Vendor: {guarantee.vendor.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50/30 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("amend")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all ${
              activeTab === "amend"
                ? "bg-white text-[#0a4d8c] shadow-sm font-bold border border-slate-200/80"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
            }`}
          >
            <RotateCw size={14} className={activeTab === "amend" ? "text-[#0a4d8c]" : ""} />
            Perpanjangan (Amandemen)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("release")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all ${
              activeTab === "release"
                ? "bg-white text-emerald-700 shadow-sm font-bold border border-slate-200/80"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
            }`}
          >
            <CalendarCheck size={14} className={activeTab === "release" ? "text-emerald-600" : ""} />
            Pengembalian (Release)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("claim")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all ${
              activeTab === "claim"
                ? "bg-white text-red-700 shadow-sm font-bold border border-slate-200/80"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/60"
            }`}
          >
            <ShieldAlert size={14} className={activeTab === "claim" ? "text-red-600" : ""} />
            Klaim Wanprestasi
          </button>
        </div>

        {/* Content Body Based on Tab */}
        <div className="p-6">
          {/* TAB 1: AMEND */}
          {activeTab === "amend" && (
            <form onSubmit={handleAmendSubmit} className="space-y-4">
              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 text-xs leading-relaxed text-blue-900">
                <span className="font-bold text-[#0a4d8c]">Perpanjangan Masa Berlaku:</span> Digunakan ketika
                pekerjaan mengalami addendum waktu kontrak. Status jaminan akan diperbarui dan tenggat
                waktu baru akan tercatat di sistem.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Nomor Addendum / Surat Perpanjangan *
                  </label>
                  <input
                    required
                    name="amendment_no"
                    placeholder="Contoh: ADD-001/SPK/2026"
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-[#0a4d8c] focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Tanggal Expiry Baru *
                  </label>
                  <input
                    required
                    type="date"
                    name="new_expiry_date"
                    defaultValue={guarantee.expiryDate}
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-800 focus:border-[#0a4d8c] focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Nilai Baru (Opsional jika nilai jaminan berubah)
                </label>
                <input
                  name="new_value"
                  placeholder={`Default: Rp ${guarantee.value.toLocaleString("id-ID")}`}
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-[#0a4d8c] focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Catatan / Alasan Perpanjangan
                </label>
                <textarea
                  name="amendment_reason"
                  rows={2}
                  placeholder="Contoh: Penyesuaian jadwal pelaksanaan pekerjaan fase finishing."
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-[#0a4d8c] focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#0a4d8c] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#083c6d] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner size="xs" className="border-white border-t-transparent" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <RotateCw size={13} />
                      <span>Simpan Perpanjangan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: RELEASE */}
          {activeTab === "release" && (
            <form onSubmit={handleReleaseSubmit} className="space-y-4">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-xs leading-relaxed text-emerald-900">
                <span className="font-bold text-emerald-800">Pengembalian Jaminan:</span> Digunakan jika
                pekerjaan telah tuntas diserahterimakan (BAST terbit). Dokumen jaminan asli dikembalikan ke
                vendor dan status jaminan ditutup menjadi <span className="font-semibold text-emerald-900">Dikembalikan</span>.
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Nomor Berita Acara Serah Terima (BAST) *
                </label>
                <input
                  required
                  name="bast_no"
                  placeholder="Contoh: BAST-099/PRIMA/X/2026"
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Catatan Serah Terima / Kondisi Berkas
                </label>
                <textarea
                  name="release_notes"
                  rows={2}
                  placeholder="Contoh: Berkas asli telah diserahkan kembali kepada PIC vendor dalam keadaan baik."
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner size="xs" className="border-white border-t-transparent" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck2 size={14} />
                      <span>Konfirmasi Pengembalian</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: CLAIM */}
          {activeTab === "claim" && (
            <form onSubmit={handleClaimSubmit} className="space-y-4">
              <div className="rounded-xl border border-red-200 bg-red-50/70 p-3.5 text-xs leading-relaxed text-red-900">
                <div className="flex items-center gap-2 font-bold text-red-800 mb-1">
                  <AlertTriangle size={15} className="text-red-600 shrink-0" />
                  Perhatian Tindakan Hukum & Wanprestasi:
                </div>
                Pengajuan klaim jaminan bank / surety bond dilakukan apabila vendor wanprestasi atau gagal
                memenuhi kewajiban kontrak. Status jaminan akan berubah menjadi{" "}
                <span className="font-semibold text-red-900">Klaim Diajukan</span>.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Nomor Surat Klaim *
                  </label>
                  <input
                    required
                    name="claim_letter_no"
                    placeholder="Contoh: SK-KLAIM/042/X/2026"
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Nilai Klaim yang Dituntut (Rp)
                  </label>
                  <input
                    name="claim_amount"
                    defaultValue={guarantee.value.toLocaleString("id-ID")}
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-800 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Alasan Wanprestasi / Dasar Klaim *
                </label>
                <textarea
                  required
                  name="claim_reason"
                  rows={3}
                  placeholder="Contoh: Penyedia jasa tidak menyelesaikan pekerjaan sesuai Surat Peringatan III dan batas waktu yang ditentukan."
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner size="xs" className="border-white border-t-transparent" />
                      <span>Mengajukan Klaim...</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert size={14} />
                      <span>Ajukan Klaim Resmi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
