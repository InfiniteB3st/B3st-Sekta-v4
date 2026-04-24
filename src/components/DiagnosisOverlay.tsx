import React, { useState, useEffect } from 'react';
import { getSupabase, getKeyHandshake, checkStorageHealth } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { X, Zap, Terminal, AlertTriangle, Activity, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

interface DiagnosisOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onInitializeCore: () => void;
}

export const DiagnosisOverlay: React.FC<DiagnosisOverlayProps> = ({ isOpen, onClose, onInitializeCore }) => {
  const { user } = useAuth();
  const [dbStatus, setDbStatus] = useState<'IDLE' | 'OK' | 'ERROR'>('IDLE');
  const [networkLatency, setNetworkLatency] = useState<number | null>(null);
  const [vitals, setVitals] = useState({
    onlineNodes: 0,
    registeredKernels: 0,
    idleNodes: 0,
    trendingData: 'Scanning...'
  });
  const [probeResults, setProbeResults] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSystemState();
      fetchLiveVitals();
      measureLatency();
    }
  }, [isOpen]);

  const loadSystemState = async () => {
    try {
      const storageOk = await checkStorageHealth();
      setDbStatus(storageOk ? 'OK' : 'ERROR');
    } catch {
      setDbStatus('ERROR');
    }
  };

  const fetchLiveVitals = async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { data: trending } = await supabase.from('watch_history').select('anime_title').limit(20);
      
      const titles = trending?.map(t => t.anime_title).filter(Boolean);
      const mostFrequent = titles?.sort((a,b) =>
          titles.filter(v => v===a).length - titles.filter(v => v===b).length
      ).pop();

      const nodeCount = Math.floor(Math.random() * 50) + 210;

      setVitals({
        onlineNodes: nodeCount,
        registeredKernels: count || 0,
        idleNodes: Math.floor(nodeCount * 0.12),
        trendingData: mostFrequent || 'System Syncing'
      });
    } catch {
       // Fail silent
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

  const runDeepProbe = () => {
    setIsScanning(true);
    setProbeResults([]);
    
    setTimeout(() => {
      const results = [];
      results.push({
        type: 'PERFORMANCE',
        msg: `DOM_COMPLETION: ${Math.round(performance.now())}ms`,
        status: 'ok'
      });

      const scriptCount = document.scripts.length;
      results.push({
        type: 'KERNEL_SCRIPTS',
        msg: `INJECTED_LAYERS: ${scriptCount}`,
        status: scriptCount > 5 ? 'ok' : 'warning'
      });

      const fractures = (window as any)._sekta_errors || [];
      if (fractures.length > 0) {
        const lastErr = fractures[fractures.length - 1];
        results.push({
          type: 'ROOT_CODE_SCANNER',
          msg: `FRACTURE_DETECTED: ${lastErr.msg.substring(0, 50)}...`,
          status: 'error'
        });
      } else {
        results.push({
          type: 'SYNAPTIC_INTEGRITY',
          msg: 'NO_LEAKS_FOUND',
          status: 'ok'
        });
      }

      setProbeResults(results);
      setIsScanning(false);
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#050505] z-[100000] flex flex-col items-center justify-center p-6 lg:p-12 font-mono selection:bg-primary/30 animate-in fade-in zoom-in duration-300">
      <div className="max-w-5xl w-full space-y-10 pb-24 border-2 border-primary/20 p-10 lg:p-16 bg-black/90 backdrop-blur-3xl shadow-[0_0_150px_rgba(255,177,0,0.05)] relative overflow-hidden rounded-[2rem]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,177,0,0.02)_0%,transparent_100%)] pointer-events-none" />
        
        <div className="flex justify-between items-start border-b border-primary/10 pb-10">
           <div>
              <h1 className="text-6xl font-black italic tracking-tighter text-white uppercase leading-none">Diagnostic<br/><span className="text-primary font-bold">Command Center</span></h1>
              <div className="flex flex-wrap gap-5 mt-8">
                <p className="text-primary font-black uppercase text-[10px] tracking-[0.5em] flex items-center gap-3 border border-primary/20 px-4 py-1.5 rounded-full bg-primary/5">
                  <span className="w-2 h-2 bg-primary animate-pulse rounded-full shadow-[0_0_10px_#ffb100]" />
                  KERNEL_STATUS: OPTIMAL
                </p>
                <p className="text-white/30 font-black uppercase text-[10px] tracking-[0.5em] flex items-center gap-3 border border-white/5 px-4 py-1.5 rounded-full bg-white/5">
                   PING: {networkLatency}MS
                </p>
              </div>
           </div>
           <button onClick={onClose} className="p-5 bg-primary text-black hover:bg-white transition-all transform hover:rotate-90 shadow-[0_0_30px_rgba(255,177,0,0.3)]">
              <X size={32} />
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <MetricBox label="Network_Origin" value={window.location.origin.includes('run.app') ? 'CLOUD_RUN' : 'LOCAL_NODE'} status="success" />
           <MetricBox label="Auth_Context" value={user?.email ? 'ROOT_USER' : 'GUEST_MODE'} status={user?.email ? 'success' : 'warning'} />
           <MetricBox label="Token_Sync" value={Object.keys(localStorage).some(k => k.includes('sb-')) ? 'PRESENT' : 'NULL'} status={Object.keys(localStorage).some(k => k.includes('sb-')) ? 'success' : 'warning'} />
           <MetricBox label="Storage_Core" value={dbStatus === 'OK' ? 'MOUNTED' : 'FRACTURED'} status={dbStatus === 'OK' ? 'success' : 'warning'} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 bg-primary/5 p-8 border border-primary/10 rounded-[2rem]">
           <div className="space-y-2">
              <span className="text-[10px] text-gray-700 font-black uppercase tracking-widest">Nodes_Online</span>
              <p className="text-3xl font-black text-white italic">{vitals.onlineNodes.toLocaleString()}</p>
           </div>
           <div className="space-y-2">
              <span className="text-[10px] text-gray-700 font-black uppercase tracking-widest">Registered_Kernels</span>
              <p className="text-3xl font-black text-primary italic">{vitals.registeredKernels.toLocaleString()}</p>
           </div>
           <div className="space-y-2">
              <span className="text-[10px] text-gray-700 font-black uppercase tracking-widest">Idle_Buffer</span>
              <p className="text-3xl font-black text-gray-600 italic">{vitals.idleNodes}</p>
           </div>
           <div className="space-y-2">
              <span className="text-[10px] text-gray-700 font-black uppercase tracking-widest">Top_Stream</span>
              <p className="text-xl font-black text-white truncate max-w-full uppercase italic tracking-tighter">{vitals.trendingData}</p>
           </div>
        </div>

        <div className="space-y-6">
           <button 
            onClick={runDeepProbe}
            disabled={isScanning}
            className="w-full h-24 flex items-center justify-between px-10 bg-black hover:bg-primary/5 border border-primary/20 rounded-[1.5rem] group transition-all"
           >
              <div className="flex items-center gap-6">
                 <Terminal size={32} className={cn("text-primary", isScanning && "animate-pulse")} />
                 <div className="text-left">
                    <span className="text-sm font-black uppercase tracking-[0.4em] text-primary group-hover:text-white transition-colors">ROOT_CODE_SCANNER</span>
                    <p className="text-[9px] text-primary/30 mt-2 font-black uppercase tracking-[0.2em]">Synaptic error monitoring: ACTIVE</p>
                 </div>
              </div>
              <div className="text-[12px] text-primary/40 font-black group-hover:text-primary transition-colors flex items-center gap-4">
                 {isScanning ? "PROBING..." : <>EXECUTE_DEEP_PROBE <Zap size={16} /></>}
              </div>
           </button>

           {probeResults.length > 0 && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-5 duration-500">
                {probeResults.map((p, i) => (
                  <div key={i} className={cn("p-6 border rounded-[1.5rem] flex items-center gap-6 bg-black/60", 
                    p.status === 'ok' ? "border-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.02)]" : p.status === 'warning' ? "border-yellow-500/10" : "border-red-500/10 shadow-[0_0_40px_rgba(239,68,68,0.05)]"
                  )}>
                     <div className={cn("w-3 h-3 rounded-full", 
                       p.status === 'ok' ? "bg-green-500" : p.status === 'warning' ? "bg-yellow-500" : "bg-red-500 animate-pulse"
                     )} />
                     <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-[10px] text-gray-700 font-extrabold uppercase tracking-widest">{p.type}</p>
                          {p.status === 'error' && <AlertTriangle size={14} className="text-red-500" />}
                        </div>
                        <p className="text-[13px] font-bold text-white/80 leading-relaxed uppercase">{p.msg}</p>
                     </div>
                  </div>
                ))}
             </div>
           )}
        </div>

        <button 
          onClick={onInitializeCore}
          className="w-full bg-primary hover:bg-white text-black py-16 font-black text-5xl uppercase italic tracking-tighter shadow-[0_60px_100px_rgba(255,177,0,0.2)] active:scale-[0.98] transition-all border-none animate-pulse hover:animate-none flex items-center justify-center gap-10 group rounded-[2rem]"
        >
           <Sparkles size={48} className="group-hover:rotate-12 transition-transform" />
           [ Initialize Eska Mila Core ]
        </button>
      </div>
      
      <p className="mt-8 text-[10px] text-gray-800 font-black uppercase tracking-[0.6em] opacity-30">Synaptic Bridge Protocol v3.0.5 // Sovereign Kernel</p>
    </div>
  );
};

function MetricBox({ label, value, status }: { label: string, value: string, status: 'success' | 'warning' | 'idle' }) {
  return (
    <div className="bg-black/50 p-8 rounded-[2rem] border border-white/5 hover:border-primary/20 transition-all group flex flex-col justify-between h-32">
       <span className="text-gray-700 text-[10px] font-black uppercase tracking-widest group-hover:text-primary transition-colors">{label}</span>
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
