"use client";

import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings as SettingsIcon, User, Bell, Lock, Palette, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("Account");
  const [toastMessage, setToastMessage] = useState("");
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    if (savedTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, []);

  const changeTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
    showToast(`${newTheme === "light" ? "Light" : "Dark"} Mode applied!`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const tabs = [
    { name: "Account", icon: User },
    { name: "Notifications", icon: Bell },
    { name: "Security", icon: Lock },
    { name: "Appearance", icon: Palette },
  ];

  return (
    <div className="space-y-6 h-full flex flex-col relative">
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 bg-emerald-500 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium text-sm">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold font-outfit text-foreground flex items-center gap-3">
            <div className="p-2 bg-brand-500/10 rounded-xl text-brand-500"><SettingsIcon className="w-6 h-6" /></div>
            Settings
          </h1>
          <p className="text-foreground/60 text-sm mt-1">Manage your profile and platform preferences.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* Settings Sidebar */}
        <div className="w-full lg:w-64 glass-panel rounded-2xl border border-[var(--border)] p-4 shrink-0">
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === tab.name ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'text-foreground/70 hover:bg-[var(--surface-border)] hover:text-foreground'}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 glass-panel rounded-2xl border border-[var(--border)] p-6 overflow-y-auto"
        >
          <h2 className="text-xl font-bold font-outfit text-foreground mb-6 pb-4 border-b border-[var(--border)]">{activeTab} Settings</h2>

          {activeTab === "Account" && (
            <div className="space-y-6 max-w-2xl">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand-500 to-accent-purple flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                  {session?.user?.name?.charAt(0) || "U"}
                </div>
                <div>
                  <button onClick={() => showToast("Avatar updated successfully!")} className="bg-[var(--surface-border)] hover:bg-[var(--border)] text-foreground px-4 py-2 rounded-xl text-sm font-medium transition-colors mb-2">Change Avatar</button>
                  <p className="text-xs text-foreground/50">JPG, GIF or PNG. 1MB max.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Full Name</label>
                  <input type="text" defaultValue={session?.user?.name || ""} className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl py-3 px-4 focus:border-brand-500 transition-all text-foreground" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Email Address</label>
                  <input type="email" defaultValue={session?.user?.email || ""} className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl py-3 px-4 focus:border-brand-500 transition-all text-foreground/60 cursor-not-allowed" disabled />
                </div>
              </div>
              
              <button onClick={() => showToast("Profile changes saved!")} className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-brand-500/20">Save Changes</button>
            </div>
          )}

          {activeTab === "Notifications" && (
            <div className="space-y-4 max-w-2xl">
              {[
                { title: "Email Notifications", desc: "Receive daily summary emails" },
                { title: "Push Notifications", desc: "Get alerted when assigned a task" },
                { title: "Mention Alerts", desc: "Notify me when someone @mentions me in chat" }
              ].map(notif => (
                <div key={notif.title} className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-brand-500/30 transition-colors">
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{notif.title}</h3>
                    <p className="text-xs text-foreground/60">{notif.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-[var(--surface-border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                  </label>
                </div>
              ))}
            </div>
          )}

          {activeTab === "Security" && (
            <div className="space-y-6 max-w-md">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Current Password</label>
                <input type="password" placeholder="••••••••" className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl py-3 px-4 focus:border-brand-500 transition-all text-foreground" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">New Password</label>
                <input type="password" placeholder="••••••••" className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl py-3 px-4 focus:border-brand-500 transition-all text-foreground" />
              </div>
              <button className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-brand-500/20">Update Password</button>
            </div>
          )}

          {activeTab === "Appearance" && (
            <div className="space-y-6">
              <p className="text-sm text-foreground/60">Choose your preferred theme. (Dark mode is set as the default premium experience).</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl">
                <div 
                  onClick={() => changeTheme("dark")}
                  className={`border-2 rounded-2xl p-4 cursor-pointer relative transition-all ${theme === "dark" ? "border-brand-500 bg-[var(--surface)]" : "border-[var(--border)] bg-[var(--surface)] hover:border-brand-500/50"}`}
                >
                  {theme === "dark" && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-brand-500 rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"/>
                    </div>
                  )}
                  <div className="w-full h-20 bg-[#0f172a] rounded-lg mb-2 border border-slate-700" />
                  <p className="text-sm font-semibold text-center text-white">Dark Mode</p>
                </div>
                
                <div 
                  onClick={() => changeTheme("light")}
                  className={`border-2 rounded-2xl p-4 cursor-pointer relative transition-all ${theme === "light" ? "border-brand-500 bg-white" : "border-[var(--border)] bg-[#f8fafc] hover:border-brand-500/50"}`}
                >
                  {theme === "light" && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-brand-500 rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"/>
                    </div>
                  )}
                  <div className="w-full h-20 bg-slate-100 rounded-lg mb-2 border border-slate-300" />
                  <p className="text-sm font-semibold text-center text-slate-900">Light Mode</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
