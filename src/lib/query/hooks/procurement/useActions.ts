"use client";

import { useMemo } from "react";
import { useGuarantees } from "./useGuarantees";
import { useDeadlines } from "./useDeadlines";
import { useDocuments } from "./useDocuments";
import { actionForGuarantee, actionForDeadline, actionForDocument } from "@/context/reducer";
import { ActionItem } from "@/types";

export function useActions() {
  const { data: guarantees = [], isLoading: loadingGuarantees } = useGuarantees();
  const { data: deadlines = [], isLoading: loadingDeadlines } = useDeadlines();
  const { data: documents = [], isLoading: loadingDocs } = useDocuments();

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

    // 3. Actions from Documents
    documents.forEach(doc => {
      const act = actionForDocument(doc);
      if (act) computedActions.push(act);
    });

    return computedActions;
  }, [guarantees, deadlines, documents]);

  return {
    data: actions,
    isLoading: loadingGuarantees || loadingDeadlines || loadingDocs,
  };
}
