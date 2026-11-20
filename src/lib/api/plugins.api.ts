import { apiFetch } from "./client";

export type N8nWebhookAuthType = "hmac_and_header" | "header" | "hmac" | "none";

export interface N8nEventCatalogItemDto {
  event: string;
  category: string;
  label: string;
  description: string;
  recommended_for?: string;
}

export interface N8nWebhookEndpointDto {
  id: string;
  name: string;
  description: string;
  url: string;
  enabled: boolean;
  events: string[];
  auth_type: N8nWebhookAuthType;
  has_secret: boolean;
  secret_masked: string;
  custom_header_name: string;
  include_presigned_urls: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  last_triggered_at?: string | null;
  last_status_code?: number | null;
  last_error?: string | null;
}

export interface N8nDeliveryLogDto {
  delivery_id: string;
  webhook_id: string;
  webhook_name: string;
  url: string;
  event: string;
  ok: boolean;
  status_code?: number | null;
  latency_ms?: number | null;
  response_preview?: string;
  error?: string | null;
  sent_at: string;
}

export interface N8nPluginOverviewDto {
  enabled: boolean;
  webhooks: N8nWebhookEndpointDto[];
  delivery_logs: N8nDeliveryLogDto[];
  events_catalog: N8nEventCatalogItemDto[];
  inbound_endpoints: {
    tools_execute_url: string;
    evaluate_sla_url: string;
    evaluate_guarantees_url: string;
    token_generate_url: string;
  };
}

export interface N8nWebhookCreatePayload {
  name: string;
  description?: string;
  url: string;
  enabled?: boolean;
  events: string[];
  auth_type: N8nWebhookAuthType;
  secret?: string;
  custom_header_name?: string;
  include_presigned_urls?: boolean;
}

export interface N8nWebhookUpdatePayload {
  name?: string;
  description?: string;
  url?: string;
  enabled?: boolean;
  events?: string[];
  auth_type?: N8nWebhookAuthType;
  secret?: string;
  clear_secret?: boolean;
  custom_header_name?: string;
  include_presigned_urls?: boolean;
}

export const n8nPluginApi = {
  getOverview: () => apiFetch<N8nPluginOverviewDto>("/plugins/n8n"),

  updateGlobal: (enabled: boolean) =>
    apiFetch<N8nPluginOverviewDto>("/plugins/n8n", {
      method: "PUT",
      body: JSON.stringify({ enabled }),
    }),

  createWebhook: (payload: N8nWebhookCreatePayload) =>
    apiFetch<
      N8nPluginOverviewDto & {
        created_id: string;
        plain_secret_once?: string | null;
      }
    >("/plugins/n8n/webhooks", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateWebhook: (webhookId: string, payload: N8nWebhookUpdatePayload) =>
    apiFetch<N8nPluginOverviewDto>(
      `/plugins/n8n/webhooks/${encodeURIComponent(webhookId)}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      }
    ),

  deleteWebhook: (webhookId: string) =>
    apiFetch<N8nPluginOverviewDto>(
      `/plugins/n8n/webhooks/${encodeURIComponent(webhookId)}`,
      {
        method: "DELETE",
      }
    ),

  testWebhook: (webhookId: string) =>
    apiFetch<{ delivery: N8nDeliveryLogDto; overview: N8nPluginOverviewDto }>(
      `/plugins/n8n/webhooks/${encodeURIComponent(webhookId)}/test`,
      {
        method: "POST",
      }
    ),

  testAdHocUrl: (payload: {
    url: string;
    auth_type: N8nWebhookAuthType;
    secret?: string;
    custom_header_name?: string;
  }) =>
    apiFetch<{ delivery: N8nDeliveryLogDto }>("/plugins/n8n/test-url", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  clearLogs: () =>
    apiFetch<N8nPluginOverviewDto>("/plugins/n8n/logs", {
      method: "DELETE",
    }),
};
