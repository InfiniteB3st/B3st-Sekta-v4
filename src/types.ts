export interface Profile {
  id: string;
  username: string;
  email?: string;
  avatar_url?: string;
  accent_color?: string;
  is_admin?: boolean;
  updated_at?: string;
  created_at?: string;
}

export interface WatchHistory {
  user_id: string;
  anime_id: number;
  anime_title?: string;
  episode?: number;
  episode_id?: string | number;
  progress?: number;
  progress_ms?: number;
  image_url?: string;
  status?: string;
  updated_at?: string;
}

export interface Addon {
  addon_id: string;
  name: string;
  url: string;
  enabled: boolean;
}
