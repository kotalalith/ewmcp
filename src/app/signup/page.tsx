"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { UserPlus, ArrowRight, Activity, ArrowLeft } from "lucide-react";
import Link from "next/link";
import axios from "axios";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Employee"
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!formData.name || !formData.email || !formData.password) {
      setError("Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post("/api/auth/signup", formData);
      if (res.status === 201) {
        // Success! Redirect to login page
        router.push("/?registered=true");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create account.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-500/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/20 blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground mb-6 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Link>

        {/* Logo/Brand */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-500 to-purple-500 flex items-center justify-center shadow-2xl shadow-brand-500/30">
            <Activity className="w-8 h-8 text-white" />
          </div>
        </div>

        <div className="glass-panel p-8 rounded-3xl border border-[var(--border)] shadow-2xl relative overflow-hidden">
          {/* Subtle top glow line */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />

          <h1 className="text-3xl font-bold font-outfit text-center mb-2 text-foreground">Create Account</h1>
          <p className="text-foreground/60 text-center mb-8 text-sm">Join Enterprise Work Management</p>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl text-center">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSignup}>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Full Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 text-foreground transition-all outline-none"
                placeholder="John Doe"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Email</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 text-foreground transition-all outline-none"
                placeholder="you@company.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Password</label>
              <input 
                type="password" 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 text-foreground transition-all outline-none"
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Role</label>
              <select 
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 text-foreground transition-all outline-none appearance-none"
              >
                <option value="Employee">Employee</option>
                <option value="Team Lead">Team Lead</option>
                <option value="Manager">Manager</option>
                <option value="Administrator">Administrator (IT Only)</option>
              </select>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl py-3 mt-4 transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 group disabled:opacity-70"
            >
              {isLoading ? "Creating Account..." : "Sign Up"}
              {!isLoading && <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-foreground/60 text-sm">
              Already have an account?{' '}
              <Link href="/" className="text-brand-500 hover:text-brand-400 font-semibold underline underline-offset-4 decoration-brand-500/30">
                Sign in instead
              </Link>
            </p>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
