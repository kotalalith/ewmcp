"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Plus, Clock, CheckCircle2, XCircle, AlertCircle, X, ChevronRight, Loader2 } from "lucide-react";
import axios from "axios";

const LEAVE_TYPES = ["Annual", "Sick", "Emergency", "Maternity", "Paternity", "Unpaid", "Other"];
const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  Approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  Rejected: "bg-red-500/10 text-red-400 border-red-500/30",
  Cancelled: "bg-slate-500/10 text-slate-400 border-slate-500/30",
};

export default function LeavePage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "Employee";
  const isManager = ["Administrator", "Manager"].includes(role);

  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [form, setForm] = useState({ type: "Annual", startDate: "", endDate: "", reason: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; id: string }>({ open: false, id: "" });
  const [rejectReason, setRejectReason] = useState("");

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/leave");
      setLeaves(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLeaves(); }, []);

  const handleApply = async () => {
    if (!form.startDate || !form.endDate || !form.reason) return;
    setIsSubmitting(true);
    try {
      await axios.post("/api/leave", form);
      setForm({ type: "Annual", startDate: "", endDate: "", reason: "" });
      setIsModalOpen(false);
      fetchLeaves();
    } catch (e) { console.error(e); alert("Failed to apply leave."); }
    finally { setIsSubmitting(false); }
  };

  const handleApprove = async (id: string) => {
    try {
      await axios.put("/api/leave", { id, status: "Approved" });
      fetchLeaves();
    } catch (e) { console.error(e); }
  };

  const handleReject = async () => {
    try {
      await axios.put("/api/leave", { id: rejectModal.id, status: "Rejected", rejectionReason: rejectReason });
      setRejectModal({ open: false, id: "" });
      setRejectReason("");
      fetchLeaves();
    } catch (e) { console.error(e); }
  };

  const filters = ["All", "Pending", "Approved", "Rejected"];
  const filtered = activeFilter === "All" ? leaves : leaves.filter(l => l.status === activeFilter);

  const stats = {
    pending: leaves.filter(l => l.status === "Pending").length,
    approved: leaves.filter(l => l.status === "Approved").length,
    total: leaves.length,
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold font-outfit text-foreground flex items-center gap-3">
            <div className="p-2 bg-brand-500/10 rounded-xl text-brand-500"><CalendarDays className="w-6 h-6" /></div>
            Leave Management
          </h1>
          <p className="text-foreground/60 text-sm mt-1">
            {isManager ? "Review and manage team leave requests." : "Apply and track your leave requests."}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-brand-500/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Apply for Leave
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 shrink-0">
        {[
          { label: "Total Requests", value: stats.total, icon: CalendarDays, color: "text-brand-500", bg: "bg-brand-500/10" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Approved", value: stats.approved, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-panel p-5 rounded-2xl border border-[var(--border)]">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground font-outfit">{s.value}</p>
            <p className="text-xs text-foreground/60 mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 shrink-0">
        {filters.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeFilter === f ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20" : "bg-[var(--surface)] border border-[var(--border)] text-foreground/70 hover:text-foreground"}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Leave List */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pb-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl text-center border border-[var(--border)]">
            <CalendarDays className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
            <p className="text-foreground/50">No leave requests found.</p>
          </div>
        ) : (
          filtered.map((leave, i) => (
            <motion.div key={leave._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-panel p-5 rounded-2xl border border-[var(--border)] hover:border-brand-500/30 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${STATUS_COLORS[leave.status]}`}>
                      {leave.status}
                    </span>
                    <span className="bg-[var(--surface-border)] text-foreground/70 text-xs px-2 py-0.5 rounded-md font-medium">{leave.type} Leave</span>
                    <span className="text-xs text-foreground/50 font-medium">{leave.days} day{leave.days > 1 ? "s" : ""}</span>
                  </div>
                  {isManager && <p className="font-semibold text-foreground text-sm mb-1">{leave.applicantName} <span className="text-foreground/40 font-normal text-xs">— {leave.applicant}</span></p>}
                  <p className="text-sm text-foreground/70 mb-2">{leave.reason}</p>
                  <p className="text-xs text-foreground/50 flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5" />
                    {new Date(leave.startDate).toLocaleDateString()} — {new Date(leave.endDate).toLocaleDateString()}
                  </p>
                </div>

                {isManager && leave.status === "Pending" && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleApprove(leave._id)}
                      className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors" title="Approve">
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setRejectModal({ open: true, id: leave._id })}
                      className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 transition-colors" title="Reject">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              {leave.rejectionReason && (
                <div className="mt-3 p-3 bg-red-500/5 border border-red-500/20 rounded-xl text-xs text-red-400">
                  <strong>Rejection Reason:</strong> {leave.rejectionReason}
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Apply Leave Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-[var(--surface)] border border-[var(--border)] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden z-10">
              <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--background)]">
                <h2 className="text-xl font-bold font-outfit text-foreground">Apply for Leave</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-[var(--surface-border)] transition-colors"><X className="w-5 h-5 text-foreground/60" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Leave Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm focus:border-brand-500 transition-all text-foreground">
                    {LEAVE_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Start Date</label>
                    <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm focus:border-brand-500 transition-all text-foreground [color-scheme:dark]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">End Date</label>
                    <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm focus:border-brand-500 transition-all text-foreground [color-scheme:dark]" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Reason <span className="text-red-400">*</span></label>
                  <textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} rows={3} placeholder="Briefly describe the reason..." className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm focus:border-brand-500 transition-all text-foreground resize-none" />
                </div>
              </div>
              <div className="p-6 border-t border-[var(--border)] bg-[var(--background)] flex justify-end gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm hover:bg-[var(--surface-border)] transition-colors text-foreground">Cancel</button>
                <button onClick={handleApply} disabled={isSubmitting || !form.startDate || !form.endDate || !form.reason} className="px-5 py-2.5 rounded-xl text-sm bg-brand-600 hover:bg-brand-500 text-white transition-colors shadow-lg shadow-brand-500/20 disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reject Reason Modal */}
      <AnimatePresence>
        {rejectModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRejectModal({ open: false, id: "" })} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-[var(--surface)] border border-[var(--border)] w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden z-10 p-6">
              <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-center text-foreground font-outfit mb-4">Reject Leave Request</h3>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejection (optional)..." rows={3} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm focus:border-brand-500 transition-all text-foreground resize-none mb-4" />
              <div className="flex gap-3">
                <button onClick={() => setRejectModal({ open: false, id: "" })} className="flex-1 py-2.5 rounded-xl text-sm hover:bg-[var(--surface-border)] transition-colors text-foreground border border-[var(--border)]">Cancel</button>
                <button onClick={handleReject} className="flex-1 py-2.5 rounded-xl text-sm bg-red-500 hover:bg-red-600 text-white transition-colors">Reject</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
