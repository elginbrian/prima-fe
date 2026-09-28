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

// ─── Procurement D3 ──────────────────────────────────────────────────────

export function useProcurements() {
  return useQuery({
    queryKey: queryKeys.procurement.all(),
    queryFn: () => procurementApi.getAll().then((r) => r.data),
  });
}

export function useProcurement(id: string) {
  return useQuery({
    queryKey: queryKeys.procurement.detail(id),
    queryFn: () => procurementApi.getById(id).then((r) => r.data),
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

export function useMoveStage(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: MoveStagePaylod) => procurementApi.moveStage(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.procurement.all() });
      qc.invalidateQueries({ queryKey: queryKeys.procurement.detail(id) });
    },
  });
}

export function useMoveStep(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: MoveStepPayload) => procurementApi.moveStep(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.procurement.all() });
      qc.invalidateQueries({ queryKey: queryKeys.procurement.detail(id) });
    },
  });
}

export function useUpdateOperationalStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateOperationalStatusPayload) =>
      procurementApi.updateOperationalStatus(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.procurement.all() });
      qc.invalidateQueries({ queryKey: queryKeys.procurement.detail(id) });
    },
  });
}

// ─── Documents D1 ────────────────────────────────────────────────────────

export function useDocuments(requestId?: string) {
  return useQuery({
    queryKey: requestId ? queryKeys.documents.byRequest(requestId) : queryKeys.documents.all(),
    queryFn: () => documentsApi.getAll(requestId).then((r) => r.data),
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
    queryFn: () => deadlinesApi.getAll(requestId).then((r) => r.data),
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
