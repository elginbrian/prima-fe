/**
 * Procurement query & mutation hooks (Modul D3)
 */
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  procurementApi,
  documentsApi,
  guaranteesApi,
  deadlinesApi,
  type CreateProcurementPayload,
  type MoveStagePaylod,
  type MoveStepPayload,
  type UpdateOperationalStatusPayload,
} from "@/lib/api";
import { queryKeys } from "@/lib/query/keys";
import { dtoToRequest, dtoToMilestone, dtoListToRequests } from "@/lib/adapters/procurement.adapter";

// ─── Procurement D3 ──────────────────────────────────────────────────────

export function useProcurements() {
  return useQuery({
    queryKey: queryKeys.procurement.all(),
    queryFn: () => procurementApi.getAll().then((r) => dtoListToRequests(r.data)),
  });
}

export function useProcurement(id: string) {
  return useQuery({
    queryKey: queryKeys.procurement.detail(id),
    queryFn: async () => {
      const r = await procurementApi.getById(id);
      return {
        request: dtoToRequest(r.data),
        milestones: (r.data.milestones ?? []).map(dtoToMilestone),
      };
    },
    enabled: !!id,
  });
}

export function useCreateProcurement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProcurementPayload) => procurementApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.procurement.all() }),
  });
}

export function useMoveStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string, payload: MoveStagePaylod }) => procurementApi.moveStage(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.procurement.all() });
      qc.invalidateQueries({ queryKey: queryKeys.procurement.detail(id) });
    },
  });
}

export function useMoveStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string, payload: MoveStepPayload }) => procurementApi.moveStep(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.procurement.all() });
      qc.invalidateQueries({ queryKey: queryKeys.procurement.detail(id) });
    },
  });
}

export function useUpdateOperationalStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string, payload: UpdateOperationalStatusPayload }) =>
      procurementApi.updateOperationalStatus(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.procurement.all() });
      qc.invalidateQueries({ queryKey: queryKeys.procurement.detail(id) });
    },
  });
}

// ─── Documents D1 ────────────────────────────────────────────────────────
import { dtoToDocument, dtoToDeadline } from "@/lib/adapters/procurement.adapter";

export function useDocuments(requestId?: string) {
  return useQuery({
    queryKey: requestId ? queryKeys.documents.byRequest(requestId) : queryKeys.documents.all(),
    queryFn: () => documentsApi.getAll(requestId).then((r) => r.data.map(dtoToDocument)),
  });
}

export function useUpdateDocumentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      documentsApi.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.documents.all() }),
  });
}

// ─── Guarantees D2 ───────────────────────────────────────────────────────

export function useGuarantees(requestId?: string) {
  return useQuery({
    queryKey: requestId ? queryKeys.guarantees.byRequest(requestId) : queryKeys.guarantees.all(),
    queryFn: () => guaranteesApi.getAll(requestId).then((r) => r.data),
  });
}

export function useUpdateGuarantee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof guaranteesApi.update>[1] }) =>
      guaranteesApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.guarantees.all() }),
  });
}

// ─── Deadlines D4 ────────────────────────────────────────────────────────

export function useDeadlines(requestId?: string) {
  return useQuery({
    queryKey: requestId ? queryKeys.deadlines.byRequest(requestId) : queryKeys.deadlines.all(),
    queryFn: () => deadlinesApi.getAll(requestId).then((r) => r.data.map(dtoToDeadline)),
  });
}

export function useUpdateDeadline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof deadlinesApi.update>[1] }) =>
      deadlinesApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.deadlines.all() }),
  });
}
