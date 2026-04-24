import React, { useState } from 'react';
import { Play, Mic, Subtitles, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface Episode {
  mal_id: number;
  title: string;
}

interface EpisodeListProps {
  episodes: Episode[];
  currentEpisode: number;
  onEpisodeSelect: (ep: number) => void;
}

/**
 * HiAnime 1:1 Episode List Node
 * Features Jikan Titles and Range Pagination for 100+ series.
 */
export const EpisodeList: React.FC<EpisodeListProps> = ({ episodes, currentEpisode, onEpisodeSelect }) => {
  const [activeRange, setActiveRange] = useState(0); // 0 = 1-100, 1 = 101-200
  
  const rangeSize = 100;
  const numRanges = Math.ceil(episodes.length / rangeSize);
  const ranges = Array.from({ length: numRanges }, (_, i) => i);
  
  const visibleEpisodes = episodes.slice(activeRange * rangeSize, (activeRange + 1) * rangeSize);

  return (
    <section className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-l-8 border-primary pl-8">
        <div className="space-y-2">
          <h3 className="text-4xl font-black italic uppercase tracking-tighter text-white">
            Access <span className="text-primary italic">Nodes</span>
          </h3>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.4em]">
            Total Transmissions: {episodes.length}
          </p>
        </div>

        {/* RANGE SELECTOR DROPDOWN */}
        {numRanges > 1 && (
          <div className="relative group">
            <select 
              value={activeRange}
              onChange={(e) => setActiveRange(Number(e.target.value))}
              className="appearance-none bg-surface border-2 border-white/5 rounded-2xl py-4 pl-8 pr-16 text-[10px] font-black uppercase tracking-widest text-[#ffb100] outline-none cursor-pointer focus:border-primary transition-all hover:bg-white/5"
            >
              {ranges.map(r => (
                <option key={r} value={r}>
                  Range: {r * rangeSize + 1} - {Math.min((r + 1) * rangeSize, episodes.length)}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-primary pointer-events-none group-hover:scale-125 transition-transform" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 max-h-[800px] overflow-y-auto custom-scrollbar pr-4 pb-10">
        {visibleEpisodes.length > 0 ? (
          visibleEpisodes.map((ep) => (
            <button
              key={ep.mal_id}
              onClick={() => onEpisodeSelect(ep.mal_id)}
              title={ep.title || `Episode ${ep.mal_id}`}
              className={cn(
                "group relative p-4 rounded-xl border transition-all duration-300 text-left overflow-visible flex items-center gap-6 w-full",
                currentEpisode === ep.mal_id 
                  ? "bg-primary text-black border-primary shadow-[0_0_30px_rgba(255,177,0,0.3)] z-10"
                  : "bg-[#080808] border-white/5 hover:border-primary/30 text-white"
              )}
            >
              {/* HOVER TOOLTIP PROJECTOR */}
              <div className="absolute left-[-200px] top-1/2 -translate-y-1/2 w-44 bg-black/90 backdrop-blur-xl border border-white/10 p-4 rounded-xl opacity-0 translate-x-10 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 pointer-events-none z-[100] hidden lg:block shadow-3xl">
                 <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-1">Transmission Detail</p>
                 <p className="text-[11px] font-bold text-white leading-tight italic line-clamp-3">{ep.title || 'No metadata found'}</p>
                 <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[8px] text-gray-500 flex items-center gap-1"><Subtitles size={8}/> AI SYNC</span>
                    <span className="text-[8px] text-green-500 font-bold">READY</span>
                 </div>
              </div>

              <div className={cn(
                "w-12 h-12 flex-shrink-0 rounded-lg flex items-center justify-center font-black italic text-xl border-2 transition-colors",
                currentEpisode === ep.mal_id ? "bg-black/10 border-black/10" : "bg-black border-white/10 text-primary group-hover:border-primary/50"
              )}>
                {ep.mal_id < 10 ? `0${ep.mal_id}` : ep.mal_id}
              </div>
              
              <div className="flex-1 flex items-center justify-between min-w-0">
                <div className="space-y-0.5">
                  <h4 className="text-[14px] font-black italic uppercase tracking-tight line-clamp-1">
                    {ep.title || `Transmission ${ep.mal_id}`}
                  </h4>
                  <div className="flex items-center gap-4">
                     <span className={cn("text-[8px] font-bold uppercase tracking-widest", currentEpisode === ep.mal_id ? "text-black/60" : "text-gray-600")}>
                        Signal: Verified
                     </span>
                     <div className="flex items-center gap-2">
                        <div className={cn("w-1.5 h-1.5 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]", currentEpisode === ep.mal_id ? "bg-black animate-pulse" : "bg-green-500")} />
                        <span className={cn("text-[7px] font-black uppercase tracking-widest", currentEpisode === ep.mal_id ? "text-black/40" : "text-gray-800")}>Sync Active</span>
                     </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 opacity-40 group-hover:opacity-100 transition-opacity">
                   <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-[8px] font-black uppercase tracking-widest flex items-center gap-1 px-2 py-1 rounded bg-white/5 border border-white/5",
                      currentEpisode === ep.mal_id ? "text-black/70 border-black/20" : "text-gray-600"
                    )}>
                      <Subtitles size={10} /> AI_SYNC
                    </span>
                    <span className={cn(
                      "text-[8px] font-black uppercase tracking-widest flex items-center gap-1 px-2 py-1 rounded bg-white/5 border border-white/5",
                      currentEpisode === ep.mal_id ? "text-black/70 border-black/20" : "text-gray-600"
                    )}>
                      <Mic size={10} /> DIRECT
                    </span>
                  </div>
                  <Play 
                    className={cn(
                      "transition-all transform group-hover:translate-x-1",
                      currentEpisode === ep.mal_id ? "scale-110" : "scale-100"
                    )} 
                    fill="currentColor" 
                    size={16} 
                  />
                </div>
              </div>

              {/* TOOLTIP STYLE HOVER ELEMENT */}
              <div className="absolute top-0 right-0 h-full w-2 bg-primary transform scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-500 opacity-20" />
              
              {currentEpisode === ep.mal_id && (
                <motion.div 
                  layoutId="active-ep"
                  className="absolute inset-0 bg-white/10 pointer-events-none"
                  initial={false}
                />
              )}
            </button>
          ))
        ) : (
          <div className="col-span-full py-20 text-center text-gray-700 font-black uppercase tracking-widest text-[10px] italic">
             Connecting to Jikan Nodes...
          </div>
        )}
      </div>
    </section>
  );
};
