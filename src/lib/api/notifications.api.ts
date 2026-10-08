import { apiFetch } from "./client";

export interface NotificationDto {
  id: string;
  request_id?: string;
  title: string;
  description: string;
  is_read: boolean;
  type: string;
  category: string;
  created_at: string;
}

export const notificationsApi = {
  getAll: () => 
    apiFetch<NotificationDto[]>("/notifications"),
  
  markRead: (id: string) =>
    apiFetch<NotificationDto>(`/notifications/${id}/read`, { method: "PUT" }),
  
  markAllRead: () =>
    apiFetch<{ message: string }>("/notifications/read-all", { method: "PUT" }),
};
