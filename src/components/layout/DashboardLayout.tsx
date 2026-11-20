"use client";

import { ReactNode, useEffect, useState } from "react";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { ProcurementProvider } from "@/context/ProcurementContext";
import { AiJobsProvider } from "@/context/AiJobsContext";
import { SidebarNav } from "@/components/navigation/SidebarNav";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { GlobalAiChatSidebar } from "@/components/layout/GlobalAiChatSidebar";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCurrentUser, useLogout } from "@/lib/query/hooks/auth/useCurrentUser";
import { clearSession } from "@/lib/api/auth.utils";

function DashboardLayoutInner({ children }: { children: ReactNode }) {
  const { mobileOpen, setMobileOpen } = useSidebar();
  const { data: currentUser, isLoading } = useCurrentUser();
  const logout = useLogout();
  const pathname = usePathname();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false);
  
  useEffect(() => { 
    setMounted(true); 
  }, []);

  // Keyboard shortcut Ctrl+J to toggle the Global AI Chat Sidebar outside /dashboard/onboarding
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "j") {
        if (!(pathname || "").startsWith("/dashboard/onboarding")) {
          e.preventDefault();
          setAiSidebarOpen((prev) => !prev);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pathname]);

  useEffect(() => {
    if (mounted && !isLoading && !currentUser) {
      clearSession();
      router.replace("/login?session=expired");
    }
  }, [mounted, isLoading, currentUser, router]);

  if (!currentUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#eaf3ff] via-[#f8fbff] to-[#edf6ff] p-4 text-center">
        <div className="flex flex-col items-center max-w-sm w-full p-8 rounded-2xl border border-slate-200/80 bg-white/95 shadow-xl backdrop-blur-sm animate-in fade-in zoom-in-95 duration-300">
          <img src="/pertamina-full.png" alt="Pertamina" className="h-8 w-auto object-contain mb-6" />
          <div className="w-10 h-10 border-4 border-blue-100 border-t-[#0a4d8c] rounded-full animate-spin mb-4" />
          <p className="text-sm font-bold text-slate-800">Menghubungkan Sesi PRIMA</p>
          <p className="mt-1 text-xs text-slate-500">Memverifikasi otentikasi dan hak akses akun...</p>
        </div>
      </div>
    );
  }

  const userLabel = currentUser
    ? currentUser.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
    : "";

  const getHeaderInfo = (path: string) => {
    if (path.includes("onboarding"))
      return {
        title: "Onboarding & Pencarian Terpadu",
        subtitle: "Akses cepat pencarian seluruh dokumen, pekerjaan, hasil analisis AI, dan prioritas SLA.",
      };
    if (path.includes("documents/templates/form"))
      return {
        title: "Formulir Template Standar Kelayakan",
        subtitle: "Susun atau ubah standar checklist berbobot serta impor kriteria otomatis dari berkas acuan.",
      };
    if (path.includes("documents/templates"))
      return {
        title: "Pustaka Template Kriteria Standar",
        subtitle: "Kelola profil standar checklist, ambang batas skor, dan instruksi validasi AI per jenis dokumen.",
      };
    if (path.includes("documents/stages"))
      return {
        title: "Kelola Metode & Tahapan Pekerjaan",
        subtitle: "Susun metode pengadaan custom beserta urutan tahapan dan target SLA standar organisasi.",
      };
    if (path.includes("documents/upload"))
      return {
        title: "Unggah & Validasi Dokumen",
        subtitle: "Pemeriksaan kelayakan dokumen berdasarkan standar checklist dan ekstraksi tahapan AI.",
      };
    if (path.includes("documents/result"))
      return {
        title: "Hasil Pemeriksaan & Ekstraksi Dokumen",
        subtitle: "Laporan hasil verifikasi dokumen pengadaan beserta ekstraksi tahapan untuk diterbitkan ke Pekerjaan.",
      };
    if (path.includes("documents"))
      return {
        title: "Pemeriksaan Dokumen",
        subtitle: "Pantau kelengkapan dokumen pra-tender, temuan hasil review AI, dan penerbitan ke pekerjaan.",
      };
    if (path.includes("overview/guarantees/upload"))
      return {
        title: "Unggah Warkat Jaminan Pekerjaan",
        subtitle: "Digitalisasi dan ekstraksi OCR warkat jaminan bank/asuransi yang terikat langsung ke paket pekerjaan.",
      };
    if (/^\/dashboard\/overview\/[^/]+$/.test(path))
      return {
        title: "Detail Pekerjaan Pengadaan",
        subtitle: "Kelola progres tahapan, kelengkapan dokumen, warkat jaminan bank, dan jadwal SLA pekerjaan.",
      };
    if (path.includes("overview"))
      return {
        title: "Pusat Kendali Pekerjaan",
        subtitle: "Pantau daftar pekerjaan pengadaan, warkat jaminan, kepatuhan SLA, dan tindak lanjut prioritas.",
      };
    if (path.includes("notifications"))
      return {
        title: "Pusat Notifikasi",
        subtitle: "Pemberitahuan real-time terkait pembaruan SLA, status pekerjaan, dan aktivitas sistem.",
      };
    if (path.includes("settings"))
      return {
        title: "Pengaturan Sistem",
        subtitle: "Kelola profil akun, kebijakan peringatan & eskalasi SLA, serta model AI & integrasi MCP.",
      };

    return { title: "Dashboard", subtitle: "Overview" };
  };

  const isOnboarding = (pathname || "").startsWith("/dashboard/onboarding");
  const isOnboardingChat = (pathname || "").startsWith("/dashboard/onboarding/chat");
  const header = getHeaderInfo(pathname || "");

  return (
    <div className="flex h-screen overflow-hidden overscroll-none bg-[#f4f7fb] text-slate-900">
      <div
        className={cn(
          "fixed inset-0 z-30 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      <SidebarNav onLogout={logout} />

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col transition-all duration-300">
        {!isOnboardingChat && (
          <div>
            <DashboardHeader
              title={header.title}
              subtitle={header.subtitle}
              userLabel={userLabel}
              userName={currentUser?.name ?? "—"}
              userRole={currentUser?.role ?? "—"}
              userAvatarUrl={currentUser?.avatar_url}
              onOpenSidebar={() => setMobileOpen(true)}
              onCloseSidebar={() => setMobileOpen(false)}
              onLogout={logout}
              transparent={isOnboarding}
              showAiAssistantToggle={!isOnboarding}
              isAiAssistantOpen={aiSidebarOpen}
              onToggleAiAssistant={() => setAiSidebarOpen((prev) => !prev)}
            />
          </div>
        )}

        <main
          className={cn(
            "scrollbar-thin flex-1 overflow-y-auto overflow-x-hidden",
            isOnboarding
              ? "p-0"
              : "px-4 py-3 sm:px-6 sm:py-4 lg:px-7 lg:py-5"
          )}
        >
          <div className={cn("animate-page-enter", isOnboarding && "h-full")}>
            {children}
          </div>
        </main>
      </div>

      {!isOnboarding && (
        <GlobalAiChatSidebar
          isOpen={aiSidebarOpen}
          onClose={() => setAiSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProcurementProvider>
      <AiJobsProvider>
        <SidebarProvider>
          <DashboardLayoutInner>{children}</DashboardLayoutInner>
        </SidebarProvider>
      </AiJobsProvider>
    </ProcurementProvider>
  );
}
