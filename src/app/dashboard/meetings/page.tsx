"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar as CalendarIcon, Clock, Video, Users, Plus, ChevronLeft, ChevronRight, X, MapPin } from "lucide-react";
import Link from "next/link";
import axios from "axios";

export default function MeetingsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date()); // Current month

  // Form State
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const res = await axios.get("/api/meetings");
      setMeetings(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSchedule = async () => {
    if (!title || !date || !time) {
      alert("Please fill in the meeting Title, Date, and Time.");
      return;
    }
    try {
      await axios.post("/api/meetings", { title, date, time, location, type: "Zoom", attendees: ["team@example.com"] });
      setIsModalOpen(false);
      fetchMeetings(); // Refresh
      // Reset form
      setTitle(""); setDate(""); setTime(""); setLocation("");
    } catch (err) {
      console.error("Failed to schedule", err);
    }
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  
  // Calculate days in month
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  // Calculate starting day of the week (1=Mon, 7=Sun)
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const emptySlots = firstDay === 0 ? 6 : firstDay - 1; // 0 is Sunday, we want Mon=0

  const monthNum = (currentDate.getMonth() + 1).toString().padStart(2, '0');
  const currentDatePrefix = `${currentDate.getFullYear()}-${monthNum}-`;

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold font-outfit text-foreground flex items-center gap-3">
            <div className="p-2 bg-brand-500/10 rounded-xl text-brand-500"><CalendarIcon className="w-6 h-6" /></div>
            Meetings
          </h1>
          <p className="text-foreground/60 text-sm mt-1">Schedule and manage your team meetings.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-brand-500/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Schedule Meeting
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Main Calendar View */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-[var(--border)] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold font-outfit text-foreground">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-border)] transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={nextMonth} className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-border)] transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {days.map(day => (
              <div key={day} className="text-center text-xs font-bold text-foreground/50 uppercase tracking-wider py-2">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2 flex-1">
            {/* Empty slots for padding */}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <div key={`empty-${i}`} className="rounded-xl border border-transparent p-2 opacity-50" />
            ))}
            
            {dates.map((d) => {
              const dateStr = `${currentDatePrefix}${d.toString().padStart(2, '0')}`;
              const daysMeetings = meetings.filter(m => m.date === dateStr);
              
              const today = new Date();
              const isToday = today.getDate() === d && today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();
              
              return (
                <div key={d} className={`rounded-xl border p-2 flex flex-col transition-colors cursor-pointer min-h-[80px] ${isToday ? 'border-brand-500 bg-brand-500/5' : 'border-[var(--border)] hover:border-brand-500/50 bg-[var(--surface)]'}`}>
                  <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-brand-500' : 'text-foreground'}`}>{d}</div>
                  <div className="mt-auto space-y-1">
                    {daysMeetings.map((m, i) => (
                       <div key={i} className="w-full h-1.5 rounded-full bg-brand-500" title={m.title} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Meetings Sidebar */}
        <div className="glass-panel p-6 rounded-2xl border border-[var(--border)] overflow-y-auto">
          <h2 className="text-xl font-bold font-outfit text-foreground mb-6">Upcoming</h2>
          <div className="space-y-4">
            {meetings.length === 0 && <p className="text-sm text-foreground/50">No upcoming meetings.</p>}
            {meetings.map((meeting, i) => (
              <motion.div 
                key={meeting._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-brand-500/30 transition-colors group relative overflow-hidden"
              >
                <div className={`absolute top-0 left-0 w-1 h-full bg-brand-500`} />
                <h3 className="font-semibold text-foreground text-sm group-hover:text-brand-500 transition-colors">{meeting.title}</h3>
                
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-foreground/60">
                    <Clock className="w-3.5 h-3.5" />
                    {meeting.date}, {meeting.time}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground/60">
                    {meeting.type === 'In Person' ? <MapPin className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                    {meeting.type || "Zoom"}
                  </div>
                </div>

                <Link href={`/dashboard/meetings/${meeting._id}`}>
                  <button className="w-full mt-4 py-2 rounded-lg border border-[var(--surface-border)] hover:bg-brand-500/10 hover:text-brand-500 hover:border-brand-500/30 text-xs font-semibold transition-colors">
                    Join Meeting
                  </button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

      </div>

      {/* Schedule Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-[var(--surface)] border border-[var(--border)] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden z-10 relative">
              <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
                <h2 className="text-xl font-bold font-outfit text-foreground">Schedule Meeting</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-[var(--surface-border)] transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Meeting Title</label>
                  <input value={title} onChange={e=>setTitle(e.target.value)} type="text" className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 focus:border-brand-500 transition-all text-foreground" placeholder="e.g. Weekly Sync" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Date</label>
                    <input value={date} onChange={e=>setDate(e.target.value)} type="date" className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 focus:border-brand-500 transition-all text-foreground" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Time</label>
                    <input value={time} onChange={e=>setTime(e.target.value)} type="time" className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 focus:border-brand-500 transition-all text-foreground" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Location / Link</label>
                  <div className="relative">
                    <Video className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                    <input value={location} onChange={e=>setLocation(e.target.value)} type="text" className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 pl-10 pr-4 focus:border-brand-500 transition-all text-foreground" placeholder="Zoom link or Room name" />
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-[var(--border)] bg-[var(--background)] flex justify-end gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm hover:bg-[var(--surface-border)] transition-colors text-foreground">Cancel</button>
                <button onClick={handleSchedule} className="px-5 py-2.5 rounded-xl text-sm bg-brand-600 hover:bg-brand-500 text-white transition-colors">Schedule</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
