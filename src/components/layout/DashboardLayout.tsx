"use client";

import { ReactNode, useEffect, useState } from "react";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { ProcurementProvider } from "@/context/ProcurementContext";
import { SidebarNav } from "@/components/navigation/SidebarNav";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
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
  
  useEffect(() => { 
    setMounted(true); 
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && !currentUser) {
      clearSession();
      router.replace("/login?session=expired");
    }
  }, [mounted, isLoading, currentUser, router]);

  if (!currentUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f4f7fb]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#1d4ed8]/20 border-t-[#1d4ed8]" />
      </div>
    );
  }

  const userLabel = currentUser
    ? currentUser.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
    : "";

  const getHeaderInfo = (path: string) => {
    if (path.includes("documents/upload")) return { title: "Upload & Ekstraksi Dokumen", subtitle: "Lakukan pemeriksaan kelengkapan dokumen secara cerdas dengan asisten PRIMA AI." };
    if (path.includes("documents/result")) return { title: "Hasil Pemeriksaan Dokumen", subtitle: "Laporan otomatis hasil verifikasi dokumen pengadaan berdasarkan standar perusahaan." };
    if (path.includes("documents")) return { title: "Pemeriksaan Dokumen", subtitle: "Pantau kelengkapan DP3, temuan hasil review, dan status tindak lanjut FPP pengadaan." };
    if (path.includes("overview")) return { title: "Overview Pengadaan", subtitle: "Pantau seluruh status, tahapan progress, dan pemenuhan SLA pekerjaan di satu tempat." };
    if (path.includes("next-action")) return { title: "Tindakan & Persetujuan", subtitle: "Kelola daftar tindakan tertunda dan permohonan persetujuan yang membutuhkan perhatian Anda." };
    if (path.includes("guarantees/upload")) return { title: "Upload Jaminan Bank/Asuransi", subtitle: "Digitalisasi dan ekstraksi data jaminan secara instan melalui sistem OCR cerdas." };
    if (path.includes("guarantees")) return { title: "Manajemen Jaminan", subtitle: "Pantau masa aktif, nilai nominal jaminan pelaksanaan/pemeliharaan, dan validitas dokumen." };
    if (path.includes("notifications")) return { title: "Pusat Notifikasi", subtitle: "Pemberitahuan real-time terkait pembaruan SLA, status pekerjaan, dan aktivitas sistem." };
    if (path.includes("settings")) return { title: "Pengaturan Sistem", subtitle: "Konfigurasi preferensi alur kerja, batas nilai persetujuan otomatis, dan parameter peringatan SLA." };
    
    return { title: "Dashboard", subtitle: "Overview" };
  };

  const header = getHeaderInfo(pathname || "");

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f7fb] text-slate-900">
      <div
        className={cn(
          "fixed inset-0 z-30 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      <SidebarNav />

      <div className="flex min-w-0 flex-1 flex-col transition-all duration-300">
        <div>
          <DashboardHeader
            title={header.title}
            subtitle={header.subtitle}
            userLabel={userLabel}
            userName={currentUser?.name ?? "—"}
            userRole={currentUser?.role ?? "—"}
            onOpenSidebar={() => setMobileOpen(true)}
            onCloseSidebar={() => setMobileOpen(false)}
            onLogout={logout}
          />
        </div>

        <main className="scrollbar-thin flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 sm:px-6 sm:py-4 lg:px-7 lg:py-5">
          <div className="animate-page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProcurementProvider>
      <SidebarProvider>
        <DashboardLayoutInner>{children}</DashboardLayoutInner>
      </SidebarProvider>
    </ProcurementProvider>
  );
}
