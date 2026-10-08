"use client";

import { useState } from "react";
import { Bell, CheckCircle2, AlertCircle, FileText, Clock, Settings, Search, CheckSquare } from "lucide-react";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/lib/query/hooks/procurement/useNotifications";
import type { NotificationType, NotificationItem } from "@/types";

export default function NotificationsPage() {
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const [activeTab, setActiveTab] = useState<"All" | "Unread">("All");

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllAsRead = () => {
    markAllRead.mutate();
  };

  const markAsRead = (id: string) => {
    markRead.mutate(id);
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "success": return <CheckCircle2 size={18} className="text-emerald-500" />;
      case "alert": return <AlertCircle size={18} className="text-amber-500" />;
      case "deadline": return <Clock size={18} className="text-red-500" />;
      case "document": return <FileText size={18} className="text-[#0a4d8c]" />;
      case "system": return <Settings size={18} className="text-slate-500" />;
    }
  };

  const getBgStyle = (type: NotificationType, isRead: boolean) => {
    if (isRead) return "bg-slate-50 border-slate-200 text-slate-500";
    
    switch (type) {
      case "success": return "bg-emerald-50 border-emerald-200";
      case "alert": return "bg-amber-50 border-amber-200";
      case "deadline": return "bg-red-50 border-red-200";
      case "document": return "bg-blue-50 border-blue-200";
      case "system": return "bg-slate-100 border-slate-300";
    }
  };

  const filteredNotifications = notifications.filter(n => activeTab === "All" || !n.isRead);

  // Group notifications by category
  const groupedNotifications = filteredNotifications.reduce((acc, notif) => {
    if (!acc[notif.category]) acc[notif.category] = [];
    acc[notif.category].push(notif);
    return acc;
  }, {} as Record<string, NotificationItem[]>);

  const categories = ["Hari Ini", "Kemarin", "Lebih Lama"];

  return (
    <div className="space-y-6 pb-12">
      {/* Filter & Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm shrink-0">
        <div className="relative w-full flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari notifikasi..." 
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-[#0a4d8c] focus:ring-1 focus:ring-[#0a4d8c]"
          />
        </div>
        
        <div className="flex items-center w-full sm:w-auto gap-3">
          <div className="flex rounded-lg bg-slate-50 p-1 border border-slate-100 w-full sm:w-auto">
            <button 
              onClick={() => setActiveTab("All")}
              className={`flex-1 sm:flex-none px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all ${activeTab === "All" ? 'bg-white text-[#0a4d8c] shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Semua
            </button>
            <button 
              onClick={() => setActiveTab("Unread")}
              className={`flex-1 sm:flex-none px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all ${activeTab === "Unread" ? 'bg-white text-[#0a4d8c] shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Belum Dibaca
            </button>
          </div>
          
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllAsRead}
              className="flex items-center justify-center gap-2 rounded-lg bg-white border border-slate-200 px-4 py-2.5 text-xs font-bold text-[#0a4d8c] shadow-sm transition-all hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              <CheckSquare size={16} />
              <span className="hidden sm:inline">Tandai semua dibaca</span>
              <span className="sm:hidden">Baca Semua</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="divide-y divide-slate-100 bg-white">
          {isLoading ? (
            <div className="flex justify-center p-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1d4ed8]/20 border-t-[#1d4ed8]" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Bell size={40} className="mb-4 text-slate-200" />
              <h3 className="text-sm font-bold text-slate-700">Tidak ada notifikasi</h3>
              <p className="mt-1 text-xs text-slate-500">Anda sudah membaca semua pemberitahuan.</p>
            </div>
          ) : (
            categories.map(category => {
              if (!groupedNotifications[category] || groupedNotifications[category].length === 0) return null;
              
              return (
                <div key={category}>
                  <div className="bg-slate-50/80 px-6 py-3 sm:px-8 border-y border-slate-100 first:border-t-0">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{category}</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {groupedNotifications[category].map((notif) => (
                      <div 
                        key={notif.id}
                        onClick={() => markAsRead(notif.id)}
                        className={`flex cursor-pointer gap-4 px-6 py-4 transition-colors hover:bg-slate-50/70 sm:px-8 ${notif.isRead ? 'opacity-60' : 'bg-white'}`}
                      >
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${getBgStyle(notif.type, notif.isRead)}`}>
                          {getIcon(notif.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-col justify-between gap-1 sm:flex-row sm:items-center sm:gap-4">
                            <h4 className={`truncate text-sm ${notif.isRead ? 'font-semibold text-slate-700' : 'font-bold text-slate-900'}`}>
                              {notif.title}
                            </h4>
                            <span className="shrink-0 text-xs font-medium text-slate-400">{notif.time}</span>
                          </div>
                          <p className={`text-sm leading-relaxed ${notif.isRead ? 'text-slate-500' : 'text-slate-600'}`}>
                            {notif.description}
                          </p>
                        </div>
                        {!notif.isRead && (
                          <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#0a4d8c]"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
