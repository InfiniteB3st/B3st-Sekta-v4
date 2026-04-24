import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Filter as FilterIcon, Search, ChevronRight, X, Loader2, Sparkles, Calendar, Activity, Star, ShieldAlert, Shield } from 'lucide-react';
import { jikanService } from '../services/jikan';
import { useSearchParams } from 'react-router-dom';
import { AnimeCard } from '../components/AnimeCard';
import { cn } from '../lib/utils';

const GENRES = [
  { id: 1, name: 'Action' }, { id: 2, name: 'Adventure' }, { id: 4, name: 'Comedy' },
  { id: 8, name: 'Drama' }, { id: 10, name: 'Fantasy' }, { id: 22, name: 'Romance' },
  { id: 24, name: 'Sci-Fi' }, { id: 36, name: 'Slice of Life' }, { id: 7, name: 'Mystery' },
  { id: 14, name: 'Horror' }, { id: 37, name: 'Supernatural' }, { id: 41, name: 'Suspense' },
  { id: 19, name: 'Music' }, { id: 18, name: 'Mecha' }
];

const ORDER_BY = [
  { value: 'popularity', name: 'Popularity' },
  { value: 'rank', name: 'Rank' },
  { value: 'score', name: 'Score' },
  { value: 'title', name: 'Title' }
];

const STATUSES = [
  { value: 'airing', name: 'Airing' },
  { value: 'complete', name: 'Finished' },
  { value: 'upcoming', name: 'Upcoming' }
];

const RATINGS = [
  { value: 'pg13', name: 'PG-13' },
  { value: 'r17', name: 'R-17+' },
  { value: 'r', name: 'R' }
];

