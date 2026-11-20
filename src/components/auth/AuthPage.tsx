"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Info,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { AuthMode } from "./types";
import { useLogin } from "@/lib/query/hooks/auth/useLogin";
import { useRegister } from "@/lib/query/hooks/auth/useRegister";
import { ApiError } from "@/lib/api";
import { ModalPortal, Spinner } from "@/components/ui";

const REMEMBERED_EMAIL_KEY = "prima_remembered_email";

const copy = {
  login: {
    title: "Masuk ke Workspace PRIMA",
    description: "Gunakan akun terdaftar untuk mengelola pekerjaan & dokumen pengadaan.",
    submit: "Masuk",
    loadingLabel: "Memverifikasi...",
  },
  register: {
    title: "Buat Akun PRIMA Baru",
    description: "Daftarkan akun operasional untuk mulai memantau pengadaan & SLA.",
    submit: "Daftar Akun",
    loadingLabel: "Mendaftarkan...",
  },
} as const;

const WORKSPACE_HIGHLIGHTS = [
  {
    icon: Sparkles,
    title: "Validasi Dokumen AI 3-Mode",
    desc: "Evaluasi KAK, penawaran & kontrak otomatis berbobot dengan mode Cekatan, Cermat, atau Cerdas.",
  },
  {
    icon: ShieldCheck,
    title: "Kendali Gatekeeper & Warkat",
    desc: "Verifikasi prasyarat tahapan tender dan pantau validitas Bank Garansi / Surety Bond.",
  },
  {
    icon: Clock,
    title: "Pemantauan SLA Real-Time",
    desc: "Deteksi dini risiko keterlambatan lengkap dengan eskalasi terstruktur dan log audit.",
  },
];

