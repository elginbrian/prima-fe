"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Zap,
  ArrowRight,
  CheckCircle2,
  Play,
  X,
  AlertTriangle,
  CornerDownRight,
} from "lucide-react";
import type {
  OmniAssistantResponseDto,
  OmniCommandDto,
  OmniReferencedItemDto,
} from "@/lib/api";
import {
  useUpdateDeadline,
  useEscalateDeadline,
  useSubmitRecoveryPlan,
  useUpdateOperationalStatus,
  useMoveStage,
  useCreateProcurement,
  useEvaluateSla,
} from "@/lib/query/hooks/procurement/useProcurement";
import { useCurrentUser } from "@/lib/query/hooks/auth/useCurrentUser";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";
import { getErrorMessage } from "@/lib/api/errors";
import type { DeadlineItem, ProcurementOperationalStatus, ProcurementStage } from "@/types";

interface OmniAiAssistantPanelProps {
  query: string;
  response: OmniAssistantResponseDto | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onSelectFollowup: (followupQuery: string) => void;
  onOpenSlaModal?: (deadlineId: string) => void;
  deadlines?: DeadlineItem[];
}

export function OmniAiAssistantPanel({
  query,
  response,
  isLoading,
  error,
  onClose,
  onSelectFollowup,
  onOpenSlaModal,
}: OmniAiAssistantPanelProps) {
  const router = useRouter();
  const toast = useToast();
  const { data: currentUser } = useCurrentUser();

  const updateDeadline = useUpdateDeadline();
  const escalateDeadline = useEscalateDeadline();
  const submitRecoveryPlan = useSubmitRecoveryPlan();
  const updateOperationalStatus = useUpdateOperationalStatus();
  const moveStage = useMoveStage();
  const createProcurement = useCreateProcurement();
  const evaluateSla = useEvaluateSla();

  const [isExecutingCmd, setIsExecutingCmd] = useState(false);
  const [commandExecuted, setCommandExecuted] = useState(false);

  const handleExecuteCommand = async (cmd: OmniCommandDto) => {
    if (isExecutingCmd || commandExecuted) return;
    setIsExecutingCmd(true);

    try {
      const p = cmd.params || {};

      switch (cmd.type) {
        case "NAVIGATE": {
          const url = String(p.url || "/dashboard/overview");
          router.push(url);
          setCommandExecuted(true);
          break;
        }
        case "COMPLETE_SLA": {
          const deadlineId = String(p.deadline_id || "");
          if (!deadlineId) throw new Error("ID SLA tidak ditemukan untuk perintah ini.");
          await updateDeadline.mutateAsync({
            id: deadlineId,
            payload: { status: "Selesai" },
          });
          toast.success(
            `SLA "${p.task_name || deadlineId}" berhasil ditandai Selesai.`
          );
          setCommandExecuted(true);
          break;
        }
        case "ESCALATE_SLA": {
          const deadlineId = String(p.deadline_id || "");
          if (!deadlineId) throw new Error("ID SLA tidak ditemukan untuk eskalasi.");
          const targetMgr = String(p.escalated_to || "Manager Pengadaan Korporat");
          const reason = String(
            p.reason || "Eskalasi melalui perintah AI Omni-Assistant"
          );
          await escalateDeadline.mutateAsync({
            id: deadlineId,
            payload: { escalated_to: targetMgr, reason },
          });
          toast.success(`SLA berhasil dieskalasi ke ${targetMgr}.`);
          setCommandExecuted(true);
          break;
        }
        case "SUBMIT_RECOVERY_PLAN": {
          const deadlineId = String(p.deadline_id || "");
          if (!deadlineId) throw new Error("ID SLA tidak ditemukan.");
          const planText = String(
            p.recovery_plan || "Percepatan koordinasi teknis & evaluasi paralel"
          );
          const recDate = p.recovery_date
            ? new Date(String(p.recovery_date)).toISOString()
            : new Date(Date.now() + 3 * 86400000).toISOString();
          await submitRecoveryPlan.mutateAsync({
            id: deadlineId,
            payload: {
              recovery_plan: planText,
              recovery_date: recDate,
            },
          });
          toast.success("Rencana mitigasi SLA berhasil disimpan.");
          setCommandExecuted(true);
          break;
        }
        case "UPDATE_JOB_STATUS": {
          const requestId = String(p.request_id || "");
          const status = String(
            p.status || "On Going"
          ) as ProcurementOperationalStatus;
          if (!requestId) throw new Error("ID Pekerjaan tidak ditemukan.");
          await updateOperationalStatus.mutateAsync({
            id: requestId,
            payload: {
              status,
              reason: String(
                p.reason || `Diperbarui ke ${status} melalui AI Omni-Assistant`
              ),
            },
          });
          toast.success(
            `Status operasional pekerjaan ${requestId} diubah menjadi "${status}".`
          );
          setCommandExecuted(true);
          break;
        }
        case "MOVE_JOB_STAGE": {
          const requestId = String(p.request_id || "");
          const stage = String(p.stage || "Evaluasi") as ProcurementStage;
          if (!requestId) throw new Error("ID Pekerjaan tidak ditemukan.");
          await moveStage.mutateAsync({
            id: requestId,
            payload: {
              stage,
              notes: String(
                p.notes || `Tahap dipindahkan ke ${stage} melalui AI Omni-Assistant`
              ),
            },
          });
          toast.success(
            `Tahap pekerjaan ${requestId} berhasil dipindahkan ke "${stage}".`
          );
          setCommandExecuted(true);
          break;
        }
        case "CREATE_PROCUREMENT": {
          const title = String(p.title || "Paket Pengadaan Baru");
          const amount = Number(p.amount) || 150000000;
          const deptName = String(p.department_name || "Procurement");
          const method = String(p.procurement_method || "Tender Terbuka");
          const isUrgent = Boolean(p.is_urgent);

          const res = await createProcurement.mutateAsync({
            title,
            amount,
            pic_id: currentUser?.id || "USR-ADMIN",
            pic_name: currentUser?.name || "Procurement Officer",
            fpp_id: "FPP-01",
            fpp_name: deptName,
            department_id: "DEPT-PROC",
            department_name: deptName,
            stage: "Persiapan",
            current_step: "Penyusunan RKS & Spesifikasi Teknis",
            procurement_method: method,
            is_urgent: isUrgent,
          });
          toast.success(`Pekerjaan "${title}" berhasil dibuat.`);
          setCommandExecuted(true);
          if (res.data?.id) {
            router.push(`/dashboard/overview/${encodeURIComponent(res.data.id)}`);
          }
          break;
        }
        case "EVALUATE_SLA": {
          const res = await evaluateSla.mutateAsync(undefined);
          const d = res.data;
          toast.success(
            `Sinkronisasi SLA selesai: ${d.total_evaluated} SLA diperiksa (${d.overdue} terlambat).`
          );
          setCommandExecuted(true);
          break;
        }
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Gagal menjalankan perintah AI"));
    } finally {
      setIsExecutingCmd(false);
    }
  };

  const handleClickReference = (item: OmniReferencedItemDto) => {
    if (item.category === "Target SLA" && onOpenSlaModal && item.id) {
      onOpenSlaModal(item.id);
      return;
    }
    if (item.href) {
      router.push(item.href);
    }
  };

  return (
    <div className="mt-3 w-full max-w-2xl overflow-hidden rounded-xl border border-[#0a4d8c]/25 bg-white shadow-lg animate-in fade-in slide-in-from-top-1 duration-200">
      {/* Header Bar with locked 'Cekatan' mode badge */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-[#f4f8fd] px-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#0a4d8c] text-white">
            <Sparkles size={13} />
          </div>
          <span className="truncate text-xs font-semibold text-slate-900">
            PRIMA Omni-Assistant
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full border border-[#0a4d8c]/20 bg-[#e8f2fc] px-2 py-0.5 text-[10px] font-semibold text-[#0a4d8c] shrink-0"
            title="Mode AI dikunci pada Mode Cekatan untuk respons instan"
          >
            <Zap size={10} />
            Mode Cekatan
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors"
          aria-label="Tutup panel AI"
        >
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3.5 text-left">
        {isLoading ? (
          <div className="flex items-center gap-3 py-4">
            <Spinner size="sm" />
            <div>
              <p className="text-xs font-semibold text-slate-800">
                Menganalisis data PRIMA untuk &ldquo;{query}&rdquo;...
              </p>
              <p className="text-[11px] text-slate-500">
                Memeriksa pekerjaan, hasil analisis AI, warkat jaminan, dan jadwal SLA
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50/70 p-3 text-xs text-red-700">
            <AlertTriangle size={15} className="shrink-0 mt-0.5 text-red-600" />
            <div className="flex-1">
              <p className="font-semibold">Gagal memproses permintaan AI</p>
              <p className="mt-0.5 text-[11px] text-red-600">{error}</p>
            </div>
          </div>
        ) : response ? (
          <>
            {/* Fallback notice if Cekatan stepped down to Gemma 4 backup */}
            {response.ai_fallback_notice && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-600">
                {response.ai_fallback_notice}
              </div>
            )}

            {/* Main Answer */}
            <div className="text-xs sm:text-[13px] leading-relaxed text-slate-800 whitespace-pre-line">
              {response.answer}
            </div>

            {/* Key Highlights */}
            {response.highlights && response.highlights.length > 0 && (
              <ul className="space-y-1 rounded-lg border border-slate-100 bg-slate-50/80 px-3.5 py-2.5">
                {response.highlights.map((h, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-[11px] text-slate-700"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0a4d8c]" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Actionable Command Execution Card */}
            {response.command && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#0a4d8c]/25 bg-[#f4f8fd] p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-[#0a4d8c] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                      Perintah AI
                    </span>
                    <span className="truncate text-xs font-semibold text-slate-900">
                      {response.command.label}
                    </span>
                  </div>
                  {response.command.description && (
                    <p className="mt-0.5 text-[11px] text-slate-600">
                      {response.command.description}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isExecutingCmd || commandExecuted}
                  onClick={() => handleExecuteCommand(response.command!)}
                  className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold shadow-2xs transition ${
                    commandExecuted
                      ? "border border-slate-200 bg-slate-100 text-slate-600"
                      : "bg-[#0a4d8c] text-white hover:!bg-[#083b6c]"
                  }`}
                >
                  {isExecutingCmd ? (
                    <>
                      <Spinner
                        size="xs"
                        className="border-white border-t-transparent"
                      />
                      <span>Menjalankan...</span>
                    </>
                  ) : commandExecuted ? (
                    <>
                      <CheckCircle2 size={13} />
                      <span>Berhasil Dijalankan</span>
                    </>
                  ) : (
                    <>
                      <Play size={12} />
                      <span>Jalankan Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Referenced Data Items (1-Click Navigation) */}
            {response.referenced_items &&
              response.referenced_items.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Data Terkait ({response.referenced_items.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {response.referenced_items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleClickReference(item)}
                        className="group flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-[#0a4d8c]/40 hover:bg-[#f8fbff]"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-xs font-semibold text-slate-800 group-hover:text-[#0a4d8c]">
                              {item.title}
                            </span>
                            {item.badge && (
                              <span
                                className={`shrink-0 rounded-full border px-1.5 py-0.2 text-[9px] font-medium ${
                                  item.is_urgent
                                    ? "border-red-200 bg-red-50 text-red-700"
                                    : "border-slate-200 bg-slate-100 text-slate-600"
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="truncate text-[10px] text-slate-500">
                            {item.subtitle}
                          </p>
                        </div>
                        <ArrowRight
                          size={12}
                          className="shrink-0 text-slate-400 group-hover:text-[#0a4d8c]"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

            {/* Suggested Follow-up Questions/Commands */}
            {response.suggested_followups &&
              response.suggested_followups.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2.5">
                  {response.suggested_followups.map((followup, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onSelectFollowup(followup)}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:border-[#0a4d8c]/30 hover:bg-[#e8f2fc] hover:text-[#0a4d8c]"
                    >
                      <CornerDownRight size={11} className="text-[#0a4d8c]" />
                      <span>{followup}</span>
                    </button>
                  ))}
                </div>
              )}
          </>
        ) : null}
      </div>
    </div>
  );
}
