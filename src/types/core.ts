export interface BaseUser {
  id: string;
  name: string;
}

export interface Department {
  id: string;
  name: string;
}

export interface SystemSettings {
  emailNotifications: boolean;
  whatsappNotifications: boolean;
  slaWarningDays: number;
  autoEscalation: boolean;
  autoEscalateDays: number;
  escalationManagerId: string;
  approvalThreshold: number;
  departmentReviewers: Record<string, string>;
  milestoneDurations: Record<string, number>;
  aiSensitivity: "Low" | "Medium" | "High";
  theme: "Light" | "Dark" | "System";
}

export type NotificationType = "success" | "alert" | "system" | "document" | "deadline";
export type NotificationCategory = "Hari Ini" | "Kemarin" | "Lebih Lama";

export interface NotificationItem {
  id: string;
  requestId?: string;
  title: string;
  description: string;
  time: string;
  isRead: boolean;
  type: NotificationType;
  category: NotificationCategory;
  actionUrl?: string;
}

export type HistoryCategory = "Pekerjaan" | "Timeline" | "SLA" | "Dokumen" | "Jaminan";

export interface HistoryItem {
  id: string;
  requestId: string;
  category: HistoryCategory;
  title: string;
  description: string;
  createdAt: string;
}
