import { getSupabase } from './supabase';

export type WatchStatus = 'Watching' | 'Plan to Watch' | 'Completed' | 'On Hold' | 'Dropped';

export const animeDatabase = {
  // Watchlist (user_lists table)
  async updateWatchlist(userId: string, animeId: number, status: WatchStatus) {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await (supabase as any)
      .from('user_lists')
      .upsert({
        user_id: userId,
        anime_id: animeId,
        status,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,anime_id' })
      .select()
      .single();

    if (error) {
      console.error('Watchlist Dropdown Sync Failed:', error);
      return null;
    }
    return data;
  },

  async getWatchlistStatus(userId: string, animeId: number): Promise<WatchStatus | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await (supabase as any)
      .from('user_lists')
      .select('status')
      .eq('user_id', userId)
      .eq('anime_id', animeId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is just "no rows found"
      console.error('Identity Status Retrieval Error:', error);
    }
    return data?.status || null;
  },

  // Watch History (watch_history table)
  async syncWatchProgress(userId: string, animeId: number, episode: number, timestamp: number, totalEpisodes: number) {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { error } = await (supabase as any)
      .from('watch_history')
      .upsert({
        user_id: userId,
        anime_id: animeId,
        last_episode: episode,
        timestamp,
        total_episodes: totalEpisodes,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,anime_id' });

    if (error) {
      console.error('Heartbeat Sync Interrupted:', error);
    }
  },

  async getLastWatched(userId: string) {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await (supabase as any)
      .from('watch_history')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('History Manifest Fetch Failure:', error);
    }
    return data;
  }
};
