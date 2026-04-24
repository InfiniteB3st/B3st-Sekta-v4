import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSupabase } from '../services/supabaseClient';
import { User, Palette, Download, Upload, RefreshCw, Check, AlertCircle, Plus, LayoutGrid, Import } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

type Tab = 'profile' | 'appearance' | 'lists';

export default function Settings() {
  const { user, profile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [accent, setAccent] = useState(profile?.accent_color || '#ffb100');
  const [malUser, setMalUser] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleUpdateAccent = async (color: string) => {
    setAccent(color);
    document.documentElement.style.setProperty('--primary', color);
    localStorage.setItem('sekta_accent', color);
    
    if (user) {
      const { error } = await getSupabase()
        .from('profiles')
        .update({ accent_color: color })
        .eq('id', user.id);

      if (!error) {
         await refreshProfile();
      }
    }
    
    setStatus({ type: 'success', text: 'Accent Color Applied Locally' + (user ? ' & Synced' : '') });
    setTimeout(() => setStatus(null), 3000);
  };

  const handleMalImport = async () => {
    if (!malUser) return;
    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch(`https://api.jikan.moe/v4/users/${malUser}/full`);
      if (!response.ok) throw new Error('Could not find MAL User');
      
      const animelistResponse = await fetch(`https://api.jikan.moe/v4/users/${malUser}/animelist`);
      const data = await animelistResponse.json();
      
      if (!data.data) throw new Error('User has no public anime list');

      const watchEntries = data.data.map((item: any) => ({
        user_id: user?.id,
        anime_id: item.anime.mal_id,
        status: item.status === 'watching' ? 'Watching' : item.status === 'completed' ? 'Completed' : 'Dropped',
        last_episode: item.num_episodes_watched || 0,
        anime_title: item.anime.title,
        image_url: item.anime.images.webp.large_image_url,
        updated_at: new Date().toISOString()
      }));

      const { error } = await getSupabase()
        .from('watch_data')
        .upsert(watchEntries, { onConflict: 'user_id,anime_id' });

      if (error) throw error;
      setStatus({ type: 'success', text: `Sync Complete: Imported ${watchEntries.length} Anime` });
    } catch (err: any) {
      setStatus({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24 px-6 md:px-0">
      
      {/* Header Engine */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4 text-primary">
           <LayoutGrid size={32} />
           <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none text-white">Settings</h1>
        </div>
        <p className="text-gray-500 font-bold uppercase tracking-[0.4em] text-[9px] ml-1">Cross-Device Synchronization & Engine Config</p>
      </div>

      {/* Optimized Tab Navigation */}
      <div className="flex gap-2 p-2 bg-surface border border-white/5 rounded-3xl w-fit">
        {(['profile', 'appearance', 'lists'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === tab ? "bg-primary text-black" : "text-gray-500 hover:text-white"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {status && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "p-8 rounded-[2rem] flex items-center justify-between border shadow-2xl",
            status.type === 'success' ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"
          )}
        >
          <div className="flex items-center gap-4 font-black uppercase tracking-widest text-xs italic">
            {status.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
            {status.text}
          </div>
          <button onClick={() => setStatus(null)} className="text-gray-500 hover:text-white">✕</button>
        </motion.div>
      )}

      <div className="relative">
        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.section 
              key="profile"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-surface rounded-[3.5rem] border border-white/5 p-12 space-y-12"
            >
               <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-[2.5rem] bg-black/40 border border-white/10 flex items-center justify-center relative overflow-hidden">
                     {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <User size={40} className="text-gray-700" />}
                  </div>
                  <div className="space-y-1">
                     <h3 className="text-2xl font-black uppercase tracking-tight text-white italic">{profile?.username || 'Sekta Member'}</h3>
                     <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest leading-loose">{user?.email}</p>
                  </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10 border-t border-white/5 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                  <div className="flex flex-col gap-2">
                     <span className="text-primary font-black">Account ID</span>
                     <code className="bg-black/40 p-4 rounded-2xl border border-white/5">{user?.id}</code>
                  </div>
                  <div className="flex flex-col gap-2">
                     <span className="text-primary font-black">Joined At</span>
                     <div className="bg-black/40 p-4 rounded-2xl border border-white/5">{new Date(profile?.created_at).toLocaleDateString()}</div>
                  </div>
               </div>
            </motion.section>
          )}

          {activeTab === 'appearance' && (
            <motion.section 
              key="appearance"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-surface rounded-[3.5rem] border border-white/5 p-12 space-y-12"
            >
              <div className="space-y-2">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Global Accent</h3>
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest italic">Sync colors across all devices</p>
              </div>

              <div className="flex flex-wrap gap-4">
                {['#ffb100', '#ff4d4d', '#4dff88', '#4287f5', '#9d42f5', '#000000'].map((color) => (
                  <button 
                    key={color}
                    onClick={() => handleUpdateAccent(color)}
                    className={cn(
                      "w-20 h-20 rounded-3xl border-4 transition-all hover:scale-110 shadow-2xl relative overflow-hidden",
                      accent === color ? "border-white scale-110 shadow-primary/40" : "border-transparent opacity-40 hover:opacity-100"
                    )}
                    style={{ backgroundColor: color }}
                  >
                    {accent === color && <Check className="absolute inset-0 m-auto text-white drop-shadow-xl" />}
                  </button>
                ))}
                <div className="relative group">
                  <input 
                    type="color" 
                    value={accent}
                    onChange={(e) => handleUpdateAccent(e.target.value)}
                    className="w-20 h-20 bg-transparent border-none cursor-pointer opacity-0 absolute inset-0 z-20"
                  />
                  <div className="w-20 h-20 rounded-3xl border-2 border-dashed border-white/20 flex items-center justify-center text-gray-500 group-hover:border-primary transition-all">
                    <Plus size={24} />
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {activeTab === 'lists' && (
            <motion.section 
              key="lists"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-surface rounded-[3.5rem] border border-white/5 p-12 space-y-12"
            >
              <div className="space-y-2">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">MAL Synchronization</h3>
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest italic flex items-center gap-2">
                   <Import size={12} /> Powered by Jikan Bridge Engine
                </p>
              </div>

              <div className="space-y-8">
                <div className="relative group">
                  <User className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-primary transition-colors" size={20} />
                  <input 
                    type="text" 
                    placeholder="ENTER MAL USERNAME..."
                    value={malUser}
                    onChange={(e) => setMalUser(e.target.value)}
                    className="w-full bg-black/40 border-2 border-white/5 rounded-3xl py-6 pl-16 pr-6 text-sm font-black tracking-widest focus:outline-none focus:border-primary transition-all text-white placeholder:text-gray-800"
                  />
                </div>

                <button 
                  onClick={handleMalImport}
                  disabled={loading || !malUser}
                  className="w-full bg-primary text-black h-20 rounded-3xl font-black text-[12px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-primary/20"
                >
                  {loading ? <RefreshCw className="animate-spin" /> : <>Start Global Sync</>}
                </button>

                <div className="pt-8 border-t border-white/5">
                   <button 
                    onClick={() => {
                        const blob = new Blob([JSON.stringify({ user: user?.id, timestamp: new Date() }, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'sekta_data_export.json';
                        a.click();
                    }}
                    className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
                   >
                     <Download size={14} /> Export Sekta Legacy Data (.json)
                   </button>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
