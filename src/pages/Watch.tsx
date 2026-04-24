import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { jikanService, Anime } from '../services/jikan';
import { useAuth } from '../context/AuthContext';
import { VideoPlayer } from '../components/VideoPlayer';

/**
 * HI-ANIME WATCH ENGINE
 * Orchestrates the data flow between Jikan episodes and the custom B3ST Player.
 */
export default function Watch() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const ep = searchParams.get('ep') || '1';
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [anime, setAnime] = useState<Anime | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        if (!id) return;
        const details = await jikanService.getAnimeById(Number(id));
        setAnime(details);
      } catch (err) {
        console.error('Watch Node Sync Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [id]);

  const handleEpisodeChange = (newEp: number) => {
    setSearchParams({ ep: newEp.toString() });
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-black">
       <div className="w-16 h-16 border-4 border-[#ffb100] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black pb-40 animate-in fade-in duration-500">
      {anime && (
        <VideoPlayer 
          animeId={anime.mal_id}
          animeTitle={anime.title}
          imageUrl={anime.images.webp.large_image_url}
          episode={Number(ep)}
          userId={user?.id || null}
          onEpisodeChange={handleEpisodeChange}
          onBack={() => navigate(`/anime/${id}`)}
        />
      )}
    </div>
  );
}
