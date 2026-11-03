"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import TrackerDetailPage from "@/components/pages/tracker/TrackerDetailPage";
import { Skeleton } from "@/components/ui/Skeleton";

function DetailRouteContent() {
  const params = useParams();
  const rawId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";
  const requestId = decodeURIComponent(rawId);

  return <TrackerDetailPage requestId={requestId} />;
}

export default function OverviewJobDetailRoute() {
  return (
    <Suspense
      fallback={
        <div className="space-y-5 pb-12">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      }
    >
      <DetailRouteContent />
    </Suspense>
  );
}

