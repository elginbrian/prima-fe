/**
 * useCurrentUser — query hook for GET /auth/me
 *
 * - Initializes from localStorage for instant first render (no flash)
 * - Fetches fresh data from BE in the background
 * - Returns null when not authenticated (no token)
 * - Auto-logouts if /auth/me returns an error (token invalid/expired)
 */
"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api";
import { queryKeys } from "@/lib/query/keys";
import { getStoredUser, getAccessToken, clearSession } from "@/lib/api/auth.utils";

export function useCurrentUser() {
  const token = getAccessToken();

  const query = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: () => authApi.me().then((r) => r.data),
    placeholderData: getStoredUser() ?? undefined,
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
    retry: false, // Don't retry on 401 — just auto-logout
  });

  // TanStack Query v5: onError removed from useQuery options.
  // Watch isError via useEffect instead.
  useEffect(() => {
    if (query.isError) {
      clearSession();
      window.location.href = "/login";
    }
  }, [query.isError]);

  return query;
}

/**
 * useLogout — clears tokens and redirects to /login
 */
export function useLogout() {
  return () => {
    clearSession();
    window.location.href = "/login";
  };
}
