import React, { useState, useEffect } from 'react';
import { getSupabase, getKeyHandshake } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { X, Zap, Terminal, Activity, Plus, MessageSquare, Trash2, Shield, Send } from 'lucide-react';
import { cn } from '../lib/utils';
import { getEskaMilaResponse } from '../services/eskaMilaEngine';

interface EskaMilaProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToDiagnosis: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

export const EskaMila: React.FC<EskaMilaProps> = ({ isOpen, onClose, onBackToDiagnosis }) => {
  const { user, session } = useAuth();
  const [conversations, setConversations] = useState<any[]>(() => 
    JSON.parse(localStorage.getItem('eska_mila_sovereign') || '[]')
  );
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

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
      if (conversations.length === 0) {
        startNewChat();
      } else if (!currentChatId) {
        loadChat(conversations[0].id);
      }
    }
  }, [isOpen]);

   const startNewChat = () => {
    const id = Date.now().toString();
    const scanReport = (window as any)._FABRIC_SCAN_REPORT || "SYNAPTIC_INTEGRITY: 100%";
    const initialMsg = `Eska Mila core initialized. Synaptic resonance established. 

[ SITE_FABRIC_REPORT ]
${scanReport}

How shall we optimize the Sekta architecture, Operator?`;

    const newChat = {
      id,
      title: `Session_${id.slice(-4)}`,
      history: [{
        role: 'assistant',
        content: initialMsg,
        time: new Date().toLocaleTimeString()
      }]
    };
    const updated = [newChat, ...conversations];
    setConversations(updated);
    localStorage.setItem('eska_mila_sovereign', JSON.stringify(updated));
    setCurrentChatId(id);
    setChatHistory(newChat.history as ChatMessage[]);
  };

  const loadChat = (id: string) => {
    const chat = conversations.find(c => c.id === id);
    if (chat) {
      setCurrentChatId(id);
      setChatHistory(chat.history);
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
      handshake: getKeyHandshake()?.prefix + "...",
      auth_context: session ? 'AUTHENTICATED' : 'ANONYMOUS',
      origin: window.location.origin,
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
    <div className="fixed inset-0 bg-[#060606] z-[100000] flex font-mono selection:bg-primary/30 animate-in fade-in slide-in-from-right duration-500">
      
      {/* SIDEBAR: KERNEL MEMORY VAULT */}
      <div className="w-[300px] bg-[#111111] border-r border-white/5 flex flex-col shadow-2xl z-20">
         <div className="p-8 pb-4">
            <button 
               onClick={startNewChat}
               className="w-full h-14 flex items-center gap-3 px-6 bg-[#1a1a1a] text-white hover:bg-white/5 rounded-full text-[13px] font-medium transition-all active:scale-95 group text-left"
            >
               <Plus size={20} className="text-gray-400 group-hover:text-primary transition-colors" /> 
               New Chat
            </button>
         </div>

         <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar">
            <div className="text-[11px] text-gray-500 font-bold uppercase tracking-widest px-4 py-2 mt-4">Recent</div>
            {conversations.length === 0 && (
               <div className="px-4 py-10 text-[11px] text-gray-700 font-medium italic">Empty workspace memory.</div>
            )}
            {conversations.map((c) => (
               <div 
                  key={c.id} 
                  onClick={() => loadChat(c.id)}
                  className={cn(
                     "group w-full text-left px-4 py-3 rounded-full transition-all cursor-pointer flex items-center justify-between relative",
                     currentChatId === c.id ? "bg-[#2A2A2A] text-white" : "text-gray-400 hover:bg-[#1a1a1a] hover:text-white"
                  )}
               >
                  <div className="flex items-center gap-3 truncate max-w-[85%]">
                     <MessageSquare size={16} className={currentChatId === c.id ? "text-primary" : "text-gray-600"} />
                     <span className="text-[13px] font-medium truncate">{c.title}</span>
                  </div>
                  <button 
                    onClick={(e) => deleteChat(c.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 hover:text-red-500 text-gray-700 rounded-full transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
               </div>
            ))}
         </div>

         <div className="p-6 border-t border-white/5">
            <button onClick={onBackToDiagnosis} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl transition-all group">
               <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-[14px]">
                  {user?.email?.charAt(0).toUpperCase() || 'K'}
               </div>
               <div className="truncate text-left leading-tight">
                  <div className="text-[13px] text-white font-medium truncate">{user?.email?.split('@')[0] || 'Operator'}</div>
                  <div className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Settings</div>
               </div>
            </button>
         </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col bg-[#050505]">
         <div className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-black/50 backdrop-blur-xl">
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-white text-[11px] font-black uppercase tracking-[0.2em]">Synaptic_Sync: STABLE</span>
               </div>
            </div>
            <div className="flex items-center gap-6">
               <span className="text-[10px] text-gray-700 font-black uppercase tracking-widest">Workspace_ID: {currentChatId?.slice(-8)}</span>
               <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-xl text-gray-500 hover:text-white transition-all">
                  <X size={24} />
               </button>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-12 lg:p-20 custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-16">
               {chatHistory.map((msg, i) => (
                  <div key={i} className={cn("flex gap-10", msg.role === 'user' ? "flex-row-reverse" : "")}>
                     <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-2xl", 
                        msg.role === 'assistant' ? "bg-black border border-primary/20 text-primary" : "bg-primary text-black"
                     )}>
                        {msg.role === 'assistant' ? <Terminal size={28} /> : <Shield size={28} />}
                     </div>
                     <div className={cn("space-y-4 max-w-[80%]", msg.role === 'user' ? "text-right" : "text-left")}>
                        <div className="text-[10px] text-gray-700 font-extrabold uppercase tracking-[0.4em] px-2">
                          {msg.role === 'assistant' ? 'Eska Mila Core' : 'Kernel Operator'} // {msg.time}
                        </div>
                        <div className={cn("p-10 rounded-[2.5rem] text-[16px] leading-relaxed shadow-2xl border", 
                           msg.role === 'assistant' ? "bg-[#0a0a0a] border-white/5 text-gray-300" : "bg-white text-black font-semibold border-transparent"
                        )}>
                           {msg.content}
                        </div>
                     </div>
                  </div>
               ))}
               {isTyping && (
                  <div className="flex gap-10 animate-pulse">
                     <div className="w-14 h-14 rounded-2xl bg-black border border-primary/10 flex items-center justify-center">
                        <Terminal size={28} className="text-primary/30" />
                     </div>
                     <div className="bg-[#0a0a0a] border border-white/5 p-10 rounded-[2.5rem] text-gray-500 italic text-[14px] font-black tracking-widest flex items-center gap-4">
                        <Activity size={20} className="animate-spin" />
                        Generating synaptic response...
                     </div>
                  </div>
               )}
            </div>
         </div>

         <div className="p-12 lg:p-16 bg-gradient-to-t from-black via-black to-transparent">
            <div className="max-w-4xl mx-auto relative">
               <input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Instruct the Core Architect..."
                  className="w-full bg-[#0a0a0a] border-2 border-white/5 rounded-3xl py-8 pl-12 pr-44 text-white text-[16px] focus:outline-none focus:border-primary/40 transition-all shadow-3xl placeholder:text-gray-800 placeholder:italic placeholder:font-bold"
               />
               <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-6">
                  <button 
                     onClick={handleSendMessage}
                     disabled={isTyping || !input.trim()}
                     className={cn(
                        "bg-primary text-black px-10 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[12px] transition-all disabled:opacity-20",
                        !isTyping && input.trim() && "hover:shadow-[0_0_40px_#ffb10066] active:scale-95"
                     )}
                  >
                     {isTyping ? <Activity size={20} className="animate-spin" /> : <Send size={20} />}
                  </button>
               </div>
            </div>
            <p className="text-center text-[10px] text-gray-800 font-black uppercase mt-8 tracking-[0.8em] opacity-40">Synaptic Resonance Active // Sovereign Kernel</p>
         </div>
      </div>
    </div>
  );
};
