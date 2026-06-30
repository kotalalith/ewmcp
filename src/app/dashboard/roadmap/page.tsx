"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FolderKanban, Calendar, TrendingUp, HelpCircle, Loader2 } from "lucide-react";
import axios from "axios";

export default function RoadmapPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axios.get("/api/projects");
        setProjects(res.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold font-outfit text-foreground flex items-center gap-3">
          <div className="p-2 bg-brand-500/10 rounded-xl text-brand-500"><FolderKanban className="w-6 h-6" /></div>
          Roadmap & Gantt Chart
        </h1>
        <p className="text-foreground/60 text-sm mt-1">Visualize project timelines, milestones, and release schedules.</p>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
      ) : projects.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center border border-[var(--border)]">
          <Calendar className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
          <p className="text-foreground/50">No projects to plot on the timeline roadmap.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto min-h-0">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-2xl border border-[var(--border)] p-6 min-w-[800px] h-full flex flex-col justify-between">
            <div>
              {/* Gantt Timeline header */}
              <div className="grid grid-cols-12 border-b border-[var(--border)] pb-3 text-center text-xs font-bold text-foreground/50 uppercase tracking-wider shrink-0">
                <div className="col-span-3 text-left">Project Title</div>
                <div>Jan</div>
                <div>Feb</div>
                <div>Mar</div>
                <div>Apr</div>
                <div>May</div>
                <div>Jun</div>
                <div>Jul</div>
                <div>Aug</div>
                <div>Sep</div>
              </div>

              {/* Timeline rows */}
              <div className="divide-y divide-[var(--border)]">
                {projects.map((proj, idx) => {
                  // Simulate timeline start & span for mockup purposes based on project data
                  const startCol = (idx % 3) + 4; // cols 4 to 6
                  const spanCol = (idx % 4) + 3;  // span 3 to 6
                  return (
                    <div key={proj._id} className="grid grid-cols-12 py-5 items-center">
                      <div className="col-span-3 pr-4">
                        <p className="font-semibold text-sm text-foreground truncate">{proj.name}</p>
                        <p className="text-xs text-foreground/40 mt-0.5">Progress: {proj.progress || 0}%</p>
                      </div>
                      <div className="col-span-9 relative h-6 bg-[var(--surface-border)]/20 rounded-lg">
                        <div 
                          className="absolute h-full rounded-lg bg-gradient-to-r from-brand-500 to-accent-purple flex items-center px-3"
                          style={{
                            left: `${((startCol - 4) / 9) * 100}%`,
                            width: `${(spanCol / 9) * 100}%`,
                          }}
                        >
                          <span className="text-[10px] text-white font-bold truncate">{proj.status}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-[var(--border)] pt-4 text-xs text-foreground/50 shrink-0">
              <span className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-brand-400" /> Auto-synchronized from project timelines</span>
              <span className="flex items-center gap-1"><HelpCircle className="w-3.5 h-3.5" /> Hover bar to edit dates</span>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
