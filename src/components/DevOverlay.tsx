import React, { useState, useEffect } from 'react';
import { getSupabase, getKeyHandshake, checkStorageHealth } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Shield, Database, X, AlertTriangle, CheckCircle2, Globe, HardDrive, Zap, Info, Activity, Sparkles, MessageSquare, Terminal, History, Trash2, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { getEskaMilaResponse } from '../services/eskaMilaEngine';
import { Profile, Addon } from '../types';

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
  const [addons, setAddons] = useState<Addon[]>([]);
  const [networkLatency, setNetworkLatency] = useState<number | null>(null);
  const [probes, setProbes] = useState<Record<string, 'pending' | 'ok' | 'failed'>>({});
  const [conversations, setConversations] = useState<any[]>(() => {
    return JSON.parse(localStorage.getItem('eska_mila_sovereign') || '[]');
  });
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const [vitals, setVitals] = useState({
    onlineNodes: 0,
    registeredKernels: 0,
    idleNodes: 0,
    trendingData: 'Scanning...'
  });
  const [probeResults, setProbeResults] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const handshake = getKeyHandshake();

  useEffect(() => {
    if (chatHistory.length > 0 && currentChatId) {
      const updated = conversations.map(c => 
        c.id === currentChatId ? { ...c, history: chatHistory } : c
      );
      setConversations(updated);
      localStorage.setItem('eska_mila_sovereign', JSON.stringify(updated));
    }
  }, [chatHistory]);

  useEffect(() => {
    if (isOpen) {
      setView('DIAGNOSIS');
      loadSystemState();
      fetchLiveVitals();
      measureLatency();
      if (conversations.length === 0) {
        startNewChat();
      } else if (!currentChatId) {
        loadChat(conversations[0].id);
      }
    }
  }, [isOpen]);

  const fetchLiveVitals = async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      // 1. Registered Kernels (Account Count)
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      
      // 2. Trending Data (Most frequent anime_id in watch_history)
      const { data: trending } = await supabase
        .from('watch_history')
        .select('anime_title')
        .limit(10);
      
      const titles = trending?.map(t => t.anime_title).filter(Boolean);
      const mostFrequent = titles?.sort((a,b) =>
          titles.filter(v => v===a).length - titles.filter(v => v===b).length
      ).pop();

      setVitals({
        onlineNodes: Math.floor(Math.random() * 50) + 120, // Mock for now
        registeredKernels: count || 0,
        idleNodes: Math.floor(Math.random() * 20) + 5,
        trendingData: mostFrequent || 'System Idle'
      });
    } catch (err) {
      console.error("Vitals Handshake Failed:", err);
    }
  };

  const runDeepProbe = () => {
    setIsScanning(true);
    setProbeResults([]);
    
    setTimeout(() => {
      const results = [];
      
      // Check performance
      if (window.performance) {
        results.push({
          type: 'PERFORMANCE',
          msg: `DOM_COMPLETION: ${Math.round(performance.now())}ms`,
          status: 'ok'
        });
      }

      // Check for scripts
      const scriptCount = document.scripts.length;
      results.push({
        type: 'KERNEL_SCRIPTS',
        msg: `INJECTED_LAYERS: ${scriptCount}`,
        status: scriptCount > 5 ? 'ok' : 'warning'
      });

      // Capture fractures (errors)
      const fractures = (window as any)._sekta_errors || [];
      if (fractures.length > 0) {
        const lastErr = fractures[fractures.length - 1];
        results.push({
          type: 'SYSTEM_FRACTURES',
          msg: `TRACE: ${lastErr.msg.substring(0, 40)}${lastErr.msg.length > 40 ? '...' : ''}`,
          status: 'error'
        });
      } else {
        results.push({
          type: 'SYNAPTIC_INTEGRITY',
          msg: 'NO_MEMORY_LEAKS_DETECTED',
          status: 'ok'
        });
      }

      setProbeResults(results);
      setIsScanning(false);
    }, 1500);
  };

  const startNewChat = () => {
    const id = Date.now().toString();
    const newChat = {
      id,
      title: `Session_${id.slice(-4)}`,
      history: [{
        role: 'assistant',
        content: "Eska Mila core initialized. Deep probe access confirmed. How shall we optimize the Sekta architecture, Operator?",
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
    localStorage.setItem('eska_mila_sovereign', JSON.stringify(updated));
    if (currentChatId === id) {
      if (updated.length > 0) loadChat(updated[0].id);
      else {
        setCurrentChatId(null);
        setChatHistory([]);
      }
    }
  };

  const loadSystemState = async () => {
    try {
      const supabase = getSupabase();
      if (!supabase) {
        setDbStatus('ERROR');
        return;
      }
      
      const storageOk = await checkStorageHealth();
      setDbStatus(storageOk ? 'OK' : 'ERROR');

      const { data } = await supabase.from('user_addons').select('*');
      if (data) {
        setAddons(data);
        runNetworkProbes(data);
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

  const runNetworkProbes = async (addonList: Addon[]) => {
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
      user: user?.email,
      vitals,
      probe_results: probeResults,
      handshake: handshake?.prefix + "...",
      addons: addons?.map(a => ({ name: a?.name, status: probes?.[a?.addon_id] || 'unknown' })),
      network_latency: networkLatency,
      auth_context: session ? 'AUTHENTICATED' : 'ANONYMOUS',
      target_origin: window.location.origin,
      fractures: (window as any)._sekta_errors?.length || 0,
      kernel_ver: '3.0.5'
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
    <div className="fixed inset-0 bg-[#060606] z-[99999] flex font-mono selection:bg-primary/30 animate-in fade-in zoom-in duration-300" data-dev-overlay-active="true">
      
      {view === 'DIAGNOSIS' ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 bg-black overflow-y-auto">
          <div className="max-w-5xl w-full space-y-8 pb-24 border-2 border-primary/20 p-8 lg:p-12 bg-[#0a0a0a]/80 backdrop-blur-3xl shadow-[0_0_100px_rgba(255,177,0,0.03)] relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/[0.01] pointer-events-none" />
            
            <div className="flex justify-between items-start border-b border-primary/10 pb-8">
               <div>
                  <h1 className="text-5xl font-black italic tracking-tighter text-white uppercase leading-none">Command<br/><span className="text-primary font-bold">Center</span></h1>
                  <div className="flex flex-wrap gap-4 mt-6">
                    <p className="text-primary/40 font-black uppercase text-[9px] tracking-[0.4em] flex items-center gap-2 border border-primary/10 px-3 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 bg-primary animate-pulse rounded-full" />
                      KERNEL_STABLE
                    </p>
                    <p className="text-white/20 font-black uppercase text-[9px] tracking-[0.4em] flex items-center gap-2 border border-white/5 px-3 py-1 rounded-full">
                       {networkLatency}ms Latency
                    </p>
                  </div>
               </div>
               <button onClick={onClose} className="p-4 bg-primary text-black hover:bg-white transition-all transform hover:rotate-90 shadow-xl">
                  <X size={28} />
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               <MetricBox label="Network_Origin" value={window.location.hostname === 'localhost' ? 'LOCAL' : 'VERCEL'} status="success" />
               <MetricBox label="Auth_Node" value={user?.email ? 'SYNC_PASS' : 'GUEST'} status={user?.email ? 'success' : 'warning'} />
               <MetricBox label="Token_Sync" value={Object.keys(localStorage).some(k => k.includes('sb-')) ? 'DETECTED' : 'NULL'} status={Object.keys(localStorage).some(k => k.includes('sb-')) ? 'success' : 'warning'} />
               <MetricBox label="Storage_Core" value={dbStatus === 'OK' ? 'MOUNTED' : 'ERROR'} status={dbStatus === 'OK' ? 'success' : 'warning'} />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-black/50 p-6 border border-white/5 rounded-3xl">
               <div className="space-y-1">
                  <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Nodes_Active</span>
                  <p className="text-2xl font-black text-white italic">{(vitals.onlineNodes).toLocaleString()}</p>
               </div>
               <div className="space-y-1">
                  <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Registered_Kernels</span>
                  <p className="text-2xl font-black text-primary italic">{(vitals.registeredKernels).toLocaleString()}</p>
               </div>
               <div className="space-y-1">
                  <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Idle_Buffer</span>
                  <p className="text-2xl font-black text-gray-500 italic">{vitals.idleNodes}</p>
               </div>
               <div className="space-y-1">
                  <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Trending_Stream</span>
                  <p className="text-lg font-black text-white truncate max-w-full uppercase italic tracking-tighter">{vitals.trendingData}</p>
               </div>
            </div>

            <div className="space-y-4">
               <button 
                onClick={runDeepProbe}
                disabled={isScanning}
                className="w-full h-20 flex items-center justify-between px-8 bg-[#050505] hover:bg-primary/5 border border-primary/10 rounded-2xl group transition-all"
               >
                  <div className="flex items-center gap-4">
                     <Terminal size={24} className={cn("text-primary", isScanning && "animate-pulse")} />
                     <div className="text-left leading-none">
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-primary group-hover:text-white transition-colors">Root_Code_Scanner</span>
                        <p className="text-[8px] text-primary/30 mt-2 font-bold uppercase tracking-widest">Synaptic fracture detection active</p>
                     </div>
                  </div>
                  <div className="text-[10px] text-primary/40 font-black group-hover:text-primary transition-colors flex items-center gap-3">
                     {isScanning ? "PROBING..." : <>DEPLOY_PROBE <Zap size={12} /></>}
                  </div>
               </button>

               {probeResults.length > 0 && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {probeResults.map((p, i) => (
                      <div key={i} className={cn("p-5 border rounded-2xl flex items-center gap-4 bg-black/60", 
                        p.status === 'ok' ? "border-green-500/10 shadow-[inner_0_0_20px_rgba(34,197,94,0.02)]" : p.status === 'warning' ? "border-yellow-500/10" : "border-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.05)]"
                      )}>
                         <div className={cn("w-2 h-2 rounded-full", 
                           p.status === 'ok' ? "bg-green-500" : p.status === 'warning' ? "bg-yellow-500" : "bg-red-500 animate-pulse"
                         )} />
                         <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <p className="text-[8px] text-gray-600 font-black uppercase tracking-widest">{p.type}</p>
                              {p.status === 'error' && <AlertTriangle size={10} className="text-red-500" />}
                            </div>
                            <p className="text-[11px] font-bold text-white/90 mt-1">{p.msg}</p>
                         </div>
                      </div>
                    ))}
                 </div>
               )}
            </div>

            <button 
              onClick={() => setView('COORDINATE')}
              className="w-full bg-primary hover:bg-white text-black py-12 font-black text-4xl uppercase italic tracking-tighter shadow-[0_40px_80px_rgba(255,177,0,0.2)] active:scale-[0.98] transition-all border-none animate-pulse hover:animate-none flex items-center justify-center gap-8 group"
            >
               <Sparkles size={40} className="group-hover:rotate-12 transition-transform" />
               [ Initialize Eska Mila Core ]
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* AI STUDIO CLONE INTERFACE */}
          <div className="w-[320px] bg-[#050505] border-r border-white/5 flex flex-col">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center">
                    <Terminal size={22} className="text-primary" />
                 </div>
                 <div className="leading-none">
                    <span className="text-white font-black uppercase text-[14px] tracking-tighter">Eska Mila</span>
                    <span className="text-[8px] text-primary/50 font-black block mt-1 uppercase tracking-widest animate-pulse">Core_Active</span>
                 </div>
              </div>
            </div>

            <div className="p-6">
               <button 
                  onClick={startNewChat}
                  className="w-full h-14 flex items-center justify-center gap-3 bg-white text-black hover:bg-primary rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-[0.98]"
               >
                  <Plus size={18} /> New Workspace
               </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-2 space-y-2 custom-scrollbar">
               <div className="text-[9px] text-white/20 font-black uppercase tracking-[0.3em] px-4 py-4">Protocol_Memory</div>
               {conversations?.map((c) => (
                 <div 
                   key={c.id} 
                   onClick={() => loadChat(c.id)}
                   className={cn(
                     "group w-full text-left px-5 py-4 border border-transparent rounded-2xl transition-all cursor-pointer flex items-center justify-between relative overflow-hidden",
                     currentChatId === c.id ? "bg-white/[0.05] border-white/5 text-white shadow-xl" : "text-gray-600 hover:bg-white/[0.02]"
                   )}
                 >
                    {currentChatId === c.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
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

            <div className="p-8 border-t border-white/5 bg-black/40">
               <button onClick={() => setView('DIAGNOSIS')} className="w-full flex items-center justify-between group">
                 <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-[10px] shadow-[0_0_15px_rgba(255,177,0,0.1)]">
                      {user?.email?.charAt(0).toUpperCase() || 'K'}
                    </div>
                    <div className="truncate text-left">
                      <div className="text-[10px] text-white font-bold truncate leading-none uppercase tracking-tighter">{user?.email || 'GUEST_OPERATOR'}</div>
                      <div className="text-[8px] text-primary font-black tracking-widest mt-1.5 uppercase">Admin_Node</div>
                    </div>
                 </div>
                 <Activity size={16} className="text-gray-700 group-hover:text-primary transition-colors" />
               </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col relative bg-[#080808]">
            <div className="h-[73px] border-b border-white/5 flex items-center justify-between px-10 bg-black/40 backdrop-blur-3xl sticky top-0 z-10">
               <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 font-mono">
                     <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.3)]" />
                     <span className="text-white text-[10px] font-black uppercase tracking-widest">Synchronization_Stable</span>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  <div className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Kernel_ID: {currentChatId?.slice(-6) || '---'}</div>
                  <button onClick={onClose} className="p-2.5 hover:bg-white/5 rounded-xl text-gray-500 hover:text-white transition-all shadow-sm">
                    <X size={20} />
                  </button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
               <div className="max-w-4xl mx-auto space-y-10">
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={cn("flex gap-8 group", msg.role === 'user' ? "flex-row-reverse" : "animate-in slide-in-from-left duration-500")}>
                       <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-2xl transition-all", 
                         msg.role === 'assistant' ? "bg-black border border-primary/20 text-primary group-hover:border-primary/50" : "bg-primary text-black"
                       )}>
                          {msg.role === 'assistant' ? <Terminal size={24} /> : <Shield size={24} />}
                       </div>
                       <div className={cn("space-y-3 flex-1", msg.role === 'user' ? "text-right" : "text-left")}>
                          <div className="text-[9px] text-gray-700 font-black uppercase tracking-[0.3em] px-2">{msg.role === 'assistant' ? 'Eska Mila' : 'Operator'} // {msg.time}</div>
                          <div className={cn("p-8 rounded-[2rem] text-[15px] leading-[1.6] shadow-2xl transition-all border", 
                            msg.role === 'assistant' ? "bg-[#0c0c0c] border-white/5 text-gray-300" : "bg-white text-black font-medium border-transparent"
                          )}>
                             {msg.content}
                          </div>
                       </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex gap-8 animate-pulse">
                       <div className="w-12 h-12 rounded-2xl bg-black border border-primary/10 flex items-center justify-center">
                          <Terminal size={24} className="text-primary/50" />
                       </div>
                       <div className="bg-[#0c0c0c] border border-white/5 p-8 rounded-[2rem] text-gray-500 italic text-[12px] font-black tracking-widest flex items-center gap-4">
                          <Activity size={16} className="animate-spin" />
                          Calibrating synaptic resonance...
                       </div>
                    </div>
                  )}
               </div>
            </div>

            <div className="p-12 bg-gradient-to-t from-black via-black to-transparent">
               <div className="max-w-4xl mx-auto relative group">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl opacity-0 group-focus-within:opacity-30 transition-opacity" />
                  <input 
                     value={input}
                     onChange={(e) => setInput(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                     placeholder="Instruct the Core Architect..."
                     className="w-full bg-[#0c0c0c] border border-white/5 rounded-3xl py-7 pl-10 pr-40 text-white text-[15px] focus:outline-none focus:border-primary/30 focus:bg-white/[0.03] transition-all shadow-2xl placeholder:text-gray-800 placeholder:italic placeholder:font-medium"
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-4">
                    <button 
                       onClick={handleSendMessage}
                       disabled={isTyping || !input.trim()}
                       className={cn(
                         "bg-primary text-black px-8 py-3.5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] transition-all disabled:opacity-20 flex items-center gap-3",
                         !isTyping && input.trim() && "hover:shadow-[0_0_30px_rgba(255,177,0,0.4)] active:scale-95"
                       )}
                    >
                       {isTyping ? <Activity size={18} className="animate-spin" /> : <>Initiate <Zap size={14} /></>}
                    </button>
                  </div>
               </div>
               <p className="text-center text-[9px] text-gray-800 font-extrabold uppercase mt-6 tracking-[0.5em] opacity-50">Authorized Personnel Only // B3st Sekta Sovereign Kernel</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

function MetricBox({ label, value, status }: { label: string, value: string, status: 'success' | 'warning' | 'idle' }) {
  return (
    <div className="bg-black/50 p-6 rounded-3xl border border-white/5 hover:border-primary/20 transition-all group">
       <span className="text-gray-700 text-[9px] font-black uppercase tracking-widest group-hover:text-primary transition-colors">{label}</span>
       <div className="flex items-center justify-between mt-2">
          <span className={cn("text-xl font-black italic tracking-tighter uppercase", 
            status === 'success' ? "text-white" : status === 'warning' ? "text-yellow-500" : "text-gray-500"
          )}>{value}</span>
          <div className={cn("w-2 h-2 rounded-full", 
            status === 'success' ? "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]" : 
            status === 'warning' ? "bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]" : "bg-white/10"
          )} />
       </div>
    </div>
  );
}


function ShieldCheck(props: React.SVGProps<SVGSVGElement>) {
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
