"use client";

import React, { createContext, useContext, useReducer, useCallback, useEffect } from "react";
import type { ProcurementState, ProcurementStage, ProcurementStep, ProcurementRequest, ProcurementOperationalStatus, DocumentItem, GuaranteeItem, ProcurementAttachment, ActionItem, NotificationItem, DeadlineItem } from "@/types";
import { initialProcurementState } from "@/lib/mockData";
import { ProcurementAction } from "./types";
import { procurementReducer, actionForGuarantee, actionForDeadline, actionForDocument } from "./reducer";

const ATTACHMENTS_STORAGE_KEY = "prima_attachments";

// ─── CONTEXT ────────────────────────────────────────────────────────────────

interface ProcurementContextValue {
  state: ProcurementState;
  dispatch: React.Dispatch<ProcurementAction>;
  addRequest: (request: ProcurementRequest) => void;
  moveRequest: (id: string, stage: ProcurementStage) => void;
  updateRequestOperationalStatus: (id: string, status: ProcurementOperationalStatus, reason?: string) => void;
  moveRequestStep: (id: string, step: ProcurementStep) => void;
  addDocument: (doc: DocumentItem) => void;
  updateDocumentStatus: (id: string, status: DocumentItem["status"]) => void;
  addGuarantee: (guarantee: GuaranteeItem) => void;
  updateGuarantee: (id: string, changes: Partial<GuaranteeItem>) => void;
  addAttachment: (attachment: ProcurementAttachment) => void;
  deleteAttachment: (id: string) => void;
  addDeadline: (deadline: DeadlineItem) => void;
  updateDeadline: (id: string, changes: Partial<DeadlineItem>) => void;
  updateDeadlineStatus: (id: string, status: "On Track" | "At Risk" | "Overdue" | "Selesai") => void;
  updateActionStatus: (id: string, status: ActionItem["status"]) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  updateSettings: (settings: Partial<ProcurementState["settings"]>) => void;
}

const ProcurementContext = createContext<ProcurementContextValue | null>(null);

// ─── PROVIDER ────────────────────────────────────────────────────────────────

export function ProcurementProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(procurementReducer, initialProcurementState);

  // Restore persistent attachments on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(ATTACHMENTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          dispatch({ type: "INIT_ATTACHMENTS", attachments: parsed });
        }
      }
    } catch (err) {
      console.error("Failed to load attachments from localStorage:", err);
    }
  }, []);

  // Compute derived actions dynamically
  const derivedState = React.useMemo(() => {
    const computedActions: ActionItem[] = [];

    // 1. Actions from Guarantees (Mendekati Expiry / Expired)
    state.guarantees.forEach(guarantee => {
      const act = actionForGuarantee(guarantee);
      if (act) computedActions.push(act);
    });

    // 2. Actions from Deadlines (At Risk / Overdue)
    state.deadlines.forEach(deadline => {
      const act = actionForDeadline(deadline);
      if (act) computedActions.push(act);
    });

    // 3. Actions from Documents (Catatan Procurement / Tindak Lanjut FPP)
    state.documents.forEach(doc => {
      const act = actionForDocument(doc);
      if (act) computedActions.push(act);
    });

    return {
      ...state,
      actions: computedActions
    };
  }, [state]);

  const addRequest = useCallback((request: ProcurementRequest) => dispatch({ type: "ADD_REQUEST", request }), []);
  const moveRequest = useCallback((id: string, stage: ProcurementStage) => dispatch({ type: "MOVE_REQUEST", id, stage }), []);
  const updateRequestOperationalStatus = useCallback((id: string, status: ProcurementOperationalStatus, reason?: string) => dispatch({ type: "UPDATE_REQUEST_OPERATIONAL_STATUS", id, status, reason }), []);
  const moveRequestStep = useCallback((id: string, step: ProcurementStep) => dispatch({ type: "MOVE_REQUEST_STEP", id, step }), []);
  const addDocument = useCallback((document: DocumentItem) => dispatch({ type: "ADD_DOCUMENT", document }), []);
  const updateDocumentStatus = useCallback((id: string, status: DocumentItem["status"]) => dispatch({ type: "UPDATE_DOCUMENT_STATUS", id, status }), []);
  const addGuarantee = useCallback((guarantee: GuaranteeItem) => dispatch({ type: "ADD_GUARANTEE", guarantee }), []);
  const updateGuarantee = useCallback((id: string, changes: Partial<GuaranteeItem>) => dispatch({ type: "UPDATE_GUARANTEE", id, changes }), []);
  const addAttachment = useCallback((attachment: ProcurementAttachment) => {
    dispatch({ type: "ADD_ATTACHMENT", attachment });
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(ATTACHMENTS_STORAGE_KEY);
        const existing: ProcurementAttachment[] = stored ? JSON.parse(stored) : [];
        const next = [attachment, ...existing.filter((a) => a.id !== attachment.id)];
        localStorage.setItem(ATTACHMENTS_STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.error("Failed to persist attachment to localStorage:", err);
      }
    }
  }, []);

  const deleteAttachment = useCallback((id: string) => {
    dispatch({ type: "DELETE_ATTACHMENT", id });
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(ATTACHMENTS_STORAGE_KEY);
        if (stored) {
          const existing: ProcurementAttachment[] = JSON.parse(stored);
          const next = existing.filter((a) => a.id !== id);
          localStorage.setItem(ATTACHMENTS_STORAGE_KEY, JSON.stringify(next));
        }
      } catch (err) {
        console.error("Failed to delete attachment from localStorage:", err);
      }
    }
  }, []);

  const addDeadline = useCallback((deadline: DeadlineItem) => dispatch({ type: "ADD_DEADLINE", deadline }), []);
  const updateDeadline = useCallback((id: string, changes: Partial<DeadlineItem>) => dispatch({ type: "UPDATE_DEADLINE", id, changes }), []);
  const updateDeadlineStatus = useCallback((id: string, status: "On Track" | "At Risk" | "Overdue" | "Selesai") => dispatch({ type: "UPDATE_DEADLINE_STATUS", id, status }), []);
  const updateActionStatus = useCallback((id: string, status: ActionItem["status"]) => dispatch({ type: "UPDATE_ACTION_STATUS", id, status }), []);
  const markNotificationRead = useCallback((id: string) => dispatch({ type: "MARK_NOTIFICATION_READ", id }), []);
  const markAllRead = useCallback(() => dispatch({ type: "MARK_ALL_READ" }), []);
  const updateSettings = useCallback((settings: Partial<ProcurementState["settings"]>) => dispatch({ type: "UPDATE_SETTINGS", settings }), []);

  return (
    <ProcurementContext.Provider value={{
      state: derivedState, dispatch,
      addRequest, moveRequest, updateRequestOperationalStatus, moveRequestStep, addDocument, updateDocumentStatus,
      addGuarantee, updateGuarantee, addAttachment, deleteAttachment, addDeadline, updateDeadline, updateDeadlineStatus, updateActionStatus,
      markNotificationRead, markAllRead, updateSettings,
    }}>
      {children}
    </ProcurementContext.Provider>
  );
}

// ─── HOOK ────────────────────────────────────────────────────────────────────

export function useProcurement() {
  const ctx = useContext(ProcurementContext);
  if (!ctx) throw new Error("useProcurement must be used inside ProcurementProvider");
  return ctx;
}
