"use client";

import { useState } from "react";
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Settings,
  Search,
  CheckSquare,
  ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/lib/query/hooks/procurement/useNotifications";
import { useDeadlines } from "@/lib/query/hooks/procurement/useProcurement";
import { SLAActionModal } from "@/components/widgets/modals/SLAActionModal";
import type { NotificationType, DeadlineItem } from "@/types";
import { Skeleton } from "@/components/ui";
import { formatRelativeTimeIndo, formatRequestCode } from "@/lib/utils";

export default function NotificationsPage() {
  const router = useRouter();
  const { data: notifications = [], isLoading } = useNotifications();
  const { data: deadlines = [] } = useDeadlines();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const [activeTab, setActiveTab] = useState<"All" | "Unread">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSlaModal, setSelectedSlaModal] = useState<DeadlineItem | null>(
    null
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllAsRead = () => {
    markAllRead.mutate();
  };

  const markAsRead = (id: string) => {
    markRead.mutate(id);
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "success":
        return <CheckCircle2 size={16} />;
      case "alert":
        return <AlertCircle size={16} />;
      case "deadline":
        return <Clock size={16} />;
      case "document":
        return <FileText size={16} />;
      case "system":
      default:
        return <Settings size={16} />;
    }
  };

  const getTypeLabel = (type: NotificationType) => {
    switch (type) {
      case "deadline":
        return "SLA";
      case "alert":
        return "Jaminan";
      case "document":
        return "Dokumen";
      case "success":
        return "Progres";
      case "system":
      default:
        return "Sistem";
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    const matchesTab = activeTab === "All" || !n.isRead;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      n.title.toLowerCase().includes(q) ||
      n.description.toLowerCase().includes(q) ||
      (n.requestId && n.requestId.toLowerCase().includes(q));
    return matchesTab && matchesQuery;
  });

  return (
    <div className="space-y-5 pb-12">
      {/* Filter & Toolbar */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm shrink-0">
        <div className="relative w-full flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={17}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari notifikasi berdasarkan judul, pesan, atau kode pekerjaan..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0a4d8c] focus:ring-1 focus:ring-[#0a4d8c]"
          />
        </div>

        <div className="flex flex-wrap items-center w-full xl:w-auto gap-2.5">
          <div className="flex shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={() => setActiveTab("All")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none ${
                activeTab === "All"
                  ? "bg-white text-[#0a4d8c] shadow-2xs"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Semua ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("Unread")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none ${
                activeTab === "Unread"
                  ? "bg-white text-[#0a4d8c] shadow-2xs"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Belum Dibaca ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-[#0a4d8c] hover:text-[#0a4d8c] transition-colors whitespace-nowrap shrink-0 focus:outline-none"
            >
              <CheckSquare size={14} className="text-[#0a4d8c]" />
              <span className="hidden sm:inline">Tandai semua dibaca</span>
              <span className="sm:hidden">Baca Semua</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="divide-y divide-slate-100 bg-white">
          {isLoading ? (
            <div className="divide-y divide-slate-100">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex gap-3.5 px-6 py-4 animate-in fade-in duration-200"
                >
                  <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-3 w-full max-w-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Bell size={36} className="mb-3 text-slate-300" />
              <h3 className="text-sm font-medium text-slate-700">
                Tidak ada notifikasi
              </h3>
              <p className="mt-1 text-xs font-normal text-slate-500">
                {searchQuery
                  ? `Tidak ada notifikasi yang cocok dengan "${searchQuery}".`
                  : "Seluruh pemberitahuan sudah terbaca."}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  if (!notif.isRead) markAsRead(notif.id);
                }}
                className={`flex items-start gap-3.5 px-5 py-4 transition-colors sm:px-6 ${
                  notif.isRead
                    ? "bg-white hover:bg-slate-50/70"
                    : "bg-[#f4f8fd]/70 hover:bg-[#f4f8fd]"
                }`}
              >
                <div
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                    notif.isRead
                      ? "border-slate-200 bg-slate-100 text-slate-500"
                      : "border-[#0a4d8c]/20 bg-[#e8f2fc] text-[#0a4d8c]"
                  }`}
                >
                  {getIcon(notif.type)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      {!notif.isRead && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-[#0a4d8c]" />
                      )}
                      <h4
                        className={`text-[13px] ${
                          notif.isRead
                            ? "font-normal text-slate-800"
                            : "font-medium text-slate-900"
                        }`}
                      >
                        {notif.title}
                      </h4>
                      <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-normal text-slate-500">
                        {getTypeLabel(notif.type)}
                      </span>
                    </div>
                    <span className="shrink-0 text-[11px] font-normal text-slate-400">
                      {formatRelativeTimeIndo(notif.time)}
                    </span>
                  </div>

                  <p className="mt-1 text-xs font-normal leading-relaxed text-slate-600">
                    {notif.description}
                  </p>

                  {(notif.actionUrl || notif.requestId || notif.type === "deadline" || notif.title.toLowerCase().includes("sla")) && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      {notif.actionUrl && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!notif.isRead) markAsRead(notif.id);
                            router.push(notif.actionUrl!);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#0a4d8c]/20 bg-[#e8f2fc] px-2.5 py-1 text-xs font-medium text-[#0a4d8c] transition hover:bg-[#dcebfa] focus:outline-none"
                        >
                          <span>Lihat Hasil Analisis AI</span>
                          <ArrowRight size={12} />
                        </button>
                      )}
                      {(notif.type === "deadline" ||
                        notif.title.toLowerCase().includes("sla")) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!notif.isRead) markAsRead(notif.id);
                            const matchedDeadline = deadlines.find(
                              (d) =>
                                (notif.requestId &&
                                  d.requestId === notif.requestId) ||
                                notif.title
                                  .toLowerCase()
                                  .includes(d.taskName.toLowerCase())
                            );
                            if (matchedDeadline) {
                              setSelectedSlaModal(matchedDeadline);
                            } else {
                              router.push(
                                "/dashboard/overview?lens=sla-actions"
                              );
                            }
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#0a4d8c]/20 bg-[#e8f2fc] px-2.5 py-1 text-xs font-medium text-[#0a4d8c] transition hover:bg-[#dcebfa] focus:outline-none"
                        >
                          <Clock size={12} />
                          <span>Tindak Lanjuti SLA</span>
                        </button>
                      )}
                      {notif.requestId && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!notif.isRead) markAsRead(notif.id);
                            router.push(
                              `/dashboard/overview/${encodeURIComponent(
                                notif.requestId!
                              )}`
                            );
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-[#0a4d8c]/40 hover:text-[#0a4d8c] focus:outline-none"
                        >
                          <span>
                            Buka Pekerjaan ({formatRequestCode(notif.requestId)})
                          </span>
                          <ArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedSlaModal && (
        <SLAActionModal
          deadline={selectedSlaModal}
          onClose={() => setSelectedSlaModal(null)}
        />
      )}
    </div>
  );
}
