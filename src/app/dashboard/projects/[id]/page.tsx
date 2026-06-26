"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, MoreVertical, Calendar as CalendarIcon, CheckCircle2, PlayCircle, BarChart3, Users } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import axios from "axios";

export default function ProjectDetailsPage() {
  const params = useParams();
  const [project, setProject] = useState<any>(null);

  useEffect(() => {
    // In a real app, fetch by ID: axios.get(`/api/projects/${params.id}`)
    // For this mockup, fetch all and find, or just mock it to look good.
    const fetchProject = async () => {
      try {
        const res = await axios.get("/api/projects");
        const found = res.data.find((p: any) => p._id === params.id) || res.data[0];
        setProject(found);
      } catch (e) { console.error(e); }
    };
    fetchProject();
  }, [params.id]);

  if (!project) return <div className="p-8 text-foreground/50">Loading project data...</div>;

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const timelineTasks = [
    { name: "Phase 1: Research", start: 0, length: 15, color: "bg-blue-500", row: 0 },
    { name: "Phase 2: Wireframes", start: 10, length: 20, color: "bg-purple-500", row: 1 },
    { name: "Phase 3: Development", start: 25, length: 40, color: "bg-brand-500", row: 2 },
    { name: "Phase 4: Testing", start: 60, length: 20, color: "bg-amber-500", row: 3 },
    { name: "Launch Preparation", start: 75, length: 15, color: "bg-emerald-500", row: 4 },
  ];

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <Link href="/dashboard/projects" className="flex items-center gap-2 text-sm font-medium text-foreground/50 hover:text-brand-500 transition-colors mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to Projects
          </Link>
          <h1 className="text-3xl font-bold font-outfit text-foreground flex items-center gap-3">
            {project.name || "Project Details"}
          </h1>
          <p className="text-foreground/60 text-sm mt-1">{project.description || "Detailed view and timeline tracking."}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2 mr-4">
            {["J", "S", "M"].map((u, i) => (
              <div key={i} className={`w-8 h-8 rounded-full border-2 border-[var(--background)] flex items-center justify-center text-xs font-bold text-white ${i===0?'bg-blue-500':i===1?'bg-purple-500':'bg-emerald-500'} relative z-${30-i*10}`}>
                {u}
              </div>
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-[var(--background)] bg-[var(--surface-border)] flex items-center justify-center text-xs font-bold text-foreground relative z-0">+2</div>
          </div>
          <button className="bg-[var(--surface)] hover:bg-[var(--surface-border)] border border-[var(--border)] text-foreground px-4 py-2.5 rounded-xl font-medium text-sm transition-colors">
            Edit Details
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0">
        <div className="glass-panel p-6 rounded-2xl border border-[var(--border)]">
          <p className="text-sm text-foreground/50 mb-1">Status</p>
          <div className="flex items-center gap-2 font-bold text-lg"><PlayCircle className="w-5 h-5 text-brand-500" /> {project.status}</div>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-[var(--border)]">
          <p className="text-sm text-foreground/50 mb-1">Overall Progress</p>
          <div className="flex items-center gap-2 font-bold text-lg"><BarChart3 className="w-5 h-5 text-emerald-500" /> {project.progress || 0}%</div>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-[var(--border)]">
          <p className="text-sm text-foreground/50 mb-1">Deadline</p>
          <div className="flex items-center gap-2 font-bold text-lg"><CalendarIcon className="w-5 h-5 text-amber-500" /> Q3 2026</div>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-[var(--border)]">
          <p className="text-sm text-foreground/50 mb-1">Budget Spent</p>
          <div className="flex items-center gap-2 font-bold text-lg"><CheckCircle2 className="w-5 h-5 text-purple-500" /> $45k / $60k</div>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-[var(--border)] flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold font-outfit text-foreground flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-500" /> Gantt Timeline
          </h2>
          <select className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-1.5 text-sm outline-none">
            <option>H1 2026</option>
            <option>H2 2026</option>
          </select>
        </div>

        <div className="flex-1 overflow-x-auto relative">
          <div className="min-w-[800px] h-full flex flex-col relative pb-4">
            
            {/* Timeline Header (Months) */}
            <div className="flex border-b border-[var(--border)] pb-2 mb-4 relative z-10">
              <div className="w-48 shrink-0 font-semibold text-sm text-foreground/60 uppercase tracking-wider pl-2">Task / Phase</div>
              <div className="flex-1 flex">
                {months.map((m, i) => (
                  <div key={m} className="flex-1 text-center font-bold text-sm text-foreground/60 border-l border-[var(--border)]/50">{m}</div>
                ))}
              </div>
            </div>

            {/* Grid Lines */}
            <div className="absolute top-10 bottom-0 left-48 right-0 flex pointer-events-none z-0">
              {months.map((m, i) => (
                <div key={i} className="flex-1 border-l border-[var(--surface-border)] h-full border-dashed opacity-50" />
              ))}
            </div>

            {/* Timeline Bars */}
            <div className="flex-1 relative z-10 space-y-4">
              {timelineTasks.map((t, i) => (
                <div key={i} className="flex items-center group relative h-10">
                  <div className="w-48 shrink-0 font-medium text-sm text-foreground truncate pr-4 pl-2 group-hover:text-brand-500 transition-colors">
                    {t.name}
                  </div>
                  <div className="flex-1 relative h-full bg-[var(--surface)]/30 rounded-lg overflow-hidden group-hover:bg-[var(--surface)] transition-colors">
                    <motion.div 
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: `${t.length}%`, opacity: 1 }}
                      transition={{ duration: 1, delay: i * 0.1, type: "spring", stiffness: 50 }}
                      className={`absolute top-1.5 bottom-1.5 rounded-md shadow-lg flex items-center px-3 overflow-hidden ${t.color}`}
                      style={{ left: `${t.start}%` }}
                    >
                      <span className="text-[10px] font-bold text-white whitespace-nowrap">{t.name}</span>
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
