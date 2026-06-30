"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Video, Edit2, Eraser, Trash2, Send, Users, Mic, PhoneOff, MicOff, Tv } from "lucide-react";

export default function CollaborationHub() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "User";

  // Whiteboard canvas state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#3b82f6");
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");

  // Call simulator state
  const [inCall, setInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([
    { sender: "System", text: "Welcome to the real-time collaboration hub!" },
  ]);
  const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const startDrawing = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.strokeStyle = tool === "eraser" ? "#0f172a" : color; // Slate-900 background equivalent color
    ctx.lineWidth = brushSize;
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    setMessages(prev => [...prev, { sender: userName, text: chatInput }]);
    setChatInput("");
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold font-outfit text-foreground flex items-center gap-3">
            <div className="p-2 bg-brand-500/10 rounded-xl text-brand-500"><Video className="w-6 h-6" /></div>
            Collaboration Hub
          </h1>
          <p className="text-foreground/60 text-sm mt-1">Simulate team whiteboard sketches, screen sharing, and huddles.</p>
        </div>
        <button onClick={() => setInCall(!inCall)}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-lg ${
            inCall ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20" : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
          }`}
        >
          {inCall ? <PhoneOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
          {inCall ? "Leave Huddle" : "Start Huddle"}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 min-h-0">
        {/* Huddle status and drawing canvas */}
        <div className="xl:col-span-3 flex flex-col gap-4 min-h-0">
          {inCall && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              className="glass-panel p-4 rounded-2xl border border-brand-500/30 bg-brand-500/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">Huddle Call Live</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-[var(--surface)] hover:bg-[var(--surface-border)] rounded-xl border border-[var(--border)] transition-colors">
                  {isMuted ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4 text-foreground/60" />}
                </button>
                <button onClick={() => setIsScreenSharing(!isScreenSharing)} className="p-2 bg-[var(--surface)] hover:bg-[var(--surface-border)] rounded-xl border border-[var(--border)] transition-colors">
                  <Tv className={`w-4 h-4 ${isScreenSharing ? "text-brand-500 animate-pulse" : "text-foreground/60"}`} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Whiteboard Workspace */}
          <div className="flex-1 glass-panel rounded-2xl border border-[var(--border)] p-4 flex flex-col min-h-0">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] shrink-0">
              <div className="flex items-center gap-2">
                <button onClick={() => setTool("pen")} className={`p-2 rounded-lg transition-colors ${tool === "pen" ? "bg-brand-500/10 text-brand-500" : "text-foreground/50 hover:bg-[var(--surface-border)]"}`}>
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => setTool("eraser")} className={`p-2 rounded-lg transition-colors ${tool === "eraser" ? "bg-brand-500/10 text-brand-500" : "text-foreground/50 hover:bg-[var(--surface-border)]"}`}>
                  <Eraser className="w-4 h-4" />
                </button>
                <button onClick={clearCanvas} className="p-2 rounded-lg text-foreground/50 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-8 h-8 rounded border border-[var(--border)] bg-transparent cursor-pointer" />
                <input type="range" min={1} max={20} value={brushSize} onChange={e => setBrushSize(parseInt(e.target.value))} className="w-20" />
              </div>
            </div>

            <div className="flex-1 min-h-0 bg-[#0f172a] rounded-xl mt-3 relative overflow-hidden">
              <canvas ref={canvasRef} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} width={800} height={500} className="w-full h-full cursor-crosshair" />
            </div>
          </div>
        </div>

        {/* Chat / Users Side panel */}
        <div className="glass-panel rounded-2xl border border-[var(--border)] flex flex-col overflow-hidden shrink-0">
          <div className="p-4 border-b border-[var(--border)] bg-[var(--background)] shrink-0 flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-500" />
            <h2 className="font-bold text-foreground font-outfit text-sm">Huddle Chat</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.map((m, i) => (
              <div key={i} className="text-xs">
                <p className="font-bold text-foreground/70">{m.sender}</p>
                <p className="text-foreground/60 bg-[var(--surface)] p-2 rounded-lg mt-1 border border-[var(--border)]">{m.text}</p>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-[var(--border)] bg-[var(--background)] shrink-0 flex gap-1.5">
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSendChat()} placeholder="Chat..." className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl py-1.5 px-3 text-xs text-foreground focus:border-brand-500" />
            <button onClick={handleSendChat} className="p-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition-colors"><Send className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
