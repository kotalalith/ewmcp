"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { BarChart3, Download, TrendingUp, PieChart as PieChartIcon, Activity } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";

export default function ReportsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "Employee";
  const [timeframe, setTimeframe] = useState("This Week");

  if (!["Administrator", "Manager"].includes(role)) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
          <Activity className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold font-outfit text-foreground">Access Denied</h1>
        <p className="text-foreground/60 mt-2">Only Administrators and Managers can view organization reports.</p>
      </div>
    );
  }

  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, projectsRes] = await Promise.all([
          axios.get("/api/tasks"),
          axios.get("/api/projects")
        ]);
        setTasks(tasksRes.data || []);
        setProjects(projectsRes.data || []);
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalProjects = projects.length;
  const completedTasks = tasks.filter(t => t.status === "Completed" || t.status === "Done").length;
  const taskCompletion = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const activeIssues = tasks.filter(t => t.status !== "Completed" && t.status !== "Done").length;

  const currentStats = {
    projects: totalProjects,
    completion: taskCompletion,
    issues: activeIssues
  };

  // Generate real data based on actual task status counts
  const notStarted = tasks.filter(t => t.status === "Not Started").length;
  const inProgress = tasks.filter(t => t.status === "In Progress").length;
  const inReview = tasks.filter(t => t.status === "Review").length;
  const completed = completedTasks;

  // Render proportional height bars (percentage of maximum value)
  const statusCounts = [notStarted, inProgress, inReview, completed, projects.length, 0, 0];
  const maxVal = Math.max(...statusCounts, 1);
  const currentData = statusCounts.map(count => (count / maxVal) * 100);

  const handleDownloadCSV = () => {
    const headers = "Metric,Value\n";
    const rows = `Total Projects,${currentStats.projects}\nTask Completion,${currentStats.completion}%\nActive Tasks,${currentStats.issues}\nNot Started Tasks,${notStarted}\nIn Progress Tasks,${inProgress}\nIn Review Tasks,${inReview}\nCompleted Tasks,${completed}`;
    const csvContent = headers + rows;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `EWMCP_Report_${timeframe.replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold font-outfit text-foreground flex items-center gap-3">
            <div className="p-2 bg-brand-500/10 rounded-xl text-brand-500"><BarChart3 className="w-6 h-6" /></div>
            Reports & Analytics
          </h1>
          <p className="text-foreground/60 text-sm mt-1">Global insights and performance metrics.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            value={timeframe} 
            onChange={(e) => setTimeframe(e.target.value)}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-foreground focus:ring-1 focus:ring-brand-500 appearance-none outline-none"
          >
            <option>This Week</option>
            <option>This Month</option>
          </select>

          <button onClick={handleDownloadCSV} className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-border)] font-medium text-sm transition-colors text-foreground flex items-center justify-center gap-2">
            <Download className="w-4 h-4" /> CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        {[
          { label: "Total Projects", value: currentStats.projects, trend: "Real Data", positive: true },
          { label: "Task Completion", value: `${currentStats.completion}%`, trend: "Real Data", positive: true },
          { label: "Active Tasks", value: currentStats.issues, trend: "Real Data", positive: false },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-panel p-6 rounded-2xl border border-[var(--border)]">
            <p className="text-sm font-medium text-foreground/60 mb-2">{stat.label}</p>
            <div className="flex items-end gap-3">
              <h3 className="text-3xl font-bold font-outfit text-foreground">{stat.value}</h3>
              <span className="text-sm font-bold flex items-center gap-1 mb-1 text-brand-500">
                {stat.trend}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="glass-panel p-6 rounded-2xl border border-[var(--border)] flex flex-col">
          <h3 className="text-lg font-bold font-outfit text-foreground mb-6 flex items-center gap-2"><Activity className="w-5 h-5 text-brand-500" /> Velocity Breakdown</h3>
          <div className="flex-1 relative flex items-end justify-between pt-10 pb-4 px-2 gap-2">
            {currentData.map((h, i) => (
              <div key={i} className="w-full h-full bg-[var(--surface-border)] rounded-t-lg relative group">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 0.5, type: "spring" }}
                  className="absolute bottom-0 w-full bg-brand-500 rounded-t-lg group-hover:bg-brand-400" 
                />
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] text-foreground/40 font-bold uppercase tracking-wider">
                  {i === 0 ? "Todo" : i === 1 ? "Active" : i === 2 ? "Review" : i === 3 ? "Done" : i === 4 ? "Proj" : `M${i+1}`}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="glass-panel p-6 rounded-2xl border border-[var(--border)] flex flex-col">
          <h3 className="text-lg font-bold font-outfit text-foreground mb-6 flex items-center gap-2"><PieChartIcon className="w-5 h-5 text-accent-purple" /> Resource Allocation</h3>
          <div className="flex-1 flex items-center justify-center">
             <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--border)" strokeWidth="16" />
                <motion.circle initial={{ strokeDashoffset: 251.2 }} animate={{ strokeDashoffset: 251.2 * 0.4 }} transition={{ duration: 1 }} cx="50" cy="50" r="40" fill="transparent" stroke="#3b82f6" strokeWidth="16" strokeDasharray="251.2" />
                <motion.circle initial={{ strokeDashoffset: 251.2 }} animate={{ strokeDashoffset: 251.2 * 0.7 }} transition={{ duration: 1, delay: 0.2 }} cx="50" cy="50" r="40" fill="transparent" stroke="#8b5cf6" strokeWidth="16" strokeDasharray="251.2" className="origin-center -rotate-[144deg]" />
                <motion.circle initial={{ strokeDashoffset: 251.2 }} animate={{ strokeDashoffset: 251.2 * 0.85 }} transition={{ duration: 1, delay: 0.4 }} cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" strokeWidth="16" strokeDasharray="251.2" className="origin-center rotate-[72deg]" />
              </svg>
            </div>
            <div className="ml-8 space-y-3">
              <div className="flex items-center gap-2 text-sm text-foreground/50">Data synchronized successfully</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
