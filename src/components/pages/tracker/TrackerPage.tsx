"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Briefcase,
  ShieldCheck,
  Clock,
  BarChart3,
  AlertTriangle,
  Plus,
  Upload,
  Download,
} from "lucide-react";
import { TrackerItem, TrackerStage } from "./types";
import { useRouter } from "next/navigation";
import type { ProcurementOperationalStatus } from "@/types";
import { getDeadlineTiming } from "@/lib/deadlineUtils";
import { formatRupiah } from "@/lib/utils";
import { TrackerHeader } from "./TrackerHeader";
import { TrackerList } from "./TrackerList";
import { TrackerKanbanBoard } from "./TrackerKanbanBoard";
import { TrackerAnalyticsView } from "./TrackerAnalyticsView";
import { TrackerGuaranteesView } from "./TrackerGuaranteesView";
import { TrackerSlaActionsView } from "./TrackerSlaActionsView";
import { DeadlineEditor, AddRequestModal } from "./TrackerModals";
import {
  useProcurements,
  useCreateProcurement,
  useUpdateOperationalStatus,
  useDeadlines,
  useDocuments,
  useUpdateDeadline,
} from "@/lib/query/hooks/procurement/useProcurement";
import { useActions } from "@/lib/query/hooks/procurement/useActions";
import { useToast } from "@/components/ui/Toast";
import { KanbanSkeleton, TableSkeleton } from "@/components/ui";
import { getErrorMessage } from "@/lib/api/errors";
import {
  requestFormToCreatePayload,
  deadlineChangesToUpdatePayload,
} from "@/lib/adapters/procurement.mutations";
import { useGuarantees } from "@/lib/query/hooks/procurement/useGuarantees";
import { useSettings } from "@/lib/query/hooks/settings/useSettings";
import { exportProcurementsToCsv } from "@/lib/exportUtils";

type WorkspaceLens = "jobs" | "guarantees" | "sla-actions" | "analytics";

