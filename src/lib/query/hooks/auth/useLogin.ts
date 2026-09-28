/**
 * useLogin — mutation hook for POST /auth/login
 *
 * On success: persists tokens + user to localStorage, invalidates /me query
 * On error: surfaces ApiError message for the form to display
 */
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi, type LoginPayload, type TokenDto } from "@/lib/api";
import { queryKeys } from "@/lib/query/keys";

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (res) => {
      const { access_token, refresh_token, user } = res.data;
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      localStorage.setItem("current_user", JSON.stringify(user));

      // Pre-populate /me cache so layout doesn't need to refetch
      queryClient.setQueryData(queryKeys.auth.me(), user);

      router.push("/dashboard/documents");
    },
  });
}
