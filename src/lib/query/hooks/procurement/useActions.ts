"use client";

import { useMemo } from "react";
import { useGuarantees } from "./useGuarantees";
import { useDeadlines } from "./useDeadlines";
import { actionForGuarantee, actionForDeadline, actionForDocument } from "@/context/reducer";
import { ActionItem } from "@/types";
// using mock for documents for now since it's not integrated
import { initialProcurementState } from "@/lib/mockData";

export function useActions() {
  const { data: guarantees = [], isLoading: loadingGuarantees } = useGuarantees();
  const { data: deadlines = [], isLoading: loadingDeadlines } = useDeadlines();

  const actions = useMemo(() => {
    const computedActions: ActionItem[] = [];

    // 1. Actions from Guarantees (Mendekati Expiry / Expired)
    guarantees.forEach(guarantee => {
      const act = actionForGuarantee(guarantee);
      if (act) computedActions.push(act);
    });

    // 2. Actions from Deadlines (At Risk / Overdue)
    deadlines.forEach(deadline => {
      const act = actionForDeadline(deadline);
      if (act) computedActions.push(act);
    });

    // 3. Actions from Documents (using mock for now until Documents API is ready)
    initialProcurementState.documents.forEach(doc => {
      const act = actionForDocument(doc);
      if (act) computedActions.push(act);
    });

    return computedActions;
  }, [guarantees, deadlines]);

  return {
    data: actions,
    isLoading: loadingGuarantees || loadingDeadlines,
  };
}
