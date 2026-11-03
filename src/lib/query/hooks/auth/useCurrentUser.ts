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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/api";
import type { UpdateProfilePayload } from "@/lib/api/auth.api";
import { queryKeys } from "@/lib/query/keys";
import { getStoredUser, setStoredUser, getAccessToken, clearSession } from "@/lib/api/auth.utils";

export function useCurrentUser() {
  const token = getAccessToken();

  const query = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: async () => {
      const res = await authApi.me();
      if (res.data) {
        setStoredUser(res.data);
      }
      return res.data;
    },
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

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      authApi.updateProfile(payload).then((res) => res.data),
    onSuccess: (updatedUser) => {
      setStoredUser(updatedUser);
      queryClient.setQueryData(queryKeys.auth.me(), updatedUser);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.users() });
      queryClient.invalidateQueries({ queryKey: ["procurements"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["guarantees"] });
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => authApi.uploadAvatar(file).then((res) => res.data),
    onSuccess: (updatedUser) => {
      setStoredUser(updatedUser);
      queryClient.setQueryData(queryKeys.auth.me(), updatedUser);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.users() });
    },
  });
}

/**
 * useLogout — clears tokens and redirects to /login
 */
export function useLogout() {
  const queryClient = useQueryClient();
  return () => {
    clearSession();
    queryClient.clear();
    window.location.href = "/login";
  };
}
