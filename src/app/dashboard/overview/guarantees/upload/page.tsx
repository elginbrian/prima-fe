import GuaranteeUploadPage from "@/components/pages/guarantees/GuaranteeUploadPage";
import { Suspense } from "react";

export default function OverviewGuaranteeUploadRoute() {
  return (
    <Suspense fallback={<div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Memuat formulir jaminan pekerjaan...</div>}>
      <GuaranteeUploadPage />
    </Suspense>
  );
}

