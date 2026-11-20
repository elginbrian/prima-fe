"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  n8nPluginApi,
  type N8nWebhookAuthType,
  type N8nWebhookCreatePayload,
  type N8nWebhookUpdatePayload,
} from "@/lib/api";

export const n8nPluginQueryKey = ["plugins", "n8n"] as const;

export function useN8nPlugin() {
  return useQuery({
    queryKey: n8nPluginQueryKey,
    queryFn: () => n8nPluginApi.getOverview().then((res) => res.data),
    staleTime: 20_000,
  });
}

export function useUpdateN8nGlobal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (enabled: boolean) =>
      n8nPluginApi.updateGlobal(enabled).then((res) => res.data),
    onSuccess: (data) => {
      qc.setQueryData(n8nPluginQueryKey, data);
    },
  });
}

export function useCreateN8nWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: N8nWebhookCreatePayload) =>
      n8nPluginApi.createWebhook(payload).then((res) => res.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: n8nPluginQueryKey });
    },
  });
}

export function useUpdateN8nWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      webhookId,
      payload,
    }: {
      webhookId: string;
      payload: N8nWebhookUpdatePayload;
    }) =>
      n8nPluginApi
        .updateWebhook(webhookId, payload)
        .then((res) => res.data),
    onSuccess: (data) => {
      qc.setQueryData(n8nPluginQueryKey, data);
    },
  });
}

export function useDeleteN8nWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (webhookId: string) =>
      n8nPluginApi.deleteWebhook(webhookId).then((res) => res.data),
    onSuccess: (data) => {
      qc.setQueryData(n8nPluginQueryKey, data);
    },
  });
}

export function useTestN8nWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (webhookId: string) =>
      n8nPluginApi.testWebhook(webhookId).then((res) => res.data),
    onSuccess: (data) => {
      if (data?.overview) {
        qc.setQueryData(n8nPluginQueryKey, data.overview);
      } else {
        qc.invalidateQueries({ queryKey: n8nPluginQueryKey });
      }
    },
  });
}

export function useTestAdHocN8nUrl() {
  return useMutation({
    mutationFn: (payload: {
      url: string;
      auth_type: N8nWebhookAuthType;
      secret?: string;
      custom_header_name?: string;
    }) => n8nPluginApi.testAdHocUrl(payload).then((res) => res.data),
  });
}

export function useClearN8nLogs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => n8nPluginApi.clearLogs().then((res) => res.data),
    onSuccess: (data) => {
      qc.setQueryData(n8nPluginQueryKey, data);
    },
  });
}
