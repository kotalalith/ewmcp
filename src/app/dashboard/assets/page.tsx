"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Laptop, Plus, X, Search, QrCode, Cpu, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import axios from "axios";

const ASSET_TYPES = ["Laptop", "Mobile", "Monitor", "Accessory", "Other"];
const STATUS_COLORS: Record<string, string> = {
  Allocated: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  Available: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  "Under Repair": "bg-amber-500/10 text-amber-400 border-amber-500/30",
  Retired: "bg-red-500/10 text-red-400 border-red-500/30",
};

export default function AssetsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "Employee";
  const isAdmin = role === "Administrator";

  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", type: "Laptop", serialNumber: "", notes: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  
  // Allocate asset fields
  const [allocateEmail, setAllocateEmail] = useState("");
  const [allocateName, setAllocateName] = useState("");

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/assets");
      setAssets(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleCreate = async () => {
    if (!form.name || !form.serialNumber) return;
    setIsSubmitting(true);
    try {
      await axios.post("/api/assets", form);
      setForm({ name: "", type: "Laptop", serialNumber: "", notes: "" });
      setIsModalOpen(false);
      fetchAssets();
    } catch (e) {
      console.error(e);
      alert("Failed to add asset");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAllocate = async (asset: any) => {
    try {
      await axios.put("/api/assets", {
        id: asset._id,
        status: "Allocated",
        assignedTo: allocateEmail,
        assignedToName: allocateName,
      });
      setSelectedAsset(null);
      setAllocateEmail("");
      setAllocateName("");
      fetchAssets();
    } catch (e) {
      console.error(e);
    }
  };

  const handleReturn = async (id: string) => {
    if (!confirm("Confirm asset return?")) return;
    try {
      await axios.put("/api/assets", {
        id,
        status: "Available",
        assignedTo: "",
        assignedToName: "",
      });
      fetchAssets();
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = assets.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
    (a.assignedToName && a.assignedToName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold font-outfit text-foreground flex items-center gap-3">
            <div className="p-2 bg-brand-500/10 rounded-xl text-brand-500"><Laptop className="w-6 h-6" /></div>
            Asset Allocation
          </h1>
          <p className="text-foreground/60 text-sm mt-1">Track laptops, devices, and hardware allocations.</p>
        </div>
        {isAdmin && (
          <button onClick={() => setIsModalOpen(true)} className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-brand-500/20 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Asset
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="relative shrink-0">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
        <input value={search} onChange={e => setSearch(e.target.value)} type="text" placeholder="Search by asset name, serial, or assignee..." className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:border-brand-500 transition-all text-foreground" />
      </div>

      {/* Assets Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto pb-4">
        {loading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl text-center border border-[var(--border)]">
            <Laptop className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
            <p className="text-foreground/50">No assets found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 content-start">
            {filtered.map((asset, i) => (
              <motion.div key={asset._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                className="glass-panel p-5 rounded-2xl border border-[var(--border)] hover:border-brand-500/30 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${STATUS_COLORS[asset.status]}`}>{asset.status}</span>
                    <span className="text-xs font-mono text-foreground/40">{asset.serialNumber}</span>
                  </div>
                  <h3 className="font-bold text-foreground text-base mb-1">{asset.name}</h3>
                  <p className="text-xs text-foreground/50 mb-3">Type: {asset.type}</p>

                  {asset.assignedToName ? (
                    <div className="mt-2 p-3 bg-brand-500/5 border border-brand-500/10 rounded-xl">
                      <p className="text-xs text-foreground/40 uppercase font-semibold">Assigned To</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{asset.assignedToName}</p>
                      <p className="text-xs text-foreground/50">{asset.assignedTo}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-foreground/30 italic">No allocation</p>
                  )}
                </div>

                {isAdmin && (
                  <div className="mt-4 pt-3 border-t border-[var(--surface-border)] flex gap-2">
                    {asset.status === "Available" ? (
                      <button onClick={() => setSelectedAsset(asset)} className="flex-1 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-brand-500/20">
                        <Cpu className="w-3.5 h-3.5" /> Allocate
                      </button>
                    ) : (
                      <button onClick={() => handleReturn(asset._id)} className="flex-1 py-2 rounded-xl border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-xs font-bold transition-all">
                        Return Asset
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Asset Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-[var(--surface)] border border-[var(--border)] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden z-10">
              <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--background)]">
                <h2 className="text-xl font-bold font-outfit text-foreground">Add New Asset</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-[var(--surface-border)] transition-colors"><X className="w-5 h-5 text-foreground/60" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Asset Name</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. MacBook Pro 14" className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm focus:border-brand-500 transition-all text-foreground" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Type</label>
                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm focus:border-brand-500 text-foreground">
                      {ASSET_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Serial Number</label>
                    <input value={form.serialNumber} onChange={e => setForm({ ...form, serialNumber: e.target.value })} placeholder="e.g. S-901-A" className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm focus:border-brand-500 transition-all text-foreground" />
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-[var(--border)] bg-[var(--background)] flex justify-end gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm hover:bg-[var(--surface-border)] transition-colors text-foreground">Cancel</button>
                <button onClick={handleCreate} disabled={isSubmitting || !form.name || !form.serialNumber} className="px-5 py-2.5 rounded-xl text-sm bg-brand-600 hover:bg-brand-500 text-white transition-colors shadow-lg shadow-brand-500/20 disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Create
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Allocation Modal */}
      <AnimatePresence>
        {selectedAsset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedAsset(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-[var(--surface)] border border-[var(--border)] w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden z-10 p-6">
              <h3 className="text-lg font-bold font-outfit text-foreground mb-4">Allocate Asset: {selectedAsset.name}</h3>
              <div className="space-y-4 mb-6">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Assignee Name</label>
                  <input value={allocateName} onChange={e => setAllocateName(e.target.value)} placeholder="e.g. John Doe" className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm focus:border-brand-500 transition-all text-foreground" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Assignee Email</label>
                  <input value={allocateEmail} onChange={e => setAllocateEmail(e.target.value)} placeholder="e.g. john@company.com" className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm focus:border-brand-500 transition-all text-foreground" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setSelectedAsset(null)} className="flex-1 py-2.5 rounded-xl text-sm border border-[var(--border)] hover:bg-[var(--surface-border)] transition-colors text-foreground">Cancel</button>
                <button onClick={() => handleAllocate(selectedAsset)} disabled={!allocateName || !allocateEmail} className="flex-1 py-2.5 rounded-xl text-sm bg-brand-600 hover:bg-brand-500 text-white transition-colors">Allocate</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
