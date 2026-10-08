"use client";

import { useState, useMemo } from "react";
import { TrackerItem, TrackerStage } from "./types";
import { useRouter } from "next/navigation";
import type { ProcurementOperationalStatus } from "@/types";
import { getDeadlineTiming } from "@/lib/deadlineUtils";
import { TrackerHeader } from "./TrackerHeader";
import { TrackerList } from "./TrackerList";
import { TrackerKanbanBoard } from "./TrackerKanbanBoard";
import { TrackerDeadlines } from "./TrackerDeadlines";
import { TrackerDetailModal } from "./TrackerDetailModal";
import { TrackerStatsPanel } from "./TrackerStatsPanel";
import { DeadlineEditor, DeadlineCreator, AddRequestModal } from "./TrackerModals";
import {
  useProcurements,
  useCreateProcurement,
  useMoveStep,
  useUpdateOperationalStatus,
  useDeadlines,
  useDocuments,
  useUpdateDeadline,
} from "@/lib/query/hooks/procurement/useProcurement";
import { useGuarantees } from "@/lib/query/hooks/procurement/useGuarantees";
import { useCurrentUser } from "@/lib/query/hooks/auth/useCurrentUser";
import { useSettings } from "@/lib/query/hooks/settings/useSettings";

export default function TrackerPage() {
  const router = useRouter();

  // 1. Fetch data from BE via React Query hooks
  const { data: procurementsData, isLoading: isLoadingProcurements } = useProcurements();
  const { data: documentsData = [] } = useDocuments();
  const { data: deadlinesData = [] } = useDeadlines();
  const { data: guaranteesData = [] } = useGuarantees();
  const { data: currentUser } = useCurrentUser();
  const { data: settings } = useSettings();

  const slaWarningDays = settings?.slaWarningDays ?? 3;

  // 2. Setup mutations
  const createProcurement = useCreateProcurement();
  const updateStatus = useUpdateOperationalStatus();
  const updateStep = useMoveStep();
  const editDeadline = useUpdateDeadline();
  
  // Safe defaults while loading
  const requests = procurementsData ?? [];
  const deadlinesList = deadlinesData ?? [];

  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [operationalStatusFilter, setOperationalStatusFilter] = useState<ProcurementOperationalStatus | "All">("All");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [expandedRelatedId, setExpandedRelatedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDeadlineId, setEditingDeadlineId] = useState<string | null>(null);
  const [addingDeadlineRequestId, setAddingDeadlineRequestId] = useState<string | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [showFullTimeline, setShowFullTimeline] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [statusReasonDraft, setStatusReasonDraft] = useState("");

  const openRequestDetail = (requestId: string) => {
    setShowFullTimeline(false);
    setStatusReasonDraft(requests.find(request => request.id === requestId)?.operationalStatusReason ?? "");
    setSelectedRequestId(requestId);
  };

  const timeStatusMap = useMemo(() => {
    const map: Record<string, string> = {};
    deadlinesList.forEach(d => {
      const prev = map[d.requestId];
      const timing = getDeadlineTiming(d, slaWarningDays);
      const rank = { "Overdue": 3, "At Risk": 2, "On Track": 1, "Selesai": 0 } as const;
      if (!prev || rank[timing.status as keyof typeof rank] > rank[prev as keyof typeof rank]) {
        map[d.requestId] = timing.status;
      }
    });
    return map;
  }, [deadlinesList, slaWarningDays]);

  const items: TrackerItem[] = useMemo(() => requests.map(r => ({
    id: r.id,
    title: r.title,
    pic: r.pic,
    amount: r.amount,
    stage: r.stage,
    operationalStatus: r.operationalStatus,
    currentStep: r.currentStep,
    department: r.department,
    stageStartedAt: r.stageStartedAt,
    isUrgent: r.isUrgent,
  })), [requests]);

  const deadlines = useMemo(() => deadlinesList.map(deadline => ({
    ...deadline,
    ...getDeadlineTiming(deadline, slaWarningDays),
  })), [deadlinesList, slaWarningDays]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (item.pic?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDept = departmentFilter === "All" || item.department.name === departmentFilter;
      const matchesOperationalStatus = operationalStatusFilter === "All" || item.operationalStatus === operationalStatusFilter;
      
      return matchesSearch && matchesDept && matchesOperationalStatus;
    });
  }, [items, searchQuery, departmentFilter, operationalStatusFilter]);

  const itemsByStage = useMemo(() => {
    const grouped = { "On Going": [], "On Hold": [], "Batal": [] } as Record<string, TrackerItem[]>;
    filteredItems.forEach(item => {
      if (!grouped[item.operationalStatus]) {
        grouped[item.operationalStatus] = [];
      }
      grouped[item.operationalStatus].push(item);
    });
    return grouped as Record<TrackerStage, TrackerItem[]>;
  }, [filteredItems]);

  const totalItemsCount = filteredItems.length;
  const onGoingCount = filteredItems.filter(item => item.operationalStatus === "On Going").length;
  const onHoldCount = filteredItems.filter(item => item.operationalStatus === "On Hold").length;
  const cancelledCount = filteredItems.filter(item => item.operationalStatus === "Batal").length;

  const documentsMap = useMemo(() => {
    const map: Record<string, { total: number; valid: number }> = {};
    requests.forEach(req => {
      const docs = documentsData.filter(d => d.requestId === req.id);
      map[req.id] = {
        total: docs.length,
        valid: docs.filter(d => d.status === "Lulus Verifikasi").length
      };
    });
    return map;
  }, [requests, documentsData]);
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("itemId", id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: TrackerStage) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("itemId");
    updateStatus.mutate({ id, payload: { status } });
  };

  return (
    <div className="space-y-6 pb-12">
      <TrackerHeader 
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        departmentFilter={departmentFilter} setDepartmentFilter={setDepartmentFilter}
        operationalStatusFilter={operationalStatusFilter} setOperationalStatusFilter={setOperationalStatusFilter}
        viewMode={viewMode} setViewMode={setViewMode}
      />

      {viewMode === "list" && (
        <div className="grid gap-5" style={{ gridTemplateColumns: "280px minmax(0, 1fr)" }}>
          {/* Stats panel — same size as kanban column */}
          <div className="self-start">
            <TrackerStatsPanel
              totalItemsCount={totalItemsCount}
              onGoingCount={onGoingCount}
              onHoldCount={onHoldCount}
              cancelledCount={cancelledCount}
              onAddRequest={() => setShowAddModal(true)}
            />
          </div>
          {/* List table — fills grid cell, scrolls horizontally inside */}
          <div className="min-w-0">
            <TrackerList 
              filteredItems={filteredItems} 
              timeStatusMap={timeStatusMap} 
              documentsMap={documentsMap}
              openRequestDetail={openRequestDetail} 
            />
          </div>
        </div>
      )}

      {viewMode === "kanban" && (
        <TrackerKanbanBoard 
          totalItemsCount={totalItemsCount} onGoingCount={onGoingCount} onHoldCount={onHoldCount} cancelledCount={cancelledCount}
          itemsByStage={itemsByStage} timeStatusMap={timeStatusMap}
          expandedCardId={expandedCardId} setExpandedCardId={setExpandedCardId}
          handleDragStart={handleDragStart} handleDragOver={handleDragOver} handleDrop={handleDrop}
          openRequestDetail={openRequestDetail}
          onAddRequest={() => setShowAddModal(true)}
        />
      )}

      <TrackerDeadlines 
        deadlines={deadlines} requests={requests}
        openRequestDetail={openRequestDetail} setEditingDeadlineId={setEditingDeadlineId}
      />

      {editingDeadlineId && (() => {
        const deadline = deadlinesList.find(item => item.id === editingDeadlineId);
        if (!deadline) return null;
        return <DeadlineEditor deadline={deadline} onClose={() => setEditingDeadlineId(null)} onSave={(changes) => { editDeadline.mutate({ id: deadline.id, payload: changes }); setEditingDeadlineId(null); }} />;
      })()}

      {addingDeadlineRequestId && (() => {
        const request = requests.find(item => item.id === addingDeadlineRequestId);
        if (!request) return null;
        return <DeadlineCreator requestId={request.id} pic={request.pic} department={request.department} onClose={() => setAddingDeadlineRequestId(null)} onSave={(deadline) => { /* TODO: useCreateDeadline */ setAddingDeadlineRequestId(null); }} />;
      })()}

      {selectedRequestId && (() => {
        const docs = documentsData.filter(d => d.requestId === selectedRequestId);
        const guars = guaranteesData.filter(g => g.requestId === selectedRequestId);
        const slas = deadlinesList.filter(d => d.requestId === selectedRequestId).map(deadline => ({ ...deadline, ...getDeadlineTiming(deadline, slaWarningDays) }));
        const history: import("@/types").HistoryItem[] = []; // TODO: implement useHistory hook if needed
        const request = requests.find(r => r.id === selectedRequestId);
        const milestones: import("@/types").ProcurementMilestone[] = []; // Fetched directly inside TrackerDetailModal
        
        return <TrackerDetailModal 
          selectedRequestId={selectedRequestId} setSelectedRequestId={setSelectedRequestId}
          request={request} milestones={milestones} docs={docs} guars={guars} slas={slas} history={history}
          showFullTimeline={showFullTimeline} setShowFullTimeline={setShowFullTimeline}
          statusReasonDraft={statusReasonDraft} setStatusReasonDraft={setStatusReasonDraft}
          moveRequestStep={(id, step) => updateStep.mutate({ id, payload: { step } })} 
          updateRequestOperationalStatus={(id, status, reason) => updateStatus.mutate({ id, payload: { status, reason } })}
          expandedRelatedId={expandedRelatedId} setExpandedRelatedId={setExpandedRelatedId}
          router={router} setAddingDeadlineRequestId={setAddingDeadlineRequestId} setEditingDeadlineId={setEditingDeadlineId}
        />;
      })()}

      {showAddModal && <AddRequestModal onClose={() => setShowAddModal(false)} onSave={(req) => { createProcurement.mutate(req as any); setShowAddModal(false); }} />}
    </div>
  );
}
