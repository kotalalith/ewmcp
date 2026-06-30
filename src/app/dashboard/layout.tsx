"use client";

import { useSession, signOut, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, FolderKanban, CheckSquare, Users, 
  FileText, MessageSquare, Calendar, LogOut, ShieldCheck,
  BarChart3, Settings as SettingsIcon, Search, Sparkles, X, Send, Bell, ChevronUp,
  Laptop, Video
} from "lucide-react";

const allNavigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard, roles: ["Administrator", "Manager", "Team Lead", "Employee", "Client"] },
  { name: "Projects", href: "/dashboard/projects", icon: FolderKanban, roles: ["Administrator", "Manager", "Team Lead"] },
  { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare, roles: ["Administrator", "Manager", "Team Lead", "Employee"] },
  { name: "Team", href: "/dashboard/team", icon: Users, roles: ["Administrator", "Manager"] },
  { name: "Calendar", href: "/dashboard/calendar", icon: Calendar, roles: ["Administrator", "Manager", "Team Lead", "Employee"] },
  { name: "Roadmap", href: "/dashboard/roadmap", icon: FolderKanban, roles: ["Administrator", "Manager", "Team Lead", "Employee"] },
  { name: "Collaboration", href: "/dashboard/collaboration", icon: Video, roles: ["Administrator", "Manager", "Team Lead", "Employee"] },
  { name: "Assets", href: "/dashboard/assets", icon: Laptop, roles: ["Administrator", "Manager", "Team Lead", "Employee"] },
  { name: "Leave", href: "/dashboard/leave", icon: Calendar, roles: ["Administrator", "Manager", "Team Lead", "Employee"] },
  { name: "Attendance", href: "/dashboard/attendance", icon: LayoutDashboard, roles: ["Administrator", "Manager", "Team Lead", "Employee"] },
  { name: "Timesheet", href: "/dashboard/timesheet", icon: CheckSquare, roles: ["Administrator", "Manager", "Team Lead", "Employee"] },
  { name: "Approvals", href: "/dashboard/approvals", icon: ShieldCheck, roles: ["Administrator", "Manager"] },
  { name: "HR Module", href: "/dashboard/hr", icon: Users, roles: ["Administrator", "Manager"] },
  { name: "Announcements", href: "/dashboard/announcements", icon: MessageSquare, roles: ["Administrator", "Manager", "Team Lead", "Employee", "Client"] },
  { name: "Help Desk", href: "/dashboard/helpdesk", icon: CheckSquare, roles: ["Administrator", "Manager", "Team Lead", "Employee", "Client"] },
  { name: "Knowledge Base", href: "/dashboard/knowledge", icon: FileText, roles: ["Administrator", "Manager", "Team Lead", "Employee", "Client"] },
  { name: "Documents", href: "/dashboard/documents", icon: FileText, roles: ["Administrator", "Manager", "Team Lead", "Employee", "Client"] },
  { name: "Messages", href: "/dashboard/messages", icon: MessageSquare, roles: ["Administrator", "Manager", "Team Lead", "Employee", "Client"] },
  { name: "Meetings", href: "/dashboard/meetings", icon: Calendar, roles: ["Administrator", "Manager", "Team Lead", "Employee"] },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart3, roles: ["Administrator", "Manager"] },
  { name: "Admin Panel", href: "/dashboard/admin", icon: ShieldCheck, roles: ["Administrator"] },
  { name: "Settings", href: "/dashboard/settings", icon: SettingsIcon, roles: ["Administrator", "Manager", "Team Lead", "Employee", "Client"] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // AI Chat States
  const [chatMessages, setChatMessages] = useState<{role: string, content: string}[]>([
    { role: 'assistant', content: 'Hello! I am your EWMCP AI assistant powered by Gemma. How can I help you today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAIOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isAIOpen]);

  const handleSendAiMessage = async () => {
    if (!chatInput.trim() || isAiLoading) return;
    
    const newUserMsg = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, newUserMsg]);
    setChatInput('');
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...chatMessages, newUserMsg] })
      });
      const data = await res.json();
      if (data.reply) {
         setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
         setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error.' }]);
      }
    } catch (err) {
       console.error(err);
       setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered a network error.' }]);
    } finally {
       setIsAiLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/notifications")
        .then(res => res.json())
        .then(data => {
           if(Array.isArray(data)) setNotifications(data);
        });
    }
  }, [status]);

  const markAsRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Global Search Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">Loading...</div>;
  }

  const role = (session?.user as any)?.role || "Employee";
  const navigation = allNavigation.filter(nav => nav.roles.includes(role));

  return (
    <div className="flex h-screen bg-[var(--background)] overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-[var(--border)] bg-[var(--surface)] flex flex-col hidden md:flex shrink-0 z-20">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-[var(--border)] shrink-0">
          <ShieldCheck className="w-6 h-6 text-brand-500" />
          <span className="font-bold font-outfit text-foreground tracking-wide">EWMCP</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-brand-500/10 text-brand-500' : 'text-foreground/70 hover:text-foreground hover:bg-[var(--surface-border)]'}`}>
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[var(--border)] shrink-0 relative">
          <AnimatePresence>
            {isRoleMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full left-4 right-4 mb-2 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl overflow-hidden z-30"
              >
                <div className="px-3 py-2 text-[10px] font-bold text-foreground/50 uppercase tracking-wider bg-[var(--background)] border-b border-[var(--border)]">Switch Role (Demo)</div>
                <div className="p-1 space-y-0.5">
                  {[
                    { name: "Administrator", email: "admin@test.com" },
                    { name: "Manager", email: "manager@test.com" },
                    { name: "Team Lead", email: "lead@test.com" },
                    { name: "Employee", email: "employee@test.com" },
                    { name: "Client", email: "client@test.com" }
                  ].map(r => (
                    <button 
                      key={r.name}
                      onClick={() => signIn('credentials', { email: r.email, password: 'password', callbackUrl: '/dashboard' })}
                      className={`w-full text-left px-3 py-2 text-sm rounded-xl transition-colors ${role === r.name ? 'bg-brand-500/10 text-brand-500 font-bold' : 'hover:bg-[var(--surface-border)] text-foreground/80'}`}
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
            className="w-full flex items-center gap-3 mb-4 p-2 -mx-2 rounded-xl hover:bg-[var(--surface-border)] transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-500 to-accent-purple flex items-center justify-center text-white font-bold text-sm shrink-0">
              {session?.user?.name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{session?.user?.name}</p>
              <p className="text-xs text-brand-500 font-medium truncate">{role}</p>
            </div>
            <ChevronUp className={`w-4 h-4 text-foreground/40 transition-transform ${isRoleMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          <button 
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between px-6 shrink-0 relative z-10">
          <div className="flex items-center gap-2 md:hidden">
            <ShieldCheck className="w-6 h-6 text-brand-500" />
            <span className="font-bold font-outfit text-foreground">EWMCP</span>
          </div>
          
          <div className="hidden md:flex flex-1 justify-end items-center gap-4">
            <button onClick={() => setIsSearchOpen(true)} className="flex items-center gap-2 bg-[var(--background)] border border-[var(--border)] hover:border-brand-500/50 text-foreground/50 px-4 py-2 rounded-xl text-sm transition-all w-64">
              <Search className="w-4 h-4" />
              <span>Search platform...</span>
              <span className="ml-auto text-[10px] border border-[var(--border)] rounded px-1.5 font-mono">Ctrl K</span>
            </button>
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--surface-border)] transition-colors relative"
              >
                <Bell className="w-4 h-4 text-foreground/70" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-[var(--background)]"></span>
                )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                    exit={{ opacity: 0, y: 10, scale: 0.95 }} 
                    className="absolute right-0 mt-2 w-80 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--background)]">
                      <h3 className="font-bold text-foreground">Notifications</h3>
                      <span className="text-xs bg-brand-500 text-white px-2 py-0.5 rounded-full">{unreadCount} New</span>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-foreground/50 text-sm">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <div 
                            key={notif._id} 
                            onClick={() => { if(!notif.read) markAsRead(notif._id); }}
                            className={`p-4 border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-border)] transition-colors cursor-pointer ${notif.read ? 'opacity-60' : 'bg-brand-500/5'}`}
                          >
                            <p className="text-sm text-foreground">{notif.message}</p>
                            <p className="text-xs text-foreground/50 mt-1">{new Date(notif.createdAt).toLocaleDateString()}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-[var(--background)] to-[var(--surface)] relative z-0">
          {children}
        </main>

        {/* AI Assistant Widget */}
        <div className="fixed bottom-6 right-6 z-50">
          <AnimatePresence>
            {isAIOpen && (
              <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="absolute bottom-16 right-0 w-80 sm:w-96 glass-panel border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[500px]">
                <div className="bg-gradient-to-r from-brand-500 to-accent-purple p-4 flex items-center justify-between text-white shrink-0">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    <span className="font-bold font-outfit">EWMCP AI Assistant</span>
                  </div>
                  <button onClick={() => setIsAIOpen(false)} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--surface)]">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-500 to-accent-purple flex items-center justify-center shrink-0 text-white">
                          <Sparkles className="w-4 h-4" />
                        </div>
                      )}
                      <div className={`text-sm p-3 rounded-2xl ${msg.role === 'user' ? 'bg-brand-500 text-white rounded-tr-none' : 'bg-[var(--background)] border border-[var(--border)] text-foreground rounded-tl-none whitespace-pre-wrap'}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isAiLoading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-500 to-accent-purple flex items-center justify-center shrink-0 text-white"><Sparkles className="w-4 h-4" /></div>
                      <div className="bg-[var(--background)] border border-[var(--border)] text-foreground text-sm p-4 rounded-2xl rounded-tl-none flex gap-1.5 items-center h-11">
                         <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce"></span>
                         <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" style={{animationDelay: '150ms'}}></span>
                         <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" style={{animationDelay: '300ms'}}></span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-4 border-t border-[var(--border)] bg-[var(--background)] shrink-0">
                  <div className="relative">
                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendAiMessage()}
                      placeholder="Ask me anything..." 
                      className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl py-2.5 pl-4 pr-10 text-sm focus:border-brand-500 transition-all text-foreground" 
                    />
                    <button onClick={handleSendAiMessage} disabled={isAiLoading} className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-500 p-1.5 hover:bg-brand-500/10 rounded-lg transition-colors disabled:opacity-50"><Send className="w-4 h-4" /></button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <button onClick={() => setIsAIOpen(!isAIOpen)} className="w-14 h-14 rounded-full bg-gradient-to-tr from-brand-500 to-accent-purple text-white flex items-center justify-center shadow-lg shadow-brand-500/30 hover:scale-110 transition-transform">
            {isAIOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Global Search Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSearchOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -20 }} className="bg-[var(--surface)] border border-[var(--border)] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden z-10 relative flex flex-col">
              <div className="p-4 border-b border-[var(--border)] flex items-center gap-3">
                <Search className="w-5 h-5 text-brand-500" />
                <input autoFocus type="text" placeholder="Search projects, tasks, members..." className="flex-1 bg-transparent border-none focus:ring-0 text-lg text-foreground placeholder-foreground/40" />
                <button onClick={() => setIsSearchOpen(false)} className="text-[10px] font-mono border border-[var(--border)] px-2 py-1 rounded text-foreground/50 hover:bg-[var(--surface-border)] transition-colors">ESC</button>
              </div>
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-bold text-foreground/40 uppercase tracking-wider">Quick Links</div>
                <Link href="/dashboard/projects" onClick={() => setIsSearchOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-brand-500/10 hover:text-brand-500 transition-colors cursor-pointer text-sm font-medium">
                  <FolderKanban className="w-4 h-4" /> Go to Projects
                </Link>
                <Link href="/dashboard/tasks" onClick={() => setIsSearchOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-brand-500/10 hover:text-brand-500 transition-colors cursor-pointer text-sm font-medium">
                  <CheckSquare className="w-4 h-4" /> Go to Tasks
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
