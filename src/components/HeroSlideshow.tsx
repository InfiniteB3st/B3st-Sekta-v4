import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Plus, ChevronLeft, ChevronRight, Calendar, Star } from 'lucide-react';
import { Anime } from '../services/jikan';
import { cn } from '../lib/utils';

interface HeroSlideshowProps {
  items: Anime[];
}

export function HeroSlideshow({ items }: HeroSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [items.length]);

  if (!items.length) return <div className="h-[450px] bg-surface animate-pulse rounded-xl" />;

  const current = items[currentIndex];

  return (
    <div className="relative h-[550px] w-full group overflow-hidden rounded-2xl border border-white/5" id="hero-slideshow">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.mal_id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          {/* Background with Blur - HiAnime Style */}
          <div 
            className="absolute inset-0 bg-cover bg-center scale-110 blur-[12px] opacity-30 transition-transform duration-[8000ms] group-hover:scale-100"
            style={{ backgroundImage: `url(${current.images.webp.large_image_url})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
          
          <div className="relative z-10 h-full flex flex-col md:flex-row items-center gap-12 px-8 md:px-20 py-16">
            <div className="hidden md:block w-64 flex-shrink-0 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-xl overflow-hidden border border-white/10 transform -rotate-2 hover:rotate-0 transition-transform duration-500">
              <img 
                src={current.images.webp.large_image_url} 
                alt={current.title} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
                <span className="bg-primary text-black text-xs font-black px-3 py-1 rounded-sm uppercase tracking-tighter italic">
                  #{currentIndex + 1} SPOTLIGHT
                </span>
                <div className="flex items-center gap-1.5 text-white/90 text-xs font-bold uppercase tracking-widest">
                  <Calendar size={14} className="text-primary" />
                  {current.status === 'Currently Airing' ? 'Airing' : 'Finished'}
                </div>
                <div className="flex items-center gap-1.5 text-white py-1 px-2 rounded bg-white/10 backdrop-blur-md text-xs font-black">
                  <Star size={14} className="text-primary" fill="currentColor" />
                  {current.score || 'N/A'}
                </div>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-black mb-6 line-clamp-2 text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] leading-none italic tracking-tighter">
                {current.title_english || current.title}
              </h1>
              
              <p className="text-gray-300 text-sm md:text-lg mb-10 line-clamp-3 max-w-3xl leading-relaxed font-medium">
                {current.synopsis}
              </p>
              
              <div className="flex items-center justify-center md:justify-start gap-5">
                <button className="bg-primary hover:bg-white text-black px-10 py-4 rounded-full font-black uppercase tracking-widest flex items-center gap-3 transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)] group/btn">
                  <Play size={24} fill="currentColor" className="group-hover/btn:scale-125 transition-transform" />
                  Watch Now
                </button>
                <button className="bg-white/5 hover:bg-white/10 text-white px-10 py-4 rounded-full font-black uppercase tracking-widest flex items-center gap-3 transition-all backdrop-blur-xl border border-white/10 border-b-white/20">
                  <Plus size={24} />
                  Add to List
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-8 right-12 flex gap-3 z-30">
        <button 
          onClick={() => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)}
          className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white backdrop-blur-xl transition-all hover:scale-110 active:scale-90"
        >
          <ChevronLeft size={28} />
        </button>
        <button 
          onClick={() => setCurrentIndex((prev) => (prev + 1) % items.length)}
          className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white backdrop-blur-xl transition-all hover:scale-110 active:scale-90"
        >
          <ChevronRight size={28} />
        </button>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-background via-background/50 to-transparent z-20 pointer-events-none" />
    </div>
  );
}
