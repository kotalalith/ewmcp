"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, UploadCloud, Search, Filter, MoreVertical, File, Download, X, Image as ImageIcon, FileArchive, LayoutTemplate, Trash2, ExternalLink } from "lucide-react";
import axios from "axios";

// Helper to format bytes
function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function DocumentsPage() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newDocCategory, setNewDocCategory] = useState("General");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const handleDeleteDoc = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await axios.delete(`/api/documents?id=${id}`);
      fetchDocuments();
    } catch (err) {
      console.error(err);
      alert("Failed to delete document");
    }
  };

  const [categories] = useState(["All", "Design", "Engineering", "Marketing", "Legal", "General"]);
  const [activeCategory, setActiveCategory] = useState("All");

  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await axios.get("/api/documents");
      setDocuments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const getIconForType = (type: string) => {
    if (type.includes("image")) return ImageIcon;
    if (type.includes("pdf")) return FileText;
    if (type.includes("zip") || type.includes("rar")) return FileArchive;
    return File;
  };

  const getColorForType = (type: string) => {
    if (type.includes("image")) return "text-emerald-500";
    if (type.includes("pdf")) return "text-red-500";
    if (type.includes("zip")) return "text-amber-500";
    return "text-brand-500";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      alert("Missing Cloudinary configuration in .env.local!");
      return;
    }

    setUploading(true);

    try {
      // 1. Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("upload_preset", uploadPreset);

      const cloudinaryRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        formData
      );

      const fileUrl = cloudinaryRes.data.secure_url;

      // 2. Save to our database
      await axios.post("/api/documents", {
        name: selectedFile.name,
        url: fileUrl,
        type: selectedFile.type || "unknown",
        size: formatBytes(selectedFile.size),
        category: newDocCategory
      });

      // 3. Reset and refresh
      setSelectedFile(null);
      setNewDocCategory("General");
      setIsUploadModalOpen(false);
      fetchDocuments();
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload file. Check console for details.");
    } finally {
      setUploading(false);
    }
  };

  const filteredDocs = activeCategory === "All" ? documents : documents.filter(d => d.category === activeCategory);

  return (
    <div className="space-y-6 relative h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold font-outfit text-foreground flex items-center gap-3">
            <div className="p-2 bg-brand-500/10 rounded-xl text-brand-500"><FileText className="w-6 h-6" /></div>
            File Gallery
          </h1>
          <p className="text-foreground/60 text-sm mt-1">Securely store and share project files.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <input type="text" placeholder="Search files..." className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl py-2.5 pl-9 pr-4 text-sm focus:border-brand-500 transition-all text-foreground" />
          </div>
          <button className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-border)] transition-colors shrink-0 text-foreground/70"><Filter className="w-4 h-4" /></button>
          <button onClick={() => setIsUploadModalOpen(true)} className="bg-brand-600 hover:bg-brand-500 text-white p-2.5 md:px-4 md:py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-brand-500/20 flex items-center gap-2 shrink-0">
            <UploadCloud className="w-4 h-4" /> <span className="hidden md:inline">Upload File</span>
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar shrink-0">
        {categories.map(cat => (
          <button 
            key={cat} 
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === cat ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'bg-[var(--surface)] border border-[var(--border)] text-foreground/70 hover:text-foreground hover:bg-[var(--surface-border)]'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 overflow-y-auto pb-6 content-start">
        {filteredDocs.map((doc, i) => {
          const Icon = getIconForType(doc.type);
          return (
            <motion.div key={doc._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="glass-panel p-4 rounded-2xl border border-[var(--border)] hover:border-brand-500/50 transition-colors group flex flex-col cursor-pointer">
              <div className="h-32 bg-[var(--background)] rounded-xl mb-4 border border-[var(--border)] flex items-center justify-center relative overflow-hidden group-hover:bg-[var(--surface-border)] transition-colors">
                <Icon className={`w-12 h-12 ${getColorForType(doc.type)} opacity-80`} />
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 hover:bg-brand-500 text-white rounded-lg transition-colors backdrop-blur-md" title="Open Document">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <div className="relative">
                    <button onClick={(e) => { e.preventDefault(); setOpenDropdownId(openDropdownId === doc._id ? null : doc._id); }} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors backdrop-blur-md"><MoreVertical className="w-4 h-4" /></button>
                    <AnimatePresence>
                      {openDropdownId === doc._id && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 top-full mt-2 w-32 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl z-20 overflow-hidden">
                          <button onClick={(e) => { e.preventDefault(); handleDeleteDoc(doc._id); setOpenDropdownId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-[var(--surface-border)] transition-colors text-left"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
              
              <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-brand-500 transition-colors" title={doc.name}>{doc.name}</h3>
              
              <div className="flex items-center justify-between mt-2 text-xs text-foreground/50">
                <span className="bg-[var(--surface-border)] px-2 py-0.5 rounded-md truncate max-w-[60%]">{doc.type.split('/')[1] || doc.type}</span>
                <span>{doc.size}</span>
              </div>
              
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--surface-border)] text-[10px] font-medium text-foreground/40">
                <span className="truncate max-w-[50%]">Added by {doc.uploadedBy}</span>
                <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
              </div>
            </motion.div>
          );
        })}
        {filteredDocs.length === 0 && (
          <div className="col-span-full py-12 text-center text-foreground/40">No documents found in this category.</div>
        )}
      </div>

      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsUploadModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-[var(--surface)] border border-[var(--border)] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden z-10 relative flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-[var(--border)] bg-[var(--background)]">
                <h2 className="text-xl font-bold font-outfit text-foreground">Upload Document</h2>
                <button onClick={() => setIsUploadModalOpen(false)} className="p-2 rounded-xl hover:bg-[var(--surface-border)] transition-colors"><X className="w-5 h-5 text-foreground/60" /></button>
              </div>
              <div className="p-6">
                
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                />

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[var(--border)] rounded-2xl p-8 text-center hover:bg-[var(--surface-border)] hover:border-brand-500/50 transition-colors cursor-pointer group mb-4"
                >
                  <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-8 h-8 text-brand-500" />
                  </div>
                  <h3 className="font-bold text-foreground mb-1">
                    {selectedFile ? selectedFile.name : "Click to select a file"}
                  </h3>
                  <p className="text-xs text-foreground/50">
                    {selectedFile ? formatBytes(selectedFile.size) : "Images, PDFs, or ZIPs"}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground/70 ml-1">Category</label>
                  <select 
                    value={newDocCategory} 
                    onChange={e => setNewDocCategory(e.target.value)} 
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-2 px-3 text-sm focus:border-brand-500 transition-colors text-foreground"
                  >
                    {categories.filter(c => c !== "All").map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

              </div>
              <div className="p-6 border-t border-[var(--border)] bg-[var(--background)] flex justify-end gap-3 mt-auto">
                <button onClick={() => setIsUploadModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm hover:bg-[var(--surface-border)] transition-colors text-foreground">Cancel</button>
                <button onClick={handleUpload} disabled={uploading || !selectedFile} className="px-5 py-2.5 rounded-xl text-sm bg-brand-600 hover:bg-brand-500 text-white transition-colors shadow-lg shadow-brand-500/20 disabled:opacity-50">
                  {uploading ? "Uploading..." : "Upload File"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
