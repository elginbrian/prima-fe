"use client";

import { useMutation } from "@tanstack/react-query";
import { aiAssistantApi, type OmniChatHistoryTurnDto } from "@/lib/api";

export interface OmniAssistantMutationInput {
  query: string;
  history?: OmniChatHistoryTurnDto[];
  file?: File | null;
  pageContext?: string | null;
  aiTier?: string | null;
}

export function useOmniAssistant() {
  return useMutation({
    mutationFn: (input: string | OmniAssistantMutationInput) => {
      const query = typeof input === "string" ? input : input.query;
      const history = typeof input === "string" ? [] : input.history;
      const file = typeof input === "string" ? null : input.file;
      const pageContext =
        typeof input === "string" ? null : input.pageContext;
      const aiTier = typeof input === "string" ? null : input.aiTier;
      return aiAssistantApi
        .queryOmniAssistant(query, history, file, pageContext, aiTier)
        .then((res) => res.data);
    },
  });
}
