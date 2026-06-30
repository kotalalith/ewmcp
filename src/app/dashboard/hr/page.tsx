"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Users, Plus, X, Briefcase, ChevronRight, Loader2, Mail, UserCheck, Trash2 } from "lucide-react";
import axios from "axios";

export default function HRPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "Employee";
  const isAdmin = role === "Administrator";
  const isHRManager = ["Administrator", "Manager"].includes(role);

  const [activeTab, setActiveTab] = useState("employees");
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: "", description: "", head: "", color: "#3b82f6" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, deptRes] = await Promise.all([
        axios.get("/api/users"),
        axios.get("/api/departments"),
      ]);
      setEmployees(empRes.data);
      setDepartments(deptRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateDept = async () => {
    if (!deptForm.name) return;
    setIsSubmitting(true);
    try {
      await axios.post("/api/departments", deptForm);
      setDeptForm({ name: "", description: "", head: "", color: "#3b82f6" });
      setIsDeptModalOpen(false);
      fetchData();
    } catch (e) { console.error(e); alert("Failed to create department"); }
    finally { setIsSubmitting(false); }
  };

  const handleDeleteDept = async (id: string) => {
    if (!confirm("Delete this department?")) return;
    try { await axios.delete(`/api/departments?id=${id}`); fetchData(); }
    catch (e) { console.error(e); }
  };

  const DEPT_STATS = departments.map(d => ({
    ...d,
    memberCount: employees.filter(e => e.department === d.name).length,
  }));

  const filteredEmployees = employees.filter(e =>
    !searchQuery ||
    e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.designation?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const roleBadgeColor: Record<string, string> = {
    Administrator: "bg-red-500/10 text-red-400 border-red-500/30",
    Manager: "bg-brand-500/10 text-brand-400 border-brand-500/30",
    "Team Lead": "bg-purple-500/10 text-purple-400 border-purple-500/30",
    Employee: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    Client: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold font-outfit text-foreground flex items-center gap-3">
            <div className="p-2 bg-brand-500/10 rounded-xl text-brand-500"><Briefcase className="w-6 h-6" /></div>
            HR Module
          </h1>
          <p className="text-foreground/60 text-sm mt-1">Manage employees, departments, and organization structure.</p>
        </div>
        {isAdmin && activeTab === "departments" && (
          <button onClick={() => setIsDeptModalOpen(true)} className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-brand-500/20 flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Department
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-1 w-fit shrink-0">
        {[
          { id: "employees", label: "Employee Directory", icon: Users },
          { id: "departments", label: "Departments", icon: Building2 },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20" : "text-foreground/60 hover:text-foreground"}`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
      ) : (
        <>
          {/* Employee Directory */}
          {activeTab === "employees" && (
            <div className="flex-1 flex flex-col min-h-0 gap-4">
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by name, email, department, designation..." className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl py-3 px-4 text-sm focus:border-brand-500 transition-all text-foreground shrink-0" />

              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
                {[
                  { label: "Total Employees", value: employees.length },
                  { label: "Active", value: employees.filter(e => e.status === "Active").length },
                  { label: "Departments", value: departments.length },
                  { label: "Roles", value: [...new Set(employees.map(e => e.role))].length },
                ].map(s => (
                  <div key={s.label} className="glass-panel p-3 rounded-xl border border-[var(--border)] text-center">
                    <p className="text-xl font-bold text-foreground font-outfit">{s.value}</p>
                    <p className="text-xs text-foreground/50">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="glass-panel rounded-2xl border border-[var(--border)] overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-[var(--surface)] border-b border-[var(--border)]">
                      <tr className="text-xs text-foreground/50 uppercase tracking-wider">
                        <th className="p-4 text-left font-semibold">Employee</th>
                        <th className="p-4 text-left font-semibold hidden md:table-cell">Department</th>
                        <th className="p-4 text-left font-semibold hidden lg:table-cell">Designation</th>
                        <th className="p-4 text-left font-semibold">Role</th>
                        <th className="p-4 text-left font-semibold">Status</th>
                        <th className="p-4 text-left font-semibold hidden sm:table-cell">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {filteredEmployees.map((emp, i) => (
                        <motion.tr key={emp._id || emp.email} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="hover:bg-[var(--surface-border)] transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${["bg-brand-500", "bg-purple-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"][i % 5]}`}>
                                {emp.name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">{emp.name}</p>
                                <p className="text-xs text-foreground/50">{emp.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-foreground/70 hidden md:table-cell">{emp.department || <span className="text-foreground/30 italic">Unassigned</span>}</td>
                          <td className="p-4 text-foreground/70 hidden lg:table-cell">{emp.designation || <span className="text-foreground/30 italic">—</span>}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${roleBadgeColor[emp.role] || "bg-slate-500/10 text-slate-400 border-slate-500/30"}`}>{emp.role}</span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${emp.status === "Active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-red-500/10 text-red-400 border-red-500/30"}`}>{emp.status || "Active"}</span>
                          </td>
                          <td className="p-4 text-foreground/50 text-xs hidden sm:table-cell">{emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : "—"}</td>
                        </motion.tr>
                      ))}
                      {filteredEmployees.length === 0 && (
                        <tr><td colSpan={6} className="p-8 text-center text-foreground/40">No employees found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Departments */}
          {activeTab === "departments" && (
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-4 content-start">
                {DEPT_STATS.map((dept, i) => (
                  <motion.div key={dept._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}
                    className="glass-panel p-5 rounded-2xl border border-[var(--border)] hover:border-brand-500/30 transition-all relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" style={{ backgroundColor: dept.color || "#3b82f6" }} />
                    <div className="ml-3">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${dept.color}20` }}>
                          <Building2 className="w-5 h-5" style={{ color: dept.color }} />
                        </div>
                        {isAdmin && (
                          <button onClick={() => handleDeleteDept(dept._id)} className="p-1.5 text-foreground/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-foreground font-outfit">{dept.name}</h3>
                      {dept.description && <p className="text-sm text-foreground/60 mt-1 mb-3">{dept.description}</p>}
                      <div className="space-y-2 mt-3">
                        <div className="flex items-center gap-2 text-xs text-foreground/60">
                          <Users className="w-3.5 h-3.5" />
                          <span>{dept.memberCount} member{dept.memberCount !== 1 ? "s" : ""}</span>
                        </div>
                        {dept.headName && (
                          <div className="flex items-center gap-2 text-xs text-foreground/60">
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Head: {dept.headName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {DEPT_STATS.length === 0 && (
                  <div className="col-span-full glass-panel p-10 rounded-2xl text-center border border-[var(--border)]">
                    <Building2 className="w-10 h-10 text-foreground/20 mx-auto mb-3" />
                    <p className="text-sm text-foreground/50">No departments yet. Create one to get started.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Department Modal */}
      <AnimatePresence>
        {isDeptModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDeptModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-[var(--surface)] border border-[var(--border)] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden z-10">
              <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--background)]">
                <h2 className="text-xl font-bold font-outfit text-foreground">Create Department</h2>
                <button onClick={() => setIsDeptModalOpen(false)} className="p-2 rounded-xl hover:bg-[var(--surface-border)] transition-colors"><X className="w-5 h-5 text-foreground/60" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Department Name <span className="text-red-400">*</span></label>
                  <input value={deptForm.name} onChange={e => setDeptForm({ ...deptForm, name: e.target.value })} placeholder="e.g. Engineering" className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm focus:border-brand-500 transition-all text-foreground" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Description</label>
                  <textarea value={deptForm.description} onChange={e => setDeptForm({ ...deptForm, description: e.target.value })} rows={2} placeholder="Brief description..." className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm focus:border-brand-500 transition-all text-foreground resize-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Department Head (Email)</label>
                  <input value={deptForm.head} onChange={e => setDeptForm({ ...deptForm, head: e.target.value })} placeholder="manager@company.com" className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm focus:border-brand-500 transition-all text-foreground" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Color</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={deptForm.color} onChange={e => setDeptForm({ ...deptForm, color: e.target.value })} className="w-10 h-10 rounded-lg border border-[var(--border)] bg-[var(--background)] cursor-pointer" />
                    <span className="text-sm text-foreground/60">{deptForm.color}</span>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-[var(--border)] bg-[var(--background)] flex justify-end gap-3">
                <button onClick={() => setIsDeptModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm hover:bg-[var(--surface-border)] transition-colors text-foreground">Cancel</button>
                <button onClick={handleCreateDept} disabled={isSubmitting || !deptForm.name} className="px-5 py-2.5 rounded-xl text-sm bg-brand-600 hover:bg-brand-500 text-white transition-colors shadow-lg shadow-brand-500/20 disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                  Create
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
