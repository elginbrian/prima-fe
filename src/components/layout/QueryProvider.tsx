"use client";

/**
 * QueryProvider — wraps the app with TanStack QueryClientProvider
 * + ReactQueryDevtools (only in development)
 *
 * Must be a Client Component because QueryClient requires browser context.
 * Used in root layout.tsx as a server-compatible wrapper.
 */
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/lib/query/queryClient";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      )}
    </QueryClientProvider>
  );
}
