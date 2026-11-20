"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  integrationsApi,
  type AiIntegrationConfigDto,
  type CustomAiModelDto,
  type CustomModelKind,
} from "@/lib/api";
import {
  getSavedChatAiMode,
  setSavedChatAiMode,
} from "@/lib/aiChatStore";

export const integrationsQueryKey = ["integrations", "config"] as const;

export function normalizeProviderKind(
  mode?: string | null
): "internal_gemini" | CustomModelKind {
  const s = (mode || "internal_gemini").toLowerCase();
  if (s === "mcp_takeover" || s === "external_mcp") return "external_mcp";
  if (s === "openai_compatible" || s === "external_api") return "external_api";
  if (s === "custom_webhook" || s === "external_webhook")
    return "external_webhook";
  return "internal_gemini";
}

export function getSavedCustomModels(
  config?: AiIntegrationConfigDto | null
): CustomAiModelDto[] {
  if (!config) return [];
  if (Array.isArray(config.custom_models) && config.custom_models.length > 0) {
    return config.custom_models.map((m) => ({
      ...m,
      provider_kind: normalizeProviderKind(m.provider_kind) as CustomModelKind,
    }));
  }
  const legacyKind = normalizeProviderKind(config.provider_mode);
  if (legacyKind !== "internal_gemini") {
    return [
      {
        id: "CUST-DEFAULT",
        display_name:
          legacyKind === "external_mcp"
            ? "External Agent Takeover (MCP)"
            : config.model_name || config.provider_name || "Custom Model",
        provider_kind: legacyKind as CustomModelKind,
        provider_name: config.provider_name,
        base_url: config.base_url,
        api_key: config.api_key,
        has_api_key: config.has_api_key,
        model_name: config.model_name,
        enable_chat: config.replace_chat_brain ?? true,
        enable_analysis:
          legacyKind === "external_mcp"
            ? false
            : (config.replace_analysis_brain ?? true),
      },
    ];
  }
  return [];
}

export function getChatCustomModels(
  config?: AiIntegrationConfigDto | null
): CustomAiModelDto[] {
  return getSavedCustomModels(config).filter((m) => m.enable_chat !== false);
}

export function getAnalysisCustomModels(
  config?: AiIntegrationConfigDto | null
): CustomAiModelDto[] {
  return getSavedCustomModels(config).filter(
    (m) => m.provider_kind !== "external_mcp" && m.enable_analysis !== false
  );
}

export function resolveAiSelectionMeta(
  config?: AiIntegrationConfigDto | null,
  selection?: string | null
) {
  const models = getSavedCustomModels(config);
  const sel = (selection || "").trim();

  if (sel.startsWith("custom:")) {
    const id = sel.slice("custom:".length);
    const found = models.find((m) => m.id === id);
    if (found) {
      return {
        selection: sel,
        isCustom: true,
        label: found.display_name || found.model_name || "Custom",
        modelName:
          found.provider_kind === "external_mcp"
            ? "External via MCP"
            : found.model_name || found.base_url || "Custom Model",
        customModel: found,
      };
    }
  }

  if (sel === "custom" && config?.active_custom_model_id) {
    const found = models.find((m) => m.id === config.active_custom_model_id);
    if (found) {
      return {
        selection: `custom:${found.id}`,
        isCustom: true,
        label: found.display_name || found.model_name || "Custom",
        modelName:
          found.provider_kind === "external_mcp"
            ? "External via MCP"
            : found.model_name || found.base_url || "Custom Model",
        customModel: found,
      };
    }
  }

  const tier =
    sel === "cermat" || sel === "cerdas" ? sel : "cekatan";
  const defaultMap = {
    cekatan: { label: "Cekatan", modelName: "Gemini 3.x Flash-lite" },
    cermat: { label: "Cermat", modelName: "Gemini 3.x Flash" },
    cerdas: { label: "Cerdas", modelName: "Gemini 4 Hydrogen" },
  };
  return {
    selection: tier,
    isCustom: false,
    label: defaultMap[tier].label,
    modelName: defaultMap[tier].modelName,
    customModel: null as CustomAiModelDto | null,
  };
}

export function getCustomAiStatus(config?: AiIntegrationConfigDto | null) {
  const models = getSavedCustomModels(config);
  const activeCustom = config?.active_custom_model_id
    ? models.find((m) => m.id === config.active_custom_model_id) || null
    : null;
  return {
    providerMode: normalizeProviderKind(config?.provider_mode),
    isNonDefault: Boolean(activeCustom),
    isCustomChat: Boolean(activeCustom && activeCustom.enable_chat),
    isCustomAnalysis: Boolean(
      activeCustom &&
        activeCustom.provider_kind !== "external_mcp" &&
        activeCustom.enable_analysis
    ),
    customModelName:
      activeCustom?.provider_kind === "external_mcp"
        ? "External via MCP"
        : activeCustom?.model_name ||
          activeCustom?.display_name ||
          "Model Custom",
    activeCustom,
    models,
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

export function useChatAiMode() {
  const { data: integrationData } = useIntegrationConfig();
  const config = integrationData?.config;
  const chatCustomModels = getChatCustomModels(config);
  const [storedMode, setStoredMode] = useState<string>(() =>
    getSavedChatAiMode()
  );

  useEffect(() => {
    const sync = () => setStoredMode(getSavedChatAiMode());
    window.addEventListener("prima-ai-chat-mode-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("prima-ai-chat-mode-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  let effectiveMode = "cekatan";
  if (storedMode === "cekatan") {
    effectiveMode = "cekatan";
  } else if (
    storedMode.startsWith("custom:") &&
    chatCustomModels.some((m) => `custom:${m.id}` === storedMode)
  ) {
    effectiveMode = storedMode;
  } else if (
    config?.active_custom_model_id &&
    chatCustomModels.some((m) => m.id === config.active_custom_model_id)
  ) {
    effectiveMode = `custom:${config.active_custom_model_id}`;
  }

  const meta = resolveAiSelectionMeta(config, effectiveMode);

  const selectMode = (nextMode: string) => {
    setSavedChatAiMode(nextMode);
    setStoredMode(nextMode);
  };

  return {
    config,
    chatCustomModels,
    activeMode: meta.selection,
    isCustom: meta.isCustom,
    label: meta.label,
    modelName: meta.modelName,
    customModel: meta.customModel,
    selectMode,
  };
}
