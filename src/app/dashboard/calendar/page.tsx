"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, Clock, Video, CalendarDays, CheckSquare, Loader2 } from "lucide-react";
import axios from "axios";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface CalEvent {
  date: string;
  title: string;
  type: "meeting" | "task" | "leave" | "holiday";
  color: string;
}

const TYPE_META = {
  meeting: { color: "bg-brand-500", textColor: "text-brand-400", label: "Meeting" },
  task: { color: "bg-amber-500", textColor: "text-amber-400", label: "Task Due" },
  leave: { color: "bg-emerald-500", textColor: "text-emerald-400", label: "Leave" },
  holiday: { color: "bg-red-500", textColor: "text-red-400", label: "Holiday" },
};

const HOLIDAYS = [
  { date: "2026-01-01", title: "New Year's Day" },
  { date: "2026-01-26", title: "Republic Day" },
  { date: "2026-08-15", title: "Independence Day" },
  { date: "2026-10-02", title: "Gandhi Jayanti" },
  { date: "2026-12-25", title: "Christmas Day" },
];

export default function CalendarPage() {
  const { data: session } = useSession();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const allEvents: CalEvent[] = [];

        // Meetings
        const meetRes = await axios.get("/api/meetings");
        (meetRes.data || []).forEach((m: any) => {
          allEvents.push({ date: m.date, title: m.title, type: "meeting", color: "bg-brand-500" });
        });

        // Tasks with due dates
        const taskRes = await axios.get("/api/tasks");
        (taskRes.data || []).forEach((t: any) => {
          if (t.dueDate) {
            allEvents.push({ date: new Date(t.dueDate).toISOString().split("T")[0], title: t.title, type: "task", color: "bg-amber-500" });
          }
        });

        // Leaves
        const leaveRes = await axios.get("/api/leave").catch(() => ({ data: [] }));
        (leaveRes.data || []).forEach((l: any) => {
          if (l.status === "Approved") {
            const start = new Date(l.startDate);
            const end = new Date(l.endDate);
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
              allEvents.push({ date: d.toISOString().split("T")[0], title: `${l.applicantName} - Leave`, type: "leave", color: "bg-emerald-500" });
            }
          }
        });

        // Holidays
        HOLIDAYS.forEach(h => {
          allEvents.push({ ...h, type: "holiday", color: "bg-red-500" });
        });

        setEvents(allEvents);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchEvents();
  }, []);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const emptySlots = firstDay === 0 ? 6 : firstDay - 1;
  const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getDateStr = (d: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const getEventsForDate = (d: number) => events.filter(e => e.date === getDateStr(d));

  const today = new Date().toISOString().split("T")[0];
  const selectedEvents = selectedDate ? events.filter(e => e.date === selectedDate) : [];

  // Legend items
  const legend = Object.entries(TYPE_META).map(([key, val]) => ({ key, ...val }));

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold font-outfit text-foreground flex items-center gap-3">
            <div className="p-2 bg-brand-500/10 rounded-xl text-brand-500"><Calendar className="w-6 h-6" /></div>
            Calendar
          </h1>
          <p className="text-foreground/60 text-sm mt-1">View all meetings, tasks, leaves, and holidays in one place.</p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-border)] transition-colors"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-lg font-bold font-outfit text-foreground min-w-[160px] text-center">{MONTHS[month]} {year}</span>
          <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-border)] transition-colors"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap shrink-0">
        {legend.map(l => (
          <div key={l.key} className="flex items-center gap-2 text-xs text-foreground/60">
            <div className={`w-3 h-3 rounded-full ${l.color}`} />
            {l.label}
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Calendar Grid */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 glass-panel rounded-2xl border border-[var(--border)] flex flex-col overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--background)] shrink-0">
            {DAYS.map(day => (
              <div key={day} className="text-center text-xs font-bold text-foreground/50 uppercase tracking-wider py-3">{day}</div>
            ))}
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-7 auto-rows-[minmax(80px,_1fr)]">
                {Array.from({ length: emptySlots }).map((_, i) => (
                  <div key={`e-${i}`} className="border-r border-b border-[var(--border)] bg-[var(--background)]/30 opacity-50" />
                ))}
                {dates.map(d => {
                  const dateStr = getDateStr(d);
                  const dayEvents = getEventsForDate(d);
                  const isToday = dateStr === today;
                  const isSelected = dateStr === selectedDate;
                  const isWeekend = (emptySlots + d - 1) % 7 >= 5;

                  return (
                    <div key={d} onClick={() => setSelectedDate(selectedDate === dateStr ? null : dateStr)}
                      className={`border-r border-b border-[var(--border)] p-2 cursor-pointer transition-colors hover:bg-[var(--surface)] ${isToday ? "bg-brand-500/5 border-brand-500/20" : ""} ${isSelected ? "bg-brand-500/10" : ""} ${isWeekend ? "opacity-60" : ""}`}>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-semibold mb-1 ${isToday ? "bg-brand-500 text-white" : "text-foreground/70"}`}>{d}</div>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 3).map((ev, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${ev.color}`} />
                            <span className="text-[10px] text-foreground/60 truncate">{ev.title}</span>
                          </div>
                        ))}
                        {dayEvents.length > 3 && <span className="text-[10px] text-foreground/40">+{dayEvents.length - 3} more</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>

        {/* Event Detail Sidebar */}
        <div className="w-full lg:w-72 glass-panel rounded-2xl border border-[var(--border)] flex flex-col overflow-hidden shrink-0">
          <div className="p-5 border-b border-[var(--border)] bg-[var(--background)]">
            <h3 className="font-bold text-foreground font-outfit">
              {selectedDate ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "Select a date"}
            </h3>
            {selectedEvents.length > 0 && <p className="text-xs text-foreground/50 mt-1">{selectedEvents.length} event{selectedEvents.length > 1 ? "s" : ""}</p>}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {selectedDate && selectedEvents.length === 0 && (
              <p className="text-sm text-foreground/40 text-center py-6">No events on this date</p>
            )}
            {!selectedDate && (
              <p className="text-sm text-foreground/40 text-center py-6">Click a date to see events</p>
            )}
            {selectedEvents.map((ev, i) => {
              const meta = TYPE_META[ev.type];
              return (
                <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex gap-3">
                  <div className={`w-1 rounded-full shrink-0 ${ev.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground line-clamp-2">{ev.title}</p>
                    <span className={`text-xs font-bold ${meta.textColor}`}>{meta.label}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