export default function Filter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // States
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [selectedGenres, setSelectedGenres] = useState<number[]>(
    searchParams.get('genres')?.split(',').map(Number).filter(n => !isNaN(n)) || []
  );
  const [status, setStatus] = useState<string[]>(
    searchParams.get('status')?.split(',').filter(Boolean) || []
  );
  const [rating, setRating] = useState(searchParams.get('rating') || '');
  const [year, setYear] = useState(searchParams.get('year') || '');
  const [orderBy, setOrderBy] = useState(searchParams.get('order_by') || 'popularity');

  useEffect(() => {
    loadResults();
  }, [searchParams]);

  const loadResults = async () => {
    setLoading(true);
    try {
      const options = {
        genres: searchParams.get('genres'),
        status: searchParams.get('status'),
        rating: searchParams.get('rating'),
        order_by: searchParams.get('order_by'),
        start_date: searchParams.get('year') ? `${searchParams.get('year')}-01-01` : undefined
      };
      const data = await jikanService.searchAnime(searchParams.get('q') || '', options);
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleGenre = (id: number) => {
    setSelectedGenres(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const toggleStatus = (val: string) => {
    setStatus(prev => prev.includes(val) ? prev.filter(s => s !== val) : [...prev, val]);
  };

  const handleApply = () => {
    const params: any = {};
    if (search) params.q = search;
    if (selectedGenres.length > 0) params.genres = selectedGenres.join(',');
    if (status.length > 0) params.status = status.join(',');
    if (rating) params.rating = rating;
    if (year) params.year = year;
    if (orderBy) params.order_by = orderBy;
    setSearchParams(params);
    setShowFilters(false);
  };

  return (
    <div className="min-h-screen bg-black pt-32 px-6 md:px-20 pb-40 space-y-16 animate-in fade-in duration-500">
      <div className="max-w-[1600px] mx-auto space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/5 pb-12 gap-8">
          <div className="space-y-4">
             <h1 className="text-6xl md:text-8xl font-black italic text-white uppercase tracking-tighter leading-none">
               Archive <span className="text-primary italic">Filter</span>
             </h1>
             <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em] italic">
               Found {results.length} nodes matching parameters // Kernel Access: Active
             </p>
          </div>
          <button 
            onClick={() => setShowFilters(true)}
            className="group relative bg-[#0a0a0a] border-2 border-white/5 px-10 py-6 rounded-[2.5rem] text-white font-black uppercase tracking-widest text-[11px] flex items-center gap-4 hover:border-primary/40 hover:bg-primary hover:text-black transition-all"
          >
            <FilterIcon size={18} className="group-hover:rotate-180 transition-transform duration-500" />
            Filter
            <div className="absolute -top-3 -right-3 w-8 h-8 bg-primary text-black rounded-full flex items-center justify-center text-[10px] font-black group-hover:bg-white transition-colors">
              {selectedGenres.length + (status ? 1 : 0) + (rating ? 1 : 0)}
            </div>
          </button>
        </div>

        {loading ? (
          <div className="py-40 flex flex-col items-center gap-8">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.8em] text-gray-800 animate-pulse">Syncing Database Cluster...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-8">
            {results.map((anime) => (
              <AnimeCard key={anime.mal_id} anime={anime} />
            ))}
            {results.length === 0 && (
              <div className="col-span-full py-40 text-center">
                 <ShieldAlert className="mx-auto text-gray-800 mb-6" size={60} />
                 <h3 className="text-2xl font-black italic text-gray-700 uppercase tracking-tighter">Zero Nodes Found</h3>
                 <p className="text-[10px] text-gray-800 font-black uppercase tracking-widest mt-2 px-10">Adjust your parameters and retry handshake.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showFilters && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-[100px]">
             <button onClick={() => setShowFilters(false)} className="absolute top-10 right-10 p-4 bg-white/5 text-gray-400 rounded-full hover:bg-red-500 hover:text-white transition-all z-[101]">
               <X size={32} />
             </button>

            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-5xl bg-[#030303] border border-white/5 rounded-[4rem] p-12 md:p-20 space-y-16 overflow-y-auto max-h-[90vh] custom-scrollbar"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                  <h2 className="text-6xl font-black italic text-white uppercase tracking-tighter">Filter</h2>
                  <div className="flex items-center gap-3">
                     <span className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                     <span className="text-[9px] text-primary font-black uppercase tracking-widest italic">Handshake Interface Locked</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                {/* Search */}
                <div className="space-y-6">
                  <label className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-gray-600">
                    <Search size={14} className="text-primary" /> Core Query
                  </label>
                  <input 
                    type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Identify Target ID..."
                    className="w-full bg-white/3 border border-white/5 rounded-3xl p-6 text-white font-black italic outline-none focus:border-primary/40 transition-all placeholder:text-gray-800"
                  />
                </div>

                {/* Subtitle/Status */}
                <div className="space-y-6">
                   <label className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-gray-600">
                    <Activity size={14} className="text-primary" /> Transmission Status
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {STATUSES.map(s => (
                      <button 
                        key={s.value} onClick={() => toggleStatus(s.value)}
                        className={cn("px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all", status.includes(s.value) ? 'bg-primary border-primary text-black' : 'bg-white/3 border-white/5 text-gray-600 hover:border-white/20')}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Genres */}
                <div className="md:col-span-2 space-y-6">
                  <label className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-gray-600">
                    <Sparkles size={14} className="text-primary" /> Parameter Overrides (Genres)
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {GENRES.map(g => (
                      <button 
                        key={g.id} onClick={() => toggleGenre(g.id)}
                        className={cn("px-8 py-4 rounded-3xl text-[11px] font-black uppercase tracking-tighter border transition-all", selectedGenres.includes(g.id) ? 'bg-primary border-primary text-black' : 'bg-white/3 border-white/5 text-gray-500 hover:border-white/20')}
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div className="space-y-6">
                   <label className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-gray-600">
                    <ShieldIcon size={14} className="text-primary" /> Security Rating
                  </label>
                   <div className="flex flex-wrap gap-3">
                    {RATINGS.map(r => (
                      <button 
                        key={r.value} onClick={() => setRating(rating === r.value ? '' : r.value)}
                        className={cn("px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all", rating === r.value ? 'bg-primary border-primary text-black' : 'bg-white/3 border-white/5 text-gray-600 hover:border-white/20')}
                      >
                        {r.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Year */}
                <div className="space-y-6">
                   <label className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-gray-600">
                    <Calendar size={14} className="text-primary" /> Temporal Coordinate (Year)
                  </label>
                  <input 
                    type="number" value={year} onChange={(e) => setYear(e.target.value)}
                    placeholder="2024"
                    min="1950" max="2026"
                    className="w-full bg-white/3 border border-white/5 rounded-3xl p-6 text-white font-black italic outline-none focus:border-primary/40 transition-all placeholder:text-gray-800"
                  />
                </div>

                {/* Sort Order */}
                <div className="md:col-span-2 space-y-6 pt-8 border-t border-white/5">
                   <label className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-gray-600">
                    <Activity size={14} className="text-primary" /> Sort Protocol
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {ORDER_BY.map(o => (
                      <button 
                        key={o.value} onClick={() => setOrderBy(o.value)}
                        className={cn("px-8 py-4 rounded-3xl text-[11px] font-black uppercase tracking-widest border transition-all", orderBy === o.value ? 'bg-primary border-primary text-black' : 'bg-white/3 border-white/5 text-gray-500 hover:border-white/20')}
                      >
                        {o.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-6">
                <button 
                   onClick={() => {
                     setSearch(''); setSelectedGenres([]); setStatus([]); setRating(''); setYear('');
                   }}
                   className="flex-1 bg-white/3 border border-white/5 text-white/40 py-8 rounded-[2.5rem] font-black uppercase tracking-widest text-[12px] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all"
                >
                  Clear Protocols
                </button>
                <button 
                  onClick={handleApply}
                  className="flex-[2] bg-primary text-black py-8 rounded-[2.5rem] font-black uppercase tracking-[0.2em] italic flex items-center justify-center gap-6 hover:scale-[1.02] shadow-[0_20px_50px_rgba(255,177,0,0.2)] transition-all active:scale-95"
                >
                  Authorize System Sync
                  <ChevronRight size={24} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ShieldIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
  );
}

