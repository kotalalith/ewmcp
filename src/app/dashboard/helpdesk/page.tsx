"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Ticket, Plus, X, Send, ChevronRight, Loader2, MessageSquare } from "lucide-react";
import axios from "axios";

const PRIORITY_BADGE: Record<string, string> = {
  Low: "bg-slate-500/10 text-slate-400 border-slate-500/30",
  Medium: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  High: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  Critical: "bg-red-500/10 text-red-400 border-red-500/30",
};
const STATUS_BADGE: Record<string, string> = {
  Open: "bg-brand-500/10 text-brand-400 border-brand-500/30",
  "In Progress": "bg-amber-500/10 text-amber-400 border-amber-500/30",
  Pending: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  Resolved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  Closed: "bg-slate-500/10 text-slate-400 border-slate-500/30",
};

export default function HelpDeskPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "Employee";
  const isManager = ["Administrator", "Manager"].includes(role);

  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [form, setForm] = useState({ title: "", description: "", category: "IT Support", priority: "Medium" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/tickets");
      setTickets(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchTickets();
    if (isManager) axios.get("/api/users").then(r => setAllUsers(r.data)).catch(() => {});
  }, []);

  const handleCreate = async () => {
    if (!form.title || !form.description) return;
    setIsSubmitting(true);
    try {
      await axios.post("/api/tickets", form);
      setForm({ title: "", description: "", category: "IT Support", priority: "Medium" });
      setIsModalOpen(false);
      fetchTickets();
    } catch (e) { console.error(e); }
    finally { setIsSubmitting(false); }
  };

  const handleComment = async () => {
    if (!commentText.trim() || !selectedTicket) return;
    try {
      const updated = await axios.put("/api/tickets", { id: selectedTicket._id, comment: commentText });
      setSelectedTicket(updated.data);
      setCommentText("");
      fetchTickets();
    } catch (e) { console.error(e); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const updated = await axios.put("/api/tickets", { id, status });
      setSelectedTicket(updated.data);
      fetchTickets();
    } catch (e) { console.error(e); }
  };

  const filters = ["All", "Open", "In Progress", "Resolved", "Closed"];
  const filtered = activeFilter === "All" ? tickets : tickets.filter(t => t.status === activeFilter);

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold font-outfit text-foreground flex items-center gap-3">
            <div className="p-2 bg-brand-500/10 rounded-xl text-brand-500"><Ticket className="w-6 h-6" /></div>
            Help Desk
          </h1>
          <p className="text-foreground/60 text-sm mt-1">Raise and track support tickets.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-brand-500/20 flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Ticket
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 shrink-0">
        {filters.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${activeFilter === f ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20" : "bg-[var(--surface)] border border-[var(--border)] text-foreground/70 hover:text-foreground"}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Ticket List */}
        <div className="lg:w-80 xl:w-96 flex flex-col gap-3 overflow-y-auto shrink-0">
          {loading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
          ) : filtered.length === 0 ? (
            <div className="glass-panel p-10 rounded-2xl text-center border border-[var(--border)]">
              <Ticket className="w-10 h-10 text-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-foreground/50">No tickets found.</p>
            </div>
          ) : filtered.map((ticket, i) => (
            <motion.div key={ticket._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedTicket(ticket)}
              className={`glass-panel p-4 rounded-2xl border cursor-pointer transition-all hover:border-brand-500/30 ${selectedTicket?._id === ticket._id ? "border-brand-500/50 bg-brand-500/5" : "border-[var(--border)]"}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-xs font-mono text-foreground/40">{ticket.ticketId}</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${PRIORITY_BADGE[ticket.priority]}`}>{ticket.priority}</span>
              </div>
              <h3 className="font-semibold text-sm text-foreground mb-1 line-clamp-2">{ticket.title}</h3>
              <div className="flex items-center justify-between mt-2">
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${STATUS_BADGE[ticket.status]}`}>{ticket.status}</span>
                <span className="text-xs text-foreground/40">{new Date(ticket.createdAt).toLocaleDateString()}</span>
              </div>
              {isManager && <p className="text-xs text-foreground/50 mt-2">By {ticket.createdByName}</p>}
            </motion.div>
          ))}
        </div>

        {/* Ticket Detail */}
        {selectedTicket ? (
          <div className="flex-1 glass-panel rounded-2xl border border-[var(--border)] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-[var(--border)] bg-[var(--background)] flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-mono text-foreground/40 mb-1">{selectedTicket.ticketId}</p>
                <h2 className="font-bold text-lg text-foreground font-outfit">{selectedTicket.title}</h2>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_BADGE[selectedTicket.status]}`}>{selectedTicket.status}</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${PRIORITY_BADGE[selectedTicket.priority]}`}>{selectedTicket.priority}</span>
                  <span className="text-xs text-foreground/40 bg-[var(--surface-border)] px-2 py-0.5 rounded-md">{selectedTicket.category}</span>
                </div>
              </div>
              {isManager && (
                <select value={selectedTicket.status} onChange={e => handleStatusChange(selectedTicket._id, e.target.value)}
                  className="bg-[var(--surface)] border border-[var(--border)] rounded-xl py-2 px-3 text-sm text-foreground focus:border-brand-500 shrink-0">
                  {["Open", "In Progress", "Pending", "Resolved", "Closed"].map(s => <option key={s}>{s}</option>)}
                </select>
              )}
            </div>

            <div className="p-5 border-b border-[var(--border)]">
              <p className="text-sm text-foreground/70 leading-relaxed">{selectedTicket.description}</p>
              <p className="text-xs text-foreground/40 mt-3">Raised by <strong>{selectedTicket.createdByName}</strong> · {new Date(selectedTicket.createdAt).toLocaleString()}</p>
            </div>

            {/* Comments */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <h3 className="text-sm font-bold text-foreground/60 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Comments ({selectedTicket.comments?.length || 0})
              </h3>
              {(selectedTicket.comments || []).map((c: any, i: number) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-xs shrink-0">{c.authorName?.charAt(0)}</div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-foreground mb-1">{c.authorName} <span className="text-foreground/40 font-normal">{new Date(c.createdAt).toLocaleString()}</span></p>
                    <p className="text-sm text-foreground/70 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Comment Input */}
            <div className="p-4 border-t border-[var(--border)] bg-[var(--background)] flex gap-2">
              <input value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === "Enter" && handleComment()}
                placeholder="Add a comment..." className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl py-2.5 px-4 text-sm focus:border-brand-500 transition-all text-foreground" />
              <button onClick={handleComment} disabled={!commentText.trim()} className="p-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-brand-500/20">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 glass-panel rounded-2xl border border-[var(--border)] flex items-center justify-center">
            <div className="text-center">
              <Ticket className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
              <p className="text-foreground/40 text-sm">Select a ticket to view details</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-[var(--surface)] border border-[var(--border)] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden z-10">
              <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--background)]">
                <h2 className="text-xl font-bold font-outfit text-foreground">Raise a Ticket</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-[var(--surface-border)] transition-colors"><X className="w-5 h-5 text-foreground/60" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Title <span className="text-red-400">*</span></label>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Brief issue title" className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm focus:border-brand-500 transition-all text-foreground" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Description <span className="text-red-400">*</span></label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Describe the issue in detail..." className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm focus:border-brand-500 transition-all text-foreground resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Category</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm focus:border-brand-500 text-foreground">
                      {["IT Support", "HR", "Finance", "Facilities", "Other"].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Priority</label>
                    <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm focus:border-brand-500 text-foreground">
                      {["Low", "Medium", "High", "Critical"].map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-[var(--border)] bg-[var(--background)] flex justify-end gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm hover:bg-[var(--surface-border)] transition-colors text-foreground">Cancel</button>
                <button onClick={handleCreate} disabled={isSubmitting || !form.title || !form.description} className="px-5 py-2.5 rounded-xl text-sm bg-brand-600 hover:bg-brand-500 text-white transition-colors shadow-lg shadow-brand-500/20 disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                  Submit Ticket
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
