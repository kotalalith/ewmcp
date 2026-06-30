"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Shield, Users, Database, ShieldAlert, Key, Settings, Loader2 } from "lucide-react";
import axios from "axios";

export default function AdminPage() {
  const { data: session } = sessionData();
  const role = (session?.user as any)?.role || "Employee";
  const isAdmin = role === "Administrator";

  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  function sessionData() {
    return useSession();
  }

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [uRes, logsRes] = await Promise.all([
        axios.get("/api/users"),
        axios.get("/api/audit-logs").catch(() => ({ data: { logs: [] } })),
      ]);
      setUsers(uRes.data || []);
      setAuditLogs(logsRes.data?.logs || logsRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin]);

  const handleRoleChange = async (email: string, newRole: string) => {
    try {
      await axios.post("/api/users", { email, role: newRole, updateOnly: true });
      fetchAdminData();
    } catch (e) {
      console.error(e);
      alert("Failed to update role");
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold font-outfit text-foreground">Access Denied</h1>
        <p className="text-foreground/60 mt-2">Only Administrators have access to the Admin Panel.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold font-outfit text-foreground flex items-center gap-3">
          <div className="p-2 bg-brand-500/10 rounded-xl text-brand-500"><Shield className="w-6 h-6" /></div>
          Admin Panel
        </h1>
        <p className="text-foreground/60 text-sm mt-1">Manage global system configurations, users, and view audit logs.</p>
      </div>

      <div className="flex gap-2 shrink-0">
        {[
          { id: "users", label: "User Roles", icon: Users },
          { id: "audit", label: "Audit Logs", icon: Database },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeTab === t.id ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20" : "bg-[var(--surface)] border border-[var(--border)] text-foreground/70 hover:text-foreground"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
      ) : activeTab === "users" ? (
        <div className="flex-1 overflow-y-auto">
          <div className="glass-panel rounded-2xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[var(--surface)] border-b border-[var(--border)]">
                <tr className="text-xs text-foreground/50 uppercase tracking-wider">
                  <th className="p-4 text-left font-semibold">User</th>
                  <th className="p-4 text-left font-semibold">Current Role</th>
                  <th className="p-4 text-left font-semibold">Update Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {users.map((u, i) => (
                  <tr key={u._id || u.email} className="hover:bg-[var(--surface-border)] transition-colors">
                    <td className="p-4">
                      <div>
                        <p className="font-semibold text-foreground">{u.name}</p>
                        <p className="text-xs text-foreground/50">{u.email}</p>
                      </div>
                    </td>
                    <td className="p-4 text-foreground/70 font-medium">{u.role}</td>
                    <td className="p-4">
                      <select
                        value={u.role}
                        onChange={e => handleRoleChange(u.email, e.target.value)}
                        className="bg-[var(--surface)] border border-[var(--border)] rounded-xl py-1.5 px-3 text-xs text-foreground focus:border-brand-500"
                      >
                        {["Administrator", "Manager", "Team Lead", "Employee", "Client"].map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="glass-panel rounded-2xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[var(--surface)] border-b border-[var(--border)]">
                <tr className="text-xs text-foreground/50 uppercase tracking-wider">
                  <th className="p-4 text-left font-semibold">Timestamp</th>
                  <th className="p-4 text-left font-semibold">User</th>
                  <th className="p-4 text-left font-semibold">Action</th>
                  <th className="p-4 text-left font-semibold">Resource</th>
                  <th className="p-4 text-left font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {auditLogs.map((log, i) => (
                  <tr key={log._id || i} className="hover:bg-[var(--surface-border)] transition-colors">
                    <td className="p-4 text-foreground/50 text-xs">{new Date(log.createdAt || log.timestamp).toLocaleString()}</td>
                    <td className="p-4">
                      <p className="font-medium text-foreground">{log.userName || log.userEmail}</p>
                    </td>
                    <td className="p-4 text-brand-400 font-semibold">{log.action}</td>
                    <td className="p-4 text-foreground/70">{log.resource}</td>
                    <td className="p-4 text-foreground/50 text-xs max-w-xs truncate">{log.details || "—"}</td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-foreground/40">No audit logs found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
