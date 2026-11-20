"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Briefcase,
  FilePlus2,
  Clock,
  AlertTriangle,
  ArrowRight,
  FileSearch,
  BookOpen,
  ShieldCheck,
  BarChart3,
  Bell,
  Settings,
  CheckCircle2,
  CornerDownLeft,
  FileText,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  useProcurements,
  useDocuments,
  useDeadlines,
} from "@/lib/query/hooks/procurement/useProcurement";
import { useValidationLogs, useValidationProfiles } from "@/lib/query/hooks/procurement/useValidation";
import { useGuarantees } from "@/lib/query/hooks/procurement/useGuarantees";
import { useSettings } from "@/lib/query/hooks/settings/useSettings";
import { useCurrentUser } from "@/lib/query/hooks/auth/useCurrentUser";
import { createChatSession } from "@/lib/aiChatStore";
import { useProcurement } from "@/context/ProcurementContext";
import { getDeadlineTiming } from "@/lib/deadlineUtils";
import { formatDateIndo, formatRequestCode, formatRupiah } from "@/lib/utils";
import { SLAActionModal } from "@/components/widgets/modals/SLAActionModal";
import type { DeadlineItem, UrgencyLevel } from "@/types";

type OmniCategory =
  | "Fitur & Navigasi"
  | "Hasil Analisis AI"
  | "Pekerjaan Pengadaan"
  | "Dokumen & Template"
  | "Warkat Jaminan"
  | "Target SLA";

interface OmniSearchResult {
  id: string;
  category: OmniCategory;
  title: string;
  subtitle: string;
  badgeText?: string;
  badgeUrgent?: boolean;
  href?: string;
  deadlineItem?: DeadlineItem;
  keywords: string;
}

const STATIC_FEATURE_RESULTS: OmniSearchResult[] = [
  {
    id: "feat-upload-doc",
    category: "Fitur & Navigasi",
    title: "Validasi Dokumen Baru (Analisis AI)",
    subtitle: "Unggah dokumen pengadaan untuk diperiksa otomatis dengan checklist AI",
    badgeText: "Fitur Utama",
    href: "/dashboard/documents/upload",
    keywords: "validasi unggah upload dokumen baru analisis ai pemeriksaan cek",
  },
  {
    id: "feat-documents",
    category: "Fitur & Navigasi",
    title: "Pemeriksaan Dokumen",
    subtitle: "Daftar seluruh dokumen pra-tender, status verifikasi, dan skor kelayakan",
    badgeText: "Menu",
    href: "/dashboard/documents",
    keywords: "pemeriksaan dokumen daftar log riwayat verifikasi",
  },
  {
    id: "feat-templates",
    category: "Fitur & Navigasi",
    title: "Pustaka Template & Tahapan Pekerjaan",
    subtitle: "Kelola standar checklist kelayakan dan master tahapan metode pengadaan",
    badgeText: "Menu",
    href: "/dashboard/documents/templates",
    keywords: "template standar kelayakan kriteria tahapan workflow rks kak",
  },
  {
    id: "feat-template-new",
    category: "Fitur & Navigasi",
    title: "Buat Template Standar Baru",
    subtitle: "Susun kriteria checklist baru atau ekstrak otomatis dari dokumen acuan",
    badgeText: "Aksi Cepat",
    href: "/dashboard/documents/templates/form",
    keywords: "buat tambah template standar baru form ekstrak kriteria",
  },
  {
    id: "feat-overview-jobs",
    category: "Fitur & Navigasi",
    title: "Daftar Pekerjaan Pengadaan",
    subtitle: "Pantau seluruh paket pekerjaan aktif, tahapan, PIC, dan nilai anggaran",
    badgeText: "Menu",
    href: "/dashboard/overview",
    keywords: "cek daftar pekerjaan pengadaan tracker proyek tender kontrak",
  },
  {
    id: "feat-guarantees",
    category: "Fitur & Navigasi",
    title: "Manajemen Warkat Jaminan",
    subtitle: "Monitoring masa berlaku jaminan bank/asuransi, klaim, dan pengembalian",
    badgeText: "Menu",
    href: "/dashboard/overview?lens=guarantees",
    keywords: "warkat jaminan bank garansi asuransi pelaksanaan pemeliharaan uang muka",
  },
  {
    id: "feat-guarantee-upload",
    category: "Fitur & Navigasi",
    title: "Unggah & OCR Warkat Jaminan Baru",
    subtitle: "Digitalisasi dan ekstraksi otomatis data warkat jaminan dengan AI OCR",
    badgeText: "Aksi Cepat",
    href: "/dashboard/overview/guarantees/upload",
    keywords: "unggah upload ocr warkat jaminan baru ekstraksi",
  },
  {
    id: "feat-sla-actions",
    category: "Fitur & Navigasi",
    title: "SLA & Tindak Lanjut Prioritas",
    subtitle: "Jadwal target penyelesaian tahapan, tenggat waktu, dan eskalasi SLA",
    badgeText: "Menu",
    href: "/dashboard/overview?lens=sla-actions",
    keywords: "sla deadline tindak lanjut jadwal target terlambat overdue eskalasi",
  },
  {
    id: "feat-analytics",
    category: "Fitur & Navigasi",
    title: "Analitik & Performa Pengadaan",
    subtitle: "Ringkasan statistik beban kerja, kepatuhan SLA, dan distribusi anggaran",
    badgeText: "Menu",
    href: "/dashboard/overview?lens=analytics",
    keywords: "analitik performa statistik grafik laporan dashboard",
  },
  {
    id: "feat-notifications",
    category: "Fitur & Navigasi",
    title: "Pusat Notifikasi",
    subtitle: "Pemberitahuan real-time hasil analisis AI, peringatan SLA, dan aktivitas",
    badgeText: "Menu",
    href: "/dashboard/notifications",
    keywords: "notifikasi pemberitahuan pesan alert",
  },
  {
    id: "feat-settings",
    category: "Fitur & Navigasi",
    title: "Pengaturan Sistem",
    subtitle: "Konfigurasi parameter peringatan SLA, profil pengguna, dan preferensi",
    badgeText: "Menu",
    href: "/dashboard/settings",
    keywords: "pengaturan setting konfigurasi profil akun",
  },
];

