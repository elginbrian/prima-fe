"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { deadlinesApi, DeadlineDto } from "@/lib/api/deadlines.api";
import { DeadlineItem } from "@/types";

export const deadlinesKeys = {
  all: ["deadlines"] as const,
  byRequest: (requestId: string) => ["deadlines", "request", requestId] as const,
  detail: (id: string) => ["deadlines", "detail", id] as const,
};

export function mapDeadlineDtoToItem(dto: DeadlineDto): DeadlineItem {
  return {
    id: dto.id,
    requestId: dto.request_id,
    relatedId: dto.related_id,
    taskName: dto.task_name,
    pic: { id: dto.pic_id, name: dto.pic_name },
    department: { id: dto.department_id, name: dto.department_name },
    targetDate: dto.target_date,
    startDate: dto.start_date,
    status: dto.status,
    urgencyLevel: dto.urgency_level,
    milestone: dto.milestone,
    nextAction: dto.next_action,
    overdueReason: dto.overdue_reason,
    pausedAt: dto.paused_at,
    accumulatedPausedDays: dto.accumulated_paused_days,
  };
}

export function useDeadlines(requestId?: string) {
  return useQuery({
    queryKey: requestId ? deadlinesKeys.byRequest(requestId) : deadlinesKeys.all,
    queryFn: () => deadlinesApi.getAll(requestId).then((res) => res.data.map(mapDeadlineDtoToItem)),
  });
}

export function useUpdateDeadline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<DeadlineDto> }) =>
      deadlinesApi.update(id, payload).then((res) => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: deadlinesKeys.all });
      queryClient.invalidateQueries({ queryKey: deadlinesKeys.detail(variables.id) });
    },
  });
}