export default function TrackerPage() {
  const router = useRouter();

  const { data: procurementsData, isLoading: isLoadingProcurements } = useProcurements();
  const { data: documentsData = [] } = useDocuments();
  const { data: deadlinesData = [] } = useDeadlines();
  const { data: guaranteesData = [], isLoading: isLoadingGuarantees } = useGuarantees();
  const { data: actionsData = [] } = useActions();
  const { data: settings } = useSettings();

  const slaWarningDays = settings?.slaWarningDays ?? 3;

  const createProcurement = useCreateProcurement();
  const updateStatus = useUpdateOperationalStatus();
  const editDeadline = useUpdateDeadline();
  const toast = useToast();

  const requests = procurementsData ?? [];
  const deadlinesList = deadlinesData ?? [];

  const [activeLens, setActiveLens] = useState<WorkspaceLens>("jobs");
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [operationalStatusFilter, setOperationalStatusFilter] = useState<
    ProcurementOperationalStatus | "All"
  >("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDeadlineId, setEditingDeadlineId] = useState<string | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"kanban" | "list" | "analytics">("list");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const syncFromUrl = () => {
        const params = new URLSearchParams(window.location.search);
        const reqIdParam = params.get("requestId");
        if (reqIdParam) {
          router.replace(`/dashboard/overview/${encodeURIComponent(reqIdParam)}`);
          return;
        }
        const lensParam = params.get("lens");
        if (
          lensParam === "guarantees" ||
          lensParam === "sla-actions" ||
          lensParam === "analytics" ||
          lensParam === "jobs"
        ) {
          setActiveLens(lensParam);
        } else {
          setActiveLens("jobs");
        }
      };

      const handleLensEvent = (evt: Event) => {
        const custom = evt as CustomEvent<WorkspaceLens>;
        if (custom.detail) {
          setActiveLens(custom.detail);
        }
      };

      syncFromUrl();
      window.addEventListener("prima-lens-change", handleLensEvent);
      window.addEventListener("popstate", syncFromUrl);
      return () => {
        window.removeEventListener("prima-lens-change", handleLensEvent);
        window.removeEventListener("popstate", syncFromUrl);
      };
    }
  }, [router]);

  const handleSelectLens = (lens: WorkspaceLens) => {
    setActiveLens(lens);
    if (typeof window !== "undefined") {
      const nextUrl =
        lens === "jobs"
          ? "/dashboard/overview"
          : `/dashboard/overview?lens=${encodeURIComponent(lens)}`;
      window.history.replaceState(null, "", nextUrl);
      window.dispatchEvent(new CustomEvent("prima-lens-change", { detail: lens }));
    }
  };

  const openRequestDetail = (requestId: string) => {
    router.push(`/dashboard/overview/${encodeURIComponent(requestId)}`);
  };

  const timeStatusMap = useMemo(() => {
    const map: Record<string, string> = {};
    deadlinesList.forEach((d) => {
      const prev = map[d.requestId];
      const timing = getDeadlineTiming(d, slaWarningDays);
      const rank = { Overdue: 3, "At Risk": 2, "On Track": 1, Selesai: 0 } as const;
      if (!prev || rank[timing.status as keyof typeof rank] > rank[prev as keyof typeof rank]) {
        map[d.requestId] = timing.status;
      }
    });
    return map;
  }, [deadlinesList, slaWarningDays]);

  const items: TrackerItem[] = useMemo(
    () =>
      requests.map((r) => ({
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
      })),
    [requests]
  );

  const deadlines = useMemo(
    () =>
      deadlinesList.map((deadline) => ({
        ...deadline,
        ...getDeadlineTiming(deadline, slaWarningDays),
      })),
    [deadlinesList, slaWarningDays]
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.pic?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDept = departmentFilter === "All" || item.department.name === departmentFilter;
      const matchesOperationalStatus =
        operationalStatusFilter === "All" || item.operationalStatus === operationalStatusFilter;

      return matchesSearch && matchesDept && matchesOperationalStatus;
    });
  }, [items, searchQuery, departmentFilter, operationalStatusFilter]);

  const itemsByStage = useMemo(() => {
    const grouped = { "On Going": [], "On Hold": [], Batal: [] } as Record<string, TrackerItem[]>;
    filteredItems.forEach((item) => {
      if (!grouped[item.operationalStatus]) {
        grouped[item.operationalStatus] = [];
      }
      grouped[item.operationalStatus].push(item);
    });
    return grouped as Record<TrackerStage, TrackerItem[]>;
  }, [filteredItems]);

  const totalItemsCount = filteredItems.length;
  const onGoingCount = requests.filter((item) => item.operationalStatus === "On Going").length;
  const onHoldCount = requests.filter((item) => item.operationalStatus === "On Hold").length;
  const cancelledCount = requests.filter((item) => item.operationalStatus === "Batal").length;

  const totalGuaranteesValue = useMemo(
    () => guaranteesData.reduce((sum, g) => sum + (g.value || 0), 0),
    [guaranteesData]
  );
  const warningGuaranteesCount = useMemo(
    () =>
      guaranteesData.filter(
        (g) =>
          g.status === "Mendekati Expiry" ||
          g.status === "Expired" ||
          g.status === "Klaim Diajukan"
      ).length,
    [guaranteesData]
  );
  const overdueOrRiskSlaCount = useMemo(
    () => deadlines.filter((d) => d.status === "Overdue" || d.status === "At Risk").length,
    [deadlines]
  );
  const pendingActionsCount = useMemo(
    () => actionsData.filter((a) => a.status === "Pending").length,
    [actionsData]
  );

  const documentsMap = useMemo(() => {
    const map: Record<string, { total: number; valid: number }> = {};
    requests.forEach((req) => {
      const docs = documentsData.filter((d) => d.requestId === req.id);
      map[req.id] = {
        total: docs.length,
        valid: docs.filter((d) => d.status === "Lulus Verifikasi").length,
      };
    });
    return map;
  }, [requests, documentsData]);

  const guaranteesMap = useMemo(() => {
    const map: Record<string, { total: number; active: number; warning: number }> = {};
    requests.forEach((req) => {
      const guars = guaranteesData.filter((g) => g.requestId === req.id);
      map[req.id] = {
        total: guars.length,
        active: guars.filter((g) => g.status === "Aktif").length,
        warning: guars.filter(
          (g) =>
            g.status === "Mendekati Expiry" ||
            g.status === "Expired" ||
            g.status === "Klaim Diajukan"
        ).length,
      };
    });
    return map;
  }, [requests, guaranteesData]);

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
    <div className="space-y-4 pb-12">
      {/* BEAN-STYLE MODULE TABS & PRIMARY ACTIONS BAR (Zero overflow) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xs">
          <button
            type="button"
            onClick={() => handleSelectLens("jobs")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-all focus:outline-none ${
              activeLens === "jobs"
                ? "bg-[#0a4d8c] text-white shadow-xs"
                : "text-slate-600 hover:bg-[#eaf3ff] hover:text-[#0a4d8c]"
            }`}
          >
            <Briefcase size={14} />
            <span>Daftar Pekerjaan</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${
                activeLens === "jobs"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {requests.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectLens("guarantees")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-all focus:outline-none ${
              activeLens === "guarantees"
                ? "bg-[#0a4d8c] text-white shadow-xs"
                : "text-slate-600 hover:bg-[#eaf3ff] hover:text-[#0a4d8c]"
            }`}
          >
            <ShieldCheck size={14} />
            <span>Warkat Jaminan</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${
                activeLens === "guarantees"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {guaranteesData.length}
            </span>
            {warningGuaranteesCount > 0 && (
              <span
                title={`${warningGuaranteesCount} warkat mendekati jatuh tempo`}
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                  activeLens === "guarantees"
                    ? "bg-white text-[#0a4d8c]"
                    : "bg-[#e8f2fc] text-[#0a4d8c] border border-[#0a4d8c]/20"
                }`}
              >
                {warningGuaranteesCount}!
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSelectLens("sla-actions")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-all focus:outline-none ${
              activeLens === "sla-actions"
                ? "bg-[#0a4d8c] text-white shadow-xs"
                : "text-slate-600 hover:bg-[#eaf3ff] hover:text-[#0a4d8c]"
            }`}
          >
            <Clock size={14} />
            <span>SLA &amp; Tindak Lanjut</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${
                activeLens === "sla-actions"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {pendingActionsCount}
            </span>
            {overdueOrRiskSlaCount > 0 && (
              <span
                title={`${overdueOrRiskSlaCount} SLA perlu perhatian`}
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                  activeLens === "sla-actions"
                    ? "bg-white text-[#0a4d8c]"
                    : "bg-[#e8f2fc] text-[#0a4d8c] border border-[#0a4d8c]/20"
                }`}
              >
                {overdueOrRiskSlaCount}!
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSelectLens("analytics")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-all focus:outline-none ${
              activeLens === "analytics"
                ? "bg-[#0a4d8c] text-white shadow-xs"
                : "text-slate-600 hover:bg-[#eaf3ff] hover:text-[#0a4d8c]"
            }`}
          >
            <BarChart3 size={14} />
            <span>Analitik &amp; Performa</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => router.push("/dashboard/overview/guarantees/upload")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition hover:border-[#0a4d8c] hover:text-[#0a4d8c] focus:outline-none"
          >
            <Upload size={14} className="text-[#0a4d8c]" />
            <span>Unggah Warkat Jaminan</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a4d8c] px-4 py-2 text-xs font-medium text-white shadow-2xs transition hover:bg-[#083b6c] focus:outline-none"
          >
            <Plus size={14} />
            <span>Pekerjaan Baru</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: DAFTAR PEKERJAAN (FULL-WIDTH TABLE OR CLEAN KANBAN) */}
      {activeLens === "jobs" && (
        <div className="space-y-4">
          <TrackerHeader
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            departmentFilter={departmentFilter}
            setDepartmentFilter={setDepartmentFilter}
            operationalStatusFilter={operationalStatusFilter}
            setOperationalStatusFilter={setOperationalStatusFilter}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onExport={() => exportProcurementsToCsv(requests)}
          />

          {viewMode === "list" ? (
            isLoadingProcurements ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <TableSkeleton rows={5} columns={7} showCardHeader />
              </div>
            ) : (
              <TrackerList
                filteredItems={filteredItems}
                timeStatusMap={timeStatusMap}
                documentsMap={documentsMap}
                guaranteesMap={guaranteesMap}
                openRequestDetail={openRequestDetail}
              />
            )
          ) : isLoadingProcurements ? (
            <KanbanSkeleton />
          ) : (
            <TrackerKanbanBoard
              totalItemsCount={totalItemsCount}
              onGoingCount={onGoingCount}
              onHoldCount={onHoldCount}
              cancelledCount={cancelledCount}
              itemsByStage={itemsByStage}
              timeStatusMap={timeStatusMap}
              documentsMap={documentsMap}
              guaranteesMap={guaranteesMap}
              expandedCardId={expandedCardId}
              setExpandedCardId={setExpandedCardId}
              handleDragStart={handleDragStart}
              handleDragOver={handleDragOver}
              handleDrop={handleDrop}
              openRequestDetail={openRequestDetail}
              onAddRequest={() => setShowAddModal(true)}
            />
          )}
        </div>
      )}

      {/* VIEW 2: WARKAT JAMINAN */}
      {activeLens === "guarantees" && (
        <TrackerGuaranteesView
          requests={requests}
          guarantees={guaranteesData}
          isLoading={isLoadingGuarantees || isLoadingProcurements}
          globalSearchQuery={searchQuery}
          departmentFilter={departmentFilter}
          openRequestDetail={openRequestDetail}
        />
      )}

      {/* VIEW 3: SLA & TINDAK LANJUT */}
      {activeLens === "sla-actions" && (
        <TrackerSlaActionsView
          deadlines={deadlines}
          requests={requests}
          openRequestDetail={openRequestDetail}
          setEditingDeadlineId={setEditingDeadlineId}
          isLoadingDeadlines={isLoadingProcurements}
        />
      )}

      {/* VIEW 4: ANALITIK & EVALUASI */}
      {activeLens === "analytics" && <TrackerAnalyticsView />}

      {/* SHARED MODALS */}
      {editingDeadlineId &&
        (() => {
          const deadline = deadlinesList.find((item) => item.id === editingDeadlineId);
          if (!deadline) return null;
          return (
            <DeadlineEditor
              deadline={deadline}
              isSaving={editDeadline.isPending}
              errorMessage={editDeadline.isError ? getErrorMessage(editDeadline.error) : null}
              onClose={() => {
                editDeadline.reset();
                setEditingDeadlineId(null);
              }}
              onSave={(changes) =>
                editDeadline.mutate(
                  { id: deadline.id, payload: deadlineChangesToUpdatePayload(changes) },
                  {
                    onSuccess: () => {
                      toast.success("Target SLA berhasil diperbarui.");
                      setEditingDeadlineId(null);
                    },
                  }
                )
              }
            />
          );
        })()}

      {showAddModal && (
        <AddRequestModal
          isSaving={createProcurement.isPending}
          errorMessage={createProcurement.isError ? getErrorMessage(createProcurement.error) : null}
          onClose={() => {
            createProcurement.reset();
            setShowAddModal(false);
          }}
          onSave={(values) =>
            createProcurement.mutate(requestFormToCreatePayload(values), {
              onSuccess: (created) => {
                toast.success("Pekerjaan baru berhasil ditambahkan.");
                setShowAddModal(false);
                if (created?.data?.id) {
                  router.push(`/dashboard/overview/${encodeURIComponent(created.data.id)}`);
                }
              },
            })
          }
        />
      )}
    </div>
  );
}
