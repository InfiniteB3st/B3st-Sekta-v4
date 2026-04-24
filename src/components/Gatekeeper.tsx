import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface GatekeeperProps {
  children: React.ReactNode;
}

export default function Gatekeeper({ children }: GatekeeperProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [key, setKey] = useState('');
  const [error, setError] = useState(false);
  const MASTER_KEY = 'b3stsekta2699';

  useEffect(() => {
    const saved = localStorage.getItem('sekta_v4_auth');
    if (saved === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleValidation = (e: React.FormEvent) => {
    e.preventDefault();
    if (key === MASTER_KEY) {
      localStorage.setItem('sekta_v4_auth', 'true');
      setIsAuthenticated(true);
    } else {
      setError(true);
      setKey('');
      setTimeout(() => setError(false), 2000);
    }
  };

  if (isAuthenticated) return <>{children}</>;

  return (
    <div className="fixed inset-0 bg-[#0f0f0f] z-[9999] flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-16 text-center"
      >
        {/* Simplified Logo */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="logo-text">
            <span className="logo-b3st text-7xl">B3ST</span>
            <span className="logo-sekta text-7xl">SEKTA</span>
          </h1>
        </div>

        <form onSubmit={handleValidation} className="space-y-10">
          <div className="relative">
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className={`w-full bg-[#1a1a1a] border-2 ${error ? 'border-red-500' : 'border-white/5 focus:border-primary'} py-5 rounded-2xl text-center text-white text-2xl outline-none transition-all`}
              autoFocus
              autoComplete="off"
            />
            {error && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-500 text-[10px] uppercase font-black tracking-widest mt-4"
              >
                Invalid Key
              </motion.p>
            )}
          </div>

          <button
            type="submit"
            className="hianime-btn-yellow w-full py-5 text-sm"
          >
            Enter Website
          </button>
        </form>
      </motion.div>
    </div>
  );
}
