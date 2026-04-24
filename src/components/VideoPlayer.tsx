import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Settings, 
  SkipForward, ChevronLeft, ChevronRight, Layout, HardDrive,
  Monitor, Subtitles, Mic, RotateCcw, RotateCw, Palette, Type, Globe,
  Activity, Zap, Shield, Info, Clock, Languages
} from 'lucide-react';
import { cn } from '../lib/utils';
import { AddonResolver, AddonSource, StreamLink } from '../services/AddonResolver';
import { syncWatchHistory, supabase } from '../services/supabaseClient';
import { EpisodeList } from './EpisodeList';
import { jikanService } from '../services/jikan';

interface VideoPlayerProps {
  animeId: number;
  animeTitle: string;
  imageUrl: string;
  episode: number;
  userId: string | null;
  onEpisodeChange: (ep: number) => void;
  onBack: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  animeId, animeTitle, imageUrl, episode: currentEpisode, userId, onEpisodeChange, onBack 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); 
  const [duration, setDuration] = useState(1440);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isTheater, setIsTheater] = useState(localStorage.getItem('sekta_theater') === 'true');
  const [showNextOverlay, setShowNextOverlay] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Advanced Player State
  const [language, setLanguage] = useState<'EN' | 'JP'>( (localStorage.getItem('sekta_lang') as any) || 'EN');
  const [jumpTime, setJumpTime] = useState(10);
  const [subsEnabled, setSubsEnabled] = useState(true);
  const [subOffset, setSubOffset] = useState(0); // AI Subtitle Sync
  const [subtitleSize, setSubtitleSize] = useState(100);
  
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [addons, setAddons] = useState<AddonSource[]>([]);
  const [activeAddon, setActiveAddon] = useState<string | null>(null);
  const [links, setLinks] = useState<StreamLink[]>([]);
  const [activeLink, setActiveLink] = useState<StreamLink | null>(null);
  const [loadingLinks, setLoadingLinks] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const syncTimerRef = useRef<number>(0);

  useEffect(() => {
    localStorage.setItem('sekta_theater', String(isTheater));
  }, [isTheater]);

  useEffect(() => {
    localStorage.setItem('sekta_lang', language);
  }, [language]);

  useEffect(() => {
    jikanService.getEpisodes(animeId).then(setEpisodes);
  }, [animeId, language]);

  useEffect(() => {
    AddonResolver.getEnabledAddons(userId || 'guest').then(list => {
      setAddons(list);
      if (list.length > 0) setActiveAddon(list[0].id);
    });
  }, [userId]);

  useEffect(() => {
    if (activeAddon) {
      setLoadingLinks(true);
      AddonResolver.scrapeLinks(activeAddon, animeId, currentEpisode).then(res => {
        setLinks(res);
        if (res.length > 0) setActiveLink(res[0]);
        setLoadingLinks(false);
      });
    }
  }, [activeAddon, animeId, currentEpisode]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const dur = videoRef.current.duration || 1440;
      setCurrentTime(current);
      setDuration(dur);
      setProgress((current / dur) * 100);

      if (dur - current <= 120 && !showNextOverlay) setShowNextOverlay(true);

      syncTimerRef.current += 1;
      if (syncTimerRef.current >= 300) { // Every ~10s of playback
        syncTimerRef.current = 0;
        syncWatchHistory({
          user_id: userId,
          anime_id: animeId,
          anime_title: animeTitle,
          episode_id: currentEpisode,
          progress_ms: current * 1000,
          image_url: imageUrl,
          status: 'Watching'
        });
      }
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const rs = Math.floor(s % 60);
    return `${m}:${rs.toString().padStart(2, '0')}`;
  };

  const jump = (direction: 'back' | 'forward') => {
    if (videoRef.current) {
      const next = direction === 'forward' ? Math.min(videoRef.current.currentTime + jumpTime, videoRef.current.duration) : Math.max(videoRef.current.currentTime - jumpTime, 0);
      videoRef.current.currentTime = next;
    }
  };

  return (
    <div ref={containerRef} className={cn("w-full bg-black min-h-screen text-white select-none", isTheater ? "fixed inset-0 z-[100]" : "space-y-20 p-6 md:p-12 lg:p-20")}>
      <div className={cn("bg-[#050505] transition-all duration-700 relative overflow-hidden group/player", isTheater ? "w-full h-full" : "rounded-[4rem] aspect-video shadow-4xl border-4 border-white/5 mx-auto max-w-7xl")}>
        
        {/* NATIVE VIDEO CORE */}
        <video 
          ref={videoRef}
          src={activeLink?.url}
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onClick={togglePlay}
          onEnded={() => setShowNextOverlay(true)}
        />

        {/* LOADING SHIMMER */}
        <AnimatePresence>
          {loadingLinks && (
            <motion.div exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-3xl z-50 flex flex-col items-center justify-center gap-8">
               <div className="relative">
                  <Activity size={80} className="text-primary animate-pulse" />
                  <div className="absolute inset-0 border-t-4 border-primary rounded-full animate-spin" />
               </div>
               <div className="text-center space-y-2">
                 <h4 className="text-2xl font-black italic uppercase tracking-tighter">Scraping Multi-Links</h4>
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-700">Verifying Node Integrity • Latency Check</p>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SYNCED AI SUBTITLES DISPLAY */}
        <AnimatePresence>
          {subsEnabled && (
            <motion.div 
               style={{ transform: `translateY(${-40}px) scale(${subtitleSize/100})` }}
               className="absolute bottom-32 inset-x-0 flex justify-center pointer-events-none z-40"
            >
              <div className="bg-black/60 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/10 shadow-2xl">
                <p className="text-white font-black uppercase tracking-widest text-lg drop-shadow-lg text-center">
                  [ AI Subtitle Feed Layer - Offset: {(subOffset).toFixed(1)}s ]
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PRO PLAYER HUD */}
        <div className="absolute inset-x-0 bottom-0 p-12 pt-32 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col gap-10 opacity-0 group-hover/player:opacity-100 transition-opacity duration-500 z-50">
          
          {/* Progress Architecture */}
          <div className="relative h-2 w-full bg-white/5 rounded-full cursor-pointer overflow-hidden group/bar" onClick={(e) => {
             const rect = e.currentTarget.getBoundingClientRect();
             const p = (e.clientX - rect.left) / rect.width;
             if (videoRef.current) videoRef.current.currentTime = p * videoRef.current.duration;
          }}>
              <div className="h-full bg-primary shadow-[0_0_30px_var(--primary)] relative" style={{ width: `${progress}%` }}>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-2xl scale-0 group-hover/bar:scale-100 transition-transform" />
              </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-12">
              <button onClick={togglePlay} className="text-white hover:text-primary transition-all active:scale-90 bg-white/5 p-4 rounded-full border border-white/5">
                {isPlaying ? <Pause fill="currentColor" size={32} /> : <Play fill="currentColor" size={32} />}
              </button>
              
              <div className="flex items-center gap-8">
                <button onClick={() => jump('back')} className="text-white/40 hover:text-primary transition-all group">
                   <RotateCcw size={26} className="group-hover:-rotate-45 transition-transform" />
                </button>
                <button onClick={() => jump('forward')} className="text-white/40 hover:text-primary transition-all group">
                   <RotateCw size={26} className="group-hover:rotate-45 transition-transform" />
                </button>
              </div>

              <div className="space-y-1">
                 <div className="text-lg font-black italic tracking-tighter flex items-center gap-3">
                    <span>{formatTime(currentTime)}</span>
                    <span className="text-gray-800">/</span>
                    <span className="text-gray-500">{formatTime(duration)}</span>
                 </div>
                 <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-primary/60">
                   <Zap size={10} /> {activeLink?.quality || '1080p'} • HI-RES
                 </div>
              </div>

              <div className="flex items-center gap-4 group/vol">
                  <button onClick={() => setIsMuted(!isMuted)} className="text-white/40 hover:text-white transition-colors">
                    {isMuted || volume === 0 ? <VolumeX size={26} /> : <Volume2 size={26} />}
                  </button>
                  <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden relative">
                    <div className="h-full bg-white opacity-40" style={{ width: `${volume * 100}%` }} />
                    <input 
                      type="range" min="0" max="1" step="0.05" 
                      value={volume} 
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
              </div>
            </div>

            <div className="flex items-center gap-10">
              <button 
                onClick={() => setShowSettings(!showSettings)} 
                className={cn("bg-white/5 p-4 rounded-full border border-white/5 transition-all", showSettings ? "text-primary border-primary/40 bg-primary/5" : "text-white/40 hover:text-white")}
              >
                <Settings size={28} className={cn(showSettings && "animate-spin-slow")} />
              </button>
              <button 
                onClick={() => setIsTheater(!isTheater)} 
                className={cn("bg-white/5 p-4 rounded-full border border-white/5 transition-all", isTheater ? "text-primary border-primary/40 bg-primary/5" : "text-white/40 hover:text-white")}
              >
                <Layout size={28} />
              </button>
              <button onClick={toggleFullscreen} className="bg-white/5 p-4 rounded-full border border-white/5 text-white/40 hover:text-white transition-all">
                <Maximize size={28} />
              </button>
            </div>
          </div>
        </div>

        {/* PRO SETTINGS ENGINE */}
        <AnimatePresence>
          {showSettings && (
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="absolute top-0 right-0 h-full w-[400px] bg-black/90 backdrop-blur-3xl border-l border-white/5 p-12 z-[100] space-y-12 overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-8">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary text-black rounded-lg flex items-center justify-center font-black italic">!</div>
                  <h4 className="text-2xl font-black italic uppercase tracking-tighter">Engine Setup</h4>
                </div>
                <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-white">CLOSE</button>
              </div>

              {/* Quality Node Selector */}
              <div className="space-y-6 border-t border-white/5 pt-8">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-4">
                      <Zap size={20} className="text-primary" />
                      <span className="text-[11px] font-black uppercase tracking-widest">Resolution Gate</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {links.map((link) => (
                      <button 
                        key={link.id}
                        onClick={() => setActiveLink(link)}
                        className={cn("py-4 rounded-xl font-black text-[10px] border-2 uppercase", 
                          activeLink?.id === link.id ? "bg-primary border-primary text-black" : "bg-white/5 border-white/5 text-gray-500 hover:bg-white/10"
                        )}
                      >
                        {link.quality} • {link.source}
                      </button>
                    ))}
                    {links.length === 0 && (
                      <div className="col-span-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[9px] font-black uppercase tracking-widest text-center italic">
                        Node Returned 0 Streams for ID: {animeId}
                      </div>
                    )}
                  </div>
              </div>

              {/* Subtitle Sync */}
              <div className="space-y-6">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-4">
                    <Clock size={20} className="text-primary" />
                    <span className="text-[11px] font-black uppercase tracking-widest">AI Sub Sync</span>
                  </div>
                  <span className="text-[11px] font-black italic text-primary">{(subOffset > 0 ? '+' : '') + subOffset.toFixed(1)}s</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setSubOffset(prev => prev - 0.5)} className="bg-white/5 py-4 rounded-xl font-black text-[10px] hover:bg-white/10">- 0.5s</button>
                  <button onClick={() => setSubOffset(prev => prev + 0.5)} className="bg-white/5 py-4 rounded-xl font-black text-[10px] hover:bg-white/10">+ 0.5s</button>
                </div>
              </div>

              {/* Language Protocol */}
              <div className="space-y-6 border-t border-white/5 pt-8">
                <div className="flex items-center gap-4 text-white">
                    <Globe size={20} className="text-primary" />
                    <span className="text-[11px] font-black uppercase tracking-widest">Metadata Locale</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setLanguage('EN')} className={cn("py-4 rounded-xl font-black text-[10px] border-2", language === 'EN' ? "bg-primary border-primary text-black shadow-lg" : "bg-white/5 border-white/5 text-gray-500")}>ENGLISH</button>
                  <button onClick={() => setLanguage('JP')} className={cn("py-4 rounded-xl font-black text-[10px] border-2", language === 'JP' ? "bg-primary border-primary text-black shadow-lg" : "bg-white/5 border-white/5 text-gray-500")}>ROMAJI</button>
                </div>
              </div>

              {/* Visual Node Scale */}
              <div className="space-y-6 border-t border-white/5 pt-8">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-4">
                      <Type size={20} className="text-primary" />
                      <span className="text-[11px] font-black uppercase tracking-widest">Text Projection</span>
                    </div>
                    <span className="text-lg font-black italic text-primary">{subtitleSize}%</span>
                  </div>
                  <input 
                    type="range" min="50" max="250" step="5" 
                    value={subtitleSize} 
                    onChange={(e) => setSubtitleSize(Number(e.target.value))}
                    className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer accent-primary" 
                  />
              </div>

              {/* Active Node Detail */}
              <div className="p-8 bg-primary/5 border border-primary/20 rounded-3xl space-y-4">
                 <div className="flex items-center gap-3 text-primary">
                    <Shield size={16} />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em]">SECURE HANDSHAKE</span>
                 </div>
                 <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest leading-relaxed">
                   Current stream is being multiplexed through the {activeAddon || 'Default'} node. AI Subtitles are hardware-accelerated.
                 </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* NEXT EPISODE PIN */}
        <AnimatePresence>
          {showNextOverlay && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="absolute bottom-48 right-12 z-50">
              <button 
                onClick={() => onEpisodeChange(currentEpisode + 1)} 
                className="bg-primary text-black px-16 py-8 rounded-full font-black uppercase tracking-[0.4em] text-[11px] flex items-center gap-6 hover:scale-105 active:scale-95 transition-all shadow-[0_40px_80px_rgba(var(--primary-rgb),0.5)] border-4 border-black/20"
              >
                <span>NEXT EPISODE</span>
                <ChevronRight size={22} strokeWidth={4} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FOOTER MANAGEMENT */}
      <div className="max-w-7xl mx-auto w-full space-y-24">
         <div className="grid grid-cols-1 lg:grid-cols-4 gap-16">
            <div className="lg:col-span-3">
               <EpisodeList episodes={episodes} currentEpisode={currentEpisode} onEpisodeSelect={onEpisodeChange} />
            </div>
            
            <section className="space-y-10">
               <div className="flex items-center gap-6 pb-6 border-b border-white/5">
                  <div className="w-2 h-10 bg-primary rounded-full" />
                  <h3 className="text-3xl font-black italic uppercase tracking-tighter">Transmission <span className="text-primary italic">Links</span></h3>
               </div>

               <div className="space-y-4">
                  {links.map((link) => (
                    <button 
                      key={link.id} 
                      onClick={() => setActiveLink(link)} 
                      className={cn("w-full p-8 rounded-[2rem] border-2 transition-all flex items-center justify-between group", 
                        activeLink?.id === link.id ? "bg-primary border-primary text-black shadow-2xl scale-[1.02]" : "bg-[#0a0a0a]/50 border-white/5 text-gray-500 hover:border-primary/40 hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-6">
                        <Zap size={22} className={activeLink?.id === link.id ? "text-black" : "text-primary"} />
                        <div className="text-left">
                          <span className="text-[11px] font-black uppercase tracking-widest block">{link.source}</span>
                          <span className={cn("text-[9px] font-bold uppercase tracking-tight", activeLink?.id === link.id ? "text-black/60" : "text-gray-700")}>{link.quality} • CDN EDGE</span>
                        </div>
                      </div>
                      <div className={cn("w-3 h-3 rounded-full", activeLink?.id === link.id ? "bg-black animate-pulse" : "bg-white/10")} />
                    </button>
                  ))}
               </div>

               <div className="p-8 bg-[#0a0a0a] rounded-3xl border border-white/5 space-y-4">
                  <div className="flex items-center gap-3 text-white">
                    <Info size={16} className="text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Node Diagnostic</span>
                  </div>
                  <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest leading-loose italic">
                    Found {links.length} stable streams for Episode {currentEpisode}. All links were verified via silent ping check.
                  </p>
               </div>
            </section>
         </div>
      </div>
    </div>
  );
};
