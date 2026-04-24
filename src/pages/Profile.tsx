import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Palette, LogOut, Save, Camera, ShieldCheck, Mail, Database, RefreshCw, Loader2, Lock, Chrome, Link as LinkIcon, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSupabase, updateUserEmail, updateUserPassword, updateUsername, uploadAvatar } from '../services/supabaseClient';
import ListManager from '../components/ListManager';

const ACCENT_COLORS = [
  '#ffb11b', // HiAnime Yellow
  '#ff4757', // Coral Red
  '#2ed573', // Emerald Green
  '#1e90ff', // Dodger Blue
  '#a4b0be', // Gray
  '#9b59b6', // Amethyst
  '#ffffff', // Pure White
];

export default function Profile() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [newUsername, setNewUsername] = useState(profile?.username || '');
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (profile) setNewUsername(profile.username);
    if (user) setNewEmail(user.email || '');
  }, [profile, user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // KERNEL VALIDATION
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Kernel Error: Identity file exceeds 2MB limit.' });
      return;
    }
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Kernel Error: Invalid identity format (PNG/JPG/WebP only).' });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    // KERNEL WATCHDOG: 10s Timeout
    const timeoutId = setTimeout(() => {
        setIsUploading(false);
        setMessage({ type: 'error', text: 'Kernel Timeout: Verify Storage RLS SQL configuration.' });
    }, 10000);

    try {
      await uploadAvatar(user.id, file);
      clearTimeout(timeoutId);
      await refreshProfile();
      setMessage({ type: 'success', text: 'Node Identity synchronized to kernel storage.' });
    } catch (err: any) {
      clearTimeout(timeoutId);
      setMessage({ type: 'error', text: err.message || 'Fatal Kernel Sync Exception.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateAccent = async (color: string) => {
    if (!user) return;
    const { error } = await getSupabase()
      .from('profiles')
      .update({ accent_color: color, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    
    if (!error) {
      await refreshProfile();
      document.documentElement.style.setProperty('--accent-color', color);
      document.documentElement.style.setProperty('--primary', color);
    }
  };

  const handleIdentityUpdate = async () => {
    if (!user || !newUsername) return;
    setIsSaving(true);
    setMessage(null);

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
        setIsSaving(false);
        setMessage({ type: 'error', text: 'Kernel Timeout: Database Unreachable.' });
        abortController.abort();
    }, 10000);

    try {
      await updateUsername(user.id, newUsername);
      clearTimeout(timeoutId);
      await refreshProfile();
      setMessage({ type: 'success', text: 'Identity updated successfully.' });
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') return;
      setMessage({ type: 'error', text: err.message || 'Fatal Database Exception.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSecurityUpdate = async (type: 'email' | 'password') => {
    if (!user) return;
    setIsSaving(true);
    setMessage(null);
    try {
      if (type === 'email') {
        await updateUserEmail(newEmail);
        setMessage({ type: 'success', text: 'Email update initialized. Check your inbox.' });
      } else {
        await updateUserPassword(newPassword);
        setMessage({ type: 'success', text: 'Password updated successfully.' });
        setNewPassword('');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const linkGoogle = async () => {
    try {
      const { error } = await getSupabase().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/profile' }
      });
      if (error) throw error;
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const tabs = [
    { id: 'profile', icon: User, label: 'Identity' },
    { id: 'security', icon: Lock, label: 'Security' },
    { id: 'appearance', icon: Palette, label: 'Visuals' },
    { id: 'lists', icon: Database, label: 'Lists' },
  ];

  return (
    <div className="min-h-screen pt-32 pb-40 px-6 md:px-12 bg-[#0f0f0f] animate-in fade-in duration-1000">
      <div className="max-w-[1500px] mx-auto space-y-20">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 border-b border-white/5 pb-16">
          <div className="space-y-6">
             <div className="flex items-center gap-4 text-primary">
                <User className="w-8 h-8" />
                <span className="text-[10px] font-black uppercase tracking-[0.8em] text-gray-500">Account Settings</span>
             </div>
             <h1 className="text-8xl font-black italic uppercase tracking-tighter text-white">USER_PROFILE</h1>
          </div>
          <div className="bg-white/5 border border-white/10 px-10 py-4 rounded-3xl flex items-center gap-4">
             <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20">
                <User size={20} className="text-primary" />
             </div>
             <div className="space-y-1">
                <span className="block text-[8px] font-black text-gray-700 uppercase tracking-widest">Active_Session</span>
                <span className="block text-xs font-bold text-white uppercase italic">{profile?.username}</span>
             </div>
          </div>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-20">
          {/* Navigation Pillar */}
          <div className="space-y-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full group relative flex items-center gap-8 p-10 rounded-[3rem] transition-all border-2 ${
                  activeTab === tab.id 
                    ? 'bg-primary border-primary text-black shadow-[0_20px_50px_rgba(var(--primary-rgb),0.3)] scale-[1.05]' 
                    : 'bg-[#1a1a1a] border-white/5 text-gray-600 hover:bg-white/5 hover:text-white'
                }`}
              >
                <tab.icon className={`w-8 h-8 ${activeTab === tab.id ? 'text-black' : 'text-primary'}`} />
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">{tab.label}</span>
              </button>
            ))}

            <button
              onClick={() => signOut()}
              className="w-full mt-12 bg-red-500/10 border-2 border-red-500/20 text-red-500 p-10 rounded-[3rem] text-[10px] font-black uppercase tracking-[0.4em] hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-4"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>

          {/* Configuration Module */}
          <div className="lg:col-span-3">
             <div className="bg-[#1a1a1a] border-2 border-white/5 rounded-[4rem] p-16 md:p-24 relative overflow-hidden shadow-3xl">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[200px] rounded-full -mr-[300px] -mt-[300px]" />
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="relative z-10"
                  >
                    {activeTab === 'profile' && (
                      <div className="space-y-16">
                        <div className="flex flex-col md:flex-row items-center gap-16">
                           <div className="relative group">
                              <label className="cursor-pointer">
                                <div className="w-48 h-48 rounded-[3.5rem] bg-[#0f0f0f] border-8 border-white/5 flex items-center justify-center overflow-hidden shadow-3xl relative">
                                  {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
                                  ) : (
                                    <User className="w-20 h-20 text-primary/10" />
                                  )}
                                  <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                     {isUploading ? <Loader2 className="animate-spin text-black" size={40} /> : <Camera className="w-10 h-10 text-black shadow-2xl" />}
                                  </div>
                                </div>
                                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploading} />
                              </label>
                           </div>
                           <div className="flex-1 space-y-4">
                              <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Edit Identity</h2>
                              <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest max-w-sm leading-relaxed">
                                 Upload a custom avatar from your device to identify your node in the Sekta.
                              </p>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-12 border-t border-white/5">
                           <div className="space-y-4">
                              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-700 ml-4">Username</label>
                              <div className="relative">
                                <User className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-800" />
                                <input 
                                  type="text" 
                                  value={newUsername}
                                  onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                                  className="w-full bg-[#0f0f0f] border-2 border-white/5 focus:border-primary px-20 py-8 rounded-[2.5rem] text-sm font-black text-white tracking-widest outline-none transition-all uppercase"
                                />
                              </div>
                           </div>
                           <div className="space-y-4">
                              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-700 ml-4">Email Address</label>
                              <div className="relative">
                                <Mail className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-800" />
                                <input 
                                  disabled
                                  type="email" 
                                  value={user?.email || ''}
                                  className="w-full bg-[#0f0f0f] border-2 border-white/5 px-20 py-8 rounded-[2.5rem] text-sm font-black text-white/30 tracking-widest outline-none"
                                />
                              </div>
                           </div>
                        </div>
                        
                        {message && (
                          <div className={`p-6 rounded-2xl flex items-center gap-4 border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                            {message.type === 'success' ? <ShieldCheck size={18} /> : <AlertTriangle size={18} />}
                            <span className="text-[10px] font-black uppercase tracking-widest">{message.text}</span>
                          </div>
                        )}

                        <button 
                          onClick={handleIdentityUpdate}
                          disabled={isSaving || newUsername === profile?.username}
                          className="w-full bg-primary text-black py-8 rounded-[2.5rem] font-black uppercase tracking-[0.6em] flex items-center justify-center gap-6 hover:scale-105 active:scale-95 transition-all shadow-3xl disabled:opacity-20 mt-12"
                        >
                           {isSaving ? <RefreshCw className="animate-spin" size={24} /> : <>Save Changes <Save size={24} /></>}
                        </button>
                      </div>
                    )}

                    {activeTab === 'security' && (
                      <div className="space-y-16">
                        <div className="space-y-4">
                           <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Security Protocols</h2>
                           <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest leading-loose">
                             Update your credentials and link external identity providers.
                           </p>
                        </div>

                        {message && (
                          <div className={`p-6 rounded-2xl flex items-center gap-4 border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                            {message.type === 'success' ? <ShieldCheck size={18} /> : <AlertTriangle size={18} />}
                            <span className="text-[10px] font-black uppercase tracking-widest">{message.text}</span>
                          </div>
                        )}

                        <div className="space-y-12">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-4">
                               <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-700 ml-4">Update Email</label>
                               <div className="flex gap-4">
                                 <input 
                                   type="email" 
                                   value={newEmail}
                                   onChange={(e) => setNewEmail(e.target.value)}
                                   className="flex-1 bg-[#0f0f0f] border-2 border-white/5 focus:border-primary px-20 py-8 rounded-[2.5rem] text-sm font-black text-white tracking-widest outline-none transition-all"
                                 />
                                 <button 
                                   onClick={() => handleSecurityUpdate('email')}
                                   className="bg-white/5 hover:bg-white/10 px-8 rounded-[1.5rem] transition-all"
                                 >
                                   <Save size={18} className="text-primary" />
                                 </button>
                               </div>
                            </div>
                            <div className="space-y-4">
                               <label className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-700 ml-4">Set Password</label>
                               <div className="flex gap-4">
                                 <input 
                                   type="password" 
                                   placeholder="NEW_PASSCODE"
                                   value={newPassword}
                                   onChange={(e) => setNewPassword(e.target.value)}
                                   className="flex-1 bg-[#0f0f0f] border-2 border-white/5 focus:border-primary px-20 py-8 rounded-[2.5rem] text-sm font-black text-white tracking-widest outline-none transition-all"
                                 />
                                 <button 
                                   onClick={() => handleSecurityUpdate('password')}
                                   className="bg-white/5 hover:bg-white/10 px-8 rounded-[1.5rem] transition-all"
                                 >
                                   <Save size={18} className="text-primary" />
                                 </button>
                               </div>
                            </div>
                          </div>

                          <div className="pt-12 border-t border-white/5 space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-700 ml-4">OAuth Identity Bridges</h4>
                            <div className="flex flex-wrap gap-4">
                               <button 
                                 onClick={linkGoogle}
                                 className="bg-white text-black px-10 py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center gap-4 hover:scale-105 active:scale-95 transition-all shadow-2xl"
                               >
                                 <Chrome size={18} className="text-[#4285F4]" />
                                 Link Google Account
                               </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'appearance' && (
                      <div className="space-y-20">
                        <div className="space-y-4">
                           <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">ACCENT_COLOR</h2>
                           <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest leading-loose">
                             Customize your visual experience. This color will be applied across all interactive elements.
                           </p>
                        </div>
                        
                        <div className="grid grid-cols-4 md:grid-cols-7 gap-8">
                          {ACCENT_COLORS.map(color => (
                            <button
                              key={color}
                              onClick={() => handleUpdateAccent(color)}
                              className={`w-full aspect-square rounded-[2rem] transition-all relative overflow-hidden group shadow-2xl ${
                                profile?.accent_color === color 
                                  ? 'border-8 border-white ring-8 ring-primary/20 scale-110' 
                                  : 'opacity-20 hover:opacity-100 hover:scale-[1.08] border-4 border-transparent'
                              }`}
                              style={{ backgroundColor: color }}
                            >
                               {profile?.accent_color === color && (
                                 <div className="absolute inset-0 flex items-center justify-center">
                                    <Save size={24} className="text-white drop-shadow-2xl animate-pulse" />
                                 </div>
                               )}
                            </button>
                          ))}
                        </div>

                        <div className="p-16 bg-[#0f0f0f] border border-white/5 rounded-[3.5rem] flex flex-col md:flex-row items-center justify-between gap-12 group">
                           <div className="space-y-4 text-center md:text-left">
                              <h4 className="text-white font-black uppercase text-4xl italic tracking-tighter">
                                B3ST <span className="text-primary italic transition-all duration-700">SEKTA</span>
                              </h4>
                              <p className="text-[10px] font-black text-gray-800 uppercase tracking-[0.4em] italic underline decoration-primary underline-offset-8">Interface v.4.0</p>
                           </div>
                           <Palette className="text-primary w-20 h-20 shadow-2xl opacity-20 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    )}

                    {activeTab === 'lists' && (
                      <ListManager />
                    )}
                  </motion.div>
                </AnimatePresence>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
