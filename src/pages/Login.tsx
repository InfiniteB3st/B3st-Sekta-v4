import React, { useState, useEffect } from 'react';
import { getSupabase, signInWithGoogle } from '../services/supabaseClient';
import { Mail, Lock, LogIn, Chrome, ShieldAlert, Zap, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // CRITICAL FIX: Direct Redirect to production blueprint
  const PRODUCTION_URL = `${window.location.origin}/home`;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      if (isSignUp) {
        const { data, error: signupError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { 
            emailRedirectTo: PRODUCTION_URL,
            data: { username: username.toLowerCase().replace(/\s/g, '') }
          } 
        });
        if (signupError) throw signupError;
        
        // IMMEDIATE PROFILE PROVISIONING
        if (data.user) {
          const { error: profileError } = await (supabase as any).from('profiles').upsert({
            id: data.user.id,
            username: username.toLowerCase().replace(/\s/g, ''),
            email: email,
            avatar_url: 'https://i.imgur.com/Heuy9Y8.png',
            accent_color: '#ffb100',
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
          if (profileError) console.error('Immediate Profile Provisioning failed:', profileError);
        }
        setError("Account initialized. Check your email for verification.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (email === 'wambuamaxwell696@gmail.com') navigate('/admin');
        else navigate('/home');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      console.log("INITIATING AUTH BRIDGE TO:", window.location.origin);
      await signInWithGoogle(window.location.origin);
    } catch (err: any) {
      setError(`HANDSHAKE_ERROR: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center p-6 z-[9999] font-sans selection:bg-[#ffb100]/30 overflow-y-auto">
      <div className="absolute inset-0 bg-[#ffb100] opacity-[0.03] blur-[150px] animate-pulse" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="w-full max-w-md bg-[#111] rounded-[3.5rem] border border-white/5 shadow-[0_32px_128px_-16px_rgba(0,0,0,1)] overflow-hidden relative"
      >
        <div className="p-12 space-y-12">
          {/* Logo Node */}
          <div className="text-center space-y-4">
            <h1 className="logo-text scale-125 justify-center flex items-center font-black leading-none gap-1">
              <span className="text-white">B3ST</span>
              <span className="text-[#ffb100]">SEKTA</span>
            </h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.4em] italic opacity-80 flex items-center justify-center gap-2">
              <Zap size={10} className="text-[#ffb100]" /> Secure Sync Protocol v3.0
            </p>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-6">
            <div className="space-y-4">
              {isSignUp && (
                <div className="relative group">
                  <User className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-[#ffb100] transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="USERNAME"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-black/40 border-2 border-white/5 rounded-2xl py-6 pl-16 pr-6 text-xs font-black tracking-widest focus:outline-none focus:border-[#ffb100] transition-all text-white placeholder:text-gray-800"
                    required={isSignUp}
                  />
                </div>
              )}
              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-[#ffb100] transition-colors" size={18} />
                <input 
                  type="email" 
                  placeholder="IDENTITY"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/40 border-2 border-white/5 rounded-2xl py-6 pl-16 pr-6 text-xs font-black tracking-widest focus:outline-none focus:border-[#ffb100] transition-all text-white placeholder:text-gray-800"
                  required
                />
              </div>
              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-[#ffb100] transition-colors" size={18} />
                <input 
                  type="password" 
                  placeholder="PASSCODE"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border-2 border-white/5 rounded-2xl py-6 pl-16 pr-6 text-xs font-black tracking-widest focus:outline-none focus:border-[#ffb100] transition-all text-white placeholder:text-gray-800"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500">
                 <ShieldAlert size={16} className="shrink-0" />
                 <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed">
                   Sync Failed: {error}
                 </p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-20 bg-[#ffb100] text-black font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-2xl shadow-[#ffb100]/20"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="text-[12px] font-black">{isSignUp ? 'INITIALIZE MEMBER' : 'START SYNC'}</span>
                  <LogIn size={20} />
                </>
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <div className="relative flex justify-center text-[9px]"><span className="bg-[#111] px-4 text-gray-600 font-bold uppercase tracking-widest italic">Bridged OAuth Gateway</span></div>
          </div>

          <button 
            type="button"
            onClick={handleGoogleLogin}
            className="w-full bg-white text-black h-20 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-gray-100 transition-all active:scale-[0.98] shadow-2xl"
          >
            <Chrome size={22} className="text-[#4285F4]" />
            Continue With Google
          </button>

          <div className="text-center pt-2">
            <button 
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
            >
              {isSignUp ? 'Already have access? Sign In' : 'New to Sekta? Initialize Profile'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
