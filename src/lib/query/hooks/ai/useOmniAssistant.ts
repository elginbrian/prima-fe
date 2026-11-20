"use client";

import { useMutation } from "@tanstack/react-query";
import { aiAssistantApi, type OmniChatHistoryTurnDto } from "@/lib/api";

export interface OmniAssistantMutationInput {
  query: string;
  history?: OmniChatHistoryTurnDto[];
}

export function useOmniAssistant() {
  return useMutation({
    mutationFn: (input: string | OmniAssistantMutationInput) => {
      const query = typeof input === "string" ? input : input.query;
      const history = typeof input === "string" ? [] : input.history;
      return aiAssistantApi
        .queryOmniAssistant(query, history)
        .then((res) => res.data);
    },
  });
}
