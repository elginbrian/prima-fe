"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, Trash2 } from "lucide-react";
import {
  useCurrentUser,
  useUpdateProfile,
  useUploadAvatar,
} from "@/lib/query/hooks/auth/useCurrentUser";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Spinner } from "@/components/ui/Spinner";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { useToast } from "@/components/ui/Toast";
import { getErrorMessage } from "@/lib/api/errors";

const DEPARTMENT_OPTIONS = [
  "Procurement & General Support",
  "IT Infrastructure",
  "Operations",
  "Human Resources",
  "General Affairs",
];

const ROLE_OPTIONS = [
  "Procurement Officer",
  "Procurement Manager",
  "Reviewer",
  "Super Admin",
];

export function ProfileTab() {
  const { data: currentUser } = useCurrentUser();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setEmail(currentUser.email || "");
      setPhone(currentUser.phone || "");
      setDepartmentName(
        currentUser.department?.name || "Procurement & General Support"
      );
      setRole(currentUser.role || "Procurement Officer");
    }
  }, [currentUser]);

  if (!currentUser) return null;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.warning("Pilih berkas gambar (JPG, PNG, atau WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.warning("Ukuran foto profil maksimal 5MB.");
      return;
    }

    uploadAvatar.mutate(file, {
      onSuccess: () => {
        toast.success("Foto profil berhasil diperbarui.");
      },
      onError: (err) => {
        toast.error(getErrorMessage(err, "Gagal mengunggah foto profil."));
      },
    });
    e.target.value = "";
  };

  const handleRemoveAvatar = () => {
    updateProfile.mutate(
      { avatar_url: "" },
      {
        onSuccess: () => {
          toast.success("Foto profil dihapus dan dikembalikan ke default.");
        },
        onError: (err) => {
          toast.error(getErrorMessage(err, "Gagal menghapus foto profil."));
        },
      }
    );
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning("Nama lengkap tidak boleh kosong.");
      return;
    }
    if (!email.trim()) {
      toast.warning("Email tidak boleh kosong.");
      return;
    }

    updateProfile.mutate(
      {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        department_name: departmentName,
        role,
      },
      {
        onSuccess: () => {
          toast.success("Informasi profil berhasil disimpan.");
        },
        onError: (err) => {
          toast.error(getErrorMessage(err, "Gagal menyimpan profil."));
        },
      }
    );
  };

  return (
    <form
      onSubmit={handleSaveProfile}
      className="space-y-8 animate-in fade-in duration-200"
    >
      {/* Profile Picture Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 rounded-xl border border-slate-200 bg-slate-50/60 p-5">
        <div className="flex items-center gap-4">
          <UserAvatar
            name={name || currentUser.name}
            userId={currentUser.id}
            avatarUrl={currentUser.avatar_url}
            size="xl"
            className="border-2 border-white shadow-sm"
          />
          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              Foto Profil Pengguna
            </h3>
            <p className="mt-0.5 text-xs font-normal text-slate-500">
              Ditampilkan pada header dan daftar penanggung jawab (PIC) pekerjaan. Jika tidak diunggah, sistem menampilkan avatar default.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadAvatar.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a4d8c] px-3.5 py-2 text-xs font-medium text-white shadow-xs transition hover:bg-[#083b6c] disabled:opacity-60 focus:outline-none"
              >
                {uploadAvatar.isPending ? (
                  <Spinner size="xs" color="white" />
                ) : (
                  <Upload size={13} />
                )}
                <span>
                  {uploadAvatar.isPending ? "Mengunggah..." : "Unggah Foto"}
                </span>
              </button>

              {currentUser.avatar_url && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={updateProfile.isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-60 focus:outline-none"
                >
                  <Trash2 size={13} />
                  <span>Gunakan Default (Tanpa Foto)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Editable Profile Fields */}
      <div>
        <h2 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-2.5 mb-5">
          Informasi Akun & Penugasan
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama lengkap..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 font-normal focus:outline-none focus:border-[#0a4d8c] focus:ring-1 focus:ring-[#0a4d8c]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">
              Email Pertamina
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@pertamina.com"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 font-normal focus:outline-none focus:border-[#0a4d8c] focus:ring-1 focus:ring-[#0a4d8c]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">
              Fungsi / Departemen
            </label>
            <SearchableSelect
              value={departmentName}
              onChange={setDepartmentName}
              allowCustomValue
              searchPlaceholder="Cari atau ketik departemen..."
              options={DEPARTMENT_OPTIONS.map((dept) => ({
                value: dept,
                label: dept,
              }))}
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">
              Peran (Role)
            </label>
            <SearchableSelect
              value={role}
              onChange={setRole}
              searchPlaceholder="Cari peran..."
              options={ROLE_OPTIONS.map((r) => ({ value: r, label: r }))}
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">
              Nomor Telepon / WhatsApp (Opsional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Contoh: +62 812-3456-7890"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 font-normal focus:outline-none focus:border-[#0a4d8c] focus:ring-1 focus:ring-[#0a4d8c]"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end border-t border-slate-100 pt-6">
        <button
          type="submit"
          disabled={updateProfile.isPending}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-[#0a4d8c] px-8 py-2.5 text-xs font-medium text-white shadow-xs transition hover:bg-[#083b6c] disabled:opacity-60 focus:outline-none"
        >
          {updateProfile.isPending && <Spinner size="xs" color="white" />}
          <span>
            {updateProfile.isPending ? "Menyimpan..." : "Simpan Profil"}
          </span>
        </button>
      </div>
    </form>
  );
}
