import { apiFetch } from "./client";
import { SystemSettings } from "@/types";

export interface SystemSettingsDto {
  email_notifications: boolean;
  whatsapp_notifications: boolean;
  sla_warning_days: number;
  auto_escalation: boolean;
  auto_escalate_days: number;
  escalation_manager_id: string;
  approval_threshold: number;
  department_reviewers: Record<string, string>;
  milestone_durations: Record<string, number>;
  ai_sensitivity: "Low" | "Medium" | "High";
  theme: "Light" | "Dark" | "System";
}

export const settingsApi = {
  get: () => apiFetch<SystemSettingsDto>("/settings"),
  
  update: (payload: SystemSettingsDto) =>
    apiFetch<SystemSettingsDto>("/settings", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
};
