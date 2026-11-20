"use client";

import { useMutation } from "@tanstack/react-query";
import { aiAssistantApi } from "@/lib/api";

export function useOmniAssistant() {
  return useMutation({
    mutationFn: (query: string) =>
      aiAssistantApi.queryOmniAssistant(query).then((res) => res.data),
  });
}
