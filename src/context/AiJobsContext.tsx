"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { documentsApi } from "@/lib/api/documents.api";
import { useToast } from "@/components/ui/Toast";
import { queryKeys } from "@/lib/query/keys";
import { notificationKeys } from "@/lib/query/hooks/procurement/useNotifications";
import type { AiTier } from "@/types/validation";

export interface TrackedAiJob {
  id: string;
  documentName: string;
  aiTierRequested?: AiTier | string | null;
  startedAt: string;
}

interface AiJobsContextValue {
  activeJobs: TrackedAiJob[];
  trackJob: (job: {
    id: string;
    documentName: string;
    aiTierRequested?: AiTier | string | null;
  }) => void;
}

const STORAGE_KEY = "prima_active_ai_jobs_v1";

const AiJobsContext = createContext<AiJobsContextValue | null>(null);

function loadStoredJobs(): TrackedAiJob[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredJobs(jobs: TrackedAiJob[]): void {
  if (typeof window === "undefined") return;
  try {
    if (jobs.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    }
  } catch {
    // Ignore storage quota errors
  }
}

export function AiJobsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [activeJobs, setActiveJobs] = useState<TrackedAiJob[]>([]);
  const jobsRef = useRef<TrackedAiJob[]>([]);
  const completedIdsRef = useRef<Set<string>>(new Set());

  const updateJobs = useCallback(
    (updater: (prev: TrackedAiJob[]) => TrackedAiJob[]) => {
      setActiveJobs((prev) => {
        const next = updater(prev);
        jobsRef.current = next;
        saveStoredJobs(next);
        return next;
      });
    },
    []
  );

  const trackJob = useCallback(
    (job: {
      id: string;
      documentName: string;
      aiTierRequested?: AiTier | string | null;
    }) => {
      completedIdsRef.current.delete(job.id);
      updateJobs((prev) => {
        const filtered = prev.filter((j) => j.id !== job.id);
        return [
          {
            id: job.id,
            documentName: job.documentName,
            aiTierRequested: job.aiTierRequested,
            startedAt: new Date().toISOString(),
          },
          ...filtered,
        ];
      });
    },
    [updateJobs]
  );

  // Hydrate from localStorage + sync active backend jobs on mount
  useEffect(() => {
    const stored = loadStoredJobs();
    if (stored.length > 0) {
      jobsRef.current = stored;
      setActiveJobs(stored);
    }

    let cancelled = false;
    documentsApi
      .getActiveValidationJobs()
      .then((res) => {
        if (cancelled) return;
        const serverJobs = res.data || [];
        if (serverJobs.length === 0) return;
        updateJobs((prev) => {
          const map = new Map(prev.map((j) => [j.id, j]));
          for (const sj of serverJobs) {
            if (!map.has(sj.id)) {
              map.set(sj.id, {
                id: sj.id,
                documentName: sj.document_name,
                aiTierRequested: sj.ai_tier_requested,
                startedAt: sj.created_at || new Date().toISOString(),
              });
            }
          }
          return Array.from(map.values());
        });
      })
      .catch(() => {
        // Ignore if not authenticated yet or network hiccup
      });

    return () => {
      cancelled = true;
    };
  }, [updateJobs]);

  // Poll every tracked active job every 3.5s until completed or failed
  useEffect(() => {
    if (activeJobs.length === 0) return;

    let cancelled = false;

    const pollOnce = async () => {
      const current = jobsRef.current;
      if (current.length === 0) return;

      await Promise.all(
        current.map(async (job) => {
          if (completedIdsRef.current.has(job.id)) return;
          try {
            const res = await documentsApi.getValidationById(job.id);
            if (cancelled) return;
            const detail = res.data;
            const status = detail.processing_status || "completed";

            if (status === "processing") return;

            // Mark finished to guarantee single notification per job
            completedIdsRef.current.add(job.id);
            updateJobs((prev) => prev.filter((j) => j.id !== job.id));

            queryClient.setQueryData(["validation", "log", detail.id], detail);
            queryClient.invalidateQueries({ queryKey: ["validation", "logs"] });
            queryClient.invalidateQueries({ queryKey: queryKeys.documents.all() });
            queryClient.invalidateQueries({ queryKey: notificationKeys.all });

            const resultUrl = `/dashboard/documents/result?id=${encodeURIComponent(detail.id)}`;

            if (status === "completed") {
              toast.success(
                `Analisis AI selesai: ${detail.document_name} (Skor ${Math.round(detail.overall_score)}/100)`,
                {
                  actionLabel: "Lihat Hasil →",
                  onAction: () => router.push(resultUrl),
                  durationMs: 10000,
                }
              );

              if (detail.ai_fallback_notice) {
                toast.warning(detail.ai_fallback_notice, {
                  durationMs: 10000,
                });
              }
            } else if (status === "failed") {
              toast.error(
                `Analisis AI gagal untuk '${detail.document_name}': ${detail.error_message || "Silakan coba evaluasi ulang."}`,
                {
                  actionLabel: "Buka Detail →",
                  onAction: () => router.push(resultUrl),
                  durationMs: 10000,
                }
              );
            }
          } catch {
            // Transient network error — retry on next interval
          }
        })
      );
    };

    const timer = setInterval(() => {
      void pollOnce();
    }, 3500);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [activeJobs.length, queryClient, router, toast, updateJobs]);

  const value = useMemo<AiJobsContextValue>(
    () => ({ activeJobs, trackJob }),
    [activeJobs, trackJob]
  );

  return (
    <AiJobsContext.Provider value={value}>{children}</AiJobsContext.Provider>
  );
}

export function useAiJobs(): AiJobsContextValue {
  const ctx = useContext(AiJobsContext);
  if (!ctx) {
    return {
      activeJobs: [],
      trackJob: () => undefined,
    };
  }
  return ctx;
}
