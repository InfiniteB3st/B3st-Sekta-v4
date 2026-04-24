import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Anime } from '../services/jikan';
import { Play, Star, Mic, Subtitles } from 'lucide-react';
import { motion } from 'motion/react';

interface AnimeCardProps {
  anime: Anime;
  key?: any;
}

export function AnimeCard({ anime }: AnimeCardProps) {
  const navigate = useNavigate();

  const handleWatchNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/watch/${anime.mal_id}`);
  };

  return (
    <motion.div
      whileHover={{ y: -10 }}
      onClick={() => navigate(`/anime/${anime.mal_id}`)}
      className="relative flex flex-col gap-3 group cursor-pointer"
    >
      {/* Poster Container */}
      <div className="relative aspect-[2.7/4] rounded-[2rem] overflow-hidden shadow-2xl border-2 border-white/5 group-hover:border-primary/50 transition-all duration-500">
        <img
          src={anime.images.webp.large_image_url}
          alt={anime.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Sub/Dub Icons in corner */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
           <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
              <Subtitles size={10} className="text-primary" />
              <span className="text-[10px] font-black uppercase text-white/80">SUB</span>
           </div>
           <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
              <Mic size={10} className="text-primary" />
              <span className="text-[10px] font-black uppercase text-white/80">DUB</span>
           </div>
        </div>

        {/* Ep Count in corner */}
        <div className="absolute top-4 right-4 bg-primary text-black px-3 py-1.5 rounded-xl font-black text-[10px] uppercase shadow-xl z-20">
          EP {anime.episodes || '?'}
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <button 
            onClick={handleWatchNow}
            className="w-16 h-16 bg-primary text-black rounded-full flex items-center justify-center shadow-[0_0_30px_var(--primary)] hover:scale-110 active:scale-90 transition-all"
          >
            <Play fill="currentColor" size={24} />
          </button>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />
      </div>

      {/* Info */}
      <div className="space-y-1.5 px-1">
        <h3 className="font-black text-xs uppercase italic tracking-tight line-clamp-2 leading-tight group-hover:text-primary transition-colors">
          {anime.title}
        </h3>
        <div className="flex items-center justify-between opacity-40">
           <div className="flex items-center gap-2">
              <Star size={10} fill="currentColor" className="text-primary" />
              <span className="text-[10px] font-black">{anime.score || 'N/A'}</span>
           </div>
           <span className="text-[10px] font-black uppercase tracking-widest">{anime.type}</span>
        </div>
      </div>
    </motion.div>
  );
}
