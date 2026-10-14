import { Skeleton } from "./Skeleton";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showCardHeader?: boolean;
}

export function TableSkeleton({
  rows = 5,
  columns = 5,
  showCardHeader = false,
}: TableSkeletonProps) {
  return (
    <div className="w-full">
      {showCardHeader && (
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
      )}
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div
            key={rIdx}
            className="flex items-center justify-between gap-4 p-4 animate-in fade-in duration-200"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <Skeleton className="h-4 w-3/4 max-w-sm" />
                <Skeleton className="h-3 w-1/2 max-w-xs" />
              </div>
            </div>
            {columns > 2 && (
              <div className="hidden sm:flex items-center gap-6 shrink-0">
                {Array.from({ length: columns - 2 }).map((_, cIdx) => (
                  <Skeleton
                    key={cIdx}
                    className={`h-4 ${
                      cIdx === 0 ? "w-24" : cIdx === 1 ? "w-20" : "w-16"
                    } rounded-full`}
                  />
                ))}
              </div>
            )}
            <Skeleton className="h-8 w-16 rounded-md shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
