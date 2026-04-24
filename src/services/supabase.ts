import { getSupabase } from './supabaseClient';

export function getSupabaseClient(): any {
  try {
    return getSupabase();
  } catch (err) {
    console.warn(err);
    return null;
  }
}

export { getSupabase };

export const syncWatchHistory = async (userId: string, animeId: number, progress: number, episodes: number) => {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await (supabase as any)
    .from('watch_history')
    .upsert({
      user_id: userId,
      anime_id: animeId,
      progress: progress,
      total_episodes: episodes,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,anime_id' });

  if (error) {
    console.error('Core sync failure:', error);
  }
};
