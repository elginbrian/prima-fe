import { Suspense } from "react";
import { AuthPage } from "@/components/auth/AuthPage";
import { Spinner } from "@/components/ui/Spinner";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#f4f7fb] gap-3">
          <Spinner size="lg" />
          <span className="text-xs font-medium text-slate-500">Memuat Sesi PRIMA...</span>
        </div>
      }
    >
      <AuthPage mode="login" />
    </Suspense>
  );
}

