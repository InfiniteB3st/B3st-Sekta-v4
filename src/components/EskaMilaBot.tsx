import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, Terminal, Zap, ShieldAlert, Sparkles, MessageSquare, Plus, Trash2, History, Cpu } from 'lucide-react';
import { getEskaMilaResponse } from '../services/eskaMilaEngine';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { getSupabase } from '../services/supabaseClient';

interface Message {
  role: 'user' | 'bot';
  content: string;
  timestamp: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: string;
}

interface EskaMilaBotProps {
  isOpen: boolean;
  onClose: () => void;
  diagnosticData: any;
}

const getSystemSnapshot = async () => {
  const supabaseClient = getSupabase();
  const session = await supabaseClient?.auth.getSession();
  const addons = JSON.parse(localStorage.getItem('sekta_addons') || '[]');
  const errors = (window as any)._sekta_errors || [];
  
  return {
    auth_status: session?.data?.session ? 'ACTIVE_HANDSHAKE' : 'LOCKED_BYPASS',
    user_id: session?.data?.session?.user?.id || 'ANONYMOUS',
    addon_count: addons.length,
    recent_errors: errors.slice(-5),
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    url: window.location.href,
    timestamp: new Date().toISOString()
  };
};

export const EskaMilaBot: React.FC<EskaMilaBotProps> = ({ isOpen, onClose, diagnosticData }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('eska_mila_v2_sessions');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSessions(parsed);
      if (parsed.length > 0) setCurrentSessionId(parsed[0].id);
    } else {
      createNewChat();
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('eska_mila_v2_sessions', JSON.stringify(sessions));
    }
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [sessions]);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  const createNewChat = () => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: `Session ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      messages: [{
        role: 'bot',
        content: "I am Eska Mila. Interface initialized. I have performed a kernel sweep. How can I assist with your B3st Sekta architecture?",
        timestamp: new Date().toISOString()
      }],
      updatedAt: new Date().toISOString()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = sessions.filter(s => s.id !== id);
    setSessions(filtered);
    if (currentSessionId === id) {
      setCurrentSessionId(filtered[0]?.id || null);
      if (filtered.length === 0) createNewChat();
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !currentSessionId) return;

    const snapshot = await getSystemSnapshot();
    const userMsg: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setSessions(prev => prev.map(s => s.id === currentSessionId ? {
      ...s,
      messages: [...s.messages, userMsg],
      updatedAt: new Date().toISOString()
    } : s));

    setInput('');
    setIsLoading(true);

    try {
      // Injecting snapshot into the call
      const response = await getEskaMilaResponse(input, { ...diagnosticData, snapshot });
      const botMsg: Message = {
        role: 'bot',
        content: response || "REDACTED: Transmission failed.",
        timestamp: new Date().toISOString()
      };
      
      setSessions(prev => prev.map(s => s.id === currentSessionId ? {
        ...s,
        messages: [...s.messages, botMsg],
        updatedAt: new Date().toISOString()
      } : s));
    } catch (err) {
      setSessions(prev => prev.map(s => s.id === currentSessionId ? {
        ...s,
        messages: [...s.messages, {
          role: 'bot',
          content: "CRITICAL_FAILURE: Synaptic link severed.",
          timestamp: new Date().toISOString()
        }],
        updatedAt: new Date().toISOString()
      } : s));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed inset-0 z-[100000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
      >
        <div className="w-full max-w-6xl h-[80vh] bg-[#050505] border border-primary/20 rounded-[3rem] shadow-[0_0_100px_rgba(255,177,0,0.1)] flex overflow-hidden">
          
          {/* Sidebar */}
          <div className="w-80 bg-black/40 border-r border-white/5 flex flex-col">
            <div className="p-8 space-y-6">
              <button 
                onClick={createNewChat}
                className="w-full bg-primary/10 border border-primary/20 text-primary py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-primary hover:text-black transition-all"
              >
                <Plus size={16} />
                New Sequence
              </button>
              
              <div className="space-y-4">
                <label className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-700 flex items-center gap-2">
                  <History size={12} /> Sequential Memory
                </label>
                <div className="space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
                  {sessions.map(s => (
                    <button 
                      key={s.id}
                      onClick={() => setCurrentSessionId(s.id)}
                      className={cn(
                        "w-full p-4 rounded-xl text-left border transition-all flex items-center justify-between group",
                        currentSessionId === s.id ? "bg-primary border-primary text-black" : "bg-white/3 border-white/5 text-gray-400 hover:border-white/10"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <MessageSquare size={14} className={currentSessionId === s.id ? "text-black" : "text-primary"} />
                        <span className="text-[10px] font-bold uppercase truncate">{s.title}</span>
                      </div>
                      <Trash2 
                        size={12} 
                        className={cn("opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500", currentSessionId === s.id ? "text-black/40" : "text-gray-600")} 
                        onClick={(e) => deleteSession(s.id, e)}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-auto p-8 border-t border-white/5 bg-primary/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                   <Cpu size={20} className="text-primary animate-pulse" />
                </div>
                <div>
                  <p className="text-[9px] text-white font-black uppercase tracking-widest">Eska Mila</p>
                  <p className="text-[8px] text-primary font-black uppercase tracking-widest opacity-50 italic">Observer ID v2.4.9</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Chat */}
          <div className="flex-1 flex flex-col bg-black">
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-black shadow-[0_0_20px_rgba(255,177,0,0.3)]">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 className="text-white font-black uppercase italic tracking-tighter text-xl">Omniscient Observer</h3>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[9px] text-primary font-black uppercase tracking-widest italic">{currentSession?.title} // System Link Active</span>
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-4 bg-white/5 text-gray-500 hover:text-white rounded-full transition-all hover:scale-110">
                <X size={24} />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-12 space-y-8 custom-scrollbar"
            >
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex flex-col", msg.role === 'user' ? "items-end" : "items-start")}>
                  <div className={cn(
                    "p-6 rounded-3xl text-[13px] max-w-[75%] leading-relaxed shadow-xl",
                    msg.role === 'user' 
                      ? "bg-primary text-black font-black italic rounded-tr-none" 
                      : "bg-white/3 text-gray-200 border border-white/5 rounded-tl-none italic"
                  )}>
                    {msg.content}
                  </div>
                  <span className="text-[8px] text-gray-700 font-black mt-3 uppercase tracking-widest px-2">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} // Sequence 0{i + 1}
                  </span>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-4 text-primary p-6 bg-primary/5 rounded-3xl self-start italic">
                   <Terminal size={14} className="animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Analyzing Transmission... Handshake 77%</span>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-10 border-t border-white/5 bg-[#050505]">
              <div className="max-w-4xl mx-auto relative group">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Identify your query..."
                  className="w-full bg-black border border-white/5 rounded-[2rem] p-6 pr-20 text-white text-sm font-black italic outline-none focus:border-primary/50 transition-all placeholder:text-gray-800"
                />
                <button 
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="absolute right-3 top-3 w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100 shadow-[0_0_20px_rgba(255,177,0,0.2)]"
                >
                  <Send size={20} />
                </button>
              </div>
              <div className="max-w-4xl mx-auto flex justify-between mt-6 px-4">
                 <p className="text-[8px] text-gray-800 font-black uppercase tracking-widest italic">Direct Path: KERNEL_OBSERVER_01</p>
                 <p className="text-[8px] text-primary/40 font-black uppercase tracking-widest italic">Encrypted via B3st Encryption</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
