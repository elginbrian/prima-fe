import {
  ProcurementState,
  ProcurementStep,
  ProcurementStage,
  GuaranteeItem,
  NotificationItem,
} from "@/types";
import { ProcurementAction } from "./types";
import { getDeadlineTiming } from "@/lib/deadlineUtils";
import {
  historyItem,
  actionForDocument,
  actionForGuarantee,
  actionForDeadline,
} from "./actionGenerators";

export { actionForDocument, actionForGuarantee, actionForDeadline, historyItem };

const stageForStep: Record<ProcurementStep, ProcurementStage> = {
  // Tender Terbuka
  "Rapat Pra-Tender": "Sourcing",
  "Pengumuman Pengadaan": "Sourcing",
  "Prebid Meeting": "Sourcing",
  "Pemasukan Dokumen Penawaran": "Sourcing",
  "Pembukaan Penawaran": "Evaluasi",
  "Evaluasi Dokumen Penawaran": "Evaluasi",
  "Sosialisasi e-Auction": "Evaluasi",
  "Negosiasi e-Auction": "Evaluasi",
  "Negosiasi Manual": "Evaluasi",
  "Laporan Hasil Pemilihan": "Contracting",
  "Pengumuman Pemenang": "Contracting",
  "Penunjukan Pemenang": "Selesai",
  // Pemilihan Langsung
  "Undangan Pemilihan": "Sourcing",
  "Pembukaan & Evaluasi Penawaran": "Evaluasi",
  "Klarifikasi & Negosiasi Teknis": "Evaluasi",
  "Penetapan Pemenang": "Contracting",
  // Penunjukan Langsung
  "Undangan Penunjukan Langsung": "Sourcing",
  "Pemasukan & Evaluasi Dokumen": "Evaluasi",
  "Klarifikasi & Negosiasi Harga": "Evaluasi",
};

