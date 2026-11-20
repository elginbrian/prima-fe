"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Zap,
  ArrowRight,
  CheckCircle2,
  Play,
  AlertTriangle,
  CornerDownRight,
  Paperclip,
  FileSearch,
  ShieldCheck,
  Radio,
} from "lucide-react";
import {
  integrationsApi,
  type OmniAssistantResponseDto,
  type OmniCommandDto,
  type OmniReferencedItemDto,
} from "@/lib/api";
import {
  type AiChatMessage,
  getLastChatUploadedFile,
  stageFileForSmartUpload,
} from "@/lib/aiChatStore";
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
import { UserAvatar } from "@/components/ui/UserAvatar";
import { getErrorMessage } from "@/lib/api/errors";
import type {
  ProcurementOperationalStatus,
  ProcurementStage,
} from "@/types";

interface ChatMessageBubbleProps {
  message: AiChatMessage;
  userName?: string;
  userAvatarUrl?: string | null;
  onSelectFollowup: (prompt: string) => void;
  onOpenSlaModal: (deadlineId: string) => void;
  onMarkCommandExecuted: (messageId: string) => void;
  onTakeoverReplied?: (
    messageId: string,
    replyPayload: OmniAssistantResponseDto
  ) => void;
}

export function ChatMessageBubble({
  message,
  userName = "Pengguna",
  userAvatarUrl,
  onSelectFollowup,
  onOpenSlaModal,
  onMarkCommandExecuted,
  onTakeoverReplied,
}: ChatMessageBubbleProps) {
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

  const isUser = message.role === "user";
  const aiData = message.aiData;
  const commandExecuted = Boolean(message.commandExecuted);
  const isWaitingTakeover = Boolean(
    aiData?.takeover_pending && aiData?.takeover_ticket_id
  );

  // Poll takeover ticket automatically every 2.5s when waiting for External MCP Agent reply
  useEffect(() => {
    if (!isWaitingTakeover || !aiData?.takeover_ticket_id || !onTakeoverReplied)
      return;
    const ticketId = aiData.takeover_ticket_id;

    const timer = setInterval(async () => {
      try {
        const res = await integrationsApi.getTakeoverTicket(ticketId);
        if (res.data?.status === "REPLIED" && res.data?.response_payload) {
          onTakeoverReplied(message.id, res.data.response_payload);
        }
      } catch {
        // ignore transient polling error
      }
    }, 2500);

    return () => clearInterval(timer);
  }, [
    isWaitingTakeover,
    aiData?.takeover_ticket_id,
    message.id,
    onTakeoverReplied,
  ]);

  const handleExecuteCommand = async (cmd: OmniCommandDto) => {
    if (isExecutingCmd || commandExecuted) return;
    setIsExecutingCmd(true);

    try {
      const p = cmd.params || {};

      switch (cmd.type) {
        case "NAVIGATE": {
          const url = String(p.url || "/dashboard/overview");
          onMarkCommandExecuted(message.id);
          router.push(url);
          break;
        }
        case "COMPLETE_SLA": {
          const deadlineId = String(p.deadline_id || "");
          if (!deadlineId)
            throw new Error("ID SLA tidak ditemukan untuk perintah ini.");
          await updateDeadline.mutateAsync({
            id: deadlineId,
            payload: { status: "Selesai" },
          });
          toast.success(
            `SLA "${p.task_name || deadlineId}" berhasil ditandai Selesai.`
          );
          onMarkCommandExecuted(message.id);
          break;
        }
        case "ESCALATE_SLA": {
          const deadlineId = String(p.deadline_id || "");
          if (!deadlineId)
            throw new Error("ID SLA tidak ditemukan untuk eskalasi.");
          const targetMgr = String(
            p.escalated_to || "Manager Pengadaan Korporat"
          );
          const reason = String(
            p.reason || "Eskalasi melalui perintah Diskusi AI PRIMA"
          );
          await escalateDeadline.mutateAsync({
            id: deadlineId,
            payload: { escalated_to: targetMgr, reason },
          });
          toast.success(`SLA berhasil dieskalasi ke ${targetMgr}.`);
          onMarkCommandExecuted(message.id);
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
          onMarkCommandExecuted(message.id);
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
                p.reason || `Diperbarui ke ${status} melalui Diskusi AI PRIMA`
              ),
            },
          });
          toast.success(
            `Status operasional pekerjaan ${requestId} diubah menjadi "${status}".`
          );
          onMarkCommandExecuted(message.id);
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
                p.notes || `Tahap dipindahkan ke ${stage} melalui Diskusi AI`
              ),
            },
          });
          toast.success(
            `Tahap pekerjaan ${requestId} berhasil dipindahkan ke "${stage}".`
          );
          onMarkCommandExecuted(message.id);
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
          onMarkCommandExecuted(message.id);
          if (res.data?.id) {
            router.push(
              `/dashboard/overview/${encodeURIComponent(res.data.id)}`
            );
          }
          break;
        }
        case "EVALUATE_SLA": {
          const res = await evaluateSla.mutateAsync(undefined);
          const d = res.data;
          toast.success(
            `Sinkronisasi SLA selesai: ${d.total_evaluated} SLA diperiksa (${d.overdue} terlambat).`
          );
          onMarkCommandExecuted(message.id);
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
    if (item.category === "Target SLA" && item.id) {
      onOpenSlaModal(item.id);
      return;
    }
    if (item.href) {
      router.push(item.href);
    }
  };

  if (isUser) {
    const canRouteFile =
      Boolean(message.attachment) &&
      getLastChatUploadedFile()?.name === message.attachment?.name;

    const handleSmartRouteToValidation = () => {
      const f = getLastChatUploadedFile();
      if (!f) return;
      stageFileForSmartUpload(f);
      router.push("/dashboard/documents/upload?fromChat=1");
    };

    const handleSmartRouteToGuarantee = () => {
      const f = getLastChatUploadedFile();
      if (!f) return;
      stageFileForSmartUpload(f);
      router.push("/dashboard/overview/guarantees/upload?fromChat=1");
    };

    return (
      <div className="flex items-start justify-end gap-3">
        <div className="max-w-[82%] sm:max-w-[75%] space-y-1.5">
          <div className="rounded-2xl rounded-tr-xs bg-[#0a4d8c] px-4 py-3 text-xs sm:text-[13px] leading-relaxed text-white shadow-2xs space-y-2">
            {message.attachment && (
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1 text-[11px] font-medium text-blue-50">
                <Paperclip size={12} className="shrink-0" />
                <span className="truncate max-w-[220px]">
                  {message.attachment.name}
                </span>
              </div>
            )}
            <p className="whitespace-pre-line">{message.content}</p>
          </div>

          {/* Smart Attachment Routing Buttons (Prioritas #4) */}
          {canRouteFile && (
            <div className="flex flex-wrap items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={handleSmartRouteToValidation}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-[#0a4d8c] shadow-2xs transition hover:border-[#0a4d8c]/40 hover:bg-[#f4f8fd]"
                title="Bawa berkas ini ke form Validasi Checklist AI tanpa perlu upload ulang"
              >
                <FileSearch size={11} />
                <span>Validasi Checklist Resmi</span>
              </button>
              <button
                type="button"
                onClick={handleSmartRouteToGuarantee}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-700 shadow-2xs transition hover:border-[#0a4d8c]/40 hover:bg-[#f4f8fd] hover:text-[#0a4d8c]"
                title="Bawa berkas ini ke form OCR Warkat Jaminan tanpa perlu upload ulang"
              >
                <ShieldCheck size={11} />
                <span>Simpan sbg Warkat Jaminan</span>
              </button>
            </div>
          )}
        </div>
        <div className="shrink-0 mt-0.5">
          <UserAvatar name={userName} avatarUrl={userAvatarUrl} size="sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      {/* AI Avatar */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#0a4d8c] text-white shadow-2xs mt-0.5">
        <Sparkles size={15} />
      </div>

      {/* Assistant Bubble */}
      <div className="min-w-0 flex-1 max-w-[90%] sm:max-w-[82%] rounded-2xl rounded-tl-xs border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
        {/* Header Meta */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-900">
              {aiData?.ai_tier_used === "mcp_takeover"
                ? aiData.ai_model_used || "External MCP Agent"
                : aiData?.ai_tier_used === "external"
                ? `External AI (${aiData.ai_model_used || "Custom"})`
                : "PRIMA AI"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-[#0a4d8c]/20 bg-[#e8f2fc] px-2 py-0.5 text-[10px] font-semibold text-[#0a4d8c]">
              {aiData?.ai_tier_used === "mcp_takeover" ? (
                <>
                  <Radio size={9} />
                  <span>Agent Takeover</span>
                </>
              ) : (
                <>
                  <Zap size={9} />
                  <span>
                    {aiData?.ai_tier_used === "external"
                      ? "External Brain"
                      : "Mode Cekatan"}
                  </span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Loading State */}
        {message.status === "sending" ? (
          <div className="flex items-center gap-2.5 py-2">
            <Spinner size="xs" />
            <span className="text-xs text-slate-500">
              Menganalisis data pekerjaan, dokumen, warkat, dan SLA...
            </span>
          </div>
        ) : message.status === "error" ? (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50/70 p-3 text-xs text-red-700">
            <AlertTriangle size={14} className="shrink-0 mt-0.5 text-red-600" />
            <div>
              <p className="font-semibold">Gagal memproses jawaban AI</p>
              <p className="mt-0.5 text-[11px] text-red-600">
                {message.errorMessage || "Terjadi gangguan koneksi ke layanan AI."}
              </p>
            </div>
          </div>
        ) : (
          <>
            {aiData?.ai_fallback_notice && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-600">
                {aiData.ai_fallback_notice}
              </div>
            )}

            {isWaitingTakeover && (
              <div className="flex items-center gap-2.5 rounded-xl border border-[#0a4d8c]/25 bg-[#f4f8fd] px-3.5 py-2.5 text-xs text-[#0a4d8c]">
                <Spinner size="xs" />
                <span className="font-medium">
                  Menunggu balasan real-time dari External Agent (Tiket{" "}
                  <code className="font-mono font-bold">
                    {aiData?.takeover_ticket_id}
                  </code>
                  )...
                </span>
              </div>
            )}

            {/* Main Answer Text */}
            <div className="text-xs sm:text-[13px] leading-relaxed text-slate-800 whitespace-pre-line">
              {aiData?.answer || message.content}
            </div>

            {/* Key Highlights */}
            {aiData?.highlights && aiData.highlights.length > 0 && (
              <ul className="space-y-1 rounded-xl border border-slate-100 bg-slate-50/80 px-3.5 py-2.5">
                {aiData.highlights.map((h, i) => (
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
            {aiData?.command && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#0a4d8c]/25 bg-[#f4f8fd] p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-[#0a4d8c] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                      Perintah AI
                    </span>
                    <span className="truncate text-xs font-semibold text-slate-900">
                      {aiData.command.label}
                    </span>
                  </div>
                  {aiData.command.description && (
                    <p className="mt-0.5 text-[11px] text-slate-600">
                      {aiData.command.description}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isExecutingCmd || commandExecuted}
                  onClick={() => handleExecuteCommand(aiData.command!)}
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

            {/* Referenced Data Items */}
            {aiData?.referenced_items && aiData.referenced_items.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Data Terkait ({aiData.referenced_items.length})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {aiData.referenced_items.map((item) => (
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

            {/* Suggested Follow-up Chips */}
            {aiData?.suggested_followups &&
              aiData.suggested_followups.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2.5">
                  {aiData.suggested_followups.map((followup, idx) => (
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
        )}
      </div>
    </div>
  );
}
