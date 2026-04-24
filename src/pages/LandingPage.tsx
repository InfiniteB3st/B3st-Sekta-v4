import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, Play } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { jikanService } from '../services/jikan';
import { getSupabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const [search, setSearch] = useState('');
  const [heroAnime, setHeroAnime] = useState<any>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchHero = async () => {
      try {
        const supabase = getSupabase();
        if (user && supabase) {
          const { data: history } = await (supabase as any)
            .from('watch_history')
            .select('anime_id')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (history) {
            const anime = await jikanService.getAnimeById(history.anime_id);
            setHeroAnime(anime);
          } else {
            const anime = await jikanService.getAnimeById(52299); 
            setHeroAnime(anime);
          }
        } else {
          const randomIds = [5114, 11061, 38524, 40028];
          const randomId = randomIds[Math.floor(Math.random() * randomIds.length)];
          const anime = await jikanService.getAnimeById(randomId);
          setHeroAnime(anime);
        }
      } catch (err) {
        console.error('Landing Discovery Failure:', err);
      }
    };
    fetchHero();
    document.title = "B3st Sekta";
  }, [user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/filter?q=${encodeURIComponent(search)}`);
  };

  return (
    <div className="relative min-h-screen bg-black flex flex-col items-center justify-center overflow-hidden selection:bg-primary/30">
      {/* Cinematic Pulse Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent z-10" />
        {heroAnime && (
          <img 
            src={heroAnime.images.webp.large_image_url} 
            className="w-full h-full object-cover opacity-40 blur-xl scale-150 animate-pulse-slow"
            alt=""
          />
        )}
      </div>

      <header className="relative z-50 flex flex-col items-center gap-20 p-12 w-full max-w-4xl">
        <Link to="/home" className="logo-text text-8xl md:text-[10rem] flex items-center justify-center gap-6 hover:scale-105 transition-all">
          <span className="font-black italic text-white uppercase tracking-tighter">B3st</span>
          <span className="font-black italic text-primary uppercase tracking-tighter">Sekta</span>
        </Link>

        <div className="w-full space-y-12">
          <form onSubmit={handleSearch} className="relative group">
            <Search className="absolute left-10 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-primary transition-colors" size={32} />
            <input 
              type="text"
              placeholder="Search anime database..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0a0a0a]/80 backdrop-blur-3xl border-2 border-white/5 rounded-[50px] py-10 pl-24 pr-12 focus:outline-none focus:ring-8 focus:ring-primary/10 focus:border-primary transition-all text-2xl font-black italic text-white placeholder:text-gray-900 shadow-2xl"
            />
            <button type="submit" className="absolute right-8 top-1/2 -translate-y-1/2 p-5 bg-primary text-black rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all">
               <ChevronRight size={32} strokeWidth={4} />
            </button>
          </form>

          <div className="flex justify-center">
            <button 
              onClick={() => navigate('/home')}
              className="bg-primary text-black px-24 py-8 rounded-[3rem] font-black italic text-xl uppercase tracking-[0.4em] flex items-center gap-6 hover:scale-110 active:scale-95 transition-all shadow-[0_30px_80px_rgba(var(--primary-rgb),0.5)]"
            >
              ENTER SITE
              <Play fill="currentColor" size={24} />
            </button>
          </div>
        </div>
      </header>
    </div>
  );
}
