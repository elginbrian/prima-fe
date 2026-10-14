import { HistoryItem, GuaranteeItem, ActionItem, DeadlineItem, DocumentItem } from "@/types";

export function historyItem(
  requestId: string,
  category: HistoryItem["category"],
  title: string,
  description: string
): HistoryItem {
  return {
    id: `HIST-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    requestId,
    category,
    title,
    description,
    createdAt: new Date().toISOString(),
  };
}

export function actionForDocument(doc: DocumentItem): ActionItem | null {
  if (doc.status === "Lulus Verifikasi") return null;

  const isActionNeeded = doc.status === "Catatan Procurement" || doc.status === "Tindak Lanjut FPP";
  if (!isActionNeeded) return null;

  return {
    id: `ACT-DOC-${doc.id}`,
    requestId: doc.requestId,
    referenceId: doc.id,
    title:
      doc.status === "Tindak Lanjut FPP"
        ? `Tindak Lanjut Dokumen: ${doc.name}`
        : `Catatan Dokumen: ${doc.name}`,
    source: "Dokumen",
    priority: doc.status === "Tindak Lanjut FPP" ? "High" : "Medium",
    dateAdded: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0], // 2 days
    description:
      doc.nextAction ??
      `Terdapat temuan pada dokumen ${doc.name} yang perlu segera ditindaklanjuti.`,
    assignee: doc.pic,
    status: "Pending",
    actionType: "Follow Up",
  };
}

export function actionForGuarantee(guarantee: GuaranteeItem): ActionItem | null {
  if (guarantee.status === "Aktif" && !guarantee.nextAction) return null;

  const isExpired = guarantee.status === "Expired";
  return {
    id: `ACT-GUAR-${guarantee.id}`,
    requestId: guarantee.requestId,
    referenceId: guarantee.id,
    title: isExpired
      ? `Eskalasi Jaminan Expired: ${guarantee.referenceNo}`
      : `Tindak Lanjut Jaminan: ${guarantee.referenceNo}`,
    source: "Jaminan",
    priority: isExpired ? "High" : "Medium",
    dateAdded: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + (isExpired ? 86400000 : 3 * 86400000)).toISOString().split("T")[0],
    description:
      guarantee.nextAction ??
      `Pantau jaminan ${guarantee.referenceNo} dan koordinasikan tindak lanjut sebelum expiry.`,
    assignee: guarantee.pic,
    status: "Pending",
    actionType: isExpired ? "Eskalasi" : "Follow Up",
  };
}

export function actionForDeadline(deadline: DeadlineItem): ActionItem | null {
  if (deadline.status === "Selesai") return null;

  const isEsc = Boolean(deadline.isEscalated);

  return {
    id: `ACT-DL-${deadline.id}`,
    requestId: deadline.requestId,
    referenceId: deadline.id,
    title: isEsc
      ? `[ESKALASI MANAJER] ${deadline.taskName}`
      : (deadline.nextAction ?? `Tindak Lanjut SLA: ${deadline.taskName}`),
    source: "Deadline",
    priority:
      isEsc || deadline.status === "Overdue" || deadline.urgencyLevel === "Critical"
        ? "High"
        : "Medium",
    dateAdded: new Date().toISOString().split("T")[0],
    dueDate: deadline.targetDate,
    description: isEsc
      ? `Task dieskalasi ke ${deadline.escalatedTo || "Manager Pengadaan"}. Keterlambatan SLA melampaui batas toleransi. Input recovery plan diperlukan.`
      : `SLA "${deadline.taskName}" pada milestone ${deadline.milestone} perlu dipantau oleh ${deadline.pic.name}.`,
    assignee: deadline.pic,
    status: "Pending",
    actionType: isEsc || deadline.status === "Overdue" ? "Eskalasi" : "Follow Up",
  };
}
