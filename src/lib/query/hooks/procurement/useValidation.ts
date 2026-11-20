"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { documentsApi } from "@/lib/api/documents.api";
import type {
  AiTier,
  CreateValidationProfilePayload,
  UpdateValidationProfilePayload,
  ReevaluateValidationPayload,
  PublishValidationToTrackerPayload,
  UpdateValidationDecisionPayload,
  CreateWorkflowStagePayload,
  UpdateWorkflowStagePayload,
  ReorderWorkflowStagesPayload,
} from "@/types/validation";
import { queryKeys } from "@/lib/query/keys";

export const validationQueryKeys = {
  profiles: (kind?: string) => ["validation", "profiles", kind ?? "all"] as const,
  profileDetail: (id: string) => ["validation", "profile", id] as const,
  validationDetail: (id: string) => ["validation", "log", id] as const,
  validationLogs: (requestId?: string) => ["validation", "logs", requestId ?? "all"] as const,
  workflowStages: (method?: string) => ["workflow", "stages", method ?? "all"] as const,
};

export function useValidationLogs(requestId?: string) {
  return useQuery({
    queryKey: validationQueryKeys.validationLogs(requestId),
    queryFn: async () => {
      const res = await documentsApi.getValidationLogs(requestId);
      return res.data;
    },
    enabled: requestId !== "",
    refetchInterval: (query) => {
      const rows = query.state.data;
      if (Array.isArray(rows) && rows.some((r) => r.processing_status === "processing")) {
        return 3500;
      }
      return false;
    },
  });
}

export function useValidationProfiles(documentKind?: string, scope?: string) {
  return useQuery({
    queryKey: validationQueryKeys.profiles(documentKind),
    queryFn: async () => {
      const res = await documentsApi.getProfiles(documentKind, scope);
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useValidationProfile(id?: string) {
  return useQuery({
    queryKey: validationQueryKeys.profileDetail(id ?? ""),
    queryFn: async () => {
      if (!id) return null;
      const res = await documentsApi.getProfileById(id);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateValidationProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateValidationProfilePayload) => {
      const res = await documentsApi.createProfile(payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["validation", "profiles"] });
    },
  });
}

export function useUpdateValidationProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateValidationProfilePayload;
    }) => {
      const res = await documentsApi.updateProfile(id, payload);
      return res.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["validation", "profiles"] });
      qc.setQueryData(validationQueryKeys.profileDetail(data.id), data);
    },
  });
}

export function useDeleteValidationProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await documentsApi.deleteProfile(id);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["validation", "profiles"] });
    },
  });
}

export function useExtractCriteria() {
  return useMutation({
    mutationFn: async (input: File | { file: File; aiTier?: AiTier }) => {
      const file = input instanceof File ? input : input.file;
      const aiTier = input instanceof File ? "cekatan" : input.aiTier ?? "cekatan";
      const res = await documentsApi.extractCriteria(file, aiTier);
      return res.data;
    },
  });
}

export function useValidationDetail(id?: string) {
  return useQuery({
    queryKey: validationQueryKeys.validationDetail(id ?? ""),
    queryFn: async () => {
      if (!id) return null;
      const res = await documentsApi.getValidationById(id);
      return res.data;
    },
    enabled: !!id,
    refetchInterval: (query) =>
      query.state.data?.processing_status === "processing" ? 3000 : false,
  });
}

export function useAnalyzeDocumentChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await documentsApi.analyzeChecklist(formData);
      return res.data;
    },
    onSuccess: (data) => {
      qc.setQueryData(validationQueryKeys.validationDetail(data.id), data);
      if (data.document_id) {
        qc.setQueryData(validationQueryKeys.validationDetail(data.document_id), data);
      }
      qc.invalidateQueries({ queryKey: queryKeys.documents.all() });
      qc.invalidateQueries({ queryKey: ["validation", "logs"] });
    },
  });
}

export function useReevaluateValidation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: ReevaluateValidationPayload;
    }) => {
      const res = await documentsApi.reevaluateValidation(id, payload);
      return res.data;
    },
    onSuccess: (data) => {
      qc.setQueryData(validationQueryKeys.validationDetail(data.id), data);
      if (data.document_id) {
        qc.setQueryData(validationQueryKeys.validationDetail(data.document_id), data);
      }
      qc.invalidateQueries({ queryKey: queryKeys.documents.all() });
      qc.invalidateQueries({ queryKey: ["validation", "logs"] });
    },
  });
}

export function useUpdateValidationDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateValidationDecisionPayload;
    }) => {
      const res = await documentsApi.updateValidationDecision(id, payload);
      return res.data;
    },
    onSuccess: (data) => {
      qc.setQueryData(validationQueryKeys.validationDetail(data.id), data);
      if (data.document_id) {
        qc.setQueryData(validationQueryKeys.validationDetail(data.document_id), data);
      }
      qc.invalidateQueries({ queryKey: queryKeys.documents.all() });
      qc.invalidateQueries({ queryKey: ["validation", "logs"] });
    },
  });
}

export function usePublishValidationToTracker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: PublishValidationToTrackerPayload) => {
      const res = await documentsApi.publishToTracker(payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.procurement.all() });
      qc.invalidateQueries({ queryKey: queryKeys.documents.all() });
      qc.invalidateQueries({ queryKey: queryKeys.deadlines.all() });
      qc.invalidateQueries({ queryKey: ["validation"] });
    },
  });
}

// ─── ADMIN WORKFLOW STAGES HOOKS ───────────────────────────────────────────

export function useWorkflowStages(procurementMethod?: string) {
  return useQuery({
    queryKey: validationQueryKeys.workflowStages(procurementMethod),
    queryFn: async () => {
      const res = await documentsApi.getWorkflowStages(procurementMethod);
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateWorkflowStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateWorkflowStagePayload) => {
      const res = await documentsApi.createWorkflowStage(payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflow", "stages"] });
    },
  });
}

export function useUpdateWorkflowStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateWorkflowStagePayload;
    }) => {
      const res = await documentsApi.updateWorkflowStage(id, payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflow", "stages"] });
    },
  });
}

export function useReorderWorkflowStages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ReorderWorkflowStagesPayload) => {
      const res = await documentsApi.reorderWorkflowStages(payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflow", "stages"] });
    },
  });
}

export function useDeleteWorkflowStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await documentsApi.deleteWorkflowStage(id);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflow", "stages"] });
    },
  });
}
