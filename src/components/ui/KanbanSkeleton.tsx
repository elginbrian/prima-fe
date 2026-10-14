import { Skeleton } from "./Skeleton";

export function KanbanSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
      {["Sourcing", "Evaluasi", "Contracting", "Selesai"].map((stage, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 flex flex-col gap-3 min-h-[480px]"
        >
          {/* Column Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-6 rounded-full" />
            </div>
            <Skeleton className="h-5 w-5 rounded-md" />
          </div>

          {/* Cards */}
          {Array.from({ length: idx === 0 ? 3 : idx === 1 ? 2 : 1 }).map((_, cIdx) => (
            <div
              key={cIdx}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-16 rounded-full" />
                <Skeleton className="h-3 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
