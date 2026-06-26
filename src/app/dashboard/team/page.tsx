"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Mail, Phone, MessageSquare, MoreVertical, Search, Filter, Plus, X, Trash2 } from "lucide-react";
import axios from "axios";

import { useRouter } from "next/navigation";

export default function TeamPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "Employee";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteRole, setInviteRole] = useState("Employee");
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const router = useRouter();

  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  const fetchTeam = async () => {
    try {
      const res = await axios.get("/api/users");
      // Map API data to the UI structure
      const fetched = res.data.map((u:any) => ({
        id: u._id,
        name: u.name,
        role: u.role,
        email: u.email,
        phone: "+1 555-000-0000",
        avatar: u.name.charAt(0).toUpperCase()
      }));
      setTeamMembers(fetched);
    } catch (e) {
      console.error("Failed to fetch team members", e);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !inviteName.trim()) return;
    try {
      await axios.post("/api/users", {
        name: inviteName,
        email: inviteEmail,
        role: inviteRole
      });
      setInviteName("");
      setInviteEmail("");
      setInvitePhone("");
      setInviteRole("Employee");
      setIsModalOpen(false);
      fetchTeam();
    } catch(e) {
      console.error(e);
      alert("Failed to invite member");
    }
  };

  const handleDelete = async (email: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    try {
      await axios.delete(`/api/users?email=${encodeURIComponent(email)}`);
      fetchTeam();
    } catch(e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 relative h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold font-outfit text-foreground flex items-center gap-3">
            <div className="p-2 bg-brand-500/10 rounded-xl text-brand-500"><Users className="w-6 h-6" /></div>
            Team Directory
          </h1>
          <p className="text-foreground/60 text-sm mt-1">Connect and collaborate with your colleagues.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <input type="text" placeholder="Search team..." className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl py-2 pl-9 pr-4 text-sm focus:border-brand-500 transition-all" />
          </div>
          <button className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-border)] transition-colors"><Filter className="w-4 h-4" /></button>
          
          {["Administrator", "Manager"].includes(role) && (
            <button onClick={() => setIsModalOpen(true)} className="bg-brand-600 hover:bg-brand-500 text-white p-2.5 md:px-4 md:py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-brand-500/20 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden md:inline">Invite Member</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 overflow-y-auto pb-6 flex-1 min-h-0 content-start">
        {teamMembers.map((member, i) => (
          <motion.div key={member.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="glass-panel p-4 rounded-2xl border border-[var(--border)] hover:border-brand-500/50 transition-all group flex flex-col">
            <div className="flex justify-between items-start mb-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-lg ${['bg-brand-500', 'bg-accent-purple', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'][i % 6]}`}>
                {member.avatar}
              </div>
              <div className="relative">
                <button onClick={() => setOpenDropdownId(openDropdownId === member.id ? null : member.id)} className="text-foreground/40 hover:text-foreground p-1"><MoreVertical className="w-4 h-4" /></button>
                <AnimatePresence>
                  {openDropdownId === member.id && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute right-0 top-full mt-1 w-32 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl z-20 overflow-hidden">
                      {["Administrator", "Manager"].includes(role) && (
                        <button onClick={() => { handleDelete(member.email); setOpenDropdownId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-[var(--surface-border)] transition-colors text-left"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            <h3 className="text-base font-bold text-foreground truncate">{member.name}</h3>
            <p className="text-xs text-brand-500 font-medium mb-3">{member.role}</p>
            
            <div className="space-y-1.5 mt-auto">
              <div className="flex items-center gap-2.5 text-xs text-foreground/60"><Mail className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{member.email}</span></div>
              <div className="flex items-center gap-2.5 text-xs text-foreground/60"><Phone className="w-3.5 h-3.5 shrink-0" /> <span>{member.phone}</span></div>
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--surface-border)] flex gap-2">
              <button onClick={() => router.push(`/dashboard/messages?dm=${member.email}`)} className="flex-1 py-1.5 rounded-lg bg-[var(--surface-border)] hover:bg-brand-500/10 hover:text-brand-500 text-xs font-semibold transition-colors flex items-center justify-center gap-2"><MessageSquare className="w-3.5 h-3.5" /> Message</button>
              <button onClick={() => window.location.href = `mailto:${member.email}`} className="flex-1 py-1.5 rounded-lg bg-[var(--surface-border)] hover:bg-brand-500/10 hover:text-brand-500 text-xs font-semibold transition-colors flex items-center justify-center gap-2"><Mail className="w-3.5 h-3.5" /> Email</button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-[var(--surface)] border border-[var(--border)] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden z-10 relative">
              <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
                <h2 className="text-xl font-bold font-outfit text-foreground">Invite New Member</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-[var(--surface-border)] transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Full Name</label>
                  <input type="text" value={inviteName} onChange={(e) => setInviteName(e.target.value)} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 focus:border-brand-500 transition-all" placeholder="John Doe" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Email Address</label>
                  <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 focus:border-brand-500 transition-all" placeholder="colleague@company.com" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Phone Number</label>
                  <input type="tel" value={invitePhone} onChange={(e) => setInvitePhone(e.target.value)} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 focus:border-brand-500 transition-all" placeholder="+1 234-567-8900" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Role</label>
                  <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 focus:border-brand-500 transition-all appearance-none">
                    <option>Employee</option><option>Team Lead</option><option>Manager</option>
                  </select>
                </div>
              </div>
              <div className="p-6 border-t border-[var(--border)] bg-[var(--background)] flex justify-end gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm hover:bg-[var(--surface-border)] transition-colors">Cancel</button>
                <button onClick={handleInvite} className="px-5 py-2.5 rounded-xl text-sm bg-brand-600 hover:bg-brand-500 text-white transition-colors shadow-lg shadow-brand-500/20">Send Invite</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
