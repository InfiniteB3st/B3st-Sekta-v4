import React, { useEffect, useState } from 'react';
import { jikanService, Anime } from '../services/jikan';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
import { AnimeCard } from '../components/AnimeCard';
import { Flame, Star, Play, ChevronRight, Info, Clock, TrendingUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [topAiring, setTopAiring] = useState<Anime[]>([]);
  const [mostPopular, setMostPopular] = useState<Anime[]>([]);
  const [continueWatching, setContinueWatching] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const [airing, popular] = await Promise.all([
          jikanService.getTopAiring(12),
          jikanService.getTopByPopularity(24)
        ]);
        setTopAiring(airing);
        setMostPopular(popular);

        if (user) {
          const { data } = await (supabase as any)
            .from('watch_history')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(12);
          if (data) setContinueWatching(data);
        } else {
          const localData = JSON.parse(localStorage.getItem('sekta_history') || '[]');
          setContinueWatching(localData.slice(0, 12));
        }
      } catch (err) {
        console.error('Home Feed Engine Fail:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [user]);

  useEffect(() => {
    if (topAiring.length === 0) return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % 5);
    }, 10000);
    return () => clearInterval(interval);
  }, [topAiring]);

  const currentHero = topAiring[heroIndex];

  return (
    <div className="bg-black min-h-screen text-white font-sans selection:bg-[#ffb100]/30 pb-32">
      <div className="max-w-[1700px] mx-auto space-y-24 px-6 md:px-12 pt-8 animate-in fade-in duration-1000">
        
        {/* 1:1 Spotlight Hero */}
        {currentHero && (
          <section className="relative h-[650px] w-full rounded-[4rem] overflow-hidden group shadow-3xl bg-[#0a0a0a] border border-white/5">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentHero.mal_id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                className="absolute inset-0"
              >
                <img 
                  src={currentHero.images.webp.large_image_url} 
                  className="w-full h-full object-cover grayscale-[0.05]" 
                  alt={currentHero.title} 
                />
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/60 to-transparent" />
                <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-black to-transparent" />
                
                <div className="absolute inset-y-0 left-0 flex flex-col justify-center px-12 md:px-24 max-w-4xl space-y-10">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#ffb100] px-3 py-1 rounded-full"><Flame size={12} className="text-black" /></div>
                    <span className="text-[11px] font-black uppercase tracking-[0.4em] text-[#ffb100] italic">Hot Release #{(heroIndex + 1)}</span>
                  </div>
                  
                  <div className="space-y-4">
                    <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-[0.85] text-white drop-shadow-3xl">
                      {currentHero.title}
                    </h1>
                    <p className="text-gray-400 text-lg font-medium line-clamp-3 leading-relaxed opacity-70 italic max-w-2xl">
                      {currentHero.synopsis}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <button 
                      onClick={() => navigate(`/watch/${currentHero.mal_id}`)}
                      className="bg-[#ffb100] text-black h-24 px-16 rounded-[2rem] flex items-center gap-4 group hover:scale-[1.05] transition-all shadow-2xl shadow-[#ffb100]/20"
                    >
                      <Play fill="currentColor" size={28} />
                      <span className="text-2xl font-black lowercase tracking-tighter italic">Watch Now</span>
                    </button>
                    <button 
                      onClick={() => navigate(`/anime/${currentHero.mal_id}`)}
                      className="bg-white/5 border border-white/10 h-24 px-12 rounded-[2rem] flex items-center gap-4 hover:bg-white/10 transition-all text-white"
                    >
                      <Info size={28} />
                      <span className="text-xl font-bold">Details</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="absolute bottom-16 right-24 hidden md:flex gap-4">
               {[0,1,2,3,4].map(idx => (
                 <button 
                  key={idx} 
                  onClick={() => setHeroIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-700 ${heroIndex === idx ? 'w-20 bg-[#ffb100]' : 'w-4 bg-white/20 hover:bg-white/40'}`}
                 />
               ))}
            </div>
          </section>
        )}

        {/* Continue Watching Sync */}
        {continueWatching.length > 0 && (
          <section className="space-y-12">
            <div className="flex items-center gap-6 border-l-8 border-[#ffb100] pl-10">
              <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Last <span className="text-[#ffb100]">Session</span></h2>
              <Clock size={32} className="text-[#ffb100] animate-pulse" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-8">
              {continueWatching.map((item) => (
                <Link 
                  key={item.anime_id} 
                  to={`/watch/${item.anime_id}?ep=${item.last_episode}`}
                  className="group relative aspect-[2.7/4] rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5"
                >
                  <img src={item.image_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-8 space-y-4">
                     <h4 className="text-xs font-black uppercase italic tracking-tight line-clamp-1">{item.anime_title}</h4>
                     <div className="flex items-center justify-between">
                       <span className="text-[9px] font-black text-[#ffb100] uppercase tracking-widest italic">EP {item.last_episode}</span>
                       <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-[#ffb100]" style={{ width: `${Math.min(100, (item.progress_ms / 1440000) * 100)}%` }} />
                       </div>
                     </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Side-by-Side Content Feed */}
        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-24">
          <div className="lg:col-span-3 space-y-32">
            
            <section className="space-y-14">
              <div className="flex items-center justify-between border-l-4 border-[#ffb100] pl-10">
                <h2 className="text-5xl font-black italic uppercase tracking-tighter leading-none">Global <span className="text-[#ffb100]">Network</span></h2>
                <Link to="/filter" className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-600 hover:text-[#ffb100] transition-all flex items-center gap-4 group">
                  Archive <ChevronRight size={18} className="group-hover:translate-x-2 transition-transform" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-8">
                {loading ? (
                  Array.from({ length: 15 }).map((_, i) => (
                    <div key={i} className="aspect-[2.7/4] bg-[#0a0a0a] animate-pulse rounded-[2.5rem]" />
                  ))
                ) : (
                  mostPopular.map((anime) => (
                    <AnimeCard key={anime.mal_id} anime={anime} />
                  ))
                )}
              </div>
            </section>

          </div>

          {/* Sidebar Feed Replica */}
          <aside className="hidden lg:block space-y-20">
             <section className="bg-[#0f0f0f] rounded-[4rem] border border-white/5 overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,1)]">
                <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                   <h3 className="text-2xl font-black italic uppercase tracking-tighter">Fast Airing</h3>
                   <TrendingUp size={24} className="text-[#ffb100] animate-bounce" />
                </div>
                <div className="p-6 space-y-2">
                   {topAiring.slice(0, 10).map((anime, i) => (
                     <Link key={anime.mal_id} to={`/anime/${anime.mal_id}`} className="flex items-center gap-6 p-6 rounded-[2.5rem] hover:bg-white/5 transition-all group">
                        <span className="text-5xl font-black italic text-gray-900 group-hover:text-[#ffb100]/20 transition-colors w-14 text-center">{i + 1}</span>
                        <div className="w-16 h-24 rounded-2xl overflow-hidden flex-shrink-0 border border-white/10 shadow-2xl">
                          <img src={anime.images.webp.large_image_url} alt="" className="w-full h-full object-cover transition-all group-hover:scale-110" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <h4 className="text-[10px] font-black italic uppercase tracking-tight line-clamp-2 leading-tight group-hover:text-[#ffb100] transition-all">{anime.title}</h4>
                          <div className="flex items-center gap-3">
                             <Star size={10} fill="currentColor" className="text-[#ffb100]" />
                             <span className="text-[10px] font-black text-gray-600 italic">{anime.score || '0.0'}</span>
                          </div>
                        </div>
                     </Link>
                   ))}
                </div>
             </section>
          </aside>
        </div>

      </div>
    </div>
  );
}
