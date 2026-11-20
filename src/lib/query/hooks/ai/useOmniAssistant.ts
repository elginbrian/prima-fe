"use client";

import { useMutation } from "@tanstack/react-query";
import { aiAssistantApi, type OmniChatHistoryTurnDto } from "@/lib/api";

export interface OmniAssistantMutationInput {
  query: string;
  history?: OmniChatHistoryTurnDto[];
  file?: File | null;
}

export function useOmniAssistant() {
  return useMutation({
    mutationFn: (input: string | OmniAssistantMutationInput) => {
      const query = typeof input === "string" ? input : input.query;
      const history = typeof input === "string" ? [] : input.history;
      const file = typeof input === "string" ? null : input.file;
      return aiAssistantApi
        .queryOmniAssistant(query, history, file)
        .then((res) => res.data);
    },
  });
}
