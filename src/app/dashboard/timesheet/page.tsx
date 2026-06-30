"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Timer, Plus, Minus, Send, CheckCircle2, Clock, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import axios from "axios";

function getWeekDates(offset = 0) {
  const now = new Date();
  const day = now.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMon + offset * 7);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split("T")[0];
  });
  return { weekStart: days[0], weekEnd: days[6], days };
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-slate-500/10 text-slate-400 border-slate-500/30",
  Submitted: "bg-brand-500/10 text-brand-400 border-brand-500/30",
  Approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  Rejected: "bg-red-500/10 text-red-400 border-red-500/30",
};

export default function TimesheetPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "Employee";
  const isManager = ["Administrator", "Manager"].includes(role);

  const [weekOffset, setWeekOffset] = useState(0);
  const { weekStart, weekEnd, days } = getWeekDates(weekOffset);
  const [entries, setEntries] = useState<Record<string, { hours: string; description: string }>>(
    Object.fromEntries(days.map(d => [d, { hours: "0", description: "" }]))
  );
  const [timesheet, setTimesheet] = useState<any>(null);
  const [pendingSheets, setPendingSheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTimesheet();
  }, [weekStart, session]);

  const fetchTimesheet = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/timesheet?weekStart=${weekStart}`);
      const data = Array.isArray(res.data) ? res.data : [];
      const found = data.find((t: any) => t.weekStart === weekStart && t.userId === session?.user?.email);
      if (found) {
        setTimesheet(found);
        const map: Record<string, { hours: string; description: string }> = {};
        days.forEach(d => { map[d] = { hours: "0", description: "" }; });
        found.entries.forEach((e: any) => { if (map[e.date] !== undefined) map[e.date] = { hours: String(e.hours), description: e.description }; });
        setEntries(map);
      } else {
        setTimesheet(null);
        setEntries(Object.fromEntries(days.map(d => [d, { hours: "0", description: "" }])));
      }
      if (isManager) {
        const allRes = await axios.get(`/api/timesheet?all=true`);
        const allData = Array.isArray(allRes.data) ? allRes.data : [];
        setPendingSheets(allData.filter((t: any) => t.status === "Submitted"));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const totalHours = days.reduce((sum, d) => sum + parseFloat(entries[d]?.hours || "0"), 0);

  const handleSave = async (status: "Draft" | "Submitted") => {
    setSaving(true);
    try {
      const payload = {
        weekStart, weekEnd,
        entries: days.map(d => ({ date: d, hours: parseFloat(entries[d]?.hours || "0"), description: entries[d]?.description || "", project: "General", task: "" })),
        status,
      };
      await axios.post("/api/timesheet", payload);
      await fetchTimesheet();
    } catch (e) { console.error(e); alert("Failed to save timesheet"); }
    finally { setSaving(false); }
  };

  const handleApprove = async (id: string, status: "Approved" | "Rejected") => {
    try {
      await axios.put("/api/timesheet", { id, status });
      setPendingSheets(prev => prev.filter(t => t._id !== id));
    } catch (e) { console.error(e); }
  };

  const isEditable = !timesheet || timesheet.status === "Draft" || timesheet.status === "Rejected";

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold font-outfit text-foreground flex items-center gap-3">
            <div className="p-2 bg-brand-500/10 rounded-xl text-brand-500"><Timer className="w-6 h-6" /></div>
            Timesheet
          </h1>
          <p className="text-foreground/60 text-sm mt-1">Log and submit your weekly work hours.</p>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center gap-3">
          <button onClick={() => setWeekOffset(o => o - 1)} className="p-2 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-border)] transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-foreground min-w-[200px] text-center">
            {weekStart} — {weekEnd}
          </span>
          <button onClick={() => setWeekOffset(o => o + 1)} disabled={weekOffset >= 0} className="p-2 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-border)] transition-colors disabled:opacity-40">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Timesheet Grid */}
        <div className="flex-1 flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center glass-panel rounded-2xl border border-[var(--border)]">
              <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-2xl border border-[var(--border)] flex flex-col flex-1 overflow-hidden">
              {timesheet && (
                <div className={`px-6 py-3 border-b border-[var(--border)] flex items-center justify-between ${timesheet.status === "Approved" ? "bg-emerald-500/5" : timesheet.status === "Rejected" ? "bg-red-500/5" : "bg-[var(--background)]"}`}>
                  <span className="text-sm text-foreground/60">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[timesheet.status]}`}>{timesheet.status}</span>
                </div>
              )}
              <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--background)] shrink-0">
                {days.map((d, i) => {
                  const isWeekend = i >= 5;
                  return (
                    <div key={d} className={`p-3 text-center border-r last:border-r-0 border-[var(--border)] ${isWeekend ? "opacity-50" : ""}`}>
                      <p className="text-xs font-bold text-foreground/50 uppercase">{DAY_LABELS[i]}</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{d.split("-")[2]}</p>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-7 flex-1 border-b border-[var(--border)]">
                {days.map((d, i) => {
                  const isWeekend = i >= 5;
                  return (
                    <div key={d} className={`border-r last:border-r-0 border-[var(--border)] p-3 flex flex-col gap-2 ${isWeekend ? "bg-[var(--background)]/30 opacity-60" : ""}`}>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEntries(prev => ({ ...prev, [d]: { ...prev[d], hours: String(Math.max(0, parseFloat(prev[d]?.hours || "0") - 0.5)) } }))} disabled={!isEditable || isWeekend} className="w-6 h-6 rounded-md bg-[var(--surface-border)] hover:bg-[var(--border)] flex items-center justify-center disabled:opacity-30 transition-colors">
                          <Minus className="w-3 h-3" />
                        </button>
                        <input type="number" min={0} max={24} step={0.5} value={entries[d]?.hours || "0"} onChange={e => setEntries(prev => ({ ...prev, [d]: { ...prev[d], hours: e.target.value } }))} disabled={!isEditable || isWeekend}
                          className="flex-1 bg-[var(--background)] border border-[var(--border)] rounded-lg py-1 px-1.5 text-center text-sm font-bold text-foreground focus:border-brand-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
                        <button onClick={() => setEntries(prev => ({ ...prev, [d]: { ...prev[d], hours: String(Math.min(24, parseFloat(prev[d]?.hours || "0") + 0.5)) } }))} disabled={!isEditable || isWeekend} className="w-6 h-6 rounded-md bg-[var(--surface-border)] hover:bg-[var(--border)] flex items-center justify-center disabled:opacity-30 transition-colors">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <input type="text" value={entries[d]?.description || ""} onChange={e => setEntries(prev => ({ ...prev, [d]: { ...prev[d], description: e.target.value } }))} disabled={!isEditable || isWeekend}
                        placeholder="Notes..." className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg py-1 px-2 text-xs text-foreground focus:border-brand-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed resize-none" />
                      {/* Mini bar */}
                      <div className="h-1.5 bg-[var(--surface-border)] rounded-full overflow-hidden mt-auto">
                        <div className="h-full bg-brand-500 rounded-full" style={{ width: `${Math.min(100, (parseFloat(entries[d]?.hours || "0") / 8) * 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 bg-[var(--background)] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-foreground/50" />
                  <span className="text-sm text-foreground/60">Total:</span>
                  <span className={`text-lg font-bold font-outfit ${totalHours >= 40 ? "text-emerald-400" : "text-foreground"}`}>{totalHours.toFixed(1)}h</span>
                  <span className="text-xs text-foreground/40">/ 40h</span>
                </div>
                {isEditable && (
                  <div className="flex gap-2">
                    <button onClick={() => handleSave("Draft")} disabled={saving} className="px-4 py-2 rounded-xl text-sm font-semibold border border-[var(--border)] hover:bg-[var(--surface-border)] text-foreground transition-colors disabled:opacity-50">
                      Save Draft
                    </button>
                    <button onClick={() => handleSave("Submitted")} disabled={saving || totalHours === 0} className="px-4 py-2 rounded-xl text-sm font-semibold bg-brand-600 hover:bg-brand-500 text-white transition-colors shadow-lg shadow-brand-500/20 disabled:opacity-50 flex items-center gap-2">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Submit
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Manager Approval Panel */}
        {isManager && (
          <div className="w-full lg:w-72 glass-panel rounded-2xl border border-[var(--border)] flex flex-col overflow-hidden shrink-0">
            <div className="p-5 border-b border-[var(--border)] bg-[var(--background)]">
              <h3 className="font-bold text-foreground font-outfit flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-500" /> Pending Approvals
                {pendingSheets.length > 0 && <span className="ml-auto bg-brand-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingSheets.length}</span>}
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {pendingSheets.length === 0 ? (
                <p className="text-sm text-foreground/40 text-center py-8">No pending submissions</p>
              ) : (
                pendingSheets.map(ts => (
                  <div key={ts._id} className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-2">
                    <p className="text-sm font-semibold text-foreground">{ts.userName}</p>
                    <p className="text-xs text-foreground/50">{ts.weekStart} — {ts.weekEnd}</p>
                    <p className="text-xs text-brand-400 font-bold">{ts.totalHours}h total</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(ts._id, "Approved")} className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors">Approve</button>
                      <button onClick={() => handleApprove(ts._id, "Rejected")} className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors">Reject</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
