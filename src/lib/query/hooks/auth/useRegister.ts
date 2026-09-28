/**
 * useRegister — mutation hook for POST /auth/register
 *
 * On success: redirects to /login
 * Note: confirmPassword is validated on the form level, NOT sent to BE
 */
"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi, type RegisterPayload } from "@/lib/api";

export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess: () => {
      router.push("/login");
    },
  });
}
