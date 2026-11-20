"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  integrationsApi,
  type AiIntegrationConfigDto,
} from "@/lib/api";

export const integrationsQueryKey = ["integrations", "config"] as const;

export function getCustomAiStatus(config?: AiIntegrationConfigDto | null) {
  const mode = config?.provider_mode || "internal_gemini";
  const isNonDefault = mode !== "internal_gemini";
  const isCustomChat =
    isNonDefault &&
    (mode === "mcp_takeover" || config?.replace_chat_brain !== false);
  const isCustomAnalysis =
    (mode === "openai_compatible" || mode === "custom_webhook") &&
    Boolean(config?.replace_analysis_brain);
  const customModelName =
    mode === "mcp_takeover"
      ? "External Agent Takeover (MCP)"
      : config?.model_name?.trim() ||
        config?.provider_name?.trim() ||
        "Model Custom Eksternal";

  return {
    providerMode: mode,
    isNonDefault,
    isCustomChat,
    isCustomAnalysis,
    customModelName,
  };
}

export function useIntegrationConfig() {
  return useQuery({
    queryKey: integrationsQueryKey,
    queryFn: () => integrationsApi.getConfig().then((res) => res.data),
    staleTime: 60_000,
  });
}

export function useUpdateIntegrationConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<AiIntegrationConfigDto>) =>
      integrationsApi.updateConfig(payload).then((res) => res.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: integrationsQueryKey });
    },
  });
}

export function useGenerateAgentToken() {
  return useMutation({
    mutationFn: ({
      label,
      expiresDays,
    }: {
      label?: string;
      expiresDays?: number;
    }) =>
      integrationsApi
        .generateToken(label, expiresDays)
        .then((res) => res.data),
  });
}

export function useExecuteMcpTool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      toolName,
      args,
    }: {
      toolName: string;
      args: Record<string, unknown>;
    }) =>
      integrationsApi.executeTool(toolName, args).then((res) => res.data),
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });
}
