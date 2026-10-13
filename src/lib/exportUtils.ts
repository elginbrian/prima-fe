import { GuaranteeItem, ProcurementRequest, DeadlineItem, DocumentItem } from "@/types";
import { calculateDaysRemaining } from "@/lib/utils";

/**
 * Utility to download raw data as Excel-compatible CSV with UTF-8 BOM
 */
export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const sanitize = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = [
    headers.map(sanitize).join(","),
    ...rows.map((row) => row.map(sanitize).join(",")),
  ].join("\r\n");

  // UTF-8 BOM allows Microsoft Excel to open Indonesian / special characters correctly
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export Guarantees (Modul D2)
 */
export function exportGuaranteesToCsv(guarantees: GuaranteeItem[]) {
  const headers = [
    "Nomor Jaminan",
    "ID Pengadaan",
    "Tipe Jaminan",
    "Nilai (Rp)",
    "Nama Vendor",
    "Penerbit (Bank / Asuransi)",
    "Jenis Penerbit",
    "Penerima Jaminan",
    "Tanggal Terbit",
    "Tanggal Expiry",
    "Sisa Hari",
    "Status Jaminan",
    "PIC Pengadaan",
    "Next Action",
  ];

  const rows = guarantees.map((g) => {
    const daysLeft = calculateDaysRemaining(g.expiryDate);
    return [
      g.referenceNo,
      g.requestId,
      g.type,
      g.value,
      g.vendor.name,
      g.issuer,
      g.issuerType || "-",
      g.beneficiary || "-",
      g.issueDate,
      g.expiryDate,
      daysLeft < 0 ? `Terlewat ${Math.abs(daysLeft)} hari` : `${daysLeft} hari`,
      g.status,
      g.pic.name,
      g.nextAction || "-",
    ];
  });

  downloadCsv("Rekapitulasi_Jaminan_PRIMA", headers, rows);
}

/**
 * Export Procurements / Tracker (Modul D3)
 */
export function exportProcurementsToCsv(requests: ProcurementRequest[]) {
  const headers = [
    "ID Pengadaan",
    "Judul Pengadaan",
    "Departemen",
    "Nilai Anggaran (Rp)",
    "Tahap Berjalan",
    "Sub-Tahap / Milestone",
    "Status Operasional",
    "PIC",
    "Tanggal Request",
  ];

  const rows = requests.map((r) => [
    r.id,
    r.title,
    r.department.name,
    r.amount,
    r.stage,
    r.currentStep,
    r.operationalStatus,
    r.pic.name,
    r.createdAt,
  ]);

  downloadCsv("Rekapitulasi_Pengadaan_PRIMA", headers, rows);
}

/**
 * Export Deadlines / SLA Tracker (Modul D4)
 */
export function exportDeadlinesToCsv(deadlines: DeadlineItem[]) {
  const headers = [
    "ID Deadline",
    "Tugas / Milestone",
    "ID Pengadaan",
    "PIC",
    "Departemen",
    "Target Selesai",
    "Status SLA",
    "Urgensi",
    "Next Action",
  ];

  const rows = deadlines.map((d) => [
    d.id,
    d.taskName,
    d.requestId,
    d.pic.name,
    d.department.name,
    d.targetDate,
    d.status,
    d.urgencyLevel,
    d.nextAction || "-",
  ]);

  downloadCsv("Rekapitulasi_SLA_Deadlines_PRIMA", headers, rows);
}

/**
 * Export Documents Verification List (Modul D2)
 */
export function exportDocumentsToCsv(documents: DocumentItem[], requests: ProcurementRequest[] = []) {
  const headers = [
    "ID Dokumen",
    "Nama Dokumen",
    "Tipe Dokumen",
    "ID Pengadaan",
    "Judul Pengadaan",
    "PIC",
    "Tanggal Unggah",
    "Status Verifikasi",
    "Jumlah Temuan",
    "Next Action",
  ];

  const rows = documents.map((doc) => {
    const req = requests.find((r) => r.id === doc.requestId);
    return [
      doc.id,
      doc.name,
      doc.type,
      doc.requestId,
      req?.title || "-",
      doc.pic.name,
      doc.uploadDate,
      doc.status,
      doc.issues.length,
      doc.nextAction || "-",
    ];
  });

  downloadCsv("Rekapitulasi_Dokumen_PRIMA", headers, rows);
}

/**
 * Export Next Actions / To-Do List (Modul D3 & D4)
 */
export function exportActionsToCsv(actions: import("@/types").ActionItem[]) {
  const headers = [
    "ID Tindakan",
    "Referensi",
    "Judul Tindakan",
    "Sumber",
    "Tipe Aksi",
    "Prioritas",
    "Assignee",
    "Tanggal Dibuat",
    "Batas Waktu (Due Date)",
    "Status",
    "Deskripsi",
  ];

  const rows = actions.map((a) => [
    a.id,
    a.referenceId,
    a.title,
    a.source,
    a.actionType,
    a.priority,
    a.assignee?.name || "-",
    a.dateAdded,
    a.dueDate,
    a.status,
    a.description,
  ]);

  downloadCsv("Rekapitulasi_NextAction_PRIMA", headers, rows);
}
