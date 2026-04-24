import React, { useState, useEffect } from 'react';
import { getSupabase, getKeyHandshake } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Shield, Database, X, AlertTriangle, CheckCircle2, Globe, HardDrive, Zap, Info, Activity, Sparkles, MessageSquare, Terminal, History, Trash2, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { getEskaMilaResponse } from '../services/eskaMilaEngine';

interface DevOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

export const DevOverlay: React.FC<DevOverlayProps> = ({ isOpen, onClose }) => {
  const { user, session } = useAuth();
  const [view, setView] = useState<'DIAGNOSIS' | 'COORDINATE'>('DIAGNOSIS');
  const [dbStatus, setDbStatus] = useState<'IDLE' | 'OK' | 'ERROR'>('IDLE');
  const [addons, setAddons] = useState<any[]>([]);
  const [networkLatency, setNetworkLatency] = useState<number | null>(null);
  const [probes, setProbes] = useState<Record<string, 'pending' | 'ok' | 'failed'>>({});
  const [conversations, setConversations] = useState<any[]>(() => {
    return JSON.parse(localStorage.getItem('eska_mila_memory') || '[]');
  });
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handshake = getKeyHandshake();

  useEffect(() => {
    if (chatHistory.length > 0 && currentChatId) {
      const updated = conversations.map(c => 
        c.id === currentChatId ? { ...c, history: chatHistory } : c
      );
      setConversations(updated);
      localStorage.setItem('eska_mila_memory', JSON.stringify(updated));
    }
  }, [chatHistory]);

  useEffect(() => {
    if (isOpen) {
      loadSystemState();
      measureLatency();
      if (conversations.length === 0) {
        startNewChat();
      } else if (!currentChatId) {
        loadChat(conversations[0].id);
      }
    }
  }, [isOpen]);

  const startNewChat = () => {
    const id = Date.now().toString();
    const newChat = {
      id,
      title: `Conversation ${new Date().toLocaleDateString()}`,
      history: [{
        role: 'assistant',
        content: "I am Eska Mila. Omniscient interface initialized. I have complete visibility into the B3st Sekta kernel. How can I assist with your architecture?",
        time: new Date().toLocaleTimeString()
      }]
    };
    setConversations([newChat, ...conversations]);
    setCurrentChatId(id);
    setChatHistory(newChat.history as ChatMessage[]);
    setView('COORDINATE');
  };

  const loadChat = (id: string) => {
    const chat = conversations.find(c => c.id === id);
    if (chat) {
      setCurrentChatId(id);
      setChatHistory(chat.history);
      setView('COORDINATE');
    }
  };

  const deleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = conversations.filter(c => c.id !== id);
    setConversations(updated);
    localStorage.setItem('eska_mila_memory', JSON.stringify(updated));
    if (currentChatId === id) {
      if (updated.length > 0) loadChat(updated[0].id);
      else setChatHistory([]);
    }
  };

  const loadSystemState = async () => {
    try {
      const supabase = getSupabase();
      if (!supabase) {
        setDbStatus('ERROR');
        return;
      }
      const { data } = await supabase.from('user_addons').select('*');
      if (data) {
        setAddons(data);
        runNetworkProbes(data);
        setDbStatus('OK');
      }
    } catch {
      setDbStatus('ERROR');
    }
  };

  const measureLatency = async () => {
    const start = performance.now();
    try {
      await fetch(window.location.origin, { method: 'HEAD' });
      setNetworkLatency(Math.round(performance.now() - start));
    } catch {
      setNetworkLatency(-1);
    }
  };

  const runNetworkProbes = async (addonList: any[]) => {
    const results: Record<string, 'pending' | 'ok' | 'failed'> = {};
    addonList.forEach(a => results[a.addon_id] = 'pending');
    setProbes(results);

    for (const addon of addonList) {
      try {
        const urlToFetch = addon.url.replace('stremio://', 'https://');
        await fetch(urlToFetch, { method: 'HEAD', mode: 'no-cors' });
        setProbes(prev => ({ ...prev, [addon.addon_id]: 'ok' }));
      } catch {
        setProbes(prev => ({ ...prev, [addon.addon_id]: 'failed' }));
      }
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return;
    
    const userMsg: ChatMessage = {
      role: 'user',
      content: input,
      time: new Date().toLocaleTimeString()
    };
    
    setChatHistory(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const diagnosticData = {
      ...(window as any)?.getSystemStats?.(),
      user: user?.email,
      handshake: handshake?.prefix + "...",
      addons: addons?.map(a => ({ name: a?.name, status: probes?.[a?.addon_id] || 'unknown' })),
      sessionActive: !!session,
    };

    const response = await getEskaMilaResponse(input, diagnosticData);
    
    setChatHistory(prev => [...prev, {
      role: 'assistant',
      content: response,
      time: new Date().toLocaleTimeString()
    }]);
    setIsTyping(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] z-[99999] flex font-mono selection:bg-primary/30 animate-in fade-in zoom-in duration-300" data-dev-overlay-active="true">
      
      {view === 'DIAGNOSIS' ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 bg-[#050505] overflow-y-auto border-[10px] border-black">
          <div className="max-w-4xl w-full space-y-12 pb-24 border-2 border-primary p-12 bg-black/80 backdrop-blur-3xl shadow-[0_0_100px_rgba(255,177,0,0.05)] relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
            <div className="flex justify-between items-start border-b border-primary/20 pb-10">
               <div>
                  <h1 className="text-6xl font-black italic tracking-tighter text-white uppercase leading-none">Diagnosis<br/><span className="text-primary font-bold">Kernel</span></h1>
                  <p className="text-primary/50 font-black uppercase text-[10px] tracking-[0.4em] mt-6 flex items-center gap-4">
                    <span className="w-2 h-2 bg-primary animate-ping rounded-full" />
                    V3.0.4 // CORE_RECOVERY_SHELL // SYNC_ACTIVE
                  </p>
               </div>
               <button onClick={onClose} className="p-4 bg-primary text-black hover:bg-white transition-all transform hover:rotate-90">
                  <X size={32} />
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <MetricBox label="Handshake" value={handshake?.prefix ? 'CONNECTED' : 'FRACTURED'} status={handshake?.prefix ? 'success' : 'warning'} />
               <MetricBox label="Auth Kernel" value={user?.email ? user.email.split('@')[0] : 'GUEST_MODE'} status={user?.email ? 'success' : 'warning'} />
               <MetricBox label="Token Sync" value={Object.keys(localStorage).some(k => k.includes('sb-')) ? 'SYNCED' : 'MISSING'} status={Object.keys(localStorage).some(k => k.includes('sb-')) ? 'success' : 'warning'} />
               <MetricBox label="Vercel Origin" value={window.location.hostname.includes('vercel') ? 'VERCEL' : 'LOCAL'} status="success" />
            </div>

            <div className="bg-[#0a0a0a] border border-primary/10 p-10 space-y-8 relative shadow-inner">
               <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                  <Database className="text-primary" />
                  <h3 className="text-xl font-black uppercase italic text-white tracking-widest">Root Recovery Script</h3>
               </div>
               <p className="text-gray-500 text-sm leading-relaxed font-medium">Execute this SQL in Supabase SQL Editor to synchronize auth profiles.</p>
               <div className="relative group">
                  <pre className="bg-black p-8 text-[12px] overflow-x-auto text-primary/80 border border-primary/20 font-bold leading-relaxed selection:bg-primary/20">
{`CREATE OR REPLACE FUNCTION handle_new_user() RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, accent_color)
  VALUES (new.id, new.raw_user_meta_data->>'username', '#ffb100');
  RETURN new;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;`}
                  </pre>
                  <button 
                    onClick={() => navigator.clipboard.writeText(`CREATE OR REPLACE FUNCTION handle_new_user() RETURNS trigger AS $$\nBEGIN\n  INSERT INTO public.profiles (id, username, accent_color)\n  VALUES (new.id, new.raw_user_meta_data->>'username', '#ffb100');\n  RETURN new;\nEND; $$ LANGUAGE plpgsql SECURITY DEFINER;`)}
                    className="absolute top-4 right-4 p-3 bg-primary/10 hover:bg-primary text-primary hover:text-black border border-primary/20 rounded-none transition-all text-[10px] font-black uppercase"
                  >
                    Copy Script
                  </button>
               </div>
            </div>

            <button 
              onClick={() => setView('COORDINATE')}
              className="w-full bg-primary hover:bg-white text-black py-10 font-black text-3xl uppercase italic tracking-tighter shadow-[0_20px_50px_rgba(255,177,0,0.15)] active:scale-[0.98] transition-all border-none"
            >
               Initialize Eska Mila Core
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* SIDEBAR - AI STUDIO CLONE */}
          <div className="w-80 bg-[#060606] border-r border-[#1a1a1a] flex flex-col items-stretch">
            <div className="p-8 border-b border-[#1a1a1a] flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center">
                    <Terminal size={22} className="text-primary" />
                 </div>
                 <div>
                    <span className="text-white font-black uppercase text-[13px] tracking-tighter block leading-none">Eska Mila</span>
                    <span className="text-[9px] text-[#444] font-bold uppercase tracking-[0.2em] mt-1 block">Synchronized</span>
                 </div>
              </div>
              <button 
                onClick={() => setView('DIAGNOSIS')} 
                className="p-3 hover:bg-white/5 rounded-xl text-gray-600 hover:text-white transition-all transform hover:scale-110"
                title="Kernel Diagnosis"
              >
                 <Activity size={18} />
              </button>
            </div>

            <div className="p-6">
               <button 
                  onClick={startNewChat}
                  className="w-full h-14 flex items-center justify-center gap-3 bg-primary hover:bg-white text-black rounded-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(255,177,0,0.1)] transition-all transform active:scale-[0.98]"
               >
                  <Plus size={18} /> New Workspace
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
               <div className="text-[10px] text-[#333] font-black uppercase tracking-[0.3em] px-4 py-2 mb-2">Memory_Buffers</div>
               {conversations?.map((c) => (
                 <div 
                   key={c.id} 
                   onClick={() => loadChat(c.id)}
                   className={cn(
                     "group w-full text-left px-5 py-4 border border-transparent hover:border-white/5 rounded-2xl transition-all cursor-pointer flex items-center justify-between",
                     currentChatId === c.id ? "bg-white/[0.03] border-primary/20 text-white shadow-xl" : "text-gray-600"
                   )}
                 >
                    <div className="flex items-center gap-4 truncate">
                       <MessageSquare size={16} className={currentChatId === c.id ? "text-primary" : "text-gray-800"} />
                       <span className="text-[11px] font-bold truncate tracking-wide">{c.title}</span>
                    </div>
                    <button 
                      onClick={(e) => deleteChat(c.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 hover:text-red-500 text-gray-700 rounded-lg transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                 </div>
               ))}
            </div>

            <div className="p-8 border-t border-[#1a1a1a] bg-black/20">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-[10px]">
                    {user?.email?.charAt(0).toUpperCase() || 'K'}
                  </div>
                  <div className="truncate">
                    <div className="text-[10px] text-gray-400 font-bold truncate leading-none uppercase tracking-tighter">{user?.email || 'GUEST_SESSION'}</div>
                    <div className="text-[8px] text-gray-600 uppercase font-black tracking-widest mt-1">Admin Access</div>
                  </div>
               </div>
            </div>
          </div>

          {/* CHAT AREA */}
          <div className="flex-1 flex flex-col relative bg-[#080808]">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl">
               <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                     <span className="text-white text-[10px] font-black uppercase tracking-widest">Protocol Sync</span>
                  </div>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors">
                  <X size={20} />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-12 space-y-8 custom-scrollbar">
               {chatHistory.map((msg, i) => (
                 <div key={i} className={cn("flex gap-6 max-w-4xl", msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto animate-in slide-in-from-left duration-300")}>
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg", 
                      msg.role === 'assistant' ? "bg-primary text-black" : "bg-[#111] border border-white/10 text-white"
                    )}>
                       {msg.role === 'assistant' ? <Terminal size={20} /> : <div className="font-black text-[10px]">USR</div>}
                    </div>
                    <div className={cn("space-y-2", msg.role === 'user' ? "text-right" : "text-left")}>
                       <div className={cn("p-6 rounded-3xl text-[14px] leading-relaxed shadow-xl", 
                         msg.role === 'assistant' ? "bg-[#111] border border-white/5 text-gray-200" : "bg-primary text-black font-bold"
                       )}>
                          {msg.content}
                       </div>
                       <div className="text-[9px] text-gray-600 font-black uppercase tracking-widest px-2">{msg.time}</div>
                    </div>
                 </div>
               ))}
               {isTyping && (
                 <div className="flex gap-6 animate-pulse">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                       <Terminal size={20} className="text-primary" />
                    </div>
                    <div className="bg-[#111] border border-white/5 p-6 rounded-3xl text-gray-500 italic text-[11px] font-black uppercase tracking-widest">
                       Processing synaptic handshake...
                    </div>
                 </div>
               )}
            </div>

            <div className="p-12 border-t border-white/5 bg-black/40 backdrop-blur-xl">
               <div className="max-w-4xl mx-auto relative group">
                  <input 
                     value={input}
                     onChange={(e) => setInput(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                     placeholder="Instruct Eska Mila..."
                     className="w-full bg-[#111] border border-white/10 rounded-2xl py-6 pl-8 pr-32 text-white text-sm focus:outline-none focus:border-primary/50 focus:bg-white/[0.07] transition-all shadow-inner"
                  />
                  <button 
                     onClick={handleSendMessage}
                     disabled={isTyping}
                     className={cn(
                       "absolute right-4 top-1/2 -translate-y-1/2 bg-primary text-black px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all disabled:opacity-50",
                       !isTyping && "hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,177,0,0.2)]"
                     )}
                  >
                     {isTyping ? <Activity size={16} className="animate-spin" /> : "Initiate"}
                  </button>
               </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

function MetricBox({ label, value, status }: { label: string, value: string, status: 'success' | 'warning' | 'idle' }) {
  return (
    <div className="bg-[#0a0a0a] p-8 rounded-3xl border border-white/5 shadow-2xl space-y-2">
       <span className="text-gray-700 text-[10px] font-black uppercase tracking-widest">{label}</span>
       <div className="flex items-center justify-between">
          <span className={cn("text-2xl font-black italic tracking-tighter uppercase", 
            status === 'success' ? "text-white" : status === 'warning' ? "text-yellow-500" : "text-gray-500"
          )}>{value}</span>
          <div className={cn("w-3 h-3 rounded-full", 
            status === 'success' ? "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]" : 
            status === 'warning' ? "bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]" : "bg-white/10"
          )} />
       </div>
    </div>
  );
}

function ShieldCheck(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
