"use client";

import { useState, useEffect } from "react";
import { Clock, User, Blocks } from "lucide-react";
import { useSettings, useUpdateSettings } from "@/lib/query/hooks/settings/useSettings";
import { useUsers } from "@/lib/query/hooks/users/useUsers";
import { ProfileTab } from "./tabs/ProfileTab";
import { SlaPolicyTab } from "./tabs/SlaPolicyTab";
import { IntegrationTab } from "./tabs/IntegrationTab";
import { SystemSettings } from "@/types";

import { useToast } from "@/components/ui/Toast";
import { Spinner, Skeleton } from "@/components/ui";
import { getErrorMessage } from "@/lib/api/errors";

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const { data: users = [] } = useUsers();
  const updateSettingsMutation = useUpdateSettings();
  const toast = useToast();

  const [formData, setFormData] = useState<SystemSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("umum");

  useEffect(() => {
    if (settings && !formData) {
      setFormData(settings);
    }
  }, [settings, formData]);

  const handleChange = (key: string, value: any) => {
    if (formData) {
      setFormData({ ...formData, [key]: value });
    }
  };

  const handleSave = () => {
    if (!formData) return;
    setIsSaving(true);
    updateSettingsMutation.mutate(formData, {
      onSuccess: () => {
        setIsSaving(false);
        toast.success("Pengaturan berhasil disimpan.");
      },
      onError: (err) => {
        setIsSaving(false);
        toast.error(getErrorMessage(err, "Gagal menyimpan pengaturan."));
      },
    });
  };

  const tabs = [
    { id: "umum", label: "Profil & Akun", icon: User },
    { id: "sla", label: "Kebijakan SLA & Eskalasi", icon: Clock },
    { id: "integrasi", label: "Integrasi AI", icon: Blocks },
  ];

  if (isLoading || !formData) {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden p-6 sm:p-8 space-y-6">
          <div className="flex gap-4 border-b border-slate-100 pb-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-32" />
          </div>
          <div className="space-y-4 max-w-xl">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex flex-col">
          {/* Top Tabs */}
          <div className="flex w-full overflow-x-auto bg-white border-b border-slate-200 px-2 sm:px-6 scrollbar-none">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-2 px-5 py-3.5 text-xs font-medium transition-all whitespace-nowrap focus:outline-none ${
                  activeTab === tab.id
                    ? "border-b-2 border-[#0a4d8c] text-[#0a4d8c]"
                    : "border-b-2 border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
                }`}
              >
                <tab.icon size={16} className="shrink-0" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Form Content */}
          <div className="bg-white p-6 sm:p-8 flex flex-col min-w-0 w-full">
            <div className="flex-1 w-full">
              {activeTab === "umum" && <ProfileTab />}
              {activeTab === "sla" && (
                <SlaPolicyTab
                  formData={formData}
                  handleChange={handleChange}
                  users={users}
                />
              )}
              {activeTab === "integrasi" && <IntegrationTab />}
            </div>

            {activeTab === "sla" && (
              <div className="mt-10 flex justify-end border-t border-slate-100 pt-6 w-full">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0a4d8c] px-8 py-2.5 text-xs font-medium text-white shadow-xs transition-all hover:bg-[#083b6c] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto focus:outline-none"
                >
                  {isSaving && <Spinner size="xs" color="white" />}
                  <span>{isSaving ? "Menyimpan..." : "Simpan Pengaturan"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
