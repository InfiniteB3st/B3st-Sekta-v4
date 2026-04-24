import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jikanService, Anime } from '../services/jikan';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
import { Star, Play, Loader2, ShieldCheck } from 'lucide-react';
import { EpisodeList } from '../components/EpisodeList';

type WatchStatus = 'Watching' | 'Plan to Watch' | 'Completed' | 'Dropped';

/**
 * HiAnime 1:1 AnimeDetails Engine
 * Features synchronized episode tracking, real metadata imports, and extension checks.
 */
export default function AnimeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [anime, setAnime] = useState<Anime | null>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<WatchStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [activeAddonsCount, setActiveAddonsCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchInit = async () => {
      try {
        if (!id) return;
        const [details, eps] = await Promise.all([
          jikanService.getAnimeById(Number(id)),
          jikanService.getEpisodes(Number(id))
        ]);
        setAnime(details);
        setEpisodes(eps);

        if (user) {
          // Sync Watch List Status from user_lists engine
          const { data } = await supabase
            .from('watch_data')
            .select('status')
            .eq('user_id', user.id)
            .eq('anime_id', Number(id))
            .maybeSingle();
          if (data) setStatus(data.status as WatchStatus);

          // Check Global Extension Infrastructure
          const { count } = await supabase
            .from('user_addons')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('enabled', true);
          setActiveAddonsCount(count);
        }
      } catch (err) {
        console.error('Core Sync Failure:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInit();
  }, [id, user]);

  const handleUpdateStatus = async (newStatus: WatchStatus) => {
    if (!user || !id || !anime) return;
    setSyncing(true);
    const { error } = await supabase
      .from('watch_data')
      .upsert({
        user_id: user.id,
        anime_id: Number(id),
        status: newStatus,
        anime_title: anime.title,
        image_url: anime.images.webp.large_image_url,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,anime_id' });

    if (!error) setStatus(newStatus);
    setSyncing(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
      <Loader2 className="w-16 h-16 text-primary animate-spin shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]" />
    </div>
  );

  if (!anime) return <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center text-white font-black uppercase tracking-widest italic">Node Not Found</div>;

  return (
    <div className="min-h-screen bg-[#0f0f0f] animate-in fade-in duration-700 pb-40 font-sans selection:bg-primary/30">
      
      {/* Dynamic Backdrop Architecture */}
      <div className="h-[75vh] w-full relative overflow-hidden">
        <img 
          src={anime.images.webp.large_image_url} 
          className="w-full h-full object-cover blur-[10px] opacity-20 scale-125" 
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/40 to-transparent" />
      </div>

      <div className="max-w-[1700px] mx-auto -mt-[55vh] relative z-20 px-6 md:px-12">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-16 md:gap-24">
          
          {/* Sidebar Metadata */}
          <div className="lg:col-span-3 space-y-12">
            <div className="w-full aspect-[2.7/4] rounded-[4rem] overflow-hidden shadow-[0_32px_128px_-16px_rgba(0,0,0,1)] border-2 border-white/5 relative group">
              <img src={anime.images.webp.large_image_url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={anime.title} />
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                 <Play className="w-24 h-24 text-black shadow-3xl bg-primary rounded-full p-6" />
              </div>
            </div>

            <div className="bg-surface rounded-[4rem] p-12 border border-white/5 space-y-10 shadow-3xl">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-primary">
                    <Star fill="currentColor" size={32} />
                    <span className="text-5xl font-black italic tracking-tighter leading-none">{anime.score || 'N/A'}</span>
                  </div>
                  <span className="bg-primary/10 text-primary px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-primary/20">#{anime.rank} Global</span>
               </div>
               
               <div className="space-y-5 pt-8 border-t border-white/5">
                  <div className="flex justify-between text-[11px] font-black uppercase text-gray-700 tracking-[0.2em] italic">
                     <span>Platform</span>
                     <span className="text-white">{anime.type}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-black uppercase text-gray-700 tracking-[0.2em] italic">
                     <span>Nodes</span>
                     <span className="text-white">{anime.episodes || '??'}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-black uppercase text-gray-700 tracking-[0.2em] italic">
                     <span>Status</span>
                     <span className="text-white">{anime.status}</span>
                  </div>
               </div>
            </div>
          </div>

          {/* Core Content Node */}
          <div className="lg:col-span-9 space-y-24">
             <div className="space-y-12">
                <div className="flex items-center gap-4 text-primary bg-primary/5 w-fit px-5 py-2 rounded-full border border-primary/10">
                   <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_var(--primary)]" />
                   <span className="text-[10px] font-black uppercase tracking-[0.6em] italic leading-none">Database Spotlight</span>
                </div>
                <h1 className="text-6xl md:text-9xl font-black italic uppercase tracking-tighter leading-[0.85] text-white drop-shadow-3xl">{anime.title}</h1>
                
                <div className="flex flex-wrap gap-6 pt-8">
                   {activeAddonsCount === 0 ? (
                     <div className="flex flex-col gap-6">
                        <button 
                          onClick={() => navigate('/addons')}
                          className="bg-red-500/10 border border-red-500/20 text-red-500 px-14 py-6 rounded-[2.5rem] font-black uppercase tracking-[0.4em] flex items-center gap-5 hover:bg-red-500 hover:text-white transition-all shadow-3xl shadow-red-500/10 group"
                        >
                          <ShieldCheck size={28} className="group-hover:rotate-12 transition-transform" />
                          Initialize Nodes
                        </button>
                        <p className="text-[10px] text-gray-700 font-black uppercase tracking-[0.3em] px-6 italic">Extension Bridge Off: Install streaming addons to enable playback.</p>
                     </div>
                   ) : (
                     <button 
                       onClick={() => navigate(`/watch/${anime.mal_id}`)}
                       className="bg-primary text-black px-14 py-6 rounded-[2.5rem] font-black uppercase tracking-[0.4em] flex items-center gap-5 hover:scale-[1.05] active:scale-[0.95] transition-all shadow-[0_20px_50px_-5px_rgba(var(--primary-rgb),0.4)]"
                     >
                       <Play fill="currentColor" size={28} />
                       Initialize Feed
                     </button>
                   )}
                   
                   <div className="flex items-center gap-3">
                     {(['Watching', 'Plan to Watch', 'Completed'] as WatchStatus[]).map(s => (
                       <button
                         key={s}
                         onClick={() => handleUpdateStatus(s)}
                         disabled={syncing}
                         className={`px-8 py-6 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all border-2 italic ${
                           status === s 
                             ? 'bg-white text-black border-white shadow-2xl' 
                             : 'bg-white/5 text-gray-500 border-transparent hover:bg-white/10 hover:text-white'
                         }`}
                       >
                         {syncing && status === s ? <Loader2 className="animate-spin w-4 h-4" /> : s}
                       </button>
                     ))}
                   </div>
                </div>

                <div className="pt-16 border-t border-white/5 max-w-4xl">
                  <p className="text-gray-400 text-2xl font-medium leading-[1.6] opacity-80 italic tracking-tight">
                    {anime.synopsis}
                  </p>
                </div>
             </div>

             {/* Synchronized Episode Engine */}
             <div className="pt-12">
               <EpisodeList 
                 episodes={episodes}
                 currentEpisode={0}
                 onEpisodeSelect={(epNum) => navigate(`/watch/${anime.mal_id}?ep=${epNum}`)}
               />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
