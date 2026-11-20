import { Menu, X, Sparkles } from "lucide-react";
import { UserProfileBean } from "./UserProfileBean";

export function DashboardHeader({
  title,
  subtitle,
  userName,
  userRole,
  userAvatarUrl,
  onOpenSidebar,
  onCloseSidebar,
  onLogout,
  transparent = false,
  showAiAssistantToggle = false,
  isAiAssistantOpen = false,
  onToggleAiAssistant,
}: {
  title: string;
  subtitle: string;
  userLabel?: string;
  userName: string;
  userRole: string;
  userAvatarUrl?: string | null;
  onOpenSidebar?: () => void;
  onCloseSidebar?: () => void;
  onLogout?: () => void;
  transparent?: boolean;
  showAiAssistantToggle?: boolean;
  isAiAssistantOpen?: boolean;
  onToggleAiAssistant?: () => void;
}) {
  return (
    <header
      className={
        transparent
          ? "pointer-events-none absolute inset-x-0 top-0 z-30 flex h-[84px] items-center justify-between gap-3 bg-transparent px-5 py-3 sm:px-7"
          : "flex h-[84px] items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-3 sm:px-7"
      }
    >
      <div className="pointer-events-auto lg:hidden">
        <button
          type="button"
          aria-label="Open navigation"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white/90 backdrop-blur-sm text-slate-700 shadow-2xs focus:outline-none"
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

      {transparent ? (
        <div className="flex-1" />
      ) : (
        <div className="min-w-0 flex-1">
          <h1 className="text-[1.25rem] font-semibold leading-tight tracking-tight text-slate-800 sm:text-[1.45rem]">
            {title}
          </h1>
          <p className="mt-0.5 text-xs font-normal text-slate-500">{subtitle}</p>
        </div>
      )}

      <div className="pointer-events-auto flex items-center gap-2.5 shrink-0">
        {showAiAssistantToggle && (
          <button
            type="button"
            onClick={onToggleAiAssistant}
            title="Buka atau tutup sidebar Diskusi AI (Ctrl + J)"
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold shadow-2xs transition focus:outline-none ${
              isAiAssistantOpen
                ? "border-[#0a4d8c] bg-[#0a4d8c] text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-[#0a4d8c]/40 hover:bg-[#f4f8fd] hover:text-[#0a4d8c]"
            }`}
          >
            <Sparkles
              size={14}
              className={isAiAssistantOpen ? "text-white" : "text-[#0a4d8c]"}
            />
            <span>Diskusi AI</span>
          </button>
        )}

        <UserProfileBean
          userName={userName}
          userRole={userRole}
          userAvatarUrl={userAvatarUrl}
          onLogout={onLogout}
        />
      </div>
    </header>
  );
}
