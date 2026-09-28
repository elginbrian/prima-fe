/**
 * useCurrentUser — query hook for GET /auth/me
 *
 * - Initializes from localStorage for instant first render (no flash)
 * - Fetches fresh data from BE in the background
 * - Returns null when not authenticated (no token)
 */
"use client";

import { useQuery } from "@tanstack/react-query";
import { authApi, type UserDto } from "@/lib/api";
import { queryKeys } from "@/lib/query/keys";

function getStoredUser(): UserDto | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("current_user");
    return raw ? (JSON.parse(raw) as UserDto) : null;
  } catch {
    return null;
  }
}

export function useCurrentUser() {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: () => authApi.me().then((r) => r.data),
    initialData: getStoredUser() ?? undefined,
    enabled: !!token,          // Only run if token exists
    staleTime: 1000 * 60 * 5, // 5 min — avoid spamming /me on every mount
  });
}

/**
 * useLogout — clears tokens and redirects to /login
 */
export function useLogout() {
  return () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("current_user");
    window.location.href = "/login";
  };
}
