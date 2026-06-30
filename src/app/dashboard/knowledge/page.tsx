"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Search, ThumbsUp, ThumbsDown, Eye, Plus, X, Tag, Loader2 } from "lucide-react";
import axios from "axios";

const CATEGORIES = ["All", "FAQ", "Policy", "Guide", "Documentation", "Other"];
const CATEGORY_COLORS: Record<string, string> = {
  FAQ: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  Policy: "text-red-400 bg-red-500/10 border-red-500/30",
  Guide: "text-brand-400 bg-brand-500/10 border-brand-500/30",
  Documentation: "text-purple-400 bg-purple-500/10 border-purple-500/30",
  Other: "text-foreground/60 bg-[var(--surface-border)] border-[var(--border)]",
};

export default function KnowledgePage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "Employee";
  const isManager = ["Administrator", "Manager"].includes(role);

  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", category: "FAQ", tags: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      let url = "/api/knowledge";
      const params: string[] = [];
      if (activeCategory !== "All") params.push(`category=${activeCategory}`);
      if (search) params.push(`q=${encodeURIComponent(search)}`);
      if (params.length) url += "?" + params.join("&");
      const res = await axios.get(url);
      setArticles(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchArticles(); }, [activeCategory, search]);

  const handleCreate = async () => {
    if (!form.title || !form.content) return;
    setIsSubmitting(true);
    try {
      await axios.post("/api/knowledge", {
        ...form,
        tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      });
      setForm({ title: "", content: "", category: "FAQ", tags: "" });
      setIsModalOpen(false);
      fetchArticles();
    } catch (e) { console.error(e); }
    finally { setIsSubmitting(false); }
  };

  const handleHelpful = async (id: string, helpful: boolean) => {
    try {
      const updated = await axios.put("/api/knowledge", helpful ? { id, incrementHelpful: true } : { id, incrementNotHelpful: true });
      if (selectedArticle?._id === id) setSelectedArticle(updated.data);
      setArticles(prev => prev.map(a => a._id === id ? updated.data : a));
    } catch (e) { console.error(e); }
  };

  const handleView = async (article: any) => {
    setSelectedArticle(article);
    // Increment view count silently
    try {
      const res = await axios.post("/api/knowledge", { incrementView: true, id: article._id });
      setArticles(prev => prev.map(a => a._id === article._id ? { ...a, views: a.views + 1 } : a));
    } catch (e) {}
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold font-outfit text-foreground flex items-center gap-3">
            <div className="p-2 bg-brand-500/10 rounded-xl text-brand-500"><BookOpen className="w-6 h-6" /></div>
            Knowledge Base
          </h1>
          <p className="text-foreground/60 text-sm mt-1">FAQs, policies, guides and documentation.</p>
        </div>
        {isManager && (
          <button onClick={() => setIsModalOpen(true)} className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-brand-500/20 flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Article
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative shrink-0">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
        <input value={search} onChange={e => setSearch(e.target.value)} type="text" placeholder="Search articles, policies, guides..." className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:border-brand-500 transition-all text-foreground" />
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 shrink-0">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === cat ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20" : "bg-[var(--surface)] border border-[var(--border)] text-foreground/70 hover:text-foreground"}`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Article List */}
        <div className="lg:w-80 xl:w-96 space-y-3 overflow-y-auto shrink-0">
          {loading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
          ) : articles.length === 0 ? (
            <div className="glass-panel p-10 rounded-2xl text-center border border-[var(--border)]">
              <BookOpen className="w-10 h-10 text-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-foreground/50">No articles found.</p>
            </div>
          ) : articles.map((art, i) => (
            <motion.div key={art._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              onClick={() => handleView(art)}
              className={`glass-panel p-4 rounded-2xl border cursor-pointer transition-all hover:border-brand-500/30 ${selectedArticle?._id === art._id ? "border-brand-500/50 bg-brand-500/5" : "border-[var(--border)]"}`}>
              <div className="flex items-start gap-3">
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border shrink-0 ${CATEGORY_COLORS[art.category] || CATEGORY_COLORS.Other}`}>{art.category}</span>
              </div>
              <h3 className="font-semibold text-sm text-foreground mt-2 mb-1">{art.title}</h3>
              <p className="text-xs text-foreground/50 line-clamp-2 mb-2">{art.content}</p>
              <div className="flex items-center gap-3 text-xs text-foreground/40">
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {art.views}</span>
                <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {art.helpful}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Article Detail */}
        {selectedArticle ? (
          <div className="flex-1 glass-panel rounded-2xl border border-[var(--border)] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-[var(--border)] bg-[var(--background)]">
              <div className="flex items-start gap-3 mb-3">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${CATEGORY_COLORS[selectedArticle.category] || CATEGORY_COLORS.Other}`}>{selectedArticle.category}</span>
              </div>
              <h2 className="text-2xl font-bold font-outfit text-foreground mb-2">{selectedArticle.title}</h2>
              <div className="flex items-center gap-4 text-xs text-foreground/40">
                <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> {selectedArticle.views} views</span>
                <span>By {selectedArticle.createdByName}</span>
                <span>{new Date(selectedArticle.createdAt).toLocaleDateString()}</span>
              </div>
              {selectedArticle.tags?.length > 0 && (
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <Tag className="w-3.5 h-3.5 text-foreground/40" />
                  {selectedArticle.tags.map((tag: string) => (
                    <span key={tag} className="text-xs bg-[var(--surface-border)] text-foreground/60 px-2 py-0.5 rounded-md">#{tag}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose prose-invert max-w-none text-foreground/80 leading-relaxed whitespace-pre-wrap text-sm">{selectedArticle.content}</div>
            </div>
            <div className="p-5 border-t border-[var(--border)] bg-[var(--background)] flex items-center gap-3">
              <span className="text-sm text-foreground/50 mr-2">Was this helpful?</span>
              <button onClick={() => handleHelpful(selectedArticle._id, true)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border)] hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-400 text-foreground/60 text-sm font-medium transition-colors">
                <ThumbsUp className="w-4 h-4" /> Yes ({selectedArticle.helpful})
              </button>
              <button onClick={() => handleHelpful(selectedArticle._id, false)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border)] hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 text-foreground/60 text-sm font-medium transition-colors">
                <ThumbsDown className="w-4 h-4" /> No ({selectedArticle.notHelpful})
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 glass-panel rounded-2xl border border-[var(--border)] flex items-center justify-center">
            <div className="text-center">
              <BookOpen className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
              <p className="text-foreground/40 text-sm">Select an article to read</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Article Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-[var(--surface)] border border-[var(--border)] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--background)] shrink-0">
                <h2 className="text-xl font-bold font-outfit text-foreground">New Article</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-[var(--surface-border)] transition-colors"><X className="w-5 h-5 text-foreground/60" /></button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Title</label>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Article title" className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm focus:border-brand-500 transition-all text-foreground" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Category</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm focus:border-brand-500 text-foreground">
                      {["FAQ", "Policy", "Guide", "Documentation", "Other"].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Tags (comma-separated)</label>
                    <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="vpn, setup, it" className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm focus:border-brand-500 transition-all text-foreground" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Content</label>
                  <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={6} placeholder="Write the article content here..." className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm focus:border-brand-500 transition-all text-foreground resize-none" />
                </div>
              </div>
              <div className="p-6 border-t border-[var(--border)] bg-[var(--background)] flex justify-end gap-3 shrink-0">
                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm hover:bg-[var(--surface-border)] transition-colors text-foreground">Cancel</button>
                <button onClick={handleCreate} disabled={isSubmitting || !form.title || !form.content} className="px-5 py-2.5 rounded-xl text-sm bg-brand-600 hover:bg-brand-500 text-white transition-colors shadow-lg shadow-brand-500/20 disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                  Publish
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
