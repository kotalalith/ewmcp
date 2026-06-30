"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, XCircle, Filter, CalendarDays, FileText, UserCheck, Loader2 } from "lucide-react";
import axios from "axios";

const STATUS_BADGE: Record<string, string> = {
  Pending: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  Approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  Rejected: "bg-red-500/10 text-red-400 border-red-500/30",
  Submitted: "bg-brand-500/10 text-brand-400 border-brand-500/30",
  Cancelled: "bg-slate-500/10 text-slate-400 border-slate-500/30",
};

const TYPE_ICON: Record<string, any> = {
  leave: CalendarDays,
  timesheet: Clock,
  document: FileText,
};

export default function ApprovalsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "Employee";
  const isManager = ["Administrator", "Manager"].includes(role);

  const [leaves, setLeaves] = useState<any[]>([]);
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("leave");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leaveRes, tsRes] = await Promise.all([
        axios.get("/api/leave").catch(() => ({ data: [] })),
        axios.get("/api/timesheet?all=true").catch(() => ({ data: [] })),
      ]);
      setLeaves(Array.isArray(leaveRes.data) ? leaveRes.data : []);
      setTimesheets(Array.isArray(tsRes.data) ? tsRes.data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleLeaveAction = async (id: string, status: "Approved" | "Rejected") => {
    try {
      await axios.put("/api/leave", { id, status });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleTsAction = async (id: string, status: "Approved" | "Rejected") => {
    try {
      await axios.put("/api/timesheet", { id, status });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const pendingLeaves = leaves.filter(l => l.status === "Pending");
  const pendingTs = timesheets.filter(t => t.status === "Submitted");

  const tabs = [
    { id: "leave", label: "Leave Requests", count: pendingLeaves.length, icon: CalendarDays },
    { id: "timesheet", label: "Timesheets", count: pendingTs.length, icon: Clock },
  ];

  if (!isManager) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
          <UserCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold font-outfit text-foreground">Access Restricted</h1>
        <p className="text-foreground/60 mt-2">Only Managers and Administrators can access the approval workflows.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-outfit text-foreground flex items-center gap-3">
          <div className="p-2 bg-brand-500/10 rounded-xl text-brand-500"><CheckCircle2 className="w-6 h-6" /></div>
          Approval Workflows
        </h1>
        <p className="text-foreground/60 text-sm mt-1">Review and action pending requests from your team.</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 shrink-0">
        {[
          { label: "Pending Leaves", value: pendingLeaves.length, color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "Total Leaves", value: leaves.length, color: "text-foreground", bg: "bg-[var(--surface-border)]" },
          { label: "Pending Timesheets", value: pendingTs.length, color: "text-brand-400", bg: "bg-brand-500/10" },
          { label: "Total Timesheets", value: timesheets.length, color: "text-foreground", bg: "bg-[var(--surface-border)]" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-panel p-5 rounded-2xl border border-[var(--border)]">
            <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
              <span className={`text-lg font-bold font-outfit ${s.color}`}>{s.value}</span>
            </div>
            <p className="text-xs text-foreground/60">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 shrink-0">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === tab.id ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20" : "bg-[var(--surface)] border border-[var(--border)] text-foreground/70 hover:text-foreground"}`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === tab.id ? "bg-white/20 text-white" : "bg-amber-500 text-white"}`}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pb-4">
        {loading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
        ) : activeTab === "leave" ? (
          leaves.length === 0 ? (
            <div className="glass-panel p-12 rounded-2xl text-center border border-[var(--border)]">
              <CalendarDays className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
              <p className="text-foreground/50">No leave requests found.</p>
            </div>
          ) : leaves.map((leave, i) => (
            <motion.div key={leave._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-panel p-5 rounded-2xl border border-[var(--border)] hover:border-brand-500/20 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${STATUS_BADGE[leave.status]}`}>{leave.status}</span>
                    <span className="text-xs font-medium bg-[var(--surface-border)] text-foreground/60 px-2 py-0.5 rounded-md">{leave.type} Leave · {leave.days} day{leave.days > 1 ? "s" : ""}</span>
                  </div>
                  <p className="font-semibold text-foreground">{leave.applicantName}</p>
                  <p className="text-sm text-foreground/60 mt-0.5">{leave.reason}</p>
                  <p className="text-xs text-foreground/40 mt-2 flex items-center gap-1.5">
                    <CalendarDays className="w-3 h-3" />
                    {new Date(leave.startDate).toLocaleDateString()} — {new Date(leave.endDate).toLocaleDateString()}
                  </p>
                </div>
                {leave.status === "Pending" && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleLeaveAction(leave._id, "Approved")}
                      className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors" title="Approve">
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleLeaveAction(leave._id, "Rejected")}
                      className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 transition-colors" title="Reject">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              {leave.approvedBy && (
                <p className="text-xs text-foreground/40 mt-3 border-t border-[var(--border)] pt-2">
                  {leave.status} by {leave.approvedBy} · {leave.approvedAt ? new Date(leave.approvedAt).toLocaleString() : ""}
                </p>
              )}
            </motion.div>
          ))
        ) : (
          timesheets.length === 0 ? (
            <div className="glass-panel p-12 rounded-2xl text-center border border-[var(--border)]">
              <Clock className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
              <p className="text-foreground/50">No timesheet submissions found.</p>
            </div>
          ) : timesheets.map((ts, i) => (
            <motion.div key={ts._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-panel p-5 rounded-2xl border border-[var(--border)] hover:border-brand-500/20 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${STATUS_BADGE[ts.status]}`}>{ts.status}</span>
                    <span className="text-xs font-semibold text-brand-400">{ts.totalHours}h total</span>
                  </div>
                  <p className="font-semibold text-foreground">{ts.userName}</p>
                  <p className="text-sm text-foreground/60 mt-0.5">Week: {ts.weekStart} — {ts.weekEnd}</p>
                  <p className="text-xs text-foreground/40 mt-1">{ts.entries?.length || 0} entries logged</p>
                </div>
                {ts.status === "Submitted" && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleTsAction(ts._id, "Approved")}
                      className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors" title="Approve">
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleTsAction(ts._id, "Rejected")}
                      className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 transition-colors" title="Reject">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
