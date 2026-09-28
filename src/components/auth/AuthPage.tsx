"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { FormEvent, useState } from "react";

import { AuthMode } from "./types";

const copy = {
  login: {
    title: "Masuk",
    description: "Masuk untuk melihat dashboard pengadaan Anda",
    submit: "Masuk",
    prompt: "Belum memiliki akun?",
    link: "Daftar sekarang",
    href: "/register",
  },
  register: {
    title: "Daftar Akun",
    description: "Buat akun untuk mulai mengelola pekerjaan pengadaan",
    submit: "Daftar",
    prompt: "Sudah memiliki akun?",
    link: "Masuk",
    href: "/login",
  },
} as const;

export function AuthPage({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const content = copy[mode];
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (mode === "register" && password !== confirmation) {
      setMessage("Konfirmasi kata sandi belum sesuai.");
      return;
    }

    setMessage(null);
    setIsLoading(true);

    const form = event.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const name = mode === "register"
      ? (form.elements.namedItem("name") as HTMLInputElement).value
      : "";

    try {
      const { authApi } = await import("@/lib/apiClient");

      if (mode === "login") {
        const res = await authApi.login(email, password);
        localStorage.setItem("access_token", res.data.access_token);
        localStorage.setItem("refresh_token", res.data.refresh_token);
        localStorage.setItem("current_user", JSON.stringify(res.data.user));
        router.push("/dashboard/documents");
      } else {
        await authApi.register(name, email, password);
        router.push("/login");
      }
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <nav className="flex h-[72px] items-center border-b border-slate-100 px-6 shadow-sm sm:px-10" aria-label="Navigasi autentikasi">
        <img src="/pertamina-full.png" alt="Pertamina" className="h-9 w-auto object-contain" />
      </nav>

      <main className="flex flex-1 items-center justify-center bg-gradient-to-br from-[#eaf3ff] via-[#f8fbff] to-[#edf6ff] px-4 py-8 sm:px-6">
        <section className="flex w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_45px_-20px_rgba(10,77,140,0.32)]">
          <div className="w-full p-6 sm:p-9 md:w-1/2 md:p-10">
       

            <div className="mb-7 space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{content.title}</h1>
              <p className="text-base leading-6 text-slate-500">{content.description}</p>
            </div>

            {message && (
              <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {message}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              {mode === "register" && (
                <Field label="Nama Lengkap" htmlFor="name" icon={<UserRound size={19} />}>
                  <input id="name" type="text" placeholder="Masukkan nama lengkap" required className="auth-input" />
                </Field>
              )}

              <Field label="Email" htmlFor="email" icon={<Mail size={19} />}>
                <input id="email" type="email" placeholder="Masukkan email Anda" required className="auth-input" />
              </Field>

              <PasswordField
                label="Kata Sandi"
                id="password"
                value={password}
                onChange={setPassword}
                visible={showPassword}
                onToggle={() => setShowPassword((value) => !value)}
              />

              {mode === "register" && (
                <PasswordField
                  label="Konfirmasi Kata Sandi"
                  id="confirmation"
                  value={confirmation}
                  onChange={setConfirmation}
                  visible={showConfirmation}
                  onToggle={() => setShowConfirmation((value) => !value)}
                />
              )}

              {mode === "login" ? (
                <div className="flex items-center justify-between gap-4">
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-600">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-[#0a4d8c]" />
                    Ingat saya
                  </label>
                  <button type="button" className="text-sm font-semibold text-[#0a4d8c] hover:underline">Lupa kata sandi?</button>
                </div>
              ) : (
                <label className="flex cursor-pointer items-start gap-2 text-sm leading-5 text-slate-600">
                  <input type="checkbox" required className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[#0a4d8c]" />
                  <span>Saya menyetujui kebijakan privasi dan ketentuan penggunaan.</span>
                </label>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-[#0a4d8c] px-4 py-3.5 text-base font-semibold text-white shadow-sm hover:!bg-[#083d6d] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? "Memproses..." : content.submit}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-600">
              {content.prompt}{" "}
              <Link href={content.href} className="font-semibold text-[#0a4d8c] hover:underline">{content.link}</Link>
            </p>
          </div>

          <aside className="relative hidden min-h-[570px] w-1/2 overflow-hidden bg-[#0a4d8c] md:flex md:flex-col md:justify-end p-10 text-white">
            <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full border-[42px] border-white/10" />
            <div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full border-[38px] border-[#35aee2]/35" />
            <div className="absolute left-12 top-16 h-24 w-24 rotate-45 rounded-2xl bg-white/10" />
            <div className="relative max-w-sm">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
                <LockKeyhole size={23} />
              </div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9fdcff]">Procurement Workspace</p>
              <h2 className="mt-3 text-3xl font-bold leading-tight">Kelola pengadaan dengan lebih terarah.</h2>
              <p className="mt-4 text-base leading-7 text-blue-100">Pantau pekerjaan, dokumen, jaminan, dan tenggat waktu dalam satu ruang kerja.</p>
            </div>
          </aside>
        </section>
      </main>

      <footer className="bg-[#0a4d8c] px-4 py-3 text-center text-xs text-white">
        © 2026 PT Pertamina Patra Niaga. All Rights Reserved.
      </footer>
    </div>
  );
}

function Field({ label, htmlFor, icon, children }: { label: string; htmlFor: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-base font-medium text-slate-800">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
        {children}
      </div>
    </div>
  );
}

function PasswordField({ label, id, value, onChange, visible, onToggle }: { label: string; id: string; value: string; onChange: (value: string) => void; visible: boolean; onToggle: () => void }) {
  return (
    <Field label={label} htmlFor={id} icon={<LockKeyhole size={19} />}>
      <input id={id} type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} placeholder="••••••••" minLength={8} required className="auth-input pr-11" />
      <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700" aria-label={visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}>
        {visible ? <EyeOff size={19} /> : <Eye size={19} />}
      </button>
    </Field>
  );
}
