import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Search, User, Menu, Bell, LogOut, Settings as Gear, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Layout({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/filter?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const isAuthPage = location.pathname === '/auth' || location.pathname === '/setup';

  return (
    <div className="min-h-screen flex flex-col bg-[#0f0f0f] text-white">
      {/* Professional Sticky Header */}
      {!isAuthPage && (
        <header className="glass-header h-20 flex items-center shadow-xl">
          <div className="max-w-[1700px] w-full mx-auto px-6 md:px-12 flex items-center justify-between gap-12">
            <Link to="/home" className="shrink-0">
               <h1 className="logo-text">
                 <span className="logo-b3st">B3ST</span>
                 <span className="logo-sekta">SEKTA</span>
               </h1>
            </Link>

            {/* Clean Modern Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl relative group hidden sm:block">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-primary transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search anime..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-16 pr-6 text-sm font-bold tracking-widest focus:outline-none focus:border-primary/40 transition-all uppercase placeholder:text-gray-800"
              />
            </form>

            <div className="flex items-center gap-8 shrink-0">
              <nav className="hidden lg:flex items-center gap-8">
                 <Link to="/home" className="text-xs font-black uppercase tracking-widest text-white/40 hover:text-primary transition-all">Home</Link>
                 <Link to="/filter" className="text-xs font-black uppercase tracking-widest text-white/40 hover:text-primary transition-all">Filter</Link>
                 <Link to="/addons" className="text-xs font-black uppercase tracking-widest text-white/40 hover:text-primary transition-all">Extensions</Link>
                 {user?.email === 'wambuamaxwell696@gmail.com' && (
                   <Link to="/admin" className="text-xs font-black uppercase tracking-widest text-primary italic hover:scale-105 transition-all">Admin</Link>
                 )}
              </nav>

              <div className="flex items-center gap-6">
                <button className="p-2 text-gray-700 hover:text-primary transition-all relative">
                  <Bell size={20} />
                  <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-primary rounded-full" />
                </button>
                
                {user ? (
                  <Link 
                    to="/profile" 
                    className="w-10 h-10 rounded-xl overflow-hidden border border-white/5 hover:border-primary transition-all bg-surface flex items-center justify-center p-1"
                  >
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <User size={20} className="text-gray-700" />
                    )}
                  </Link>
                ) : (
                  <button 
                    onClick={() => navigate('/auth')}
                    className="hianime-btn-yellow text-[10px] py-2 px-6"
                  >
                    Login
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1700px] mx-auto pt-10">
        {children}
      </main>

      {/* HiAnime Visual Footer */}
      {!isAuthPage && (
        <footer className="mt-40 bg-surface border-t border-white/5 pt-24 pb-12 px-8">
          <div className="max-w-[1700px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-20">
            <div className="col-span-1 md:col-span-2 space-y-10">
              <Link to="/home" className="shrink-0 scale-125 origin-left inline-block">
                 <h1 className="logo-text">
                   <span className="logo-b3st">B3ST</span>
                   <span className="logo-sekta">SEKTA</span>
                 </h1>
              </Link>
              <p className="text-gray-500 text-sm font-medium leading-relaxed max-w-md italic">
                 Experience anime like never before in full 1080p HD. Join the largest community of Otakus in the Sekta.
              </p>
              <div className="flex flex-wrap gap-4">
                 <span className="bg-background border border-white/5 px-4 py-2 rounded-xl text-[10px] font-black uppercase text-gray-800">Version 4.0</span>
              </div>
            </div>
            
            <div className="space-y-10">
              <h4 className="text-xs font-black uppercase tracking-widest text-primary italic">Explore</h4>
              <ul className="space-y-5 text-sm font-bold text-gray-500">
                <li><Link to="/home" className="hover:text-white transition-all">Latest Anime</Link></li>
                <li><Link to="/filter" className="hover:text-white transition-all">Anime Filter</Link></li>
                <li><Link to="/addons" className="hover:text-white transition-all">Extensions</Link></li>
              </ul>
            </div>

            <div className="space-y-10">
              <h4 className="text-xs font-black uppercase tracking-widest text-primary italic">Support</h4>
              <ul className="space-y-5 text-sm font-bold text-gray-500">
                <li><Link to="/help" className="hover:text-white transition-all">Help Center</Link></li>
                <li><Link to="/dmca" className="hover:text-white transition-all">DMCA</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-all">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition-all">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="max-w-[1700px] mx-auto mt-24 pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 opacity-30">
             <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-800">
                <ShieldCheck className="w-4 h-4" />
                Community Safe Platform
             </div>
             <p className="text-[10px] font-black uppercase tracking-widest text-gray-800">
                InfiniteB3st Development © 2026
             </p>
          </div>
        </footer>
      )}
    </div>
  );
}
