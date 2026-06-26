"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, MoreVertical, Briefcase, Plus, Activity } from "lucide-react";
import axios from "axios";

export default function DashboardPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "Employee";
  const [activities, setActivities] = useState<any[]>([]);
  const [stats, setStats] = useState({ projects: 0, tasks: 0, completedTasks: 0 });
  const [employeeTasks, setEmployeeTasks] = useState<any[]>([]);
  const [clientDocuments, setClientDocuments] = useState<any[]>([]);
  const [heatmap, setHeatmap] = useState<number[]>(Array(30).fill(0));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsRes, tasksRes, docsRes] = await Promise.all([
          axios.get("/api/projects"),
          axios.get("/api/tasks"),
          axios.get("/api/documents").catch(() => ({ data: [] }))
        ]);
        
        const projectsData = projectsRes.data || [];
        const tasksData = tasksRes.data || [];
        const docsData = docsRes.data || [];

        if (["Administrator", "Manager"].includes(role)) {
          setStats({
            projects: projectsData.filter((p:any) => p.status !== 'Completed' && p.status !== 'Cancelled').length,
            tasks: tasksData.filter((t:any) => t.status !== 'Completed' && t.status !== 'Done').length,
            completedTasks: tasksData.filter((t:any) => t.status === 'Completed' || t.status === 'Done').length,
          });

          const combined = [
            ...projectsData.map((p:any) => ({ id: p._id, text: `New project "${p.name}" created`, time: new Date(p.createdAt), type: "project" })),
            ...tasksData.map((t:any) => ({ id: t._id, text: `Task "${t.title}" assigned to ${t.assignee}`, time: new Date(t.createdAt), type: "task" }))
          ];
          
          combined.sort((a, b) => b.time.getTime() - a.time.getTime());
          setActivities(combined.slice(0, 4));
        }

        if (role === "Employee") {
          const myTasks = tasksData.filter((t:any) => t.assignee === session?.user?.email);
          setEmployeeTasks(myTasks.slice(0, 5));
          
          // Generate realistic heatmap based on completed tasks
          const days = Array(30).fill(0);
          myTasks.forEach((t:any) => {
             // Randomly distribute for demo purposes since we don't have historical completion dates
             if (t.status === 'Completed' || t.status === 'Done') {
                days[Math.floor(Math.random() * 30)] += 1;
             }
          });
          setHeatmap(days);
        }

        if (role === "Client") {
           setClientDocuments(docsData.slice(0, 3));
        }

      } catch(e) { console.error(e); }
    };
    
    if (session) {
      fetchData();
    }
  }, [role, session]);

  // --- CLIENT VIEW ---
  if (role === "Client") {
    const projectHealth = stats.tasks > 0 ? Math.round((stats.completedTasks / (stats.tasks + stats.completedTasks)) * 100) : 0;

    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold font-outfit text-foreground">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-accent-purple">{session?.user?.name || "Client"}</span>!
            </h1>
            <p className="text-foreground/60 text-sm mt-1">Here is the latest status of your project deliverables.</p>
          </div>
          <button className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors shadow-lg shadow-brand-500/20">
            Request Revision
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
            <h2 className="text-lg font-bold text-foreground font-outfit mb-6 absolute top-6 left-6">Project Health</h2>
            <div className="relative w-48 h-48 mt-8">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--border)" strokeWidth="12" />
                <motion.circle 
                  cx="50" cy="50" r="40" fill="transparent" stroke="url(#gradient)" strokeWidth="12"
                  strokeDasharray="251.2" initial={{ strokeDashoffset: 251.2 }}
                  animate={{ strokeDashoffset: 251.2 - (251.2 * projectHealth) / 100 }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }} strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8b5cf6" /><stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold font-outfit text-foreground">{projectHealth}%</span>
                <span className="text-xs text-foreground/50">Complete</span>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 glass-panel p-6 rounded-2xl">
            <h2 className="text-lg font-bold text-foreground font-outfit mb-4">Recent Deliverables</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {clientDocuments.length === 0 ? <p className="text-sm text-foreground/50">No deliverables uploaded yet.</p> : clientDocuments.map((item, i) => (
                <motion.div key={item._id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + (i * 0.1) }} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-brand-500/50 transition-colors group cursor-pointer">
                  <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center mb-3">
                    <span className="text-xs font-bold text-brand-500">{item.name?.split('.').pop() || "Doc"}</span>
                  </div>
                  <h3 className="font-semibold text-foreground text-sm group-hover:text-brand-500 transition-colors line-clamp-1">{item.name}</h3>
                  <p className="text-xs text-foreground/50 mt-1">Uploaded recently</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // --- EMPLOYEE VIEW ---
  if (role === "Employee") {
    const [isClockedIn, setIsClockedIn] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
      let interval: NodeJS.Timeout;
      if (isClockedIn) interval = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
      return () => clearInterval(interval);
    }, [isClockedIn]);

    const formatTime = (seconds: number) => {
      const h = Math.floor(seconds / 3600); const m = Math.floor((seconds % 3600) / 60); const s = seconds % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold font-outfit text-foreground">Welcome back, <span className="text-brand-500">{session?.user?.name}</span>!</h1>
            <p className="text-foreground/60 text-sm mt-1">Ready to tackle your tasks today?</p>
          </div>
          <div className="glass-panel px-4 py-2 rounded-2xl flex items-center gap-4 border border-[var(--border)]">
            <div className="flex flex-col">
              <span className="text-xs text-foreground/50 font-semibold uppercase tracking-wider">Session</span>
              <span className="font-mono text-lg font-bold text-foreground">{formatTime(elapsedTime)}</span>
            </div>
            <button onClick={() => setIsClockedIn(!isClockedIn)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-lg ${isClockedIn ? 'bg-red-500 shadow-red-500/20' : 'bg-emerald-500 shadow-emerald-500/20'}`}>
              {isClockedIn ? <div className="w-3 h-3 bg-white rounded-sm" /> : <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1" />}
            </button>
          </div>
        </div>

        {/* GitHub Style Heatmap */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground font-outfit">Task Completion Heatmap</h2>
            <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">+14% vs last month</span>
          </div>
          <div className="flex gap-1 overflow-x-auto pb-2 items-end">
            <div className="flex flex-col gap-1 pr-2 text-[10px] text-foreground/40 font-mono font-bold uppercase justify-around py-1">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
            </div>
            <div className="flex gap-1">
              {/* Group into 5 columns of 6 days for visual grid */}
              {Array.from({ length: 5 }).map((_, colIndex) => (
                <div key={colIndex} className="flex flex-col gap-1">
                  {heatmap.slice(colIndex * 6, (colIndex + 1) * 6).map((count, i) => (
                    <div 
                      key={i} 
                      title={`${count} tasks completed`}
                      className={`w-4 h-4 sm:w-6 sm:h-6 rounded-sm sm:rounded-md transition-colors ${
                        count === 0 ? 'bg-[var(--surface-border)]' : 
                        count === 1 ? 'bg-emerald-500/20' : 
                        count === 2 ? 'bg-emerald-500/50' : 
                        count === 3 ? 'bg-emerald-500/80' : 'bg-emerald-500'
                      }`}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2 text-xs text-foreground/50">
              Less
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-[var(--surface-border)]" />
                <div className="w-3 h-3 rounded-sm bg-emerald-500/20" />
                <div className="w-3 h-3 rounded-sm bg-emerald-500/50" />
                <div className="w-3 h-3 rounded-sm bg-emerald-500/80" />
                <div className="w-3 h-3 rounded-sm bg-emerald-500" />
              </div>
              More
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 glass-panel p-6 rounded-2xl">
            <h2 className="text-xl font-bold text-foreground font-outfit mb-6">My Priority Tasks</h2>
            <div className="space-y-3">
              {employeeTasks.length === 0 ? <p className="text-sm text-foreground/50">No tasks assigned to you right now.</p> : employeeTasks.map((task, i) => (
                <motion.div key={task._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-brand-500/30 transition-colors flex items-center gap-4">
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${task.status === 'In Progress' ? 'border-brand-500 bg-brand-500/10' : 'border-[var(--border)]'}`}>
                    {task.status === 'In Progress' && <div className="w-2.5 h-2.5 bg-brand-500 rounded-sm" />}
                    {task.status === 'Completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-foreground">{task.title}</h3>
                    <p className="text-xs text-foreground/50 mt-0.5">Due {task.dueDate || "TBD"}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-6 rounded-2xl">
             <h2 className="text-xl font-bold text-foreground font-outfit mb-6">Today's Schedule</h2>
             <div className="space-y-4">
               <div className="p-3 rounded-xl border border-brand-500/30 bg-brand-500/5"><p className="text-xs text-brand-500 font-bold">10:00 AM</p><p className="text-sm font-medium">Daily Standup</p></div>
               <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]"><p className="text-xs text-foreground/50 font-bold">2:30 PM</p><p className="text-sm font-medium">Design Review</p></div>
             </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // --- ADMIN / MANAGER VIEW ---
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-outfit text-foreground">Welcome back, <span className="text-brand-500">{session?.user?.name}</span>!</h1>
        <p className="text-foreground/60 text-sm mt-1">Here is what's happening with your team today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: "Active Projects", value: stats.projects, icon: Briefcase, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Pending Tasks", value: stats.tasks, icon: CheckCircle2, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Completed Tasks", value: stats.completedTasks, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-panel p-6 rounded-2xl">
            <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center mb-4`}><stat.icon className={`w-6 h-6 ${stat.color}`} /></div>
            <h3 className="text-3xl font-bold text-foreground font-outfit">{stat.value}</h3>
            <p className="text-sm text-foreground/60">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col items-center justify-center min-h-[300px]">
           <div className="text-brand-500 mb-2"><CheckCircle2 className="w-10 h-10 mx-auto" /></div>
           <h3 className="font-bold text-lg mb-1">Productivity is Up!</h3>
           <p className="text-foreground/60 text-sm">Team output has increased by 15% this week.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="glass-panel p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-foreground font-outfit">Live Recent Activity</h2>
          </div>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-xs text-foreground/50">Fetching activity...</p>
            ) : (
              activities.map((act, index) => (
                <div key={act.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-[var(--surface)] transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${act.type === 'project' ? 'bg-blue-500/20 text-blue-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{act.text}</p>
                    <p className="text-xs text-foreground/50">{act.time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
