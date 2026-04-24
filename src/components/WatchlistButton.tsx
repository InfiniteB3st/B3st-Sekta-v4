import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ListPlus, Check, ChevronDown, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { animeDatabase, WatchStatus } from '../services/animeDatabase';

interface WatchlistButtonProps {
  animeId: number;
}

const STATUS_OPTIONS: WatchStatus[] = ['Watching', 'Plan to Watch', 'Completed', 'On Hold', 'Dropped'];

export function WatchlistButton({ animeId }: WatchlistButtonProps) {
  const { user } = useAuth();
  const [currentStatus, setCurrentStatus] = useState<WatchStatus | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      animeDatabase.getWatchlistStatus(user.id, animeId).then(setCurrentStatus);
    }
  }, [user, animeId]);

  const handleUpdate = async (status: WatchStatus) => {
    if (!user) return;
    setLoading(true);
    const result = await animeDatabase.updateWatchlist(user.id, animeId, status);
    if (result) setCurrentStatus(status);
    setLoading(false);
    setIsOpen(false);
  };

  if (!user) return null;

  return (
    <div className="relative">
      <div className="flex items-center">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl group ${
            currentStatus 
              ? 'bg-primary text-black' 
              : 'bg-white/5 text-white hover:bg-white/10'
          }`}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-black" />
          ) : (
            currentStatus ? <Check className="w-4 h-4" /> : <ListPlus className="w-4 h-4" />
          )}
          {currentStatus || 'Add to Watchlist'}
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute left-0 mt-4 w-64 bg-[#1a1a1a] border border-white/5 rounded-3xl p-3 shadow-2xl z-50 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />
              
              <div className="relative space-y-1">
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    onClick={() => handleUpdate(status)}
                    className={`w-full text-left px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between group ${
                      currentStatus === status 
                        ? 'bg-primary/20 text-primary' 
                        : 'text-gray-500 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {status}
                    {currentStatus === status && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
