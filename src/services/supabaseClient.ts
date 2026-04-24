import { createClient } from '@supabase/supabase-js';

const SB_URL = (import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.REACT_APP_SUPABASE_URL || "https://wnjdlqqlmzjklxcgiqap.supabase.co").trim().replace(/\/$/, "");
const SB_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.REACT_APP_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduamRscXFsbXpqa2x4Y2dpcWFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3ODU4MzIsImV4cCI6MjA5MjM2MTgzMn0.Z-WM1XtqO2CNPB9qmi0ivswAE-MVE8tBrrpqX1i5rRE").trim();

if (!SB_URL || SB_URL.includes("your-project-id") || !SB_KEY || SB_KEY.includes("your-anon-key")) {
  console.error("KERNEL_CRITICAL: API Keys missing or invalid in environment! Handshake failed.");
}

import { SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

/**
 * getClient: The single source of truth for Supabase connectivity.
 */
export const getClient = () => {
  if (typeof window === 'undefined') return null;
  
  if (!_supabase) {
    if (!SB_URL || !SB_KEY) return null;
    try {
      _supabase = createClient(SB_URL, SB_KEY, {
        global: {
          headers: { 'apikey': SB_KEY },
        },
      });
    } catch (err) {
      console.error("SUPABASE_INIT_FAILURE: Kernel isolated.", err);
      return null;
    }
  }
  return _supabase;
};

// HELPER: LOCAL FILE UPLOAD (KERNEL COMPLIANT)
export const uploadAvatar = async (userId: string, file: File) => {
  const client = getClient();
  if (!client) throw new Error("Supabase node unreachable");

  // VALIDATION: Type check
  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Invalid format. Use PNG, JPG, or WebP.");
  }

  // VALIDATION: Size check (DYNAMIC LIMIT)
  const limitMb = Number(import.meta.env.VITE_STORAGE_LIMIT_MB || 2);
  if (file.size > limitMb * 1024 * 1024) {
    throw new Error(`File exceeds ${limitMb}MB limit.`);
  }

  const filePath = `${userId}/profile.png`;

  // 1. Upload to storage (Hierarchical Path for RLS)
  const { error: uploadError } = await client.storage
    .from('avatars')
    .upload(filePath, file, { 
      upsert: true,
      contentType: file.type
    });

  if (uploadError) throw uploadError;

  // 2. Get Public URL
  const { data: { publicUrl } } = client.storage
    .from('avatars')
    .getPublicUrl(filePath);

  // 3. Update Profiles Table
  const { error: updateError } = await client
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', userId);

  if (updateError) throw updateError;

  return publicUrl;
};

// Compatibility nodes for existing imports
export const checkStorageHealth = async () => {
  const client = getClient();
  if (!client) return false;
  try {
    const { data, error } = await client.storage.getBucket('avatars');
    if (error) return false;
    return !!data;
  } catch {
    return false;
  }
};

export const getSupabase = getClient;
export const initSupabase = getClient;

import { Profile, WatchHistory } from '../types';

// WATCH HISTORY PROTOCOL (INCOGNITO COMPLIANT)
export const syncWatchHistory = async (history: WatchHistory) => {
  const client = getClient();
  if (!client) {
    const localHistory = JSON.parse(localStorage.getItem('sekta_history') || '[]');
    const anime_id = history.anime_id;
    const existingIndex = localHistory.findIndex((h: WatchHistory) => h.anime_id === anime_id);
    const newEntry = { ...history, updated_at: new Date().toISOString() };
    if (existingIndex > -1) localHistory[existingIndex] = newEntry;
    else localHistory.unshift(newEntry);
    localStorage.setItem('sekta_history', JSON.stringify(localHistory.slice(0, 50)));
    return;
  }

  const { user_id } = history;
  if (!user_id) return;

  const { error } = await client
    .from('watch_history')
    .upsert({ ...history, updated_at: new Date().toISOString() }, { onConflict: 'user_id,anime_id' });
  if (error) console.error('Cloud Sync Failed:', error);
};

export const updateUserEmail = async (newEmail: string) => {
  const client = getClient();
  if (!client) throw new Error("Supabase not initialized");
  const { data, error } = await client.auth.updateUser({ email: newEmail });
  if (error) throw error;
  return data;
};

export const updateUserPassword = async (password: string) => {
  const client = getClient();
  if (!client) throw new Error("Supabase not initialized");
  const { data, error } = await client.auth.updateUser({ password });
  if (error) throw error;
  return data;
};

export const updateUsername = async (userId: string, username: string) => {
  const client = getClient();
  if (!client) throw new Error("Supabase not initialized");
  const { data, error } = await client
    .from('profiles')
    .update({ username, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const signInWithGoogle = async (redirectTo?: string) => {
  const client = getClient();
  if (!client) throw new Error("Supabase not initialized");
  const finalRedirect = redirectTo || window.location.origin;
  try {
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo: finalRedirect,
        queryParams: { access_type: 'offline', prompt: 'consent' }
      }
    });
    if (error) throw error;
  } catch (err) {
    console.error('OAuth Handshake Error:', err);
    throw err;
  }
};

export const syncUserProfile = async (user: { id: string }) => {
  const client = getClient();
  if (!client || !user) return null;
  
  const { data: profile, error: fetchError } = await client
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (fetchError) {
    console.error('Handshake Sync Error:', fetchError);
    return null;
  }
  
  return profile as Profile | null;
};

export const syncProfile = async (payload: Partial<Profile> & { id: string }) => {
  const client = getClient();
  if (!client) return;
  const { error } = await client
    .from('profiles')
    .upsert({ ...payload, updated_at: new Date().toISOString() }, { onConflict: 'id' });
  if (error) console.error('Profile Sync Failure:', error);
};

export const signUpUser = async (email: string, pass: string, username: string) => {
  const client = getClient();
  if (!client) throw new Error("Supabase not initialized");
  const { data, error } = await client.auth.signUp({ 
    email, 
    password: pass,
    options: {
      data: { username }
    }
  });
  
  if (error) throw error;
  
  if (data.user) {
    const { error: profileError } = await client
      .from('profiles')
      .upsert({
        id: data.user.id,
        username: username,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
      
    if (profileError) console.warn('Profile bridge warning:', profileError.message);
  }
  
  return data;
};

export const getKeyHandshake = () => ({
  prefix: SB_KEY.substring(0, 5),
  suffix: SB_KEY.substring(SB_KEY.length - 5),
  isKeyPresent: !!SB_KEY && !SB_KEY.includes('REPLACE')
});