export function procurementReducer(
  state: ProcurementState,
  action: ProcurementAction
): ProcurementState {
  switch (action.type) {
    case "ADD_REQUEST": {
      return {
        ...state,
        requests: [action.request, ...state.requests],
        history: [
          historyItem(
            action.request.id,
            "Pekerjaan",
            "Pekerjaan dibuat",
            `${action.request.title} ditambahkan ke tracker.`
          ),
          ...state.history,
        ],
      };
    }

    case "MOVE_REQUEST": {
      const request = state.requests.find((r) => r.id === action.id);
      if (!request) return state;

      const notification: NotificationItem = {
        id: `NOTIF-${Date.now()}`,
        requestId: action.id,
        title: `Status Diperbarui: ${request.id}`,
        description: `${request.title} telah dipindahkan dari tahap "${request.stage}" ke "${action.stage}".`,
        time: "Baru saja",
        isRead: false,
        type: "success",
        category: "Hari Ini",
      };

      return {
        ...state,
        requests: state.requests.map((r) =>
          r.id === action.id
            ? { ...r, stage: action.stage, updatedAt: new Date().toISOString().split("T")[0] }
            : r
        ),
        notifications: [notification, ...state.notifications],
      };
    }

    case "UPDATE_REQUEST_OPERATIONAL_STATUS": {
      const request = state.requests.find((r) => r.id === action.id);
      if (!request) return state;

      return {
        ...state,
        requests: state.requests.map((r) =>
          r.id === action.id
            ? {
                ...r,
                operationalStatus: action.status,
                operationalStatusReason: action.reason,
                updatedAt: new Date().toISOString().split("T")[0],
              }
            : r
        ),
        history: [
          historyItem(
            action.id,
            "Pekerjaan",
            "Status pekerjaan diperbarui",
            `Status diubah menjadi ${action.status}${action.reason ? `: ${action.reason}` : "."}`
          ),
          ...state.history,
        ],
        notifications: [
          {
            id: `NOTIF-${Date.now()}`,
            requestId: action.id,
            title: `Status Pekerjaan Diperbarui: ${request.id}`,
            description: `${request.title} sekarang berstatus ${action.status}.`,
            time: "Baru saja",
            isRead: false,
            type: "success",
            category: "Hari Ini",
          },
          ...state.notifications,
        ],
        deadlines: state.deadlines.map((d) => {
          if (d.requestId !== action.id) return d;
          if (action.status === "On Hold" && request.operationalStatus !== "On Hold") {
            return { ...d, pausedAt: new Date().toISOString() };
          }
          if (action.status !== "On Hold" && request.operationalStatus === "On Hold") {
            let additionalDays = 0;
            if (d.pausedAt) {
              const diffMs = new Date().getTime() - new Date(d.pausedAt).getTime();
              additionalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            }
            return {
              ...d,
              accumulatedPausedDays: (d.accumulatedPausedDays || 0) + additionalDays,
              pausedAt: undefined,
            };
          }
          return d;
        }),
      };
    }

    case "MOVE_REQUEST_STEP": {
      const request = state.requests.find((r) => r.id === action.id);
      if (!request) return state;

      const notification: NotificationItem = {
        id: `NOTIF-${Date.now()}`,
        requestId: action.id,
        title: `Tahap Procurement Diperbarui: ${request.id}`,
        description: `${request.title} sekarang berada pada tahap "${action.step}".`,
        time: "Baru saja",
        isRead: false,
        type: "success",
        category: "Hari Ini",
      };

      return {
        ...state,
        requests: state.requests.map((r) =>
          r.id === action.id
            ? {
                ...r,
                stage: stageForStep[action.step],
                currentStep: action.step,
                updatedAt: new Date().toISOString().split("T")[0],
              }
            : r
        ),
        milestones: state.milestones.map((m) => {
          if (m.requestId !== action.id) return m;
          const currentIndex = Object.keys(stageForStep).indexOf(action.step);
          const milestoneIndex = Object.keys(stageForStep).indexOf(m.step);
          return {
            ...m,
            status:
              milestoneIndex < currentIndex
                ? m.status === "Pending"
                  ? "Skipped"
                  : m.status
                : milestoneIndex === currentIndex
                ? "In Progress"
                : "Pending",
            date:
              milestoneIndex <= currentIndex
                ? new Date().toISOString().split("T")[0]
                : m.date,
          };
        }),
        notifications: [notification, ...state.notifications],
        history: [
          historyItem(
            action.id,
            "Timeline",
            "Tahap timeline diperbarui",
            `Tahap aktif diubah menjadi ${action.step}.`
          ),
          ...state.history,
        ],
      };
    }

    case "ADD_DOCUMENT": {
      const request = state.requests.find((r) => r.id === action.document.requestId);
      const newNotif: NotificationItem = {
        id: `NOTIF-${Date.now()}`,
        requestId: action.document.requestId,
        title: `Dokumen Baru Diupload: ${action.document.name}`,
        description: `File baru untuk ${
          request?.title ?? action.document.requestId
        } telah diunggah dan menunggu pemeriksaan.`,
        time: "Baru saja",
        isRead: false,
        type: "document",
        category: "Hari Ini",
      };
      return {
        ...state,
        documents: [action.document, ...state.documents],
        milestones: action.document.procurementStep
          ? state.milestones.map((m) =>
              m.requestId === action.document.requestId &&
              m.step === action.document.procurementStep
                ? { ...m, documentId: action.document.id }
                : m
            )
          : state.milestones,
        notifications: [newNotif, ...state.notifications],
        history: [
          historyItem(
            action.document.requestId,
            "Dokumen",
            "Dokumen ditambahkan",
            `${action.document.name} ditambahkan untuk pemeriksaan.`
          ),
          ...state.history,
        ],
      };
    }

    case "UPDATE_DOCUMENT_STATUS": {
      const doc = state.documents.find((d) => d.id === action.id);
      if (!doc) return state;
      const request = state.requests.find((r) => r.id === doc.requestId);
      const isPass = action.status === "Lulus Verifikasi";
      const newNotif: NotificationItem = {
        id: `NOTIF-${Date.now()}`,
        requestId: doc.requestId,
        title: isPass
          ? `Dokumen Lulus Verifikasi: ${doc.name}`
          : `Catatan pada Dokumen: ${doc.name}`,
        description: isPass
          ? `"${doc.name}" untuk ${
              request?.title ?? doc.requestId
            } telah divalidasi dan dinyatakan lengkap.`
          : `"${doc.name}" untuk ${request?.title ?? doc.requestId} memerlukan tindak lanjut.`,
        time: "Baru saja",
        isRead: false,
        type: isPass ? "success" : "alert",
        category: "Hari Ini",
      };
      return {
        ...state,
        documents: state.documents.map((d) =>
          d.id === action.id ? { ...d, status: action.status } : d
        ),
        notifications: [newNotif, ...state.notifications],
        history: [
          historyItem(
            doc.requestId,
            "Dokumen",
            "Status dokumen diperbarui",
            `${doc.name} diubah menjadi ${action.status}.`
          ),
          ...state.history,
        ],
      };
    }

    case "ADD_GUARANTEE": {
      const request = state.requests.find((r) => r.id === action.guarantee.requestId);
      const newNotif: NotificationItem = {
        id: `NOTIF-${Date.now()}`,
        requestId: action.guarantee.requestId,
        title: `Jaminan Baru Ditambahkan: ${action.guarantee.referenceNo}`,
        description: `${action.guarantee.type} dari ${action.guarantee.vendor.name} telah berhasil diregistrasi untuk ${
          request?.title ?? action.guarantee.requestId
        }.`,
        time: "Baru saja",
        isRead: false,
        type: "success",
        category: "Hari Ini",
      };
      return {
        ...state,
        guarantees: [action.guarantee, ...state.guarantees],
        notifications: [newNotif, ...state.notifications],
        history: [
          historyItem(
            action.guarantee.requestId,
            "Jaminan",
            "Jaminan ditambahkan",
            `${action.guarantee.type} ${action.guarantee.referenceNo} ditambahkan.`
          ),
          ...state.history,
        ],
      };
    }

    case "UPDATE_GUARANTEE": {
      const existing = state.guarantees.find((guarantee) => guarantee.id === action.id);
      if (!existing) return state;
      const updated = { ...existing, ...action.changes };
      const expiryTime = new Date(`${updated.expiryDate}T23:59:59`).getTime();
      const remainingDays = Number.isNaN(expiryTime)
        ? 0
        : Math.ceil((expiryTime - Date.now()) / 86400000);
      const status: GuaranteeItem["status"] =
        remainingDays < 0
          ? "Expired"
          : remainingDays <= state.settings.slaWarningDays
          ? "Mendekati Expiry"
          : "Aktif";
      return {
        ...state,
        guarantees: state.guarantees.map((guarantee) =>
          guarantee.id === action.id ? { ...updated, status } : guarantee
        ),
        history: [
          historyItem(
            updated.requestId,
            "Jaminan",
            "Data jaminan dikoreksi",
            `${updated.referenceNo} diperbarui melalui koreksi manual hasil ekstraksi.`
          ),
          ...state.history,
        ],
      };
    }

    case "ADD_ATTACHMENT":
      return {
        ...state,
        attachments: [action.attachment, ...state.attachments],
        history: [
          historyItem(
            action.attachment.requestId,
            "Dokumen",
            "Dokumen pendukung ditambahkan",
            `${
              action.attachment.fileUrl
                ? action.attachment.fileUrl.split("/").pop()
                : "File"
            } disimpan tanpa ekstraksi.`
          ),
          ...state.history,
        ],
      };

    case "ADD_DEADLINE": {
      const timing = getDeadlineTiming(action.deadline, state.settings.slaWarningDays);
      const deadline = { ...action.deadline, ...timing };
      return {
        ...state,
        deadlines: [deadline, ...state.deadlines],
        history: [
          historyItem(
            deadline.requestId,
            "SLA",
            "SLA ditambahkan",
            `${deadline.taskName} ditetapkan hingga ${deadline.targetDate}.`
          ),
          ...state.history,
        ],
      };
    }

    case "UPDATE_DEADLINE": {
      const existing = state.deadlines.find((d) => d.id === action.id);
      if (!existing) return state;
      const updated = { ...existing, ...action.changes };
      const timing = getDeadlineTiming(updated, state.settings.slaWarningDays);
      return {
        ...state,
        deadlines: state.deadlines.map((d) =>
          d.id === action.id ? { ...updated, ...timing } : d
        ),
        history: [
          historyItem(
            updated.requestId,
            "SLA",
            "SLA diperbarui",
            `${updated.taskName} diperbarui; target ${updated.targetDate}.`
          ),
          ...state.history,
        ],
      };
    }

    case "UPDATE_DEADLINE_STATUS": {
      const dl = state.deadlines.find((d) => d.id === action.id);
      if (!dl) return state;
      const isDone = action.status === "Selesai";
      let newNotif: NotificationItem | null = null;
      if (isDone) {
        const request = state.requests.find((r) => r.id === dl.requestId);
        newNotif = {
          id: `NOTIF-${Date.now()}`,
          requestId: dl.requestId,
          title: `Deadline Selesai: ${dl.taskName}`,
          description: `Tugas "${dl.taskName}" untuk ${
            request?.title ?? dl.requestId
          } telah ditandai selesai oleh ${dl.pic.name}.`,
          time: "Baru saja",
          isRead: false,
          type: "success",
          category: "Hari Ini",
        };
      }
      return {
        ...state,
        deadlines: state.deadlines.map((d) =>
          d.id === action.id ? { ...d, status: action.status as any } : d
        ),
        notifications: newNotif ? [newNotif, ...state.notifications] : state.notifications,
      };
    }

    case "UPDATE_ACTION_STATUS": {
      const act = state.actions.find((a) => a.id === action.id);
      if (!act) return state;
      const isDone = action.status === "Done";
      let newNotif: NotificationItem | null = null;
      if (isDone) {
        newNotif = {
          id: `NOTIF-${Date.now()}`,
          requestId: act.requestId || "",
          title: `Tindakan Selesai: ${act.title}`,
          description: `${act.assignee.name} telah menyelesaikan "${act.title}".`,
          time: "Baru saja",
          isRead: false,
          type: "success",
          category: "Hari Ini",
        };
      }
      return {
        ...state,
        actions: state.actions.map((a) =>
          a.id === action.id ? { ...a, status: action.status } : a
        ),
        deadlines: state.deadlines.map((d) =>
          d.id === act.referenceId && isDone ? { ...d, status: "Selesai" as any } : d
        ),
        notifications: newNotif ? [newNotif, ...state.notifications] : state.notifications,
      };
    }

    case "ADD_ACTION":
      return state;

    case "MARK_NOTIFICATION_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.id ? { ...n, isRead: true } : n
        ),
      };

    case "MARK_ALL_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      };

    case "ADD_NOTIFICATION":
      return { ...state, notifications: [action.notification, ...state.notifications] };

    case "UPDATE_SETTINGS":
      return {
        ...state,
        settings: { ...state.settings, ...action.settings },
      };

    default:
      return state;
  }
}
