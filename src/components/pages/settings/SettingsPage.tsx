"use client";

import { useState, useEffect } from "react";
import { Settings, Bell, Clock, Cpu, Palette, Save, User } from "lucide-react";
import { useSettings, useUpdateSettings } from "@/lib/query/hooks/settings/useSettings";
import { ProfileTab } from "./tabs/ProfileTab";
import { NotificationTab } from "./tabs/NotificationTab";
import { SystemTab } from "./tabs/SystemTab";
import { SystemSettings } from "@/types";

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateSettingsMutation = useUpdateSettings();
  
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
        alert("Pengaturan berhasil disimpan.");
      },
      onError: () => {
        setIsSaving(false);
        alert("Gagal menyimpan pengaturan.");
      }
    });
  };

  const tabs = [
    { id: "umum", label: "Profil & Akun", icon: User },
    { id: "notifikasi", label: "Notifikasi", icon: Bell },
    { id: "sistem", label: "Pengaturan Sistem", icon: Settings },
  ];

  if (isLoading || !formData) {
    return <div className="p-8 text-center text-slate-500">Memuat pengaturan...</div>;
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        <div className="flex flex-col">
          {/* Top Tabs */}
          <div className="flex w-full overflow-x-auto bg-white border-b border-slate-200 px-2 sm:px-6 scrollbar-none">
            {tabs.map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-2 px-6 py-4 text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-b-2 border-[#0a4d8c] text-[#0a4d8c]' : 'border-b-2 border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'}`}
              >
                <tab.icon size={18} className="shrink-0" /> 
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Form Content */}
          <div className="bg-white p-6 sm:p-8 lg:p-10 flex flex-col min-w-0 w-full">
            <div className="flex-1 w-full">
              {activeTab === "umum" && <ProfileTab />}
              {activeTab === "notifikasi" && <NotificationTab formData={formData} handleChange={handleChange} users={[]} />}
              {activeTab === "sistem" && <SystemTab formData={formData} handleChange={handleChange} users={[]} />}
            </div>
            
            <div className="mt-12 flex justify-end border-t border-slate-100 pt-6 sm:pt-8 w-full">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0a4d8c] px-12 py-3 text-sm font-bold tracking-wide text-white shadow-sm transition-all hover:bg-[#093e6f] hover:shadow disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
