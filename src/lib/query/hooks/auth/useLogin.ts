/**
 * useLogin — mutation hook for POST /auth/login
 *
 * On success: persists tokens + user to localStorage AND cookie, invalidates /me query
 * On error: surfaces ApiError message for the form to display
 */
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi, type LoginPayload } from "@/lib/api";
import { queryKeys } from "@/lib/query/keys";
import { setSession } from "@/lib/api/auth.utils";

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (res) => {
      // setSession writes to localStorage AND cookie (for middleware)
      setSession(res.data);

      // Pre-populate /me cache so layout doesn't need to refetch
      queryClient.setQueryData(queryKeys.auth.me(), res.data.user);

      // Redirect to the page user was trying to access, or default
      const redirect = searchParams.get("redirect") ?? "/dashboard/overview";
      router.push(redirect);
    },
  });
}
