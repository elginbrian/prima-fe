import { apiFetch } from "./client";
import type { OmniAssistantResponseDto } from "./ai.api";

export type ExternalProviderMode =
  | "internal_gemini"
  | "openai_compatible"
  | "custom_webhook"
  | "mcp_takeover";

export interface TakeoverTicketDto {
  ticket_id: string;
  status: "PENDING" | "REPLIED";
  user_query: string;
  page_context?: string;
  attachment_filename?: string | null;
  created_at: string;
  replied_at?: string | null;
  agent_name?: string | null;
  response_payload?: OmniAssistantResponseDto | null;
}

export interface AiIntegrationConfigDto {
  provider_mode: ExternalProviderMode;
  provider_name: string;
  base_url: string;
  api_key?: string;
  has_api_key?: boolean;
  model_name: string;
  replace_chat_brain: boolean;
  replace_analysis_brain: boolean;
}

export interface McpToolSchemaDto {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, { type?: string; description?: string; enum?: string[] }>;
    required?: string[];
  };
}

export interface IntegrationOverviewResponseDto {
  config: AiIntegrationConfigDto;
  mcp_tools: McpToolSchemaDto[];
  takeover_tickets?: TakeoverTicketDto[];
  endpoints: {
    mcp_jsonrpc_url: string;
    tool_execute_url: string;
    openapi_spec_url: string;
  };
}

export interface GeneratedAgentTokenDto {
  token: string;
  label: string;
  expires_days: number;
  user_name: string;
}

export const integrationsApi = {
  getConfig: () =>
    apiFetch<IntegrationOverviewResponseDto>("/integrations/config"),

  updateConfig: (payload: Partial<AiIntegrationConfigDto>) =>
    apiFetch<{ config: AiIntegrationConfigDto }>("/integrations/config", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  generateToken: (label = "Antigravity / MCP Agent Key", expires_days = 365) =>
    apiFetch<GeneratedAgentTokenDto>("/integrations/token", {
      method: "POST",
      body: JSON.stringify({ label, expires_days }),
    }),

  executeTool: (tool_name: string, argumentsPayload: Record<string, unknown>) =>
    apiFetch<{ tool_name: string; result: unknown }>(
      "/integrations/tools/execute",
      {
        method: "POST",
        body: JSON.stringify({
          tool_name,
          arguments: argumentsPayload,
        }),
      }
    ),

  getTakeoverTicket: (ticketId: string) =>
    apiFetch<TakeoverTicketDto>(
      `/integrations/takeover/tickets/${encodeURIComponent(ticketId)}`
    ),
};
