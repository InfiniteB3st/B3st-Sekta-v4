import { supabase } from './supabaseClient';

export interface AddonSource {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface StreamLink {
  id: string;
  source: string;
  url: string;
  quality: string;
  status: 'pending' | 'online' | 'offline';
}

/**
 * MASTER ARCHITECT: AddonResolver Engine
 * Bridges the gap between B3ST SEKTA UI and the underlying streaming infrastructure.
 */
export const AddonResolver = {
  /**
   * Fetches the user's enabled addons from Supabase or LocalStorage for guests.
   */
  getEnabledAddons: async (userId: string): Promise<AddonSource[]> => {
    const ADDON_MAP: Record<string, { name: string; description: string }> = {
      'netflix-node': { name: 'Netflix Node', description: 'Ultra-HD Premium Stream' },
      'hianime-core': { name: 'HiAnime Core', description: 'Stable 1080p Mirror' },
      'aniwave-bridge': { name: 'AniWave Bridge', description: 'Global CDN Network' }
    };

    if (userId === 'guest') {
      const localAddons = JSON.parse(localStorage.getItem('sekta_addons') || '[]');
      if (localAddons.length === 0) {
        return [{ id: 'hianime-core', name: 'HiAnime Core', description: 'Stable 1080p Mirror', enabled: true }];
      }
      return localAddons.map((item: any) => ({
        ...item,
        id: item.addon_id || item.id,
        name: ADDON_MAP[item.addon_id]?.name || item.name || item.addon_id,
        description: ADDON_MAP[item.addon_id]?.description || item.description || 'Custom Extension Source'
      }));
    }

    const { data, error } = await supabase
      .from('user_addons')
      .select('*')
      .eq('user_id', userId)
      .eq('enabled', true);

    if (error) return [];

    return (data || []).map(item => ({
      id: item.addon_id,
      name: item.name || ADDON_MAP[item.addon_id]?.name || item.addon_id,
      description: item.description || ADDON_MAP[item.addon_id]?.description || 'Custom Extension Source',
      enabled: item.enabled
    }));
  },

  /**
   * Scrapes multiple links from an Add-on and performs a health check (Ping).
   */
  scrapeLinks: async (addonId: string, animeId: number, episode: number): Promise<StreamLink[]> => {
    // Simulated multi-link response from an add-on
    const sources = ['GogoServer', 'CloudStream', 'MegaDrive', 'VidStream', 'DirectEdge'];
    const qualities = ['1080p', '720p', '480p'];
    
    const links: StreamLink[] = Array.from({ length: 5 }).map((_, i) => ({
      id: `${addonId}-link-${i}`,
      source: sources[i % sources.length],
      url: `https://test-videos.co.uk/vids/big_buck_bunny.mp4?source=${i}`,
      quality: qualities[i % qualities.length],
      status: 'pending'
    }));

    // Perform silent "Ping" health check
    const verifiedLinks = await Promise.all(links.map(async (link) => {
      try {
        const response = await fetch(link.url, { method: 'HEAD' });
        return { ...link, status: response.ok ? 'online' : 'offline' as any };
      } catch {
        return { ...link, status: 'offline' as any };
      }
    }));

    return verifiedLinks.filter(l => l.status === 'online');
  }
};
