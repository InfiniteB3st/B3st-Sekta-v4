import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, syncUserProfile } from '../services/supabaseClient';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, currentUser?: User) => {
    try {
      // MASTER ARCHITECT: Identity Sync Check
      const activeProfile = await syncUserProfile(currentUser);
      
      if (activeProfile) {
        // ADMIN_FORCE: Hard-coded check for Superuser authority
        if (currentUser?.email === 'wambuamaxwell696@gmail.com') {
          activeProfile.role = 'admin';
          console.log("SUPERUSER AUTHENTICATED: B3ST_SEKTA_ADMIN_LEVEL_0");
        }
        setProfile(activeProfile);
        if (activeProfile.accent_color) {
          document.documentElement.style.setProperty('--primary', activeProfile.accent_color);
        }
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error('Core Profile Engine Error:', err);
    }
  };

  useEffect(() => {
    // Apply local accent if guest
    const localAccent = localStorage.getItem('sekta_accent');
    if (localAccent) {
      document.documentElement.style.setProperty('--primary', localAccent);
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id, session.user);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id, session.user);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
