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
    const newChat = {
      id,
      title: `Session_${id.slice(-4)}`,
      history: [{
        role: 'assistant',
        content: "Eska Mila core initialized. Synaptic resonance established. How shall we optimize the Sekta architecture, Operator?",
        time: new Date().toLocaleTimeString()
      }]
    };
    setConversations([newChat, ...conversations]);
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
      
      {/* SIDEBAR: AI STUDIO CLONE */}
      <div className="w-[300px] bg-black border-r border-white/5 flex flex-col shadow-2xl">
         <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center">
                  <Terminal size={22} className="text-primary" />
               </div>
               <div className="leading-none">
                  <span className="text-white font-black uppercase text-[15px] tracking-tighter">Eska Mila</span>
                  <span className="text-[9px] text-primary/50 font-black block mt-1 uppercase tracking-widest animate-pulse">SOVEREIGN_CORE</span>
               </div>
            </div>
         </div>

         <div className="p-6">
            <button 
               onClick={startNewChat}
               className="w-full h-14 flex items-center justify-center gap-3 bg-white text-black hover:bg-primary rounded-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl transition-all active:scale-[0.98]"
            >
               <Plus size={18} /> New Workspace
            </button>
         </div>

         <div className="flex-1 overflow-y-auto px-5 py-2 space-y-1.5 custom-scrollbar">
            <div className="text-[9px] text-white/20 font-black uppercase tracking-[0.4em] px-5 py-4">Memory_Vault</div>
            {conversations.map((c) => (
               <div 
                  key={c.id} 
                  onClick={() => loadChat(c.id)}
                  className={cn(
                     "group w-full text-left px-5 py-4 border border-transparent rounded-2xl transition-all cursor-pointer flex items-center justify-between relative",
                     currentChatId === c.id ? "bg-white/10 border-white/10 text-white shadow-xl" : "text-gray-600 hover:bg-white/5"
                  )}
               >
                  {currentChatId === c.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                  <div className="flex items-center gap-4 truncate">
                     <MessageSquare size={16} className={currentChatId === c.id ? "text-primary" : "text-gray-800"} />
                     <span className="text-[12px] font-bold truncate tracking-tight">{c.title}</span>
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

         <div className="p-8 border-t border-white/5 bg-black/50">
            <button onClick={onBackToDiagnosis} className="w-full flex items-center justify-between group">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-[12px]">
                     {user?.email?.charAt(0).toUpperCase() || 'K'}
                  </div>
                  <div className="truncate text-left leading-none">
                     <div className="text-[11px] text-white font-bold truncate uppercase tracking-tighter">{user?.email || 'GUEST'}</div>
                     <div className="text-[8px] text-primary font-black tracking-widest mt-1.5 uppercase">Admin_Node</div>
                  </div>
               </div>
               <Activity size={18} className="text-gray-700 group-hover:text-primary transition-colors" />
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
