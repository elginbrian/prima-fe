import { Menu, X, UserCircle2, LogOut, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogoutModal } from "@/components/ui/LogoutModal";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Spinner } from "@/components/ui/Spinner";
import { useAiJobs } from "@/context/AiJobsContext";

export function DashboardHeader({
  title,
  subtitle,
  userLabel,
  userName,
  userRole,
  userAvatarUrl,
  onOpenSidebar,
  onCloseSidebar,
  onLogout,
}: {
  title: string;
  subtitle: string;
  userLabel: string;
  userName: string;
  userRole: string;
  userAvatarUrl?: string | null;
  onOpenSidebar?: () => void;
  onCloseSidebar?: () => void;
  onLogout?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const { activeJobs } = useAiJobs();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="flex h-[84px] items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-3 sm:px-7">
      <div className="lg:hidden">
        <button
          type="button"
          aria-label="Open navigation"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none"
          onClick={onOpenSidebar}
        >
          <Menu size={16} />
        </button>
      </div>

      <div className="hidden lg:hidden">
        <button
          type="button"
          aria-label="Close navigation"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none"
          onClick={onCloseSidebar}
        >
          <X size={16} />
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <h1 className="text-[1.25rem] font-semibold leading-tight tracking-tight text-slate-800 sm:text-[1.45rem]">
          {title}
        </h1>
        <p className="mt-0.5 text-xs font-normal text-slate-500">{subtitle}</p>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {activeJobs.length > 0 && (
          <button
            type="button"
            onClick={() => router.push("/dashboard/documents")}
            title={activeJobs.map((j) => j.documentName).join(", ")}
            className="inline-flex items-center gap-2 rounded-full border border-[#0a4d8c]/25 bg-[#e8f2fc] px-3 py-1.5 text-xs font-medium text-[#0a4d8c] shadow-2xs transition hover:bg-[#dcebfa] focus:outline-none"
          >
            <Spinner size="xs" />
            <Sparkles size={13} className="hidden sm:inline" />
            <span className="max-w-[160px] truncate">
              {activeJobs.length === 1
                ? "1 dokumen dianalisis AI..."
                : `${activeJobs.length} dokumen dianalisis AI...`}
            </span>
          </button>
        )}

      <div ref={menuRef} className="relative flex items-center justify-center">
        <button
          type="button"
          aria-label="User profile"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white p-1 pr-3 shadow-xs transition hover:border-[#0a4d8c]/40 focus:outline-none"
        >
          <UserAvatar name={userName} avatarUrl={userAvatarUrl} size="md" />
          <div className="hidden text-left sm:block">
            <div className="max-w-[130px] truncate text-xs font-medium text-slate-800">
              {userName}
            </div>
            <div className="max-w-[130px] truncate text-[10px] font-normal text-slate-500">
              {userRole}
            </div>
          </div>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            <div className="border-b border-slate-100 bg-slate-50/70 p-4">
              <div className="flex items-center gap-3">
                <UserAvatar name={userName} avatarUrl={userAvatarUrl} size="lg" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{userName}</p>
                  <p className="text-xs font-normal text-slate-500">{userRole}</p>
                </div>
              </div>
            </div>

            <div className="p-1.5">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  router.push("/dashboard/settings");
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none"
              >
                <UserCircle2 size={15} className="text-[#0a4d8c]" />
                Profil & Pengaturan Akun
              </button>
              <div className="my-1 border-t border-slate-100" />
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setLogoutOpen(true);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none"
              >
                <LogOut size={15} className="text-slate-500" />
                Keluar
              </button>
            </div>
          </div>
        )}
      </div>
      </div>

      <LogoutModal
        isOpen={logoutOpen}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={() => {
          setLogoutOpen(false);
          onLogout?.();
        }}
      />
    </header>
  );
}
