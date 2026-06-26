"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { LayoutDashboard, List, CheckSquare, Clock, Plus, MoreVertical, Calendar, Trash2 } from "lucide-react";
import axios from "axios";
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Individual Sortable Task Card Component
function SortableTaskItem({ id, task, onDelete }: { id: string, task: any, onDelete: (id: string) => void }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-brand-500/50 shadow-sm relative group">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-sm text-foreground">{task.title}</h4>
        <div className="relative">
          <button 
            onPointerDown={(e) => e.stopPropagation()} 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
            className="text-foreground/40 hover:text-foreground"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {isDropdownOpen && (
            <div onPointerDown={(e) => e.stopPropagation()} className="absolute right-0 top-full mt-1 w-32 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl z-20 overflow-hidden">
               <button onClick={() => { setIsDropdownOpen(false); onDelete(id); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-[var(--surface-border)] transition-colors text-left">
                 <Trash2 className="w-3.5 h-3.5" /> Delete
               </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-1.5 text-xs text-foreground/50">
          <Calendar className="w-3.5 h-3.5" />
          {new Date(task.dueDate || Date.now()).toLocaleDateString()}
        </div>
        <div className={`w-6 h-6 rounded-full bg-brand-500/20 text-brand-500 flex items-center justify-center text-[10px] font-bold`}>
          {task.assignee?.charAt(0).toUpperCase() || "U"}
        </div>
      </div>
    </div>
  );
}

// Column Component
function Column({ id, title, tasks, onDelete }: { id: string, title: string, tasks: any[], onDelete: (id: string) => void }) {
  return (
    <div className="bg-[var(--background)]/50 rounded-2xl border border-[var(--border)] flex flex-col h-[calc(100vh-14rem)] min-w-[320px] max-w-[350px]">
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
        <h3 className="font-bold font-outfit text-foreground flex items-center gap-2">
          {title}
          <span className="text-xs bg-[var(--surface-border)] px-2 py-0.5 rounded-full text-foreground/60">{tasks.length}</span>
        </h3>
        <button className="p-1 rounded hover:bg-[var(--surface-border)]"><Plus className="w-4 h-4 text-foreground/50" /></button>
      </div>
      <div className="p-3 flex-1 overflow-y-auto space-y-3">
        <SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <SortableTaskItem key={task._id} id={task._id} task={task} onDelete={onDelete} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<any[]>([]);
  const [view, setView] = useState<"board"|"list">("board");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", assignee: "", dueDate: "", project: "", priority: "Medium", status: "Not Started" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allProjects, setAllProjects] = useState<any[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchTasks();
    fetchUsersAndProjects();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await axios.get("/api/tasks");
      setTasks(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchUsersAndProjects = async () => {
    try {
      const [usersRes, projectsRes] = await Promise.all([
        axios.get("/api/users"),
        axios.get("/api/projects")
      ]);
      setAllUsers(usersRes.data);
      setAllProjects(projectsRes.data);
    } catch (err) { console.error(err); }
  };

  const handleCreateTask = async () => {
    if (!newTask.title) return;
    setIsSubmitting(true);
    try {
      await axios.post("/api/tasks", newTask);
      setNewTask({ title: "", description: "", assignee: "", dueDate: "", project: "", priority: "Medium", status: "Not Started" });
      setIsModalOpen(false);
      fetchTasks();
    } catch (err) {
      console.error(err);
      alert("Error creating task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      try {
        setTasks(prev => prev.filter(t => t._id !== id));
        await axios.delete(`/api/tasks?id=${id}`);
      } catch (err) {
        console.error("Failed to delete", err);
        fetchTasks();
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    
    // Find which column it was dropped into (this is simplified, ideally we track column bounds, 
    // but for dnd-kit verticalList we check the over item's status)
    const activeTask = tasks.find(t => t._id === taskId);
    const overTask = tasks.find(t => t._id === over.id);
    
    if (activeTask && overTask && activeTask.status !== overTask.status) {
      const newStatus = overTask.status;
      
      // Optimistic update
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
      
      try {
        await axios.put("/api/tasks", { id: taskId, status: newStatus });
      } catch (err) {
        console.error("Failed to update task status", err);
        fetchTasks(); // Revert on fail
      }
    }
  };

  const columns = [
    { id: "Not Started", title: "To Do" },
    { id: "In Progress", title: "In Progress" },
    { id: "Completed", title: "Done" },
  ];

  return (
    <div className="space-y-6 h-full flex flex-col relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold font-outfit text-foreground flex items-center gap-3">
            <div className="p-2 bg-brand-500/10 rounded-xl text-brand-500"><CheckSquare className="w-6 h-6" /></div>
            Tasks Board
          </h1>
          <p className="text-foreground/60 text-sm mt-1">Drag and drop to manage workflow.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1">
            <button onClick={() => setView("board")} className={`p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${view === 'board' ? 'bg-[var(--surface-border)] text-foreground' : 'text-foreground/50 hover:text-foreground'}`}>
              <LayoutDashboard className="w-4 h-4" /> Board
            </button>
            <button onClick={() => setView("list")} className={`p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${view === 'list' ? 'bg-[var(--surface-border)] text-foreground' : 'text-foreground/50 hover:text-foreground'}`}>
              <List className="w-4 h-4" /> List
            </button>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-brand-500/20 flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Task
          </button>
        </div>
      </div>

      {view === "board" ? (
        <div className="flex-1 overflow-x-auto min-h-0 pb-4">
          <div className="flex gap-6 h-full items-start">
            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
              {columns.map(col => (
                <Column 
                  key={col.id} 
                  id={col.id} 
                  title={col.title} 
                  tasks={tasks.filter(t => t.status === col.id)} 
                  onDelete={handleDeleteTask}
                />
              ))}
            </DndContext>
          </div>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-[var(--border)] overflow-hidden flex-1 flex flex-col">
           <table className="w-full text-left text-sm">
            <thead className="bg-[var(--surface)] border-b border-[var(--border)] text-foreground/60 uppercase tracking-wider text-xs">
              <tr>
                <th className="p-4 font-semibold">Task</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Assignee</th>
                <th className="p-4 font-semibold">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] overflow-y-auto">
              {tasks.map((task) => (
                <tr key={task._id} className="hover:bg-[var(--surface-border)] transition-colors">
                  <td className="p-4 font-medium text-foreground">{task.title}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${task.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' : task.status === 'In Progress' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-500/10 text-slate-500'}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="p-4 text-foreground/70">{task.assignee}</td>
                  <td className="p-4 text-foreground/70">{new Date(task.dueDate || Date.now()).toLocaleDateString()}</td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-foreground/50">No tasks found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* New Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="bg-[var(--surface)] border border-[var(--border)] w-full max-w-lg rounded-3xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--background)] shrink-0">
              <h2 className="text-xl font-bold text-foreground font-outfit">Create New Task</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-[var(--surface-border)] text-foreground/60 hover:text-foreground transition-colors"><MoreVertical className="w-5 h-5 rotate-45" /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground/80">Task Title <span className="text-red-500">*</span></label>
                <input type="text" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} placeholder="e.g. Design Homepage" className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm focus:border-brand-500 text-foreground transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground/80">Description</label>
                <textarea value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} placeholder="Add more details about this task..." rows={3} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm focus:border-brand-500 text-foreground transition-colors resize-none" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground/80">Project</label>
                  <select value={newTask.project} onChange={e => setNewTask({...newTask, project: e.target.value})} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm focus:border-brand-500 text-foreground transition-colors">
                    <option value="">No Project</option>
                    {allProjects.map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground/80">Assignee</label>
                  <select value={newTask.assignee} onChange={e => setNewTask({...newTask, assignee: e.target.value})} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm focus:border-brand-500 text-foreground transition-colors">
                    <option value="">Unassigned</option>
                    {allUsers.map(u => (
                      <option key={u.email} value={u.email}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground/80">Priority</label>
                  <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm focus:border-brand-500 text-foreground transition-colors">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground/80">Due Date</label>
                  <input type="date" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm focus:border-brand-500 text-foreground transition-colors [color-scheme:dark]" />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-[var(--border)] bg-[var(--background)] flex justify-end gap-3 shrink-0 mt-auto">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-semibold text-sm text-foreground hover:bg-[var(--surface-border)] transition-colors">Cancel</button>
              <button onClick={handleCreateTask} disabled={isSubmitting || !newTask.title} className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-brand-600 hover:bg-brand-500 text-white transition-colors shadow-lg shadow-brand-500/20 disabled:opacity-50">
                {isSubmitting ? "Creating..." : "Create Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
