"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Search, Phone, Video, Info, Send, Smile, Paperclip, Hash, Users, X, Edit2, Trash2 } from "lucide-react";
import axios from "axios";
import Pusher from "pusher-js";

export default function MessagesPage() {
  const { data: session } = useSession();
  const [activeChannel, setActiveChannel] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Dynamic State for DB
  const [conversations, setConversations] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  
  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"channel" | "dm" | "edit">("channel");
  const [newItemName, setNewItemName] = useState("");
  const [selectedUserEmail, setSelectedUserEmail] = useState("");
  const [selectedChannelUsers, setSelectedChannelUsers] = useState<string[]>([]);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchConversations = async () => {
    try {
      const res = await axios.get("/api/conversations");
      setConversations(res.data);
      if (res.data.length > 0 && !activeChannel) {
        setActiveChannel(res.data[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get("/api/users");
      const otherUsers = res.data.filter((u: any) => u.email !== session?.user?.email);
      setAllUsers(otherUsers);
      if (otherUsers.length > 0) setSelectedUserEmail(otherUsers[0].email);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async () => {
    if (!activeChannel) return;
    try {
      const res = await axios.get(`/api/messages?channel=${activeChannel}`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (session?.user?.email) {
      fetchConversations();
      fetchUsers();
    }
  }, [session]);

  // Fetch initial messages and connect to Pusher WebSocket
  useEffect(() => {
    if (!activeChannel) return;
    fetchMessages();

    if (!process.env.NEXT_PUBLIC_PUSHER_KEY || !process.env.NEXT_PUBLIC_PUSHER_CLUSTER) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });

    const channel = pusher.subscribe(activeChannel);
    
    channel.bind("new-message", (newMessage: any) => {
      setMessages((prev) => {
        if (prev.find(m => m._id === newMessage._id)) return prev;
        return [...prev, newMessage];
      });
    });

    return () => {
      pusher.unsubscribe(activeChannel);
      pusher.disconnect();
    };
  }, [activeChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || !activeChannel) return;
    try {
      await axios.post("/api/messages", {
        channel: activeChannel,
        content: inputValue
      });
      setInputValue("");
      fetchMessages();
    } catch (err) {
      console.error("Failed to send", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const openAddModal = (type: "channel" | "dm") => {
    setModalType(type);
    setNewItemName("");
    setSelectedChannelUsers([]);
    setIsAddModalOpen(true);
  };

  const openEditModal = () => {
    const activeConvo = conversations.find(c => c._id === activeChannel);
    if (!activeConvo) return;
    
    setModalType("edit");
    setNewItemName(activeConvo.name || "");
    // exclude self from the checkboxes
    const others = activeConvo.participants.filter((p: string) => p !== session?.user?.email);
    setSelectedChannelUsers(others);
    setIsAddModalOpen(true);
  };

  const handleAddNewItem = async () => {
    try {
      if (modalType === "edit") {
        await axios.put("/api/conversations", { 
          id: activeChannel, 
          name: newItemName, 
          participants: selectedChannelUsers 
        });
      } else {
        const payload = modalType === "channel" 
          ? { type: "channel", name: newItemName, participants: selectedChannelUsers } 
          : { type: "direct", participantEmail: selectedUserEmail };
        
        const res = await axios.post("/api/conversations", payload);
        setActiveChannel(res.data._id);
      }
      
      await fetchConversations();
      setIsAddModalOpen(false);
    } catch (err) {
      console.error("Failed to save conversation", err);
    }
  };

  const handleDeleteChannel = async () => {
    try {
      await axios.delete(`/api/conversations?id=${activeChannel}`);
      setActiveChannel("");
      await fetchConversations();
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const channels = conversations.filter(c => c.type === "channel");
  const directMessages = conversations.filter(c => c.type === "direct");

  const getDMOtherParticipant = (convo: any) => {
    const otherEmail = convo.participants.find((p: string) => p !== session?.user?.email);
    const user = allUsers.find(u => u.email === otherEmail);
    return user ? user.name : otherEmail || "Unknown";
  };

  const activeConvo = conversations.find(c => c._id === activeChannel);
  const activeTitle = activeConvo?.type === "channel" 
    ? activeConvo.name 
    : (activeConvo ? getDMOtherParticipant(activeConvo) : "");

  return (
    <div className="flex h-full border border-[var(--border)] rounded-2xl overflow-hidden glass-panel bg-[var(--surface)]/50 relative">
      
      {/* Left Sidebar */}
      <div className="w-64 border-r border-[var(--border)] bg-[var(--background)]/50 flex flex-col hidden md:flex shrink-0">
        <div className="p-4 border-b border-[var(--border)]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <input type="text" placeholder="Search messages..." className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl py-2 pl-9 pr-4 text-xs focus:border-brand-500 transition-all text-foreground" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-6">
          {/* Channels */}
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Channels</span>
              <button onClick={() => openAddModal("channel")} className="text-foreground/40 hover:text-brand-500 transition-colors"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="space-y-0.5">
              {channels.map(channel => (
                <button 
                  key={channel._id}
                  onClick={() => setActiveChannel(channel._id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all ${activeChannel === channel._id ? 'bg-brand-500/10 text-brand-500 font-semibold' : 'text-foreground/70 hover:bg-[var(--surface)] hover:text-foreground font-medium'}`}
                >
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 opacity-50" />
                    <span className="truncate max-w-[150px]">{channel.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          {/* DMs */}
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Direct Messages</span>
              <button onClick={() => openAddModal("dm")} className="text-foreground/40 hover:text-brand-500 transition-colors"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="space-y-0.5">
              {directMessages.map(dm => {
                const dmName = getDMOtherParticipant(dm);
                return (
                  <button 
                    key={dm._id}
                    onClick={() => setActiveChannel(dm._id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all ${activeChannel === dm._id ? 'bg-brand-500/10 text-brand-500 font-semibold' : 'text-foreground/70 hover:bg-[var(--surface)] hover:text-foreground font-medium'}`}
                  >
                    <div className="flex items-center gap-2 relative">
                      <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-brand-500 to-accent-purple text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        {dmName.charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-[var(--background)] rounded-full" />
                      <span className="truncate max-w-[130px] text-left">{dmName}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--surface)]/30 relative">
        <div className="h-16 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur flex items-center justify-between px-6 shrink-0 z-10">
          {activeChannel ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500">
                  {activeConvo?.type === "channel" ? <Hash className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="font-bold text-foreground font-outfit uppercase">
                    {activeTitle}
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeConvo?.type === "channel" && (
                  <button onClick={openEditModal} className="p-2 text-foreground/40 hover:text-brand-500 hover:bg-brand-500/10 rounded-xl transition-all">
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => setIsDeleteModalOpen(true)} className="p-2 text-foreground/40 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="text-foreground/40 text-sm">Select a chat to start messaging</div>
          )}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, i) => {
            const isMe = msg.sender === session?.user?.email;
            return (
              <div key={msg._id || i} className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                {!isMe && (
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-xs shrink-0">
                    {msg.senderName?.charAt(0) || "U"}
                  </div>
                )}
                <div className={`flex flex-col gap-1 max-w-[70%] ${isMe ? 'items-end' : ''}`}>
                  <div className={`flex items-baseline gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <span className="font-semibold text-sm">{isMe ? 'You' : msg.senderName}</span>
                    <span className="text-[10px] text-foreground/40">{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <div className={`${isMe ? 'bg-brand-600 text-white rounded-br-none shadow-brand-500/20 shadow-lg' : 'bg-[var(--surface)] border border-[var(--border)] rounded-bl-none text-foreground/80'} p-3 rounded-2xl text-sm`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}
          {messages.length === 0 && activeChannel && (
            <div className="h-full flex items-center justify-center text-foreground/40 text-sm">
              No messages here yet. Say hello!
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 bg-[var(--background)]/80 backdrop-blur border-t border-[var(--border)] shrink-0">
          <div className="relative flex items-end gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-2 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 transition-all">
            <button className="p-2 text-foreground/40 hover:text-foreground transition-colors shrink-0"><Paperclip className="w-5 h-5" /></button>
            <textarea 
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!activeChannel}
              rows={1}
              className="w-full bg-transparent border-none focus:ring-0 resize-none py-2 text-sm max-h-32 min-h-[40px] text-foreground placeholder-foreground/40 disabled:opacity-50"
              placeholder={activeChannel ? `Message ${activeTitle}...` : "Select a chat first..."}
            />
            <button className="p-2 text-foreground/40 hover:text-amber-500 transition-colors shrink-0"><Smile className="w-5 h-5" /></button>
            <button onClick={sendMessage} disabled={!activeChannel} className="p-2 bg-brand-500 text-white rounded-xl hover:bg-brand-400 transition-colors shrink-0 shadow-lg shadow-brand-500/20 disabled:opacity-50"><Send className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* Add / Edit Item Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-[var(--surface)] border border-[var(--border)] w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden z-10 relative flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-[var(--border)] bg-[var(--background)]">
                <h2 className="text-xl font-bold font-outfit text-foreground">
                  {modalType === "channel" ? "Create Channel" : modalType === "edit" ? "Edit Channel" : "New Direct Message"}
                </h2>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 rounded-xl hover:bg-[var(--surface-border)] transition-colors"><X className="w-5 h-5 text-foreground/60" /></button>
              </div>
              <div className="p-6">
                
                {modalType === "channel" || modalType === "edit" ? (
                  <>
                    <label className="text-xs font-semibold text-foreground/70 ml-1 mb-2 block">Channel Name</label>
                    <input 
                      type="text" 
                      value={newItemName}
                      onChange={e => setNewItemName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddNewItem()}
                      placeholder="e.g., Marketing Team"
                      className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm focus:border-brand-500 transition-colors text-foreground mb-4"
                      autoFocus
                    />
                    
                    <label className="text-xs font-semibold text-foreground/70 ml-1 mb-2 block">Select Members</label>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                      {allUsers.map(u => (
                        <label key={u.email} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--surface-border)] cursor-pointer transition-colors border border-transparent hover:border-[var(--border)]">
                          <input 
                            type="checkbox" 
                            checked={selectedChannelUsers.includes(u.email)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedChannelUsers([...selectedChannelUsers, u.email]);
                              } else {
                                setSelectedChannelUsers(selectedChannelUsers.filter(email => email !== u.email));
                              }
                            }}
                            className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 bg-[var(--background)] border-[var(--border)]"
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{u.name}</span>
                            <span className="text-[10px] text-foreground/50">{u.email}</span>
                          </div>
                        </label>
                      ))}
                      {allUsers.length === 0 && (
                        <div className="text-xs text-foreground/40 italic p-2">No other users found.</div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <label className="text-xs font-semibold text-foreground/70 ml-1 mb-2 block">Select Team Member</label>
                    <select 
                      value={selectedUserEmail}
                      onChange={e => setSelectedUserEmail(e.target.value)}
                      className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl py-3 px-4 text-sm focus:border-brand-500 transition-colors text-foreground"
                    >
                      {allUsers.map(u => (
                        <option key={u.email} value={u.email}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                  </>
                )}

              </div>
              <div className="p-6 border-t border-[var(--border)] bg-[var(--background)] flex justify-end gap-3 mt-auto">
                <button onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm hover:bg-[var(--surface-border)] transition-colors text-foreground">Cancel</button>
                <button 
                  onClick={handleAddNewItem} 
                  disabled={(modalType === "channel" || modalType === "edit") ? !newItemName.trim() : !selectedUserEmail} 
                  className="px-5 py-2.5 rounded-xl text-sm bg-brand-600 hover:bg-brand-500 text-white transition-colors shadow-lg shadow-brand-500/20 disabled:opacity-50"
                >
                  {modalType === "channel" ? "Create Channel" : modalType === "edit" ? "Save Changes" : "Start Chat"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-[var(--surface)] border border-[var(--border)] w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden z-10 relative flex flex-col p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold font-outfit text-foreground mb-2">Delete Chat?</h2>
              <p className="text-sm text-foreground/60 mb-6">
                Are you sure you want to permanently delete <strong>{activeTitle}</strong>? This action cannot be undone and will delete it for everyone.
              </p>
              <div className="flex justify-center gap-3">
                <button onClick={() => setIsDeleteModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm hover:bg-[var(--surface-border)] transition-colors text-foreground font-semibold">Cancel</button>
                <button onClick={handleDeleteChannel} className="px-5 py-2.5 rounded-xl text-sm bg-red-500 hover:bg-red-600 text-white transition-colors shadow-lg shadow-red-500/20 font-semibold">
                  Yes, Delete It
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

const Plus = ({className}: {className?: string}) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
);
