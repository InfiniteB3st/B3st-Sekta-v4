import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, ShieldCheck, ArrowRight, Loader2, Lock, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, syncProfile } from '../services/supabaseClient';
import { useNavigate } from 'react-router-dom';

/**
 * SENIOR SYSTEMS ARCHITECT: Setup Engine
 * Mandatory Stage 2: Profile & Avatar Initialization
 */
export default function SetupAccount() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('https://i.imgur.com/Heuy9Y8.png'); // Default HiAnime Avatar
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avatars = [
    'https://i.imgur.com/Heuy9Y8.png', 
    'https://i.imgur.com/5u9B8yN.png',
    'https://i.imgur.com/8Q6Zl3R.png',
    'https://i.imgur.com/mYFq8pS.png',
    'https://i.imgur.com/0v5Ue9n.png',
    'https://i.imgur.com/lM5a8D9.png'
  ];

  useEffect(() => {
    if (profile?.username) {
      navigate('/home');
    }
  }, [profile, navigate]);

  const handleCompleteSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (username.length < 3) {
      setError('Username invalid (Minimum 3 chars)');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Uniqueness Guard
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (existingUser) {
        throw new Error('This alias is already claimed.');
      }

      // 2. Auth Bridge: Update password for secondary access
      if (password) {
        const { error: authError } = await supabase.auth.updateUser({ password });
        if (authError) throw authError;
      }

      // 3. Sync Profile Data
      await syncProfile({
        id: user.id,
        username,
        email: user.email,
        avatar_url: selectedAvatar,
        accent_color: '#ffb100'
      });

      // 4. Register Base Addons
      await supabase.from('user_addons').upsert([
        { user_id: user.id, addon_id: 'netflix-node', enabled: true },
        { user_id: user.id, addon_id: 'hianime-core', enabled: true }
      ], { onConflict: 'user_id,addon_id' });

      await refreshProfile();
      navigate('/home');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 selection:bg-[#ffb100]/30 font-sans">
      <div className="absolute inset-0 bg-[#ffb100] opacity-[0.02] blur-[150px]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-[#0d0d0d] border border-white/5 rounded-[4rem] p-12 md:p-20 shadow-3xl relative overflow-hidden"
      >
        <div className="absolute top-10 right-10 opacity-[0.03]">
           <Sparkles size={200} className="text-[#ffb100]" />
        </div>

        <div className="space-y-12 relative z-10">
          <div className="space-y-4">
             <div className="flex items-center gap-3 text-[#ffb100]">
                <ShieldCheck size={24} className="animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.5em] italic">System Initialization</span>
             </div>
             <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-white leading-[0.9]">
               Finalize your <br/>
               <span className="text-[#ffb100]">Sekta Profile</span>
             </h1>
          </div>

          <form onSubmit={handleCompleteSetup} className="space-y-10">
            {/* Avatar Selector */}
            <div className="space-y-6">
              <div className="flex items-center gap-4 text-gray-500 font-black uppercase tracking-widest text-[10px] italic">
                <ImageIcon size={14} />
                <span>Select Anime Avatar</span>
              </div>
              <div className="flex flex-wrap gap-4">
                {avatars.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedAvatar(url)}
                    className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all p-1 ${
                      selectedAvatar === url ? 'border-[#ffb100] scale-110 shadow-2xl shadow-[#ffb100]/20' : 'border-transparent opacity-40 hover:opacity-100'
                    }`}
                  >
                    <img src={url} className="w-full h-full object-cover rounded-xl" alt="" />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="relative group">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-700 group-focus-within:text-[#ffb100] transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="w-full bg-black/40 border-2 border-white/5 focus:border-[#ffb100] rounded-2xl py-6 pl-16 pr-6 text-white text-sm font-black tracking-widest outline-none transition-all placeholder:text-gray-900"
                  placeholder="USERNAME ALIAS"
                  required
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-700 group-focus-within:text-[#ffb100] transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border-2 border-white/5 focus:border-[#ffb100] rounded-2xl py-6 pl-16 pr-6 text-white text-sm font-black tracking-widest outline-none transition-all placeholder:text-gray-900"
                  placeholder="SECRET PASSCODE"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-6 bg-red-500/10 border border-red-500/15 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center italic">
                {error}
              </div>
            )}

            <button
              disabled={isSubmitting}
              type="submit"
              className="w-full h-24 bg-[#ffb100] text-black rounded-3xl font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-[#ffb100]/20"
            >
              {isSubmitting ? <Loader2 className="w-8 h-8 animate-spin" /> : <>START SYNC <ArrowRight size={24} /></>}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
