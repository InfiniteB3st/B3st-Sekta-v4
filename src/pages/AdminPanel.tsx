import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSupabase } from '../services/supabase';
import { Users, ShieldAlert, RefreshCw, Ban, UserCheck, Search, Activity, Terminal, Shield } from 'lucide-react';
import { cn } from '../lib/utils';

interface AdminProfile {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  is_banned: boolean;
  last_seen: string | null;
  created_at: string;
}

export default function AdminPanel() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ total: 0, online: 0 });
  const supabase = getSupabase();

  const ADMIN_EMAIL = 'wambuamaxwell696@gmail.com';

  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) {
      fetchProfiles();
    }
  }, [user]);

  const fetchProfiles = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
      
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
      const onlineCount = (data || []).filter(p => p.last_seen && new Date(p.last_seen) > fiveMinsAgo).length;
      setStats({ total: data?.length || 0, online: onlineCount });
    } catch (err) {
      console.error('Intelligence Fetch Failure:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleBan = async (profileId: string, currentStatus: boolean) => {
    if (!supabase || !confirm(`STRICT COMMAND: Initiate ${currentStatus ? 'Unban' : 'BAN'} sequence?`)) return;
    try {
      const { error } = await supabase.from('profiles').update({ is_banned: !currentStatus }).eq('id', profileId);
      if (error) throw error;
      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, is_banned: !currentStatus } : p));
    } catch (err: any) {
      alert(`Command Error: ${err.message}`);
    }
  };

  if (user?.email !== ADMIN_EMAIL) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-center animate-in fade-in duration-1000">
        <ShieldAlert size={120} className="text-red-900 mb-8 opacity-20" />
        <h1 className="text-5xl font-black italic uppercase tracking-tighter">ACCESS RESTRICTED</h1>
        <p className="text-gray-800 mt-4 text-[11px] font-black uppercase tracking-[0.5em] max-w-sm leading-loose">
          Unauthorized Access. This area is reserved for administrators only.
        </p>
      </div>
    );
  }

  const filtered = profiles.filter(p => 
    p.username?.toLowerCase().includes(search.toLowerCase()) || 
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-16 animate-in slide-in-from-bottom-12 duration-1000" id="admin-panel">
      <header className="flex flex-col md:flex-row items-end justify-between gap-10 border-l-8 border-primary pl-10 py-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <Shield className="text-primary" size={32} />
             <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none text-white">ADMIN PANEL</h1>
          </div>
          <p className="text-[11px] text-gray-700 font-black uppercase tracking-[0.4em]">B3ST SEKTA MANAGEMENT v.4.0</p>
        </div>
        <button 
          onClick={fetchProfiles}
          disabled={loading}
          className="bg-[#1a1a1a] hover:bg-white text-primary hover:text-black p-6 rounded-[35px] border-2 border-white/5 transition-all shadow-2xl active:scale-90"
        >
          <RefreshCw size={28} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      {/* Stats Deck */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="bg-[#1a1a1a] border-2 border-white/5 p-12 rounded-[50px] space-y-6 shadow-2xl relative overflow-hidden group">
          <Users className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity" size={140} />
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Total Users</h3>
          <p className="text-7xl font-black italic tracking-tighter leading-none text-white">{stats.total}</p>
        </div>
        <div className="bg-[#1a1a1a] border-2 border-white/5 p-12 rounded-[50px] space-y-6 shadow-2xl relative overflow-hidden group">
          <Activity className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity text-green-500" size={140} />
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-green-500/40">Online Now</h3>
          <p className="text-7xl font-black italic tracking-tighter leading-none text-green-500">{stats.online}</p>
        </div>
        <div className="bg-[#1a1a1a] border-2 border-white/5 p-12 rounded-[50px] space-y-6 shadow-2xl relative overflow-hidden group">
          <Ban className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity text-red-500" size={140} />
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500/40">Banned Users</h3>
          <p className="text-7xl font-black italic tracking-tighter leading-none text-red-500">
            {profiles.filter(p => p.is_banned).length}
          </p>
        </div>
      </div>

      {/* Management Grid */}
      <section className="bg-[#1a1a1a] rounded-[60px] border-2 border-white/5 overflow-hidden shadow-3xl">
        <div className="p-12 border-b-2 border-white/5 flex flex-col xl:flex-row xl:items-center justify-between gap-12 bg-white/[0.01]">
          <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white">USER SEARCH</h2>
          <div className="relative group w-full max-w-xl">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-primary transition-colors" size={24} />
            <input 
              type="text" 
              placeholder="SEARCH USERS..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/60 border-2 border-white/5 rounded-[40px] py-6 pl-20 pr-10 focus:outline-none focus:border-primary transition-all text-sm font-black italic text-white placeholder:text-gray-900"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-black/40">
              <tr>
                <th className="px-12 py-10 text-[11px] font-black uppercase tracking-[0.4em] text-gray-700">User Details</th>
                <th className="px-12 py-10 text-[11px] font-black uppercase tracking-[0.4em] text-gray-700">Status</th>
                <th className="px-12 py-10 text-[11px] font-black uppercase tracking-[0.4em] text-gray-700">Activity</th>
                <th className="px-12 py-10 text-[11px] font-black uppercase tracking-[0.4em] text-gray-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-white/5">
              {filtered.map(p => {
                const isOnline = p.last_seen && new Date(p.last_seen) > new Date(Date.now() - 5 * 60 * 1000);
                return (
                  <tr key={p.id} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="px-12 py-10">
                      <div className="flex items-center gap-8">
                        <div className="w-20 h-20 rounded-[35px] overflow-hidden border-4 border-white/5 bg-black flex-shrink-0 group-hover:scale-110 transition-transform shadow-2xl relative">
                          {p.avatar_url ? (
                            <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-900 text-4xl font-black italic">{p.username?.[0] || '?' }</div>
                          )}
                          {isOnline && <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 border-4 border-black rounded-full shadow-[0_0_20px_rgba(34,197,94,0.5)]" />}
                        </div>
                        <div>
                          <h4 className="text-xl font-black uppercase italic tracking-tighter text-white group-hover:text-primary transition-colors">{p.username || 'UNKNOWN'}</h4>
                          <p className="text-[10px] text-gray-700 font-black uppercase tracking-widest mt-2">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-12 py-10">
                      <div className="flex items-center gap-4">
                        {p.is_banned ? (
                          <span className="bg-red-500/10 text-red-500 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-500/20 shadow-lg shadow-red-500/10">BANNED</span>
                        ) : (
                          <span className="bg-green-500/10 text-green-500 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-500/20 shadow-lg shadow-green-500/10">AUTHORIZED</span>
                        )}
                        {p.email === ADMIN_EMAIL && (
                          <span className="bg-primary text-black px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 ring-4 ring-primary/10">ADMIN</span>
                        )}
                      </div>
                    </td>
                    <td className="px-12 py-10 whitespace-nowrap">
                      <div className="flex flex-col gap-2">
                         <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-700">LAST SEEN:</span>
                         <span className="text-[11px] font-black uppercase italic text-gray-400">
                           {p.last_seen ? new Date(p.last_seen).toLocaleString() : 'OFFLINE'}
                         </span>
                      </div>
                    </td>
                    <td className="px-12 py-10 text-right">
                      {p.email !== ADMIN_EMAIL && (
                        <button 
                          onClick={() => toggleBan(p.id, p.is_banned)}
                          className={cn(
                            "px-10 py-4 rounded-[30px] text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl active:scale-95",
                            p.is_banned 
                              ? "bg-green-500 text-black hover:bg-white" 
                              : "bg-red-500/20 border-2 border-red-500/30 text-red-500 hover:bg-red-500 hover:text-black"
                          )}
                        >
                          {p.is_banned ? 'UNBAN' : 'BAN USER'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-12 py-40 text-center">
                    <p className="text-gray-900 font-black uppercase tracking-[0.8em] text-xs">NO USERS FOUND</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
