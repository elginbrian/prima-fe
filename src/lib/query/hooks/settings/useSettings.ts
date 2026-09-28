import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsApi, SystemSettingsDto } from "@/lib/api";
import { queryKeys } from "@/lib/query/keys";
import { SystemSettings } from "@/types";

function mapToDomain(dto: SystemSettingsDto): SystemSettings {
  return {
    emailNotifications: dto.email_notifications,
    whatsappNotifications: dto.whatsapp_notifications,
    slaWarningDays: dto.sla_warning_days,
    autoEscalation: dto.auto_escalation,
    autoEscalateDays: dto.auto_escalate_days,
    escalationManagerId: dto.escalation_manager_id,
    approvalThreshold: dto.approval_threshold,
    departmentReviewers: dto.department_reviewers,
    milestoneDurations: dto.milestone_durations,
    aiSensitivity: dto.ai_sensitivity,
    theme: dto.theme,
  };
}

function mapToDto(domain: SystemSettings): SystemSettingsDto {
  return {
    email_notifications: domain.emailNotifications,
    whatsapp_notifications: domain.whatsappNotifications,
    sla_warning_days: domain.slaWarningDays,
    auto_escalation: domain.autoEscalation,
    auto_escalate_days: domain.autoEscalateDays,
    escalation_manager_id: domain.escalationManagerId,
    approval_threshold: domain.approvalThreshold,
    department_reviewers: domain.departmentReviewers,
    milestone_durations: domain.milestoneDurations,
    ai_sensitivity: domain.aiSensitivity,
    theme: domain.theme,
  };
}

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings.all(),
    queryFn: () => settingsApi.get().then((r) => mapToDomain(r.data)),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SystemSettings) => settingsApi.update(mapToDto(payload)).then(r => mapToDomain(r.data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.settings.all() });
    },
  });
}
