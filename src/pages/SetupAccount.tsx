import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, ShieldCheck, ArrowRight, Loader2, Lock, Sparkles, Image as ImageIcon, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSupabase, syncProfile, uploadAvatar } from '../services/supabaseClient';
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
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.username) {
      navigate('/home');
    }
  }, [profile, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Kernel Error: File exceeds 2MB limit.');
        return;
      }
      const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Kernel Error: Invalid format (PNG/JPG/WebP only).');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleCompleteSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!avatarFile) {
        setError('Identity Incomplete: Node requires a profile visual.');
        return;
    }

    if (username.length < 3) {
      setError('Identity Linkage Error: Username too short.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // KERNEL WATCHDOG: 10s Safety Timeout
    const timeoutId = setTimeout(() => {
        setIsSubmitting(false);
        setError('Kernel Timeout: Connection rejected by database. Verify Storage RLS SQL.');
    }, 10000);

    try {
      const supabase = getSupabase();
      
      // 1. Alias Collision Check
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (existingUser) {
        clearTimeout(timeoutId);
        throw new Error('Sync Conflict: Alias already bound to another node.');
      }

      // 2. Storage Sync (Uses Hierarchical Path)
      const finalAvatarUrl = await uploadAvatar(user.id, avatarFile);

      // 3. Auth Credential Stabilization
      if (password) {
        const { error: authError } = await supabase.auth.updateUser({ password });
        if (authError) throw authError;
      }

      // 4. Record Finalization
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username,
          email: user.email,
          avatar_url: finalAvatarUrl,
          accent_color: '#ffb100',
          updated_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      // 5. Node Addon Registration
      await supabase.from('user_addons').upsert([
        { user_id: user.id, addon_id: 'netflix-node', enabled: true },
        { user_id: user.id, addon_id: 'hianime-core', enabled: true }
      ], { onConflict: 'user_id,addon_id' });

      clearTimeout(timeoutId);
      await refreshProfile();
      navigate('/home');
    } catch (err: any) {
      clearTimeout(timeoutId);
      setError(err.message || 'Fatal Kernel Exception.');
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
                <span className="text-[10px] font-black uppercase tracking-[0.5em] italic">Kernel Authorization</span>
             </div>
             <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-white leading-[0.9]">
               Initialize your <br/>
               <span className="text-[#ffb100]">Node Access</span>
             </h1>
          </div>

          <form onSubmit={handleCompleteSetup} className="space-y-10">
            {/* Avatar Selector */}
            <div className="flex flex-col md:flex-row items-center gap-10">
               <label className="cursor-pointer group relative">
                  <div className="w-32 h-32 rounded-[2.5rem] bg-black border-2 border-white/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-[#ffb100] shadow-2xl relative">
                    {avatarPreview ? (
                      <img src={avatarPreview} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <ImageIcon size={32} className="text-gray-800" />
                        <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest">Required</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-[#ffb100]/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                       <Camera size={24} className="text-black" />
                    </div>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
               </label>
               <div className="flex-1 space-y-2">
                  <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Identity Core</h3>
                  <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest max-w-xs leading-relaxed">
                    Upload a local identity file (PNG/JPG) to enable node visualization.
                  </p>
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
