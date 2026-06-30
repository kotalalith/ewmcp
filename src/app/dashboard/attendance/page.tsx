"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Clock, Play, Square, Coffee, BarChart3, Calendar, Users, Loader2 } from "lucide-react";
import axios from "axios";

function formatDuration(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function AttendancePage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "Employee";
  const isManager = ["Administrator", "Manager"].includes(role);

  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [monthRecords, setMonthRecords] = useState<any[]>([]);
  const [allRecords, setAllRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const currentMonth = today.slice(0, 7);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/attendance?month=${currentMonth}`);
      const records = Array.isArray(res.data) ? res.data : [];
      setMonthRecords(records);
      const todayRec = records.find((r: any) => r.date === today && r.userId === session?.user?.email);
      setTodayRecord(todayRec || null);
      if (isManager) {
        const allRes = await axios.get(`/api/attendance?month=${currentMonth}`);
        setAllRecords(Array.isArray(allRes.data) ? allRes.data : []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (session) fetchAttendance(); }, [session]);

  // Live timer when clocked in
  useEffect(() => {
    if (todayRecord?.clockIn && !todayRecord?.clockOut) {
      const startMs = new Date(todayRecord.clockIn).getTime();
      intervalRef.current = setInterval(() => setElapsed(Date.now() - startMs), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setElapsed(0);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [todayRecord]);

  const handleAction = async (action: string) => {
    setActionLoading(true);
    try {
      await axios.post("/api/attendance", { action });
      await fetchAttendance();
    } catch (e: any) {
      alert(e.response?.data?.error || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const isClockedIn = !!todayRecord?.clockIn && !todayRecord?.clockOut;
  const isOnBreak = isClockedIn && todayRecord?.breaks?.some((b: any) => !b.end);

  const presentDays = monthRecords.filter(r => r.status === "Present").length;
  const totalHoursThisMonth = monthRecords.reduce((sum: number, r: any) => sum + (r.totalHours || 0), 0);

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-outfit text-foreground flex items-center gap-3">
          <div className="p-2 bg-brand-500/10 rounded-xl text-brand-500"><Clock className="w-6 h-6" /></div>
          Attendance
        </h1>
        <p className="text-foreground/60 text-sm mt-1">Track your daily work hours and attendance.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Left: Clock Panel */}
        <div className="space-y-4">
          {/* Live Clock Widget */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 rounded-2xl border border-[var(--border)] text-center">
            <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center border-4 relative"
              style={{ borderColor: isClockedIn ? "#10b981" : "#334155" }}>
              <Clock className={`w-8 h-8 ${isClockedIn ? "text-emerald-500" : "text-foreground/40"}`} />
              {isClockedIn && <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[var(--surface)] animate-pulse" />}
            </div>

            {isClockedIn ? (
              <>
                <p className="text-xs text-foreground/50 uppercase tracking-wider mb-1">Session Time</p>
                <p className="text-4xl font-bold font-mono text-foreground mb-1">{formatDuration(elapsed)}</p>
                <p className="text-xs text-emerald-400 font-medium mb-5">
                  Clocked in at {new Date(todayRecord.clockIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
                <div className="space-y-2">
                  <button onClick={() => handleAction(isOnBreak ? "break-end" : "break-start")} disabled={actionLoading}
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 border ${isOnBreak ? "border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20" : "border-[var(--border)] bg-[var(--surface)] text-foreground/70 hover:text-foreground hover:bg-[var(--surface-border)]"}`}>
                    <Coffee className="w-4 h-4" />
                    {isOnBreak ? "End Break" : "Start Break"}
                  </button>
                  <button onClick={() => handleAction("clock-out")} disabled={actionLoading}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 disabled:opacity-50">
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4 fill-current" />}
                    Clock Out
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-foreground/60 mb-2">{todayRecord?.clockOut ? "Shift completed today" : "You are not clocked in"}</p>
                {todayRecord?.clockOut && (
                  <p className="text-xs text-foreground/40 mb-4">
                    {new Date(todayRecord.clockIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} — {new Date(todayRecord.clockOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {" · "}<span className="text-emerald-400 font-medium">{todayRecord.totalHours}h total</span>
                  </p>
                )}
                {!todayRecord?.clockOut && (
                  <button onClick={() => handleAction("clock-in")} disabled={actionLoading}
                    className="w-full mt-3 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50">
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                    Clock In
                  </button>
                )}
              </>
            )}
          </motion.div>

          {/* Monthly Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Days Present", value: presentDays, color: "text-emerald-400", bg: "bg-emerald-500/10" },
              { label: "Hours Logged", value: `${totalHoursThisMonth.toFixed(1)}h`, color: "text-brand-400", bg: "bg-brand-500/10" },
            ].map(s => (
              <motion.div key={s.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-4 rounded-2xl border border-[var(--border)] text-center">
                <p className={`text-2xl font-bold font-outfit ${s.color}`}>{s.value}</p>
                <p className="text-xs text-foreground/50 mt-0.5">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right: Monthly Log */}
        <div className="lg:col-span-2 glass-panel rounded-2xl border border-[var(--border)] flex flex-col overflow-hidden">
          <div className="p-5 border-b border-[var(--border)] flex items-center gap-3">
            <Calendar className="w-5 h-5 text-brand-500" />
            <h2 className="font-bold text-foreground font-outfit">
              Monthly Attendance — {new Date().toLocaleString("default", { month: "long", year: "numeric" })}
            </h2>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[var(--surface)] border-b border-[var(--border)]">
                  <tr className="text-xs text-foreground/50 uppercase tracking-wider">
                    <th className="p-4 text-left font-semibold">Date</th>
                    {isManager && <th className="p-4 text-left font-semibold">Employee</th>}
                    <th className="p-4 text-left font-semibold">Clock In</th>
                    <th className="p-4 text-left font-semibold">Clock Out</th>
                    <th className="p-4 text-left font-semibold">Hours</th>
                    <th className="p-4 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {(isManager ? allRecords : monthRecords).map((rec) => (
                    <tr key={rec._id} className="hover:bg-[var(--surface-border)] transition-colors">
                      <td className="p-4 font-medium text-foreground">{rec.date}</td>
                      {isManager && <td className="p-4 text-foreground/70 text-xs">{rec.userName}</td>}
                      <td className="p-4 text-foreground/70">{rec.clockIn ? new Date(rec.clockIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                      <td className="p-4 text-foreground/70">{rec.clockOut ? new Date(rec.clockOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                      <td className="p-4 text-foreground/70">{rec.totalHours ? `${rec.totalHours}h` : "—"}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          rec.status === "Present" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
                          rec.status === "Absent" ? "bg-red-500/10 text-red-400 border-red-500/30" :
                          "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        }`}>{rec.status}</span>
                      </td>
                    </tr>
                  ))}
                  {(isManager ? allRecords : monthRecords).length === 0 && (
                    <tr><td colSpan={isManager ? 6 : 5} className="p-8 text-center text-foreground/40">No attendance records for this month.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
