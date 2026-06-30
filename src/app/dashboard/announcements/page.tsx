"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, Pin, Plus, X, Building2, Users, Loader2, AlertTriangle } from "lucide-react";
import axios from "axios";

const TYPE_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  Company:    { color: "text-brand-400 bg-brand-500/10 border-brand-500/30", icon: Building2, label: "Company-wide" },
  Department: { color: "text-accent-purple bg-purple-500/10 border-purple-500/30", icon: Users, label: "Department" },
  Team:       { color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30", icon: Users, label: "Team" },
  General:    { color: "text-foreground/60 bg-[var(--surface-border)] border-[var(--border)]", icon: Megaphone, label: "General" },
};

const PRIORITY_COLORS: Record<string, string> = {
  High: "text-red-400",
  Medium: "text-amber-400",
  Low: "text-foreground/40",
};

export default function AnnouncementsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "Employee";
  const isManager = ["Administrator", "Manager"].includes(role);

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", type: "Company", priority: "Medium", pinned: false, department: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/announcements");
      setAnnouncements(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleCreate = async () => {
    if (!form.title || !form.content) return;
    setIsSubmitting(true);
    try {
      await axios.post("/api/announcements", form);
      setForm({ title: "", content: "", type: "Company", priority: "Medium", pinned: false, department: "" });
      setIsModalOpen(false);
      fetchAnnouncements();
    } catch (e) { console.error(e); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    try {
      await axios.delete(`/api/announcements?id=${id}`);
      fetchAnnouncements();
    } catch (e) { console.error(e); }
  };

  const handlePin = async (ann: any) => {
    try {
      await axios.put("/api/announcements", { id: ann._id, pinned: !ann.pinned });
      fetchAnnouncements();
    } catch (e) { console.error(e); }
  };

  const pinned = announcements.filter(a => a.pinned);
  const unpinned = announcements.filter(a => !a.pinned);

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold font-outfit text-foreground flex items-center gap-3">
            <div className="p-2 bg-brand-500/10 rounded-xl text-brand-500"><Megaphone className="w-6 h-6" /></div>
            Announcements
          </h1>
          <p className="text-foreground/60 text-sm mt-1">Stay updated with company-wide and team news.</p>
        </div>
        {isManager && (
          <button onClick={() => setIsModalOpen(true)} className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-brand-500/20 flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Announcement
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-6 pb-4">
        {loading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
        ) : announcements.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl text-center border border-[var(--border)]">
            <Megaphone className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
            <p className="text-foreground/50">No announcements yet.</p>
          </div>
        ) : (
          <>
            {/* Pinned */}
            {pinned.length > 0 && (
              <div>
                <p className="text-xs font-bold text-foreground/40 uppercase tracking-wider mb-3 flex items-center gap-2"><Pin className="w-3.5 h-3.5" /> Pinned</p>
                <div className="space-y-3">
                  {pinned.map((ann, i) => <AnnouncementCard key={ann._id} ann={ann} i={i} isManager={isManager} expanded={expanded} onExpand={setExpanded} onDelete={handleDelete} onPin={handlePin} />)}
                </div>
              </div>
            )}

            {/* Recent */}
            <div>
              {pinned.length > 0 && <p className="text-xs font-bold text-foreground/40 uppercase tracking-wider mb-3">Recent</p>}
              <div className="space-y-3">
                {unpinned.map((ann, i) => <AnnouncementCard key={ann._id} ann={ann} i={i} isManager={isManager} expanded={expanded} onExpand={setExpanded} onDelete={handleDelete} onPin={handlePin} />)}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-[var(--surface)] border border-[var(--border)] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden z-10">
              <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--background)]">
                <h2 className="text-xl font-bold font-outfit text-foreground">New Announcement</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-[var(--surface-border)] transition-colors"><X className="w-5 h-5 text-foreground/60" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Title <span className="text-red-400">*</span></label>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Q3 Town Hall Meeting" className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm focus:border-brand-500 transition-all text-foreground" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Content <span className="text-red-400">*</span></label>
                  <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={4} placeholder="Write the announcement content here..." className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm focus:border-brand-500 transition-all text-foreground resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Type</label>
                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm focus:border-brand-500 text-foreground">
                      {["Company", "Department", "Team", "General"].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Priority</label>
                    <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm focus:border-brand-500 text-foreground">
                      {["Low", "Medium", "High"].map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-[var(--surface-border)] transition-colors">
                  <input type="checkbox" checked={form.pinned} onChange={e => setForm({ ...form, pinned: e.target.checked })} className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 bg-[var(--background)]" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Pin this announcement</p>
                    <p className="text-xs text-foreground/50">Pinned posts stay at the top for everyone</p>
                  </div>
                </label>
              </div>
              <div className="p-6 border-t border-[var(--border)] bg-[var(--background)] flex justify-end gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm hover:bg-[var(--surface-border)] transition-colors text-foreground">Cancel</button>
                <button onClick={handleCreate} disabled={isSubmitting || !form.title || !form.content} className="px-5 py-2.5 rounded-xl text-sm bg-brand-600 hover:bg-brand-500 text-white transition-colors shadow-lg shadow-brand-500/20 disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
                  {isSubmitting ? "Publishing..." : "Publish"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AnnouncementCard({ ann, i, isManager, expanded, onExpand, onDelete, onPin }: any) {
  const cfg = TYPE_CONFIG[ann.type] || TYPE_CONFIG.General;
  const isExpanded = expanded === ann._id;
  const Icon = cfg.icon;

  return (
    <motion.div key={ann._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
      className={`glass-panel rounded-2xl border transition-all ${ann.pinned ? "border-brand-500/30 bg-brand-500/3" : "border-[var(--border)]"}`}>
      <div className="p-5 cursor-pointer" onClick={() => onExpand(isExpanded ? null : ann._id)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${cfg.color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {ann.pinned && <Pin className="w-3.5 h-3.5 text-brand-400" />}
                <h3 className="font-bold text-foreground">{ann.title}</h3>
                {ann.priority === "High" && <AlertTriangle className={`w-3.5 h-3.5 ${PRIORITY_COLORS[ann.priority]}`} />}
              </div>
              <p className={`text-sm text-foreground/70 ${isExpanded ? "" : "line-clamp-2"}`}>{ann.content}</p>
            </div>
          </div>
          {isManager && (
            <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
              <button onClick={() => onPin(ann)} className={`p-1.5 rounded-lg transition-colors ${ann.pinned ? "text-brand-400 bg-brand-500/10" : "text-foreground/30 hover:text-foreground hover:bg-[var(--surface-border)]"}`} title={ann.pinned ? "Unpin" : "Pin"}>
                <Pin className="w-4 h-4" />
              </button>
              <button onClick={() => onDelete(ann._id)} className="p-1.5 rounded-lg text-foreground/30 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 mt-3">
          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${cfg.color}`}>{ann.type}</span>
          <span className="text-xs text-foreground/40">By {ann.createdByName} · {new Date(ann.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </motion.div>
  );
}
