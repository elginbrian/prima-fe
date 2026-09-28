/**
 * TanStack Query — QueryClient singleton
 * Configure global defaults: stale time, retry, error handling
 */
import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,        // 5 minutes — data stays fresh
      gcTime: 1000 * 60 * 10,          // 10 minutes — keep in cache
      retry: (failureCount, error) => {
        // Don't retry on 401/403/404
        if (error instanceof ApiError && [401, 403, 404].includes(error.statusCode)) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
