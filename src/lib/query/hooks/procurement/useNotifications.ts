"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi, NotificationDto } from "@/lib/api/notifications.api";
import { NotificationItem, NotificationType, NotificationCategory } from "@/types";

export const notificationKeys = {
  all: ["notifications"] as const,
};

function mapDtoToItem(dto: NotificationDto): NotificationItem {
  return {
    id: dto.id,
    requestId: dto.request_id,
    title: dto.title,
    description: dto.description,
    time: dto.created_at,
    isRead: dto.is_read,
    type: dto.type as NotificationType,
    category: dto.category as NotificationCategory,
  };
}

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: () => notificationsApi.getAll().then((res) => res.data.map(mapDtoToItem)),
    // Optional: Refresh periodically
    refetchInterval: 30000, 
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
