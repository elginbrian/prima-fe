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
      }
    }
  }, [router]);

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
      {/* BLUE ACTION HEADER BANNER */}
      <section className="relative overflow-hidden rounded-2xl bg-[#0a4d8c] px-6 py-6 text-white shadow-xs sm:px-8">
        <div className="relative z-10 max-w-3xl">
          <h2 className="max-w-2xl text-xl font-semibold tracking-tight sm:text-2xl">
            Kendalikan setiap tahapan dari satu ruang kerja!
          </h2>
          <p className="mt-2 max-w-2xl text-xs sm:text-sm font-normal leading-relaxed text-blue-100">
            Daftarkan paket pekerjaan baru, unggah warkat jaminan bank, dan pantau pemenuhan tenggat waktu di setiap tahap pengadaan.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-xs sm:text-sm font-medium text-[#0a4d8c] shadow-xs transition hover:bg-blue-50 focus:outline-none"
            >
              <Plus size={15} /> Pekerjaan Baru
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard/overview/guarantees/upload")}
              className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-xs sm:text-sm font-medium text-white transition hover:bg-white/20 backdrop-blur-xs focus:outline-none"
            >
              <Upload size={15} /> Unggah Warkat Jaminan
            </button>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border-[32px] border-blue-300/15" />
        <div className="pointer-events-none absolute -bottom-24 right-24 h-48 w-48 rounded-full border-[24px] border-blue-300/10" />
      </section>

      {/* SINGLE UNIFIED NAVIGATION & SUMMARY BAR (4 Interactive Stat-Tabs) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Tab 1: Daftar Pekerjaan */}
        <button
          type="button"
          onClick={() => setActiveLens("jobs")}
          className={`flex items-start justify-between rounded-xl border p-4 text-left transition-all focus:outline-none ${
            activeLens === "jobs"
              ? "border-[#0a4d8c] bg-white ring-2 ring-blue-100/80 shadow-xs"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Daftar Pekerjaan
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-slate-800">{requests.length}</span>
              <span className="text-xs font-normal text-[#0a4d8c]">{onGoingCount} Berjalan</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              {onHoldCount} Ditunda · {cancelledCount} Batal
            </div>
          </div>
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
              activeLens === "jobs"
                ? "bg-[#0a4d8c] text-white border-[#0a4d8c]"
                : "bg-slate-50 text-slate-500 border-slate-200"
            }`}
          >
            <Briefcase size={16} />
          </div>
        </button>

        {/* Tab 2: Warkat Jaminan */}
        <button
          type="button"
          onClick={() => setActiveLens("guarantees")}
          className={`flex items-start justify-between rounded-xl border p-4 text-left transition-all focus:outline-none ${
            activeLens === "guarantees"
              ? "border-[#0a4d8c] bg-white ring-2 ring-blue-100/80 shadow-xs"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="min-w-0">
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Warkat Jaminan
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-slate-800">{guaranteesData.length}</span>
              <span className="truncate text-xs font-normal text-slate-600">
                {formatRupiah(totalGuaranteesValue)}
              </span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              {warningGuaranteesCount > 0 ? (
                <span className="text-[#0a4d8c] font-normal">
                  {warningGuaranteesCount} mendekati jatuh tempo
                </span>
              ) : (
                <span>Seluruh warkat aktif</span>
              )}
            </div>
          </div>
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
              activeLens === "guarantees"
                ? "bg-[#0a4d8c] text-white border-[#0a4d8c]"
                : "bg-slate-50 text-slate-500 border-slate-200"
            }`}
          >
            <ShieldCheck size={16} />
          </div>
        </button>

        {/* Tab 3: SLA & Tindak Lanjut */}
        <button
          type="button"
          onClick={() => setActiveLens("sla-actions")}
          className={`flex items-start justify-between rounded-xl border p-4 text-left transition-all focus:outline-none ${
            activeLens === "sla-actions"
              ? "border-[#0a4d8c] bg-white ring-2 ring-blue-100/80 shadow-xs"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              SLA & Tindak Lanjut
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-slate-800">{pendingActionsCount}</span>
              <span className="text-xs font-normal text-slate-600">Tindak Lanjut</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              {overdueOrRiskSlaCount > 0 ? (
                <span className="text-[#0a4d8c] font-normal">
                  {overdueOrRiskSlaCount} SLA perlu perhatian
                </span>
              ) : (
                <span>{deadlines.length} jadwal SLA tercatat</span>
              )}
            </div>
          </div>
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
              activeLens === "sla-actions"
                ? "bg-[#0a4d8c] text-white border-[#0a4d8c]"
                : "bg-slate-50 text-slate-500 border-slate-200"
            }`}
          >
            <Clock size={16} />
          </div>
        </button>

        {/* Tab 4: Analitik & Evaluasi */}
        <button
          type="button"
          onClick={() => setActiveLens("analytics")}
          className={`flex items-start justify-between rounded-xl border p-4 text-left transition-all focus:outline-none ${
            activeLens === "analytics"
              ? "border-[#0a4d8c] bg-white ring-2 ring-blue-100/80 shadow-xs"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Analitik & Evaluasi
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-sm font-medium text-slate-800">Performa & Bottleneck</span>
            </div>
            <div className="mt-1.5 text-[11px] text-slate-400">
              Ringkasan durasi tahapan & SLA
            </div>
          </div>
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
              activeLens === "analytics"
                ? "bg-[#0a4d8c] text-white border-[#0a4d8c]"
                : "bg-slate-50 text-slate-500 border-slate-200"
            }`}
          >
            <BarChart3 size={16} />
          </div>
        </button>
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
