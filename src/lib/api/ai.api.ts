import { apiFetch } from "./client";

export type OmniIntentKind = "QUESTION" | "COMMAND" | "HYBRID";

export type OmniCommandType =
  | "NAVIGATE"
  | "COMPLETE_SLA"
  | "ESCALATE_SLA"
  | "SUBMIT_RECOVERY_PLAN"
  | "UPDATE_JOB_STATUS"
  | "MOVE_JOB_STAGE"
  | "CREATE_PROCUREMENT"
  | "EVALUATE_SLA";

export interface OmniReferencedItemDto {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  badge?: string | null;
  is_urgent?: boolean;
  href?: string | null;
}

export interface OmniCommandDto {
  type: OmniCommandType;
  label: string;
  description?: string | null;
  auto_execute?: boolean;
  params: Record<string, unknown>;
}

export interface OmniAssistantResponseDto {
  intent_kind: OmniIntentKind;
  answer: string;
  highlights: string[];
  referenced_items: OmniReferencedItemDto[];
  command?: OmniCommandDto | null;
  suggested_followups: string[];
  ai_tier_requested: string;
  ai_tier_used: string;
  ai_model_used?: string | null;
  ai_fallback_notice?: string | null;
  takeover_ticket_id?: string | null;
  takeover_pending?: boolean;
}

export interface OmniChatHistoryTurnDto {
  role: "user" | "assistant";
  content: string;
}

export const aiAssistantApi = {
  queryOmniAssistant: (
    query: string,
    history?: OmniChatHistoryTurnDto[],
    file?: File | null,
    pageContext?: string | null,
    aiTier?: string | null
  ) => {
    if (file) {
      const formData = new FormData();
      formData.append("query", query);
      formData.append("history", JSON.stringify(history ?? []));
      if (pageContext) {
        formData.append("page_context", pageContext);
      }
      if (aiTier) {
        formData.append("ai_tier", aiTier);
      }
      formData.append("file", file);
      return apiFetch<OmniAssistantResponseDto>("/ai/omni-assistant", {
        method: "POST",
        body: formData,
      });
    }

    return apiFetch<OmniAssistantResponseDto>("/ai/omni-assistant", {
      method: "POST",
      body: JSON.stringify({
        query,
        history: history ?? [],
        page_context: pageContext || undefined,
        ai_tier: aiTier || undefined,
      }),
    });
  },
};
