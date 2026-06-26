"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    // Simulate NextAuth login using credentials provider
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid credentials");
      setIsLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    const res = await signIn("credentials", {
      email: demoEmail,
      password: "password",
      redirect: false,
    });
    if (res?.ok) {
      router.push("/dashboard");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-900">
      {/* Animated Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-500/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-purple/20 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-panel w-full max-w-md p-8 rounded-3xl z-10"
      >
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-500 to-accent-purple flex items-center justify-center shadow-lg shadow-brand-500/30">
            <ShieldCheck className="text-white w-8 h-8" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold font-outfit text-center mb-2 text-foreground">Welcome Back</h1>
        <p className="text-foreground/60 text-center mb-8 text-sm">Sign in to Enterprise Work Management</p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/50 text-red-500 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleLogin}>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[var(--surface)] border border-[var(--surface-border)] rounded-xl py-3 pl-12 pr-4 text-foreground focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[var(--surface)] border border-[var(--surface-border)] rounded-xl py-3 pl-12 pr-4 text-foreground focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded bg-[var(--surface)] border-[var(--surface-border)] text-brand-500 focus:ring-brand-500" />
              <span className="text-xs text-foreground/70">Remember me</span>
            </label>
            <Link href="/forgot-password" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">Forgot password?</Link>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl py-3 mt-4 transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? "Signing in..." : "Sign In"}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
            
          <div className="mt-4 text-center">
            <p className="text-foreground/60 text-sm">
              Don't have an account?{' '}
              <Link href="/signup" className="text-brand-500 hover:text-brand-400 font-semibold underline underline-offset-4 decoration-brand-500/30">
                Sign up
              </Link>
            </p>
          </div>
        </form>

        <div className="mt-8 border-t border-[var(--surface-border)] pt-6">
          <p className="text-xs text-foreground/50 text-center font-medium uppercase tracking-wider mb-4">Quick Login (Demo)</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => handleDemoLogin("admin@test.com")} className="py-2 text-xs font-semibold rounded-lg bg-[var(--surface)] border border-[var(--surface-border)] hover:border-brand-500 text-foreground transition-all">Administrator</button>
            <button type="button" onClick={() => handleDemoLogin("manager@test.com")} className="py-2 text-xs font-semibold rounded-lg bg-[var(--surface)] border border-[var(--surface-border)] hover:border-brand-500 text-foreground transition-all">Manager</button>
            <button type="button" onClick={() => handleDemoLogin("lead@test.com")} className="py-2 text-xs font-semibold rounded-lg bg-[var(--surface)] border border-[var(--surface-border)] hover:border-brand-500 text-foreground transition-all">Team Lead</button>
            <button type="button" onClick={() => handleDemoLogin("employee@test.com")} className="py-2 text-xs font-semibold rounded-lg bg-[var(--surface)] border border-[var(--surface-border)] hover:border-brand-500 text-foreground transition-all">Employee</button>
            <button type="button" onClick={() => handleDemoLogin("client@test.com")} className="col-span-2 py-2 text-xs font-semibold rounded-lg bg-[var(--surface)] border border-[var(--surface-border)] hover:border-brand-500 text-foreground transition-all">Client</button>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
