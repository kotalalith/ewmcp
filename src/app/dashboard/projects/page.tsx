"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderKanban, Plus, MoreVertical, Calendar, X, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import axios from "axios";

export default function ProjectsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "Employee";
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [projects, setProjects] = useState<any[]>([]);
  
  const [newProject, setNewProject] = useState({ name: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProjects = async () => {
    try {
      const res = await axios.get("/api/projects");
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);
  const handleCreateProject = async () => {
    if (!newProject.name) return;
    setIsSubmitting(true);
    try {
      const payload = {
        name: newProject.name,
        description: newProject.description,
        status: "Planning",
        progress: 0,
        team: [session?.user?.email]
      };
      await axios.post("/api/projects", payload);
      setNewProject({ name: "", description: "" });
      setIsModalOpen(false);
      fetchProjects();
    } catch (err) {
      console.error(err);
      alert("Failed to create project. Ensure you have the right permissions.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 relative h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-outfit text-foreground flex items-center gap-3">
            <div className="p-2 bg-brand-500/10 rounded-xl text-brand-500"><FolderKanban className="w-6 h-6" /></div>
            Projects
          </h1>
          <p className="text-foreground/60 text-sm mt-1">Manage and track your active projects.</p>
        </div>
        
        {/* Only Admins/Managers/Leads can create projects */}
        {["Administrator", "Manager", "Team Lead"].includes(role) && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-brand-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {projects.map((project, i) => (
          <motion.div 
            key={project._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-panel p-6 rounded-2xl border border-[var(--border)] group hover:border-brand-500/50 transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                project.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' :
                project.status === 'In Progress' ? 'bg-brand-500/10 text-brand-500' :
                'bg-amber-500/10 text-amber-500'
              }`}>
                {project.status}
              </div>
              <button 
                className="text-foreground/40 hover:text-red-500 transition-colors p-1" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  if(confirm('Delete project?')) axios.delete(`/api/projects?id=${project._id}`).then(fetchProjects) 
                }}
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
            
            <Link href={`/dashboard/projects/${project._id}`} className="block">
              <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-brand-500 transition-colors">{project.name}</h3>
              <p className="text-sm text-foreground/60 line-clamp-2 mb-4 min-h-[40px]">{project.description || "No description provided."}</p>
            </Link>
            
            <div className="mt-auto mb-2 flex justify-between items-center text-xs">
              <span className="text-foreground/60 font-medium">Progress</span>
              <span className="text-foreground font-bold">{project.progress || 0}%</span>
            </div>
            <div className="h-2 w-full bg-[var(--surface-border)] rounded-full overflow-hidden mb-6">
              <div className={`h-full rounded-full ${project.status === 'Completed' ? 'bg-emerald-500' : 'bg-brand-500'}`} style={{ width: `${project.progress || 0}%` }} />
            </div>

            <div className="pt-4 border-t border-[var(--surface-border)] flex justify-between items-center text-xs text-foreground/50">
              <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Due {project.due || "TBD"}</div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-500/20 to-purple-500/20 border border-[var(--border)] flex items-center justify-center text-brand-500 font-bold uppercase">
                {project.name.charAt(0)}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* New Project Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[var(--surface)] border border-[var(--border)] w-full max-w-md rounded-2xl shadow-2xl z-10 overflow-hidden">
              <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--background)]">
                <h2 className="text-xl font-bold text-foreground font-outfit">Create New Project</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-[var(--surface-border)] text-foreground/60 hover:text-foreground transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground/80">Project Name</label>
                  <input type="text" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} placeholder="e.g. Website Redesign" className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm focus:border-brand-500 text-foreground" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground/80">Description</label>
                  <textarea value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} rows={3} placeholder="Brief details about the project..." className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm focus:border-brand-500 text-foreground resize-none" />
                </div>
              </div>
              <div className="p-6 border-t border-[var(--border)] bg-[var(--background)] flex justify-end gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-medium text-sm text-foreground hover:bg-[var(--surface-border)] transition-colors">Cancel</button>
                <button onClick={handleCreateProject} disabled={isSubmitting} className="px-5 py-2.5 rounded-xl font-medium text-sm bg-brand-600 hover:bg-brand-500 text-white transition-colors shadow-lg shadow-brand-500/20 disabled:opacity-50">
                  {isSubmitting ? "Creating..." : "Create Project"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