const URGENCY_WEIGHT: Record<UrgencyLevel, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

function getCategoryIcon(category: OmniCategory) {
  switch (category) {
    case "Fitur & Navigasi":
      return <Sparkles size={15} className="text-[#0a4d8c]" />;
    case "Hasil Analisis AI":
      return <FileSearch size={15} className="text-[#0a4d8c]" />;
    case "Pekerjaan Pengadaan":
      return <Briefcase size={15} className="text-[#0a4d8c]" />;
    case "Dokumen & Template":
      return <BookOpen size={15} className="text-[#0a4d8c]" />;
    case "Warkat Jaminan":
      return <ShieldCheck size={15} className="text-[#0a4d8c]" />;
    case "Target SLA":
      return <Clock size={15} className="text-[#0a4d8c]" />;
  }
}

export default function OnboardingPage() {
  const router = useRouter();
  const { state } = useProcurement();
  const { data: currentUser } = useCurrentUser();
  const { data: serverRequests = [] } = useProcurements();
  const { data: serverDocs = [] } = useDocuments();
  const { data: serverDeadlines = [] } = useDeadlines();
  const { data: validationLogs = [] } = useValidationLogs();
  const { data: validationProfiles = [] } = useValidationProfiles();
  const { data: guarantees = [] } = useGuarantees();
  const { data: settings } = useSettings();

  const slaWarningDays = settings?.slaWarningDays ?? 3;
  const requests = serverRequests.length > 0 ? serverRequests : state.requests;
  const deadlines = serverDeadlines.length > 0 ? serverDeadlines : state.deadlines;
  const documents = serverDocs.length > 0 ? serverDocs : state.documents;

  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selectedSlaModal, setSelectedSlaModal] = useState<DeadlineItem | null>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcut: Ctrl+K or "/" to focus search bar
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsFocused(true);
      } else if (
        e.key === "/" &&
        document.activeElement !== inputRef.current &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          (document.activeElement as HTMLElement)?.tagName || ""
        )
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsFocused(true);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute enriched deadlines and pick Top 2 Most Urgent active SLAs
  const enrichedDeadlines = useMemo(() => {
    return deadlines.map((d) => {
      const timing = getDeadlineTiming(d, slaWarningDays);
      return {
        ...d,
        status: timing.status,
        daysRemaining: timing.daysRemaining,
      };
    });
  }, [deadlines, slaWarningDays]);

  const topUrgentSlas = useMemo(() => {
    const active = enrichedDeadlines.filter((d) => d.status !== "Selesai");
    return [...active]
      .sort((a, b) => {
        // 1. Overdue first
        const aOverdue = a.status === "Overdue" ? 1 : 0;
        const bOverdue = b.status === "Overdue" ? 1 : 0;
        if (aOverdue !== bOverdue) return bOverdue - aOverdue;

        // 2. Escalated next
        const aEsc = a.isEscalated ? 1 : 0;
        const bEsc = b.isEscalated ? 1 : 0;
        if (aEsc !== bEsc) return bEsc - aEsc;

        // 3. Days remaining ascending (most negative / closest due date first)
        if (a.daysRemaining !== b.daysRemaining) {
          return a.daysRemaining - b.daysRemaining;
        }

        // 4. Urgency weight descending
        return (
          (URGENCY_WEIGHT[b.urgencyLevel] ?? 1) -
          (URGENCY_WEIGHT[a.urgencyLevel] ?? 1)
        );
      })
      .slice(0, 2);
  }, [enrichedDeadlines]);

  // Build universal omni-search index across all entities
  const allSearchItems = useMemo<OmniSearchResult[]>(() => {
    const items: OmniSearchResult[] = [...STATIC_FEATURE_RESULTS];

    // 1. AI Analysis Results (Validation Logs)
    validationLogs.forEach((log) => {
      const scoreText =
        log.processing_status === "processing"
          ? "Sedang Diproses AI"
          : `Skor ${Math.round(log.overall_score)}/100 · ${log.compliance_status}`;
      items.push({
        id: `val-${log.id}`,
        category: "Hasil Analisis AI",
        title: log.document_name,
        subtitle: `${log.id} · ${log.profile_name || "Pemeriksaan AI"} · ${scoreText}`,
        badgeText:
          log.processing_status === "processing"
            ? "Memproses"
            : `${Math.round(log.overall_score)}%`,
        badgeUrgent: log.compliance_status === "Perlu Perbaikan",
        href: `/dashboard/documents/result?id=${encodeURIComponent(log.id)}`,
        keywords: `${log.id} ${log.document_name} ${log.profile_name || ""} ${log.compliance_status} ${log.validated_by_name || ""} analisis ai hasil pemeriksaan`,
      });
    });

    // 2. Procurement Jobs
    requests.forEach((req) => {
      const code = formatRequestCode(req.id);
      items.push({
        id: `req-${req.id}`,
        category: "Pekerjaan Pengadaan",
        title: req.title,
        subtitle: `${code} · Tahap ${req.stage} (${req.currentStep}) · PIC: ${req.pic.name} · ${formatRupiah(req.amount)}`,
        badgeText: req.stage,
        badgeUrgent: Boolean(req.isUrgent),
        href: `/dashboard/overview/${encodeURIComponent(req.id)}`,
        keywords: `${req.id} ${code} ${req.title} ${req.department.name} ${req.pic.name} ${req.fpp.name} ${req.stage} ${req.currentStep} ${req.operationalStatus} pekerjaan pengadaan`,
      });
    });

    // 3. Documents (not already duplicated by validation logs with same ID)
    const loggedDocIds = new Set(
      validationLogs.map((l) => l.document_id || l.id)
    );
    documents.forEach((doc) => {
      if (loggedDocIds.has(doc.id)) return;
      items.push({
        id: `doc-${doc.id}`,
        category: "Dokumen & Template",
        title: doc.name,
        subtitle: `${doc.id} · ${doc.documentKind || doc.type} · PIC: ${doc.pic.name}`,
        badgeText: doc.status,
        href: `/dashboard/documents/result?id=${encodeURIComponent(doc.id)}`,
        keywords: `${doc.id} ${doc.name} ${doc.documentKind || ""} ${doc.status} ${doc.pic.name} dokumen berkas`,
      });
    });

    // 4. Validation Templates
    validationProfiles.forEach((prof) => {
      items.push({
        id: `prof-${prof.id}`,
        category: "Dokumen & Template",
        title: prof.name,
        subtitle: `Template Standar · ${prof.document_kind} · Ambang Lulus ${prof.passing_score_threshold}/100`,
        badgeText: "Template",
        href: `/dashboard/documents/templates/form?id=${encodeURIComponent(prof.id)}`,
        keywords: `${prof.name} ${prof.document_kind} ${prof.description || ""} template standar checklist`,
      });
    });

    // 5. Guarantees (Warkat Jaminan)
    guarantees.forEach((g) => {
      items.push({
        id: `guar-${g.id}`,
        category: "Warkat Jaminan",
        title: `${g.referenceNo} — ${g.vendor.name}`,
        subtitle: `${g.type} · Penerbit: ${g.issuer} · Berlaku s/d ${formatDateIndo(g.expiryDate)}`,
        badgeText: g.status,
        badgeUrgent: g.status === "Expired" || g.status === "Klaim Diajukan",
        href: g.requestId
          ? `/dashboard/overview/${encodeURIComponent(g.requestId)}?tab=docs-guarantees`
          : "/dashboard/overview?lens=guarantees",
        keywords: `${g.referenceNo} ${g.vendor.name} ${g.issuer} ${g.type} ${g.status} warkat jaminan garansi`,
      });
    });

    // 6. SLA & Deadlines
    enrichedDeadlines.forEach((dl) => {
      const reqMatch = requests.find((r) => r.id === dl.requestId);
      const timingLabel =
        dl.status === "Selesai"
          ? "Selesai"
          : dl.daysRemaining < 0
          ? `Terlambat ${Math.abs(dl.daysRemaining)} hari`
          : dl.daysRemaining === 0
          ? "Jatuh tempo hari ini"
          : `${dl.daysRemaining} hari lagi`;

      items.push({
        id: `sla-${dl.id}`,
        category: "Target SLA",
        title: dl.taskName,
        subtitle: `${reqMatch ? reqMatch.title : formatRequestCode(dl.requestId)} · PIC: ${dl.pic.name} · Target: ${formatDateIndo(dl.targetDate)}`,
        badgeText: timingLabel,
        badgeUrgent: dl.status === "Overdue" || dl.isEscalated,
        deadlineItem: dl,
        keywords: `${dl.taskName} ${dl.milestone} ${dl.pic.name} ${dl.department.name} ${dl.status} ${reqMatch?.title || ""} sla deadline tenggat`,
      });
    });

    return items;
  }, [
    validationLogs,
    requests,
    documents,
    validationProfiles,
    guarantees,
    enrichedDeadlines,
  ]);

  // Filter & rank results when user types a query
  const filteredResults = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return [];
    }

    const tokens = trimmed.split(/\s+/).filter(Boolean);

    const matched = allSearchItems
      .map((item) => {
        const titleLower = item.title.toLowerCase();
        const subLower = item.subtitle.toLowerCase();
        const kwLower = item.keywords.toLowerCase();
        const catLower = item.category.toLowerCase();

        const allMatch = tokens.every(
          (tok) =>
            titleLower.includes(tok) ||
            subLower.includes(tok) ||
            kwLower.includes(tok) ||
            catLower.includes(tok)
        );
        if (!allMatch) return null;

        let score = 0;
        if (titleLower.startsWith(trimmed)) score += 100;
        else if (titleLower.includes(trimmed)) score += 60;
        if (subLower.includes(trimmed)) score += 30;
        if (item.category === "Fitur & Navigasi") score += 10;

        return { item, score };
      })
      .filter((entry): entry is { item: OmniSearchResult; score: number } => entry !== null)
      .sort((a, b) => b.score - a.score);

    // Group and cap per category (max 4 per category, max 16 total) so dropdown stays clean
    const categoryOrder: OmniCategory[] = [
      "Fitur & Navigasi",
      "Hasil Analisis AI",
      "Pekerjaan Pengadaan",
      "Dokumen & Template",
      "Warkat Jaminan",
      "Target SLA",
    ];

    const grouped: OmniSearchResult[] = [];
    for (const cat of categoryOrder) {
      const catItems = matched
        .filter((m) => m.item.category === cat)
        .slice(0, 4)
        .map((m) => m.item);
      grouped.push(...catItems);
    }

    return grouped.slice(0, 16);
  }, [query, allSearchItems]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  const handleAskAi = (customQuery?: string) => {
    const q = (customQuery ?? query).trim();
    if (!q) return;

    setIsFocused(false);
    const session = createChatSession(q);
    router.push(`/dashboard/onboarding/chat/${encodeURIComponent(session.id)}`);
  };

  const handleSelectResult = (item: OmniSearchResult) => {
    setIsFocused(false);
    if (item.deadlineItem) {
      setSelectedSlaModal(item.deadlineItem);
      return;
    }
    if (item.href) {
      router.push(item.href);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsFocused(false);
      inputRef.current?.blur();
      return;
    }

    const totalCount = filteredResults.length;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (totalCount === 0) {
        setActiveIndex(-1);
        return;
      }
      setActiveIndex((prev) => (prev + 1 >= totalCount ? -1 : prev + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (totalCount === 0) {
        setActiveIndex(-1);
        return;
      }
      setActiveIndex((prev) => (prev - 1 < -1 ? totalCount - 1 : prev - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex === -1 || totalCount === 0) {
        handleAskAi();
      } else {
        const target = filteredResults[activeIndex];
        if (target) {
          handleSelectResult(target);
        }
      }
    }
  };

  const activeJobsCount = useMemo(
    () =>
      requests.filter(
        (r) => r.operationalStatus === "On Going" && r.stage !== "Selesai"
      ).length,
    [requests]
  );

  const firstName = currentUser?.name?.split(" ")[0] || "Rekan";
  const showDropdown = isFocused && query.trim().length > 0;

  // Group filteredResults by category for rendering headers
  const groupedSections = useMemo(() => {
    const map = new Map<OmniCategory, { item: OmniSearchResult; flatIndex: number }[]>();
    filteredResults.forEach((item, idx) => {
      const list = map.get(item.category) ?? [];
      list.push({ item, flatIndex: idx });
      map.set(item.category, list);
    });
    return Array.from(map.entries());
  }, [filteredResults]);

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#f4f7fb] px-4 py-12">
      {/* Animated Floating Blue Shades Background */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="animate-blue-shade-1 absolute -top-24 -left-20 h-[420px] w-[420px] rounded-full bg-[#0a4d8c]/12 blur-[95px]" />
        <div className="animate-blue-shade-2 absolute top-1/4 -right-24 h-[460px] w-[460px] rounded-full bg-blue-400/15 blur-[110px]" />
        <div className="animate-blue-shade-3 absolute -bottom-28 left-1/3 h-[380px] w-[440px] rounded-full bg-[#1565c0]/12 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center">
        {/* Minimalist Greeting */}
        <div className="text-center mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
            Selamat bertugas, {firstName}
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
            Cari dokumen, pekerjaan, hasil analisis AI, warkat jaminan, atau fitur di seluruh PRIMA.
          </p>
        </div>

        {/* Centered Omni-Search Bar */}
        <div
          ref={searchContainerRef}
          className="relative w-full max-w-2xl z-30"
        >
          <div
            className={`flex items-center w-full rounded-xl border bg-white px-4 py-3 shadow-xs transition-all duration-150 ${
              isFocused
                ? "border-[#0a4d8c] ring-3 ring-[#0a4d8c]/12 shadow-md"
                : "border-slate-200/90 hover:border-slate-300"
            }`}
          >
            <Search
              size={18}
              className={`shrink-0 transition-colors ${
                isFocused ? "text-[#0a4d8c]" : "text-slate-400"
              }`}
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onFocus={() => setIsFocused(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsFocused(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Cari dokumen, pekerjaan, SLA, atau ketik pertanyaan & perintah untuk AI..."
              className="w-full bg-transparent px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              aria-label="Cari atau tanya AI di seluruh PRIMA"
            />
            {query ? (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleAskAi()}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#0a4d8c] px-2.5 py-1 text-[11px] font-semibold text-white shadow-2xs transition hover:!bg-[#083b6c]"
                  title="Mulai Diskusi AI (Mode Cekatan)"
                >
                  <Sparkles size={12} />
                  <span className="hidden sm:inline">Diskusi AI</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  aria-label="Bersihkan pencarian"
                >
                  <X size={15} />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                <span className="inline-flex items-center gap-1 rounded-md border border-[#0a4d8c]/20 bg-[#e8f2fc] px-1.5 py-0.5 text-[10px] font-semibold text-[#0a4d8c]">
                  <Zap size={10} />
                  AI Cekatan
                </span>
                <kbd className="inline-flex items-center gap-0.5 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                  Ctrl K
                </kbd>
              </div>
            )}
          </div>

          {/* Omni-Search Results Dropdown */}
          {showDropdown && (
            <div className="absolute left-0 right-0 top-full mt-2 max-h-[440px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl scrollbar-thin">
              {/* Top Generative AI Option (Always available at index -1) */}
              <div className="mb-1.5 pb-1.5 border-b border-slate-100">
                <button
                  type="button"
                  onMouseEnter={() => setActiveIndex(-1)}
                  onClick={() => handleAskAi()}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    activeIndex === -1
                      ? "bg-[#e8f2fc] text-[#0a4d8c]"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0a4d8c] text-white">
                      <Sparkles size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-xs font-semibold text-slate-900">
                          Tanya atau Perintahkan AI: &ldquo;{query}&rdquo;
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-[#0a4d8c]/20 bg-white px-2 py-0.5 text-[9px] font-semibold text-[#0a4d8c]">
                          <Zap size={9} />
                          Mode Cekatan
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-slate-500">
                        Jawab pertanyaan dari data real-time PRIMA atau jalankan perintah langsung
                      </p>
                    </div>
                  </div>
                  <CornerDownLeft
                    size={13}
                    className={`shrink-0 transition-opacity ${
                      activeIndex === -1
                        ? "opacity-100 text-[#0a4d8c]"
                        : "opacity-0"
                    }`}
                  />
                </button>
              </div>

              {groupedSections.length > 0 ? (
                <div className="space-y-2.5">
                  {groupedSections.map(([category, entries]) => (
                    <div key={category}>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        {getCategoryIcon(category)}
                        <span>{category}</span>
                      </div>
                      <div className="space-y-0.5">
                        {entries.map(({ item, flatIndex }) => {
                          const isSelected = flatIndex === activeIndex;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onMouseEnter={() => setActiveIndex(flatIndex)}
                              onClick={() => handleSelectResult(item)}
                              className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                                isSelected
                                  ? "bg-[#e8f2fc] text-[#0a4d8c]"
                                  : "text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="truncate text-xs font-semibold text-slate-900">
                                    {item.title}
                                  </span>
                                  {item.badgeText && (
                                    <span
                                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                                        item.badgeUrgent
                                          ? "border-red-200 bg-red-50 text-red-700"
                                          : "border-slate-200 bg-slate-100 text-slate-600"
                                      }`}
                                    >
                                      {item.badgeText}
                                    </span>
                                  )}
                                </div>
                                <p className="mt-0.5 truncate text-[11px] text-slate-500">
                                  {item.subtitle}
                                </p>
                              </div>
                              <CornerDownLeft
                                size={13}
                                className={`shrink-0 transition-opacity ${
                                  isSelected
                                    ? "opacity-100 text-[#0a4d8c]"
                                    : "opacity-0"
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-3 px-3 text-center">
                  <p className="text-[11px] text-slate-500">
                    Tidak ada kecocokan kata kunci langsung — tekan <strong className="font-semibold text-[#0a4d8c]">Enter</strong> untuk memulai Diskusi AI (Mode Cekatan).
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4 Side-by-Side Quick Action Buttons */}
        <div className="mt-4 grid w-full max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* 1. Cek Daftar Pekerjaan */}
          <button
            type="button"
            onClick={() => router.push("/dashboard/overview")}
            className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-2xs transition-all hover:border-[#0a4d8c]/40 hover:bg-[#f8fbff] hover:shadow-xs focus:outline-none"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8f2fc] text-[#0a4d8c]">
                <Briefcase size={16} />
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                {activeJobsCount} Aktif
              </span>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-semibold text-slate-900 group-hover:text-[#0a4d8c] transition-colors">
                  Cek Daftar Pekerjaan
                </span>
                <ArrowRight
                  size={13}
                  className="shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#0a4d8c]"
                />
              </div>
              <p className="mt-0.5 truncate text-[11px] text-slate-500">
                Pantau progres & tahapan pengadaan
              </p>
            </div>
          </button>

          {/* 2. Validasi Dokumen Baru */}
          <button
            type="button"
            onClick={() => router.push("/dashboard/documents/upload")}
            className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-2xs transition-all hover:border-[#0a4d8c]/40 hover:bg-[#f8fbff] hover:shadow-xs focus:outline-none"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0a4d8c] text-white">
                <FilePlus2 size={16} />
              </div>
              <span className="rounded-full border border-[#0a4d8c]/20 bg-[#e8f2fc] px-2 py-0.5 text-[10px] font-medium text-[#0a4d8c]">
                AI Checklist
              </span>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-semibold text-slate-900 group-hover:text-[#0a4d8c] transition-colors">
                  Validasi Dokumen Baru
                </span>
                <ArrowRight
                  size={13}
                  className="shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#0a4d8c]"
                />
              </div>
              <p className="mt-0.5 truncate text-[11px] text-slate-500">
                Unggah & analisis kelayakan berkas
              </p>
            </div>
          </button>

          {/* 3 & 4. Top 2 Most Urgent SLAs */}
          {[0, 1].map((slotIdx) => {
            const sla = topUrgentSlas[slotIdx];
            if (!sla) {
              return (
                <button
                  key={`sla-fallback-${slotIdx}`}
                  type="button"
                  onClick={() => router.push("/dashboard/overview?lens=sla-actions")}
                  className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-2xs transition-all hover:border-[#0a4d8c]/40 hover:bg-[#f8fbff] hover:shadow-xs focus:outline-none"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <CheckCircle2 size={16} />
                    </div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      SLA Aman
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-slate-900 group-hover:text-[#0a4d8c] transition-colors">
                        Jadwal Target SLA
                      </span>
                      <ArrowRight
                        size={13}
                        className="shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#0a4d8c]"
                      />
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">
                      Semua tenggat waktu terkendali
                    </p>
                  </div>
                </button>
              );
            }

            const isTrulyUrgent =
              sla.status === "Overdue" ||
              sla.isEscalated ||
              sla.urgencyLevel === "Critical" ||
              sla.daysRemaining <= 0;

            const daysLabel =
              sla.daysRemaining < 0
                ? `Terlambat ${Math.abs(sla.daysRemaining)}h`
                : sla.daysRemaining === 0
                ? "Hari Ini"
                : `H-${sla.daysRemaining}`;

            const linkedReq = requests.find((r) => r.id === sla.requestId);

            return (
              <button
                key={sla.id}
                type="button"
                onClick={() => setSelectedSlaModal(sla)}
                className={`group flex flex-col justify-between rounded-xl border bg-white p-3.5 text-left shadow-2xs transition-all hover:shadow-xs focus:outline-none ${
                  isTrulyUrgent
                    ? "border-red-200/90 hover:border-red-300 hover:bg-red-50/20"
                    : "border-slate-200 hover:border-[#0a4d8c]/40 hover:bg-[#f8fbff]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      isTrulyUrgent
                        ? "bg-red-50 text-red-600"
                        : "bg-[#e8f2fc] text-[#0a4d8c]"
                    }`}
                  >
                    {isTrulyUrgent ? <AlertTriangle size={16} /> : <Clock size={16} />}
                  </div>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                      isTrulyUrgent
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-[#0a4d8c]/20 bg-[#e8f2fc] text-[#0a4d8c]"
                    }`}
                  >
                    SLA · {daysLabel}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`truncate text-xs font-semibold transition-colors ${
                        isTrulyUrgent
                          ? "text-slate-900 group-hover:text-red-700"
                          : "text-slate-900 group-hover:text-[#0a4d8c]"
                      }`}
                      title={sla.taskName}
                    >
                      {sla.taskName}
                    </span>
                    <ArrowRight
                      size={13}
                      className={`shrink-0 transition-transform group-hover:translate-x-0.5 ${
                        isTrulyUrgent
                          ? "text-red-400 group-hover:text-red-600"
                          : "text-slate-400 group-hover:text-[#0a4d8c]"
                      }`}
                    />
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-slate-500">
                    {linkedReq ? linkedReq.title : formatRequestCode(sla.requestId)} · {sla.pic.name}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SLA Action Modal when clicking an urgent SLA button or search result */}
      {selectedSlaModal && (
        <SLAActionModal
          deadline={selectedSlaModal}
          onClose={() => setSelectedSlaModal(null)}
        />
      )}
    </div>
  );
}
