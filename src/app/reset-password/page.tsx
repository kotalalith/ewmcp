"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing token.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    
    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } else {
        setError(data.error || "Failed to reset password");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-900">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-500/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-purple/20 rounded-full blur-[120px]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-panel w-full max-w-md p-8 rounded-3xl z-10"
      >
        <Link href="/" className="inline-flex items-center text-sm text-foreground/60 hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to login
        </Link>
        
        <h1 className="text-3xl font-bold font-outfit mb-2 text-foreground">Set New Password</h1>
        <p className="text-foreground/60 mb-8 text-sm">Please enter your new password below.</p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/50 text-red-500 text-sm font-medium">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/50 text-green-500 text-sm font-medium">
            {message}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">New Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[var(--surface)] border border-[var(--surface-border)] rounded-xl py-3 pl-12 pr-4 text-foreground focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider ml-1">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-[var(--surface)] border border-[var(--surface-border)] rounded-xl py-3 pl-12 pr-4 text-foreground focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading || !token}
            className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl py-3 mt-4 transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? "Resetting..." : "Reset Password"}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </motion.div>
    </main>
  );
}
