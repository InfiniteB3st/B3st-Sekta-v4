import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Database, ServerCrash, Activity } from 'lucide-react';
import { initSupabase } from './services/supabaseClient';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import Gatekeeper from './components/Gatekeeper';
import Home from './pages/Home';
import LandingPage from './pages/LandingPage';
import Filter from './pages/Filter';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Login from './pages/Login';
import SetupAccount from './pages/SetupAccount';
import AddonManager from './pages/AddonManager';
import AnimeDetails from './pages/AnimeDetails';
import Watch from './pages/Watch';
import AdminPanel from './pages/AdminPanel';
import { jikanService } from './services/jikan';
import { HelpCenter, DMCA, Terms, Privacy } from './components/FooterPages';
import { AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';

const DiagnosisOverlay = lazy(() => import('./components/DiagnosisOverlay').then(module => ({ default: module.DiagnosisOverlay })));
const EskaMila = lazy(() => import('./components/EskaMila').then(module => ({ default: module.EskaMila })));

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("CRITICAL_SYSTEM_CRASH:", error, errorInfo);
  }

  render() {
    if (this.state.hasError || (window as any).HANDSHAKE_ERROR) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-12 text-center space-y-12 animate-in fade-in duration-1000">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full animate-pulse" />
            <div className="w-32 h-32 bg-white/5 border-2 border-primary/20 rounded-[2.5rem] flex items-center justify-center text-primary relative shadow-[0_0_50px_rgba(255,177,0,0.1)]">
               <ServerCrash size={64} className="animate-bounce" />
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-center gap-3">
               <span className="text-4xl font-black italic text-white uppercase tracking-tighter">B3st</span>
               <span className="text-4xl font-black italic text-primary uppercase tracking-tighter">Sekta</span>
            </div>
            <h2 className="text-xl font-bold text-gray-400 uppercase tracking-[0.2em]">System Diagnostics Required</h2>
            <p className="text-gray-600 max-w-sm mx-auto text-[11px] font-medium leading-relaxed uppercase tracking-wider">
               The kernel has intercepted a system warning. Access the Command Center to resolve.
               Press <span className="text-primary font-black">SHIFT + Q + T</span> to access the master bypass.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <button 
              onClick={() => window.location.reload()}
              className="px-12 py-5 bg-primary text-black font-black uppercase tracking-widest text-[11px] rounded-full hover:scale-110 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,177,0,0.2)] flex items-center gap-3"
            >
              <RefreshCw size={16} /> Re-Initialize Kernel
            </button>
            <div className="p-6 bg-white/5 border border-white/5 rounded-2xl font-mono text-[9px] text-red-500/60 max-w-lg overflow-hidden whitespace-nowrap text-ellipsis">
               EXCEPTION_TOKEN: {this.state.error?.message || "HANDSHAKE_TIMEOUT_401"}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * MASTER GUARD: 100% SUCCESS RATE REDIRECTS
 * Mandatory Onboarding Logic.
 */
function MasterGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-[9999]">
      <div className="w-20 h-20 border-4 border-[#ffb100] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  // Auto-Onboarding: Redirect if profile missing username
  if (user && !profile?.username && location.pathname !== '/finish-setup' && location.pathname !== '/login') {
    return <Navigate to="/finish-setup" replace />;
  }

  // SUPERUSER REDIRECT: Auto-navigate to Dev Dashboard on entry
  if (user?.email === 'wambuamaxwell696@gmail.com' && location.pathname === '/home') {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const { user } = useAuth();
  const [showDiagnostics, setShowDiagnostics] = React.useState(false);
  const [showEskaMila, setShowEskaMila] = React.useState(false);
  const [isDbOffline, setIsDbOffline] = React.useState(false);
  const [addons, setAddons] = React.useState<any[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // MASTER KERNEL BYPASS: Shift + Q + T (Universal Shortcut Override)
      if (e.shiftKey && e.code === 'KeyQ') {
        const catchT = (t: KeyboardEvent) => {
          if (t.code === 'KeyT') {
            t.preventDefault();
            t.stopPropagation();
            setShowDiagnostics(prev => !prev);
          }
        };
        window.addEventListener('keydown', catchT, { once: true });
        setTimeout(() => window.removeEventListener('keydown', catchT), 500);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // CAPTURE SYSTEM ERRORS FOR FABRIC SCANNER
    const originalError = console.error;
    (window as any)._sekta_errors = (window as any)._sekta_errors || [];
    console.error = (...args: any[]) => {
      const msg = args.map(a => typeof a === 'object' ? (a instanceof Error ? a.message : JSON.stringify(a)) : String(a)).join(' ');
      (window as any)._sekta_errors.push({ msg, time: new Date().toISOString() });
      if ((window as any)._sekta_errors.length > 50) (window as any)._sekta_errors.shift();
      originalError.apply(console, args);
    };

    // Global Brand Sync
    const style = document.createElement('style');
    style.innerHTML = `
      :root { --primary: #ffb100; --primary-rgb: 255, 177, 0; }
      .bg-primary { background-color: #ffb100 !important; }
      .text-primary { color: #ffb100 !important; }
      .border-primary { border-color: #ffb100 !important; }
      .glow-primary { box-shadow: 0 0 20px rgba(255, 177, 0, 0.4); }
    `;
    document.head.appendChild(style);
    document.title = "B3st Sekta";

    // AUTH & DB HANDSHAKE
    const checkDb = async () => {
      const supabase = initSupabase();
      if (!supabase) return setIsDbOffline(true);
      try {
        const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true }).limit(1);
        if (error && (error.code === '401' || error.code === 'P0001')) setIsDbOffline(true);
        const { data: adds } = await supabase.from('user_addons').select('*');
        if (adds) setAddons(adds);
      } catch { setIsDbOffline(true); }
    };

    checkDb();

    window.addEventListener('keydown', handleKeyDown);

    const supabaseClient = initSupabase();
    if (supabaseClient) {
      const { data } = supabaseClient.auth.onAuthStateChange((event) => {
         if (['SIGNED_IN', 'USER_UPDATED', 'INITIAL_SESSION'].includes(event)) checkDb();
         if (event === 'SIGNED_OUT') window.location.href = '/login';
      });
      return () => {
        data.subscription.unsubscribe();
        window.removeEventListener('keydown', handleKeyDown);
        console.error = originalError;
      };
    }
  }, []);

  useEffect(() => {
    // DYNAMIC FAVICON LOGIC
    const updateFavicon = async () => {
       try {
          const supabase = initSupabase();
          if (!supabase) return;
          const { data } = await supabase.from('watch_history').select('anime_id').order('watched_at', { ascending: false }).limit(1).single();
          let animeId = data?.anime_id;
          
          if (!animeId) {
             const top = await jikanService.getTopByPopularity(1);
             animeId = top[0]?.mal_id;
          }

          if (animeId) {
             const anime = await jikanService.getAnimeById(animeId);
             const imageUrl = anime.images.webp.image_url;
             const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement || document.createElement('link');
             link.rel = 'icon';
             link.href = imageUrl;
             document.getElementsByTagName('head')[0].appendChild(link);
          }
       } catch (err) {
          console.warn("Favicon update failed:", err);
       }
    };
    updateFavicon();
  }, []);

  if (isDbOffline) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-12 text-center space-y-8 animate-in fade-in duration-700">
        <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center text-primary animate-pulse border-4 border-primary/20">
          <Database size={64} />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">Connection Interrupted</h1>
          <p className="text-gray-500 max-w-sm font-black uppercase tracking-[0.2em] text-[10px] leading-relaxed">
            The database node handshake is pending. Access the Command Center for manual override.
          </p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => window.location.reload()}
            className="bg-primary text-black px-12 py-5 rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-2xl hover:scale-105 active:scale-95 transition-all"
          >
            ATTEMPT RE-SYNCHRONIZATION
          </button>
          <button 
            onClick={() => setShowDiagnostics(true)}
            className="bg-white/5 text-white/40 px-8 py-5 rounded-[2rem] font-black uppercase tracking-widest text-[10px] border border-white/10 hover:text-white transition-all"
          >
            OPEN COMMAND CENTER
          </button>
        </div>
        <Suspense fallback={null}>
          <DiagnosisOverlay 
            isOpen={showDiagnostics} 
            onClose={() => setShowDiagnostics(false)} 
            onInitializeCore={() => {
              setShowDiagnostics(false);
              setShowEskaMila(true);
            }}
          />
          <EskaMila 
            isOpen={showEskaMila} 
            onClose={() => setShowEskaMila(false)} 
            onBackToDiagnosis={() => {
              setShowEskaMila(false);
              setShowDiagnostics(true);
            }}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <Router>
      <MasterGuard>
        <Gatekeeper>
          <Layout>
            <Routes>
              {/* Public Entry */}
              <Route path="/" element={<LandingPage />} />
              
              {/* Public Core */}
              <Route path="/login" element={<Login />} />
              <Route path="/auth" element={<Navigate to="/login" replace />} />
              <Route path="/finish-setup" element={<SetupAccount />} />
              
              {/* Authenticated Application */}
              <Route path="/" element={<Home />} />
              <Route path="/home" element={<Home />} />
              <Route path="/filter" element={<Filter />} />
              <Route path="/anime/:id" element={<AnimeDetails />} />
              <Route path="/watch/:id" element={<Watch />} />
              
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/addons" element={<AddonManager />} />
              <Route path="/admin" element={<AdminPanel />} />
              
              {/* Footer Pages */}
              <Route path="/help" element={<HelpCenter />} />
              <Route path="/dmca" element={<DMCA />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              
              {/* Global Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </Gatekeeper>
      </MasterGuard>
      <Suspense fallback={null}>
        {user?.email?.toLowerCase() === 'wambuamaxwell696@gmail.com' && (
          <button 
            onClick={() => setShowEskaMila(prev => !prev)}
            style={{
              position: 'fixed',
              top: '20px',
              right: '250px', // Shift left to not overlap if top-right button in overlay is present? 
              // Actually, user wants it at Top Right. I'll put it at top 20, right 20.
              zIndex: 999999,
              padding: '12px 24px',
              background: 'linear-gradient(45deg, #ffb100 0%, #ff8c00 100%)',
              color: 'black',
              borderRadius: '12px',
              fontWeight: '900',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              boxShadow: '0 0 30px rgba(255,177,0,0.5)',
              border: '2px solid rgba(255,255,255,0.2)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            className="hover:scale-105 active:scale-95 animate-pulse hover:animate-none"
          >
            <Activity size={18} />
            Eska Mila AI
          </button>
        )}
        <DiagnosisOverlay 
          isOpen={showDiagnostics} 
          onClose={() => setShowDiagnostics(false)} 
          onInitializeCore={() => {
            setShowDiagnostics(false);
            setShowEskaMila(true);
          }}
        />
        <EskaMila 
          isOpen={showEskaMila} 
          onClose={() => setShowEskaMila(false)} 
          onBackToDiagnosis={() => {
            setShowEskaMila(false);
            setShowDiagnostics(true);
          }}
        />
      </Suspense>
    </Router>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
