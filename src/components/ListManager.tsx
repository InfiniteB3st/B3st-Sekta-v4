import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Download, Upload, Shield, Loader2, Database, FileJson, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSupabase } from '../services/supabase';

export default function ListManager() {
  const { user, profile } = useAuth();
  const supabase = getSupabase();
  const [malUsername, setMalUsername] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleMALImport = async () => {
    if (!malUsername || !user || !supabase) return;
    setIsImporting(true);
    setStatus('Connecting to Service...');
    
    try {
      // Jikan User Animelist API
      const response = await fetch(`https://api.jikan.moe/v4/users/${malUsername}/animelist`);
      if (!response.ok) throw new Error('Could not find user.');
      
      const json = await response.json();
      const malList = json.data || [];
      
      setStatus(`Importing ${malList.length} Anime...`);

      // Transform MAL status to B3st Sekta status
      const statusMap: Record<string, string> = {
        'watching': 'Watching',
        'completed': 'Completed',
        'on_hold': 'On Hold',
        'dropped': 'Dropped',
        'plan_to_watch': 'Plan to Watch'
      };

      // Batch migration
      for (const item of malList) {
        await supabase.from('user_lists').upsert({
          user_id: user.id,
          anime_id: item.anime.mal_id,
          status: statusMap[item.status] || 'Plan to Watch',
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,anime_id' });
      }
      
      setStatus('Import Successful');
      setTimeout(() => setStatus(null), 3000);
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
      console.error('Import Failure:', err);
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportJSON = async () => {
    if (!user || !supabase) return;
    try {
      const { data, error } = await supabase
        .from('user_lists')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `watchlist_${profile?.username || 'user'}_${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export Failure:', err);
    }
  };

  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Database className="text-primary w-6 h-6" />
          <h3 className="text-xl font-black text-white uppercase italic">List Management</h3>
        </div>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-loose max-w-md">
          Keep your lists in sync. Import from MyAnimeList or export your current watchlist as a backup.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Import */}
        <div className="bg-[#0f0f0f] border border-white/5 rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary/50 tracking-widest">
            <Upload size={14} />
            Import from MAL
          </div>
          <div className="space-y-4">
            <input
              type="text"
              value={malUsername}
              onChange={(e) => setMalUsername(e.target.value)}
              placeholder="Username"
              className="w-full bg-[#1a1a1a] border-2 border-white/5 focus:border-primary rounded-2xl py-5 px-6 text-white text-sm font-black tracking-widest outline-none transition-all uppercase"
            />
            <button
              onClick={handleMALImport}
              disabled={isImporting || !malUsername}
              className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:translate-y-[-2px] active:translate-y-[2px] transition-all disabled:opacity-50"
            >
              {isImporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              {isImporting ? 'Syncing...' : 'Start Import'}
            </button>
          </div>
        </div>

        {/* Export */}
        <div className="bg-[#0f0f0f] border border-white/5 rounded-3xl p-8 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary/50 tracking-widest">
              <Download size={14} />
              Export Data
            </div>
            <p className="text-[10px] text-gray-600 font-bold uppercase leading-relaxed">
              Export your entire watch history and watchlist as a JSON file.
            </p>
          </div>
          <button
            onClick={handleExportJSON}
            className="w-full bg-white/5 border border-white/10 text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 transition-all mt-8"
          >
            <FileJson className="w-5 h-5" />
            Download Watchlist
          </button>
        </div>
      </div>

      {status && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center gap-4"
        >
          {status === 'IMPORT_COMPLETE' ? (
            <CheckCircle2 className="text-primary w-6 h-6" />
          ) : (
            <Loader2 className="text-primary w-6 h-6 animate-spin" />
          )}
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{status}</span>
        </motion.div>
      )}
    </div>
  );
}