export function AuthPage({ mode }: { mode: AuthMode }) {
  const searchParams = useSearchParams();
  const sessionParam = searchParams.get("session");
  const registeredParam = searchParams.get("registered");

  const content = copy[mode];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rememberEmail, setRememberEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isForgotOpen, setIsForgotOpen] = useState(false);

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const mutation = mode === "login" ? loginMutation : registerMutation;
  const isLoading = mutation.isPending;

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(REMEMBERED_EMAIL_KEY);
      if (saved) {
        setEmail(saved);
        setRememberEmail(true);
      }
    } catch {
      // Ignore storage read issues
    }
  }, []);

  const serverError =
    mutation.error instanceof ApiError
      ? mutation.error.message
      : mutation.error
      ? "Terjadi kesalahan saat menghubungi server. Silakan coba lagi."
      : null;

  const errorMessage = formError ?? serverError;

  const passwordHasMinLen = password.length >= 8;
  const passwordsMatch = confirmation.length > 0 && password === confirmation;
  const passwordsMismatch = confirmation.length > 0 && password !== confirmation;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setFormError("Email wajib diisi.");
      return;
    }

    if (mode === "register") {
      if (!name.trim()) {
        setFormError("Nama lengkap wajib diisi.");
        return;
      }
      if (!passwordHasMinLen) {
        setFormError("Kata sandi minimal 8 karakter.");
        return;
      }
      if (password !== confirmation) {
        setFormError("Konfirmasi kata sandi belum sesuai.");
        return;
      }
      registerMutation.mutate({
        name: name.trim(),
        email: trimmedEmail,
        password,
      });
      return;
    }

    try {
      if (rememberEmail) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, trimmedEmail);
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }
    } catch {
      // Ignore storage quota issues
    }

    loginMutation.mutate({ email: trimmedEmail, password });
  };

  return (
    <div className="flex min-h-screen flex-col justify-between bg-[#f4f7fb] px-4 py-6 text-slate-900 sm:px-6">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center">
        {/* Subtle Unified Brand Header matching Dashboard */}
        <div className="mb-5 flex w-full items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-3">
            <img
              src="/pertamina-full.png"
              alt="Pertamina"
              className="h-8 w-auto object-contain"
            />
            <span className="hidden h-4 w-px bg-slate-300 sm:inline-block" />
            <span className="hidden text-xs font-medium text-slate-500 sm:inline-block">
              PRIMA Procurement Governance System
            </span>
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-600 shadow-2xs">
            PT Pertamina Patra Niaga
          </span>
        </div>

        {/* Crisp Split Card matching Dashboard UI */}
        <section className="flex w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          {/* Left Panel: Mode Switcher + Clean Form */}
          <div className="flex w-full flex-col justify-between p-6 sm:p-8 md:w-[54%]">
            <div>
              {/* Bean / Pill Auth Mode Switcher */}
              <div className="mb-6 flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50/80 p-1">
                  <Link
                    href="/login"
                    className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                      mode === "login"
                        ? "bg-[#0a4d8c] text-white shadow-2xs hover:!bg-[#083b6c]"
                        : "text-slate-600 hover:!bg-[#eaf3ff] hover:text-[#0a4d8c]"
                    }`}
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/register"
                    className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                      mode === "register"
                        ? "bg-[#0a4d8c] text-white shadow-2xs hover:!bg-[#083b6c]"
                        : "text-slate-600 hover:!bg-[#eaf3ff] hover:text-[#0a4d8c]"
                    }`}
                  >
                    Daftar Akun
                  </Link>
                </div>
              </div>

              <div className="mb-5 space-y-1">
                <h1 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
                  {content.title}
                </h1>
                <p className="text-xs leading-relaxed text-slate-500">
                  {content.description}
                </p>
              </div>

              {/* Contextual Session / Registration Status Banners */}
              {mode === "login" && sessionParam === "expired" && !errorMessage && (
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-[#0a4d8c]/25 bg-[#f4f8fd] px-3.5 py-2.5 text-xs text-[#0a4d8c]">
                  <Info size={14} className="mt-0.5 shrink-0" />
                  <span>
                    Sesi Anda telah berakhir atau belum terautentikasi. Silakan masuk kembali.
                  </span>
                </div>
              )}

              {mode === "login" && registeredParam === "1" && !errorMessage && (
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-[#0a4d8c]/25 bg-[#e8f2fc] px-3.5 py-2.5 text-xs text-[#0a4d8c]">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                  <span>
                    Akun berhasil dibuat. Silakan masuk menggunakan email dan kata sandi Anda.
                  </span>
                </div>
              )}

              {/* Urgent Error Banner (Red Reserved for Real Errors) */}
              {errorMessage && (
                <div
                  role="alert"
                  className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700"
                >
                  {errorMessage}
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                {mode === "register" && (
                  <Field
                    label="Nama Lengkap"
                    htmlFor="name"
                    icon={<UserRound size={15} />}
                  >
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Masukkan nama lengkap Anda"
                      required
                      className="auth-input"
                    />
                  </Field>
                )}

                <Field label="Email" htmlFor="email" icon={<Mail size={15} />}>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@pertamina.com"
                    required
                    className="auth-input"
                  />
                </Field>

                <div className="space-y-1.5">
                  <PasswordField
                    label="Kata Sandi"
                    id="password"
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    value={password}
                    onChange={setPassword}
                    visible={showPassword}
                    onToggle={() => setShowPassword((v) => !v)}
                  />
                  {mode === "register" && password.length > 0 && (
                    <div
                      className={`flex items-center gap-1.5 text-[11px] ${
                        passwordHasMinLen ? "text-[#0a4d8c]" : "text-slate-500"
                      }`}
                    >
                      <CheckCircle2
                        size={12}
                        className={
                          passwordHasMinLen ? "text-[#0a4d8c]" : "text-slate-300"
                        }
                      />
                      <span>Minimal 8 karakter ({password.length}/8)</span>
                    </div>
                  )}
                </div>

                {mode === "register" && (
                  <div className="space-y-1.5">
                    <PasswordField
                      label="Konfirmasi Kata Sandi"
                      id="confirmation"
                      autoComplete="new-password"
                      value={confirmation}
                      onChange={setConfirmation}
                      visible={showConfirmation}
                      onToggle={() => setShowConfirmation((v) => !v)}
                    />
                    {passwordsMatch && (
                      <div className="flex items-center gap-1.5 text-[11px] text-[#0a4d8c]">
                        <CheckCircle2 size={12} />
                        <span>Konfirmasi kata sandi sesuai</span>
                      </div>
                    )}
                    {passwordsMismatch && (
                      <div className="text-[11px] font-medium text-red-600">
                        Konfirmasi kata sandi belum sesuai
                      </div>
                    )}
                  </div>
                )}

                {mode === "login" ? (
                  <div className="flex items-center justify-between gap-4 pt-0.5">
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        checked={rememberEmail}
                        onChange={(e) => setRememberEmail(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-slate-300 accent-[#0a4d8c]"
                      />
                      <span>Ingat email saya</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsForgotOpen(true)}
                      className="text-xs font-medium text-[#0a4d8c] hover:underline focus:outline-none"
                    >
                      Lupa kata sandi?
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer items-start gap-2 pt-0.5 text-xs leading-relaxed text-slate-600">
                    <input
                      type="checkbox"
                      required
                      className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 accent-[#0a4d8c]"
                    />
                    <span>
                      Saya menyetujui kebijakan privasi dan tata kelola sistem pengadaan PRIMA.
                    </span>
                  </label>
                )}

                <button
                  type="submit"
                  disabled={isLoading || (mode === "register" && passwordsMismatch)}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-[#0a4d8c] px-4 py-2.5 text-xs font-medium text-white shadow-2xs transition hover:!bg-[#083b6c] disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
                >
                  {isLoading && (
                    <Spinner size="xs" className="border-white border-t-transparent" />
                  )}
                  <span>{isLoading ? content.loadingLabel : content.submit}</span>
                </button>
              </form>
            </div>

            <p className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
              {mode === "login" ? "Belum memiliki akun?" : "Sudah memiliki akun?"}{" "}
              <Link
                href={mode === "login" ? "/register" : "/login"}
                className="font-medium text-[#0a4d8c] hover:underline"
              >
                {mode === "login" ? "Daftar sekarang" : "Masuk ke sistem"}
              </Link>
            </p>
          </div>

          {/* Right Panel: Clean PRIMA Blue Capability Summary (Blue + Slate only) */}
          <aside className="hidden w-[46%] flex-col justify-between bg-[#0a4d8c] p-8 text-white md:flex">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium tracking-wide text-blue-100">
                Procurement Governance Workspace
              </span>
              <h2 className="mt-4 text-2xl font-semibold leading-snug tracking-tight">
                Kelola pengadaan lebih terukur &amp; transparan.
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-blue-100/90">
                Satu workspace terintegrasi untuk pemeriksaan dokumen berbasis AI, jaminan pengadaan, dan kepatuhan SLA.
              </p>
            </div>

            <div className="mt-8 space-y-3">
              {WORKSPACE_HIGHLIGHTS.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 rounded-xl border border-white/15 bg-white/10 p-3.5"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white">
                      <Icon size={15} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white">
                        {item.title}
                      </div>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-blue-100/85">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        </section>

        <footer className="mt-5 text-center text-[11px] text-slate-400">
          © 2026 PT Pertamina Patra Niaga · Sistem Tata Kelola Pengadaan PRIMA
        </footer>
      </div>

      {/* Forgot Password Support Modal */}
      {isForgotOpen && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4"
            onClick={() => setIsForgotOpen(false)}
          >
            <div
              className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-4">
                <div className="flex items-center gap-2">
                  <LockKeyhole size={16} className="text-[#0a4d8c]" />
                  <h3 className="text-sm font-semibold text-slate-800">
                    Pemulihan Akses Akun PRIMA
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(false)}
                  aria-label="Tutup modal"
                  className="rounded p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-3 p-5 text-xs leading-relaxed text-slate-600">
                <p>
                  Untuk alasan keamanan tata kelola perusahaan, reset kata sandi akun operasional dilakukan melalui verifikasi Administrator Sistem PRIMA.
                </p>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-700">
                  <div className="font-medium text-slate-800">
                    Langkah Pemulihan:
                  </div>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-[11px]">
                    <li>Hubungi Administrator Procurement / IT Helpdesk dengan menyertakan email terdaftar Anda.</li>
                    <li>Atau buat akun baru sementara melalui tab <strong>Daftar Akun</strong> bila diperlukan untuk pengujian.</li>
                  </ul>
                </div>
              </div>
              <div className="flex justify-end border-t border-slate-100 bg-slate-50/70 px-5 py-3">
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(false)}
                  className="rounded-lg bg-[#0a4d8c] px-4 py-2 text-xs font-medium text-white hover:bg-[#083b6c] transition-colors"
                >
                  Saya Mengerti
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  icon,
  children,
}: {
  label: string;
  htmlFor: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-[11px] font-medium uppercase tracking-wider text-slate-600"
      >
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
}

function PasswordField({
  label,
  id,
  autoComplete,
  value,
  onChange,
  visible,
  onToggle,
}: {
  label: string;
  id: string;
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <Field label={label} htmlFor={id} icon={<LockKeyhole size={15} />}>
      <input
        id={id}
        name={id}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Minimal 8 karakter"
        minLength={8}
        required
        className="auth-input pr-10"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700 focus:outline-none"
        aria-label={visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
      >
        {visible ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </Field>
  );
}
