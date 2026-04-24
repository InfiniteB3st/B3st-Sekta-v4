import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Database, ServerCrash } from 'lucide-react';
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

const DevOverlay = lazy(() => import('./components/DevOverlay').then(module => ({ default: module.DevOverlay })));

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
  const [isDbOffline, setIsDbOffline] = React.useState(false);
  const [addons, setAddons] = React.useState<any[]>([]);

  const isAdmin = user?.email === 'wambuamaxwell696@gmail.com';

  useEffect(() => {
    console.log("Kernel: Pre-flight sequence initiated...");
    
    const handleNativeToggle = () => {
      // MASTER GATE: Temporarily accessible to ALL users until account issue is 100% resolved
      const isAuthorized = true;
      
      if (isAuthorized) {
        setShowDiagnostics(prev => !prev);
        if (!showDiagnostics) {
          console.log("--- STARTING SITE DIAGNOSIS ---");
          console.table({
            timestamp: new Date().toISOString(),
            url: window.location.href,
            status: "Optimizing kernel routing..."
          });
        }
      }
    };

    window.addEventListener('toggle-diagnosis', handleNativeToggle);

    // CAPTURE SYSTEM ERRORS
    const originalError = console.error;
    (window as any)._sekta_errors = [];
    const customError = (...args: any[]) => {
      (window as any)._sekta_errors.push({
        msg: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '),
        time: new Date().toISOString()
      });
      if ((window as any)._sekta_errors.length > 50) (window as any)._sekta_errors.shift();
      originalError.apply(console, args);
    };
    console.error = customError;

    // Inject global styles to ensure Branding consistency
    const style = document.createElement('style');
    style.innerHTML = `
      .logo-b3st { color: #ffffff; }
      .logo-sekta { color: #ffb100; }
      .accent-primary { color: #ffb100; }
      .bg-primary { background-color: #ffb100 !important; }
      .border-primary { border-color: #ffb100 !important; }
      .text-primary { color: #ffb100 !important; }
      :root { 
        --primary: #ffb100;
        --primary-rgb: 255, 177, 0;
      }
      .accent-yellow { color: #ffb100; }
      .bg-yellow { background-color: #ffb100; }
      
      /* Global Scraper UI Improvements */
      .source-active { border-color: #ffb100; background: rgba(255, 177, 0, 0.1); }
      .source-inactive { border-color: rgba(255, 255, 255, 0.05); }
    `;
    document.head.appendChild(style);
    document.title = "B3st Sekta";

    // AUTH OBSERVER & DB PROBE
    const checkDb = async () => {
      const supabase = initSupabase();
      if (!supabase) {
        setIsDbOffline(true);
        return;
      }
      try {
        const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true }).limit(1);
        if (error && error.code === '401') setIsDbOffline(true);
        
        const { data } = await supabase.from('user_addons').select('*');
        if (data) setAddons(data);
      } catch {
        setIsDbOffline(true);
      }
    };

    checkDb();

    // Listen for Auth Changes
    const supabaseClient = initSupabase();
    let subscription: { unsubscribe: () => void } | null = null;
    
    if (supabaseClient) {
      const { data } = supabaseClient.auth.onAuthStateChange((event, session) => {
         console.log(`AUTH_EVENT: ${event}`, session?.user?.id);
         if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
           checkDb();
         }
         if (event === 'SIGNED_OUT') {
           window.location.href = '/login';
         }
      });
      subscription = data.subscription;
    }

    return () => {
      subscription?.unsubscribe();
      window.removeEventListener('toggle-diagnosis', handleNativeToggle);
      console.error = originalError;
    };
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
            OPEN KERNEL LOGS
          </button>
        </div>
        <Suspense fallback={null}>
          <DiagnosticWrapper isOpen={showDiagnostics} onClose={() => setShowDiagnostics(false)} />
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
        <DiagnosticWrapper isOpen={showDiagnostics} onClose={() => setShowDiagnostics(false)} />
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

function DiagnosticWrapper({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  // EMERGENCY BYPASS: Allow trigger for all users to debug handshake issues
  if (!isOpen) return null;
  return <DevOverlay isOpen={isOpen} onClose={onClose} />;
}
