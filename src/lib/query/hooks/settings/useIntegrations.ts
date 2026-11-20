"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  integrationsApi,
  type AiIntegrationConfigDto,
} from "@/lib/api";

export const integrationsQueryKey = ["integrations", "config"] as const;

export function useIntegrationConfig() {
  return useQuery({
    queryKey: integrationsQueryKey,
    queryFn: () => integrationsApi.getConfig().then((res) => res.data),
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
