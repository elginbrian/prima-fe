import TemplateEditorPage from "@/components/pages/documents/TemplateEditorPage";
import { Suspense } from "react";

export default function TemplateFormRoute() {
  return (
    <Suspense
      fallback={
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
          Memuat formulir template standar...
        </div>
      }
    >
      <TemplateEditorPage />
    </Suspense>
  );
}
