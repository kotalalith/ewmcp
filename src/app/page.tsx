"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, LayoutDashboard, Users, Calendar, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: <LayoutDashboard className="w-6 h-6 text-brand-400" />,
    title: "Intuitive Dashboard",
    description: "Get a bird's-eye view of your entire organization's workflow at a glance."
  },
  {
    icon: <Users className="w-6 h-6 text-accent-purple" />,
    title: "Team Collaboration",
    description: "Seamlessly work together with your team, assign tasks, and track progress."
  },
  {
    icon: <Calendar className="w-6 h-6 text-emerald-400" />,
    title: "Smart Scheduling",
    description: "Built-in calendar and meeting integrations to keep everyone on the same page."
  },
  {
    icon: <ShieldCheck className="w-6 h-6 text-brand-500" />,
    title: "Enterprise Security",
    description: "Bank-grade encryption and role-based access control for your peace of mind."
  }
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 overflow-hidden font-outfit selection:bg-brand-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/50 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-accent-purple flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Zap className="text-white w-5 h-5 fill-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">EWM</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link href="/signup" className="text-sm font-semibold bg-white text-slate-900 hover:bg-slate-200 transition-colors px-6 py-2.5 rounded-full shadow-lg shadow-white/10">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-accent-purple/20 rounded-full blur-[150px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-brand-300 mb-8 backdrop-blur-sm">
            <Sparkles className="w-4 h-4" />
            <span>The new standard for team productivity</span>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-white mb-6 leading-tight max-w-4xl">
            Manage your enterprise <br className="hidden lg:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-accent-purple">
              with absolute clarity.
            </span>
          </h1>
          
          <p className="text-lg lg:text-xl text-slate-400 mb-10 max-w-2xl leading-relaxed">
            A unified platform to track tasks, host meetings, and collaborate with your team securely in one place. Built for modern enterprises.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link href="/login" className="flex items-center gap-2 text-base font-semibold bg-brand-600 hover:bg-brand-500 text-white transition-all px-8 py-4 rounded-full shadow-lg shadow-brand-500/25 group">
              Go to Dashboard
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/signup" className="flex items-center gap-2 text-base font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all px-8 py-4 rounded-full backdrop-blur-sm">
              Create an account
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="relative py-20 px-6 max-w-7xl mx-auto z-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors group"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-900/50 flex items-center justify-center mb-6 border border-white/5 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 mt-20 relative z-10 text-center text-slate-500 text-sm">
        <p>© {new Date().getFullYear()} Enterprise Work Management. All rights reserved.</p>
      </footer>
    </main>
  );
}
