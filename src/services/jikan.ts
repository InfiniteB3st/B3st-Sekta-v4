export interface Anime {
  mal_id: number;
  url: string;
  images: {
    webp: {
      image_url: string;
      small_image_url: string;
      large_image_url: string;
    };
  };
  title: string;
  title_english: string | null;
  type: string;
  source: string;
  episodes: number | null;
  status: string;
  airing: boolean;
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  popularity: number | null;
  synopsis: string | null;
}

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url: string, retries: number = 3, delay: number = 1000): Promise<any> {
  let lastError: any = null;
  
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      
      if (res.status === 429) {
        lastError = new Error('Jikan Rate Limit (429)');
        const backoff = delay * (2 ** i); // Exponential backoff
        console.warn(`${lastError.message}. Retrying in ${backoff}ms (Attempt ${i + 1}/${retries})...`);
        await wait(backoff);
        continue;
      }

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const json = await res.json();
      if (!json) throw new Error('Received empty response from Jikan');
      return json;
    } catch (err) {
      lastError = err;
      if (i === retries - 1) break;
      await wait(delay * (i + 1));
    }
  }
  
  throw lastError || new Error(`Failed to fetch after ${retries} retries`);
}

export const jikanService = {
  getTopByPopularity: async (limit: number = 10): Promise<Anime[]> => {
    try {
      const data = await fetchWithRetry(`${JIKAN_BASE_URL}/top/anime?filter=bypopularity&limit=${limit}`);
      return data?.data || [];
    } catch (err) {
      console.error('Failed to fetch top anime:', err);
      return [];
    }
  },
  
  getTopAiring: async (limit: number = 10): Promise<Anime[]> => {
    try {
      const data = await fetchWithRetry(`${JIKAN_BASE_URL}/top/anime?filter=airing&limit=${limit}`);
      return data?.data || [];
    } catch (err) {
      console.error('Failed to fetch airing anime:', err);
      return [];
    }
  },

  searchAnime: async (query: string, options: any = {}): Promise<Anime[]> => {
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      params.append('order_by', options.order_by || 'popularity');
      
      if (options.genres) params.append('genres', options.genres);
      if (options.status) params.append('status', options.status);
      if (options.rating) params.append('rating', options.rating);
      if (options.score) params.append('min_score', options.score);
      if (options.start_date) params.append('start_date', options.start_date);
      
      const data = await fetchWithRetry(`${JIKAN_BASE_URL}/anime?${params.toString()}`);
      return data?.data || [];
    } catch (err) {
      console.error('Failed to search anime:', err);
      return [];
    }
  },

  getAnimeById: async (id: number): Promise<Anime> => {
    try {
      const data = await fetchWithRetry(`${JIKAN_BASE_URL}/anime/${id}`);
      if (!data?.data) throw new Error('Anime not found');
      return data.data;
    } catch (err) {
      console.error(`Failed to fetch anime details for ID ${id}:`, err);
      throw err;
    }
  },

  getEpisodes: async (id: number): Promise<any[]> => {
    try {
      const data = await fetchWithRetry(`${JIKAN_BASE_URL}/anime/${id}/episodes`);
      return data?.data || [];
    } catch (err) {
      console.error(`Failed to fetch episodes for anime ID ${id}:`, err);
      return [];
    }
  }
};
