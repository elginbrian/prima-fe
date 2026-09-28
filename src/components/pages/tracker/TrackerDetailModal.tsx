import { useEffect } from "react";
import { createPortal } from "react-dom";
import { LayoutList, X, CheckCircle2, FileText, ChevronRight, ChevronDown, ShieldCheck, CalendarClock } from "lucide-react";
import { ProcurementRequest, ProcurementOperationalStatus, ProcurementStep, DeadlineItem, DocumentItem, GuaranteeItem, HistoryItem, ProcurementMilestone } from "@/types";
import { useProcurement } from "@/lib/query/hooks/procurement/useProcurement";

import { TrackerDetailModalProps } from "./types";

const PROCUREMENT_STEPS: ProcurementStep[] = [
  "Rapat Pra-Tender",
  "Pengumuman Pengadaan",
  "Prebid Meeting",
  "Pemasukan Dokumen Penawaran",
  "Pembukaan Penawaran",
  "Evaluasi Dokumen Penawaran",
  "Sosialisasi e-Auction",
  "Negosiasi e-Auction",
  "Negosiasi Manual",
  "Laporan Hasil Pemilihan",
  "Pengumuman Pemenang",
  "Penunjukan Pemenang",
];

export function TrackerDetailModal({
  selectedRequestId, setSelectedRequestId, request: initialRequest, milestones: initialMilestones, docs, guars, slas, history,
  showFullTimeline, setShowFullTimeline, statusReasonDraft, setStatusReasonDraft,
  moveRequestStep, updateRequestOperationalStatus, expandedRelatedId, setExpandedRelatedId,
  router, setAddingDeadlineRequestId, setEditingDeadlineId
}: TrackerDetailModalProps) {
  const { data: detailData, isLoading } = useProcurement(selectedRequestId);
  
  const request = detailData?.request ?? initialRequest;
  const milestones = detailData?.milestones ?? initialMilestones;

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedRequestId(null); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [setSelectedRequestId]);

  if (typeof document === 'undefined') return null;

  const currentMilestoneIndex = milestones.findIndex(m => m.status === "In Progress");
  const nextMilestone = milestones.find(m => m.status === "Pending");
  const completedMilestones = milestones.filter(m => m.status === "Done").length;
  const timelineStart = showFullTimeline ? 0 : Math.max(0, currentMilestoneIndex > -1 ? currentMilestoneIndex - 1 : 0);
  const visibleMilestones = showFullTimeline ? milestones : milestones.slice(timelineStart, timelineStart + 3);
  const hasHiddenMilestones = !showFullTimeline && milestones.length > visibleMilestones.length;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex min-h-dvh items-center justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300" onClick={() => setSelectedRequestId(null)}>
      <div role="dialog" aria-modal="true" aria-labelledby="tracker-detail-title" className="flex max-h-[calc(100dvh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300 ease-out" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-6 py-5 sm:px-8">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-slate-500">
              <LayoutList size={18} />
              <span className="text-[11px] font-bold uppercase tracking-[0.16em]">Ringkasan Pekerjaan</span>
            </div>
            <h3 id="tracker-detail-title" className="mt-2 truncate text-lg font-bold text-slate-800">{request?.title ?? selectedRequestId}</h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-500">
              <span>{selectedRequestId}</span>
              {request && <span>PIC: {request.pic.name}</span>}
              {request && <span>{request.amount}</span>}
            </div>
          </div>
          <button aria-label="Tutup detail request" onClick={() => setSelectedRequestId(null)} className="shrink-0 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 space-y-8 overflow-y-auto p-6 sm:p-8">
          {request && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#0a4d8c]">Posisi proses saat ini</div>
                  <div className="mt-1 text-lg font-bold text-slate-800">{request.currentStep}</div>
                  <div className="mt-1 text-xs text-slate-500">Stage ringkas: {request.stage} · {completedMilestones} dari {milestones.length} tahap selesai</div>
                </div>
                <label className="w-full lg:w-72">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Update tahap manual</span>
                  <select
                    value={request.currentStep}
                    onChange={(event) => moveRequestStep(selectedRequestId, event.target.value as ProcurementStep)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-[#0a4d8c] focus:outline-none"
                  >
                    {PROCUREMENT_STEPS.map(step => <option key={step} value={step}>{step}</option>)}
                  </select>
                </label>
                <label className="w-full lg:w-44">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Status pekerjaan</span>
                  <select
                    value={request.operationalStatus}
                    onChange={(event) => updateRequestOperationalStatus(selectedRequestId, event.target.value as ProcurementOperationalStatus, event.target.value === "On Going" ? "" : statusReasonDraft)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-[#0a4d8c] focus:outline-none"
                  >
                    <option value="On Going">On Going</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Batal">Batal</option>
                  </select>
                </label>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/80"><div className="h-full rounded-full bg-[#0a4d8c] transition-all" style={{ width: `${milestones.length ? ((completedMilestones + (currentMilestoneIndex >= 0 ? 1 : 0)) / milestones.length) * 100 : 0}%` }} /></div>
              {nextMilestone && <div className="mt-2 text-[11px] font-medium text-slate-500">Berikutnya: <span className="font-semibold text-slate-700">{nextMilestone.step}</span></div>}
              {request.operationalStatus !== "On Going" && <div className="mt-4 border-t border-blue-100 pt-4"><label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Alasan status {request.operationalStatus}</label><div className="mt-2 flex flex-col gap-2 sm:flex-row"><input value={statusReasonDraft} onChange={(event) => setStatusReasonDraft(event.target.value)} placeholder={request.operationalStatus === "On Hold" ? "Contoh: menunggu klarifikasi user" : "Contoh: kebutuhan dibatalkan peminta"} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-[#0a4d8c] focus:outline-none" /><button type="button" onClick={() => updateRequestOperationalStatus(selectedRequestId, request.operationalStatus, statusReasonDraft)} className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-[#0a4d8c] hover:bg-blue-50">Simpan Alasan</button></div></div>}
            </div>
          )}

          <section>
            <div className="flex items-end justify-between gap-3 border-b border-slate-200 pb-3">
              <div><h4 className="text-sm font-bold text-slate-800">Timeline proses procurement</h4><p className="mt-1 text-xs text-slate-500">Status setiap tahap Berita Acara dan deliverable terkait.</p></div>
              <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-[#0a4d8c]">{request?.stage ?? "-"}</span>
            </div>
            <div className="relative mt-5 space-y-1">
              <div className="absolute bottom-5 left-[15px] top-5 w-px bg-slate-200" />
              {visibleMilestones.map((milestone, index) => {
                const milestoneIndex = timelineStart + index;
                const isDone = milestone.status === "Done";
                const isCurrent = milestone.status === "In Progress";
                const milestoneSlas = slas.filter(sla => sla.milestone === milestone.step);
                return (
                  <div key={milestone.id} className="relative flex gap-4 py-2">
                    <div className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-4 border-white text-[11px] font-bold ${isDone ? "bg-emerald-500 text-white" : isCurrent ? "bg-[#0a4d8c] text-white ring-4 ring-blue-100" : "bg-slate-100 text-slate-400"}`}>
                      {isDone ? <CheckCircle2 size={15} /> : milestoneIndex + 1}
                    </div>
                    <div className={`min-w-0 flex-1 rounded-lg border px-3 py-2.5 ${isCurrent ? "border-blue-200 bg-blue-50/60" : isDone ? "border-emerald-100 bg-emerald-50/40" : "border-slate-100 bg-white"}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className={`text-sm font-semibold ${isCurrent ? "text-[#0a4d8c]" : "text-slate-700"}`}>{milestone.step}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isDone ? "text-emerald-600" : isCurrent ? "text-[#0a4d8c]" : "text-slate-400"}`}>{isDone ? "Selesai" : isCurrent ? "Sedang berjalan" : "Berikutnya"}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-slate-500">
                        {milestone.date && <span>{milestone.date}</span>}
                        {milestone.pic && <span>PIC: {milestone.pic.name}</span>}
                        {milestone.documentId && <span>Dokumen tertaut: {milestone.documentId}</span>}
                      </div>
                      
                      {milestoneSlas.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {milestoneSlas.map(s => (
                            <div key={s.id} className="overflow-hidden rounded-md border border-slate-200 bg-white/60">
                              <button onClick={() => setExpandedRelatedId(current => current === `sla-${s.id}` ? null : `sla-${s.id}`)} className="flex w-full items-center justify-between gap-3 px-2.5 py-2 text-left transition hover:bg-white">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5"><CalendarClock size={14} className="text-slate-400" /><span className="truncate text-xs font-semibold text-slate-700">{s.taskName}</span></div>
                                  <div className="mt-1 text-[11px] text-slate-500">PIC: {s.pic.name} • Target: {s.targetDate}</div>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${s.status === 'On Track' || s.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : s.status === 'At Risk' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                    {s.status === "Overdue" ? `${Math.abs(s.daysRemaining)}h lewat` : s.status === "Selesai" ? "Selesai" : `${s.daysRemaining}h sisa`}
                                  </span>
                                  {expandedRelatedId === `sla-${s.id}` ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                                </div>
                              </button>
                              {expandedRelatedId === `sla-${s.id}` && (
                                <div className="border-t border-slate-100 bg-slate-50 px-3 py-3 text-[11px] text-slate-600">
                                  <div><span className="font-semibold">SLA:</span> {s.startDate ?? "-"} s.d. {s.targetDate} • Urgensi: {s.urgencyLevel}</div>
                                  {s.status === "Overdue" && s.overdueReason && <div className="mt-1 text-red-600 font-medium">Alasan telat: {s.overdueReason}</div>}
                                  {s.nextAction && <div className="mt-1"><span className="font-semibold text-[#0a4d8c]">Next Action:</span> {s.nextAction}</div>}
                                  <button onClick={() => setEditingDeadlineId(s.id)} className="mt-2 text-[#0a4d8c] font-semibold hover:underline">Edit SLA</button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {!isDone && (
                        <button type="button" onClick={() => setAddingDeadlineRequestId(selectedRequestId)} className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-blue-200 bg-blue-50/50 py-2.5 text-[11px] font-bold text-[#0a4d8c] transition hover:bg-blue-100/50">
                          + Tambah SLA di tahapan ini
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {hasHiddenMilestones && <button type="button" onClick={() => setShowFullTimeline(true)} className="mt-4 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0a4d8c]">Tampilkan {milestones.length - visibleMilestones.length} tahapan lainnya</button>}
            {showFullTimeline && milestones.length > 3 && <button type="button" onClick={() => setShowFullTimeline(false)} className="mt-4 text-xs font-semibold text-[#0a4d8c] hover:underline">Ringkas timeline</button>}
          </section>
          
          {/* Documents Section */}
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-[#0a4d8c] font-semibold text-sm">
                <FileText size={16} />
                Dokumen
              </div>
              <button onClick={() => router.push('/dashboard/documents')} className="text-[11px] font-medium text-slate-500 hover:text-[#0a4d8c] transition-colors flex items-center gap-1">
                Ke Modul Dokumen <ChevronRight size={12} />
              </button>
            </div>
            {docs.length > 0 ? (
              <div className="space-y-2">
                {docs.map(d => (
                  <div key={d.id}>
                    <button onClick={() => setExpandedRelatedId(current => current === `doc-${d.id}` ? null : `doc-${d.id}`)} className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-left transition hover:border-blue-200 hover:bg-blue-50/40">
                      <div className="min-w-0"><div className="truncate text-[12px] font-medium text-slate-800">{d.name}</div><div className="mt-0.5 text-[11px] text-slate-500">{d.type} • {d.uploadDate}</div></div>
                      <div className="flex shrink-0 items-center gap-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${d.status === 'Lulus Verifikasi' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{d.status}</span>{expandedRelatedId === `doc-${d.id}` ? <ChevronDown size={15} className="text-slate-400" /> : <ChevronRight size={15} className="text-slate-400" />}</div>
                    </button>
                    {expandedRelatedId === `doc-${d.id}` && <div className="border-x border-b border-slate-200 bg-white px-3 py-3 text-xs text-slate-600"><div>{d.issues.length > 0 ? d.issues.join(" ") : "Tidak ada temuan pemeriksaan."}</div>{d.nextAction && <div className="mt-2"><span className="font-semibold text-[#0a4d8c]">Next Action:</span> {d.nextAction}</div>}<button onClick={() => router.push(`/dashboard/documents/result?id=${d.id}`)} className="mt-3 font-semibold text-[#0a4d8c] hover:underline">Buka hasil pemeriksaan</button></div>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic py-2 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">Tidak ada dokumen tertaut.</div>
            )}
          </div>

          {/* Guarantees Section */}
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-[#0a4d8c] font-semibold text-sm">
                <ShieldCheck size={16} />
                Jaminan
              </div>
              <div className="flex items-center gap-3"><button onClick={() => router.push('/dashboard/guarantees')} className="text-[11px] font-medium text-slate-500 hover:text-[#0a4d8c] transition-colors flex items-center gap-1">Lihat Semua <ChevronRight size={12} /></button><button onClick={() => router.push(`/dashboard/guarantees/upload?requestId=${selectedRequestId}`)} className="rounded-md bg-[#0a4d8c] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#093e6f]">+ Jaminan</button></div>
            </div>
            {guars.length > 0 ? (
              <div className="space-y-2">
                {guars.map(g => (
                  <div key={g.id}>
                    <button onClick={() => setExpandedRelatedId(current => current === `guarantee-${g.id}` ? null : `guarantee-${g.id}`)} className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-left transition hover:border-blue-200 hover:bg-blue-50/40">
                      <div className="min-w-0"><div className="truncate text-[12px] font-medium text-slate-800">{g.vendor.name}</div><div className="mt-0.5 text-[11px] text-slate-500">{g.type} • Jatuh tempo: {g.expiryDate}</div></div>
                      <div className="flex shrink-0 items-center gap-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${g.status === 'Aktif' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{g.status}</span>{expandedRelatedId === `guarantee-${g.id}` ? <ChevronDown size={15} className="text-slate-400" /> : <ChevronRight size={15} className="text-slate-400" />}</div>
                    </button>
                    {expandedRelatedId === `guarantee-${g.id}` && <div className="border-x border-b border-slate-200 bg-white px-3 py-3 text-xs text-slate-600"><div><span className="font-semibold">{g.referenceNo}</span> • {g.issuer} • {g.value}</div>{g.nextAction && <div className="mt-2"><span className="font-semibold text-[#0a4d8c]">Next Action:</span> {g.nextAction}</div>}<button onClick={() => router.push('/dashboard/guarantees')} className="mt-3 font-semibold text-[#0a4d8c] hover:underline">Buka modul jaminan</button></div>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic py-2 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">Tidak ada jaminan tertaut.</div>
            )}
          </div>


          <section>
            <div className="flex items-end justify-between gap-3 border-b border-slate-200 pb-3"><div><h4 className="text-sm font-bold text-slate-800">Histori Aktivitas</h4><p className="mt-1 text-xs text-slate-500">Perubahan penting pada pekerjaan, timeline, SLA, dokumen, dan jaminan.</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{history.length} aktivitas</span></div>
            {history.length > 0 ? <div className="relative mt-4 space-y-4 border-l border-slate-200 pl-5">{history.map(item => <div key={item.id} className="relative"><span className={`absolute -left-[25px] top-1.5 h-3 w-3 rounded-full border-2 border-white ${item.category === "SLA" ? "bg-amber-500" : item.category === "Jaminan" ? "bg-emerald-500" : item.category === "Dokumen" ? "bg-blue-500" : "bg-slate-500"}`} /><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-semibold text-slate-800">{item.title}</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{item.category}</span></div><p className="mt-1 text-xs text-slate-600">{item.description}</p><time className="mt-1 block text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleString("id-ID")}</time></div>)}</div> : <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">Belum ada aktivitas yang tercatat untuk pekerjaan ini.</div>}
          </section>
        </div>
      </div>
    </div>
  , document.body);
}
