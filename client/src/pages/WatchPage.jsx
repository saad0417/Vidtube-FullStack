import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { videoApi } from '../api/video.api';
import { VideoPlayer } from '../components/video/VideoPlayer';
import { VideoInfo } from '../components/video/VideoInfo';
import { CommentsSection } from '../components/video/CommentsSection';
import { RelatedVideos } from '../components/video/RelatedVideos';
import { SaveToPlaylistModal } from '../components/video/SaveToPlaylistModal';
import { Loader2, AlertCircle } from 'lucide-react';

export const WatchPage = () => {
  const { videoId } = useParams();
  const [isTheater, setIsTheater] = useState(() => {
    try {
      return localStorage.getItem('vidtube:theater') === 'true';
    } catch {
      return false;
    }
  });
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSavePlaylistOpen, setIsSavePlaylistOpen] = useState(false);

  const toggleTheater = () => {
    setIsTheater((prev) => {
      try {
        localStorage.setItem('vidtube:theater', String(!prev));
      } catch {
        /* storage may be unavailable */
      }
      return !prev;
    });
  };

  useEffect(() => {
    // Scroll to top on video change
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (!videoId) return;

    setLoading(true);
    setError(null);

    videoApi.getVideoById(videoId)
      .then((res) => {
        setVideo(res.data);
      })
      .catch((err) => {
        console.error('Error fetching video:', err);
        setError(err.response?.data?.message || 'Failed to load video');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [videoId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-10 h-10 text-brand animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Loading video stream...</p>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-display font-bold text-white mb-2">Video Unavailable</h2>
        <p className="text-sm text-gray-400 mb-6">
          {error || 'This video may have been removed by the creator.'}
        </p>
        <Link to="/" className="btn-primary">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`mx-auto px-4 sm:px-6 lg:px-8 py-6 ${
        isTheater ? 'max-w-none' : 'max-w-[1700px]'
      }`}
    >
      <div className={`flex flex-col gap-6 ${isTheater ? '' : 'lg:flex-row'}`}>
        {/* Left Column: Player, Video Info, Comments */}
        <div className="flex-1 min-w-0">
          <VideoPlayer
            videoSrc={video.videoFile}
            poster={video.thumbnail}
            autoPlay={true}
            isTheater={isTheater}
            onToggleTheater={toggleTheater}
          />

          <VideoInfo
            video={video}
            onOpenSavePlaylist={() => setIsSavePlaylistOpen(true)}
          />

          <CommentsSection videoId={video._id} />
        </div>

        {/* Right Column: Up Next / Related Videos */}
        <div className={`w-full shrink-0 ${isTheater ? '' : 'lg:w-[380px] xl:w-[420px]'}`}>
          <RelatedVideos currentVideoId={video._id} />
        </div>
      </div>

      {/* Save to Playlist Modal */}
      <SaveToPlaylistModal
        isOpen={isSavePlaylistOpen}
        onClose={() => setIsSavePlaylistOpen(false)}
        videoId={video._id}
      />
    </div>
  );
};
