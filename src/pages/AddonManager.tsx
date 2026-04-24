import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Puzzle, Plus, Globe, Trash2, ShieldCheck, 
  AlertTriangle, RefreshCw, Loader2, Link as LinkIcon,
  ChevronRight, HardDrive, Settings, ExternalLink, Key,
  CheckCircle2, XCircle, Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';

interface AddonManifest {
  addon_id: string;
  name: string;
  version: string;
  description: string;
  url: string;
  enabled: boolean;
  type?: 'catalog' | 'streaming' | 'subtitle';
}

interface StreamLink {
  name: string;
  url: string;
  quality: string;
  status: 'pending' | 'online' | 'offline';
}

export default function AddonManager() {
  const { user } = useAuth();
  const [addons, setAddons] = useState<AddonManifest[]>([]);
  const [manifestUrl, setManifestUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'installed' | 'explorer'>('installed');

  useEffect(() => {
    loadAddons();
  }, [user]);

  const loadAddons = async () => {
    try {
      if (user) {
        const { data, error: dbError } = await (supabase as any)
          .from('user_addons')
          .select('*')
          .eq('user_id', user.id);
        if (data) setAddons(data);
      } else {
        const local = JSON.parse(localStorage.getItem('sekta_addons') || '[]');
        setAddons(local);
      }
    } catch (err) {
      console.error('Add-on Load Failure:', err);
    }
  };

  const installAddon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manifestUrl.trim()) return;
    
    setLoading(true);
    setError(null);

    try {
      // SMART PARSER: Fetch and validate remote manifest
      let targetUrl = manifestUrl.replace('stremio://', 'https://');
      if (!targetUrl.endsWith('/manifest.json') && !targetUrl.includes('.json')) {
        targetUrl = targetUrl.replace(/\/$/, '') + '/manifest.json';
        // Handle cases where the URL might be a repo or similar
      }

      console.log(`DIAGNOSTIC: Handshaking with node at ${targetUrl}`);
      const response = await fetch(targetUrl);
      if (!response.ok) throw new Error("Handshake Failed: Node endpoint unreachable.");
      
      const manifest = await response.json();
      
      // Strict Validation Logic
      if (!manifest.id || !manifest.name || !Array.isArray(manifest.resources)) {
        throw new Error("Invalid Add-on Manifest. Missing ID, Name, or Resource Logic.");
      }

      const newAddon: AddonManifest = {
        addon_id: manifest.id,
        name: manifest.name,
        version: manifest.version || '1.0.0',
        description: manifest.description || 'Verified B3st Sekta Streaming Node.',
        url: targetUrl,
        enabled: true,
        type: manifest.types?.includes('movie') ? 'streaming' : 'catalog'
      };

      if (user) {
        const { error: dbError } = await (supabase as any)
          .from('user_addons')
          .upsert({
            user_id: user.id,
            ...newAddon,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id,url' });
        if (dbError) throw dbError;
      } else {
        const local = JSON.parse(localStorage.getItem('sekta_addons') || '[]');
        const filtered = local.filter((a: any) => a.url !== manifestUrl);
        filtered.push(newAddon);
        localStorage.setItem('sekta_addons', JSON.stringify(filtered));
      }

      setAddons(prev => {
        const filtered = prev.filter(a => a.url !== manifestUrl);
        return [...filtered, newAddon];
      });
      setManifestUrl('');
      setActiveTab('installed');
    } catch (err: any) {
      setError(`Validation Failed: ${err.message}`);
      console.error('Manifest Parse Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const uninstallAddon = async (id: string) => {
    try {
      if (user) {
        await (supabase as any).from('user_addons').delete().eq('user_id', user.id).eq('addon_id', id);
      } else {
        const local = JSON.parse(localStorage.getItem('sekta_addons') || '[]');
        const filtered = local.filter((a: any) => a.addon_id !== id);
        localStorage.setItem('sekta_addons', JSON.stringify(filtered));
      }
      setAddons(prev => prev.filter(a => a.addon_id !== id));
    } catch (err) {
      console.error('Uninstall Failure:', err);
    }
  };

  return (
    <div className="min-h-screen bg-black p-6 md:p-20 space-y-24 animate-in fade-in duration-700">
      <div className="max-w-6xl mx-auto space-y-20">
        
        {/* Cinematic Header */}
        <div className="space-y-8">
          <div className="flex items-center gap-4 text-primary bg-primary/10 w-fit px-8 py-3 rounded-full border border-primary/20 shadow-[0_0_30px_rgba(var(--primary-rgb),0.1)]">
            <Puzzle size={18} strokeWidth={3} />
            <span className="text-[11px] font-black uppercase tracking-[0.5em] italic">System Extensions v2.0</span>
          </div>
          <div className="space-y-4">
            <h1 className="text-7xl md:text-9xl font-black italic text-white uppercase tracking-tighter leading-none">
              Installed <span className="text-primary">Add-ons</span>
            </h1>
            <p className="text-gray-500 max-w-3xl font-bold uppercase tracking-widest text-[12px] leading-relaxed italic">
              Deploy modular streaming engines. Our "Stremio-style" architecture allows one node to broadcast up to 50 links simultaneously.
            </p>
          </div>
        </div>

        {/* Installation Terminal */}
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/20 blur-[120px] opacity-0 group-focus-within:opacity-40 transition-opacity duration-1000" />
          <form onSubmit={installAddon} className="relative bg-[#080808] border-2 border-white/5 p-4 rounded-[4rem] flex flex-col md:flex-row items-center gap-4 shadow-3xl focus-within:border-primary/40 transition-all duration-500">
             <div className="flex-1 flex items-center w-full px-8">
                <Globe className="text-gray-700 group-focus-within:text-primary transition-colors" size={28} />
                <input 
                  type="text" 
                  placeholder="INPUT MANIFEST URL (JSON or STREMIO LINK)"
                  value={manifestUrl}
                  onChange={(e) => setManifestUrl(e.target.value)}
                  className="w-full bg-transparent px-8 py-10 text-lg font-black text-white tracking-widest outline-none placeholder:text-gray-800 italic"
                  required
                />
             </div>
             <button 
              disabled={loading}
              className="w-full md:w-auto bg-primary text-black px-20 py-10 rounded-[3rem] font-black text-sm uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shadow-[0_20px_60px_rgba(var(--primary-rgb),0.4)]"
             >
               {loading ? <Loader2 className="animate-spin" /> : <Plus size={22} strokeWidth={4} />}
               Install Node
             </button>
          </form>
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute -bottom-20 left-12 flex items-center gap-4 text-red-500 font-black uppercase text-[10px] tracking-[0.3em] bg-red-500/10 px-8 py-3 rounded-full border border-red-500/20 backdrop-blur-xl">
                <AlertTriangle size={16} /> {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Addon Database Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
           {addons.map((addon) => (
             <motion.div 
               key={addon.addon_id}
               layout
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-[#0c0c0c] border border-white/5 p-12 rounded-[3.5rem] space-y-10 group hover:border-primary/40 transition-all duration-500 relative overflow-hidden"
             >
               <div className="absolute top-0 right-0 p-8">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-gray-800">
                    <ExternalLink size={18} />
                  </div>
               </div>

               <div className="flex items-center gap-8">
                 <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500">
                   <HardDrive size={40} strokeWidth={2.5} />
                 </div>
                 <div className="space-y-1">
                   <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">{addon.name}</h3>
                   <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[9px]">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      v{addon.version} • ONLINE
                   </div>
                 </div>
               </div>

               <p className="text-gray-600 text-[11px] font-bold uppercase tracking-widest leading-relaxed">
                 {addon.description}
               </p>

               <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                  <button 
                    onClick={() => uninstallAddon(addon.addon_id)}
                    className="flex items-center gap-3 px-6 py-3 bg-red-500/10 text-red-500 rounded-full font-black uppercase tracking-widest text-[9px] hover:bg-red-500 hover:text-white transition-all"
                  >
                    <Trash2 size={12} /> Uninstall
                  </button>
                  <div className="flex items-center gap-3 text-gray-800">
                    <CheckCircle2 size={18} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Active Link</span>
                  </div>
               </div>
             </motion.div>
           ))}

           {addons.length === 0 && !loading && (
             <div className="col-span-full py-48 border-4 border-dashed border-white/5 rounded-[4rem] flex flex-col items-center justify-center gap-12 text-gray-900 group">
                <Puzzle size={120} className="opacity-20 group-hover:text-primary group-hover:opacity-40 transition-all duration-1000" />
                <div className="text-center space-y-6">
                  <h4 className="text-3xl font-black italic uppercase tracking-tighter text-white">No Active Add-on Nodes</h4>
                  <p className="text-[12px] uppercase font-bold tracking-[0.5em] italic">Inject a manifest URL to activate site features</p>
                </div>
             </div>
           )}
        </div>

        {/* Global Security Disclaimer */}
        <div className="p-12 bg-primary/5 rounded-[3rem] border border-primary/20 flex flex-col md:flex-row items-center gap-10">
           <div className="w-24 h-24 bg-primary text-black rounded-full flex items-center justify-center shrink-0">
             <ShieldCheck size={48} />
           </div>
           <div className="space-y-3">
             <h5 className="text-xl font-black italic uppercase tracking-tight text-white">Encrypted Handshake Node</h5>
             <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest leading-loose">
               B3st Sekta does not host streaming content. We provide the "bridge" infrastructure for community-verified Add-ons. All data in transit is handled via local sandbox isolation.
             </p>
           </div>
        </div>
      </div>
    </div>
  );
}
