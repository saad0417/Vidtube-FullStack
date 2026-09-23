import React, { useState, useEffect } from 'react';
import { ThumbsUp } from 'lucide-react';
import { likeApi } from '../api/like.api';
import { VideoListItem } from '../components/common/VideoListItem';
import { EmptyState } from '../components/common/EmptyState';
import { PageHeader } from '../components/common/PageHeader';
import { Spinner } from '../components/common/Spinner';
import { getErrorMessage } from '../utils/helpers';
import toast from 'react-hot-toast';

export const LikedVideosPage = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    likeApi
      .getLikedVideos()
      .then((res) => {
        if (cancelled) return;
        // The API returns Like documents with the video populated; a like whose
        // video was later deleted comes back with a null `video`.
        const liked = Array.isArray(res.data)
          ? res.data.map((like) => like.video).filter(Boolean)
          : [];
        setVideos(liked);
      })
      .catch((error) => {
        if (cancelled) return;
        toast.error(getErrorMessage(error, 'Could not load your liked videos'));
        setVideos([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <Spinner label="Loading your liked videos..." />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      <PageHeader
        icon={ThumbsUp}
        title="Liked videos"
        subtitle={
          videos.length
            ? `${videos.length} ${videos.length === 1 ? 'video' : 'videos'} you've liked`
            : 'Videos you like are collected here'
        }
      />

      {videos.length === 0 ? (
        <EmptyState
          icon={ThumbsUp}
          title="No liked videos yet"
          description="Tap the like button on any video and it will be saved to this list."
        />
      ) : (
        <div className="space-y-6">
          {videos.map((video) => (
            <VideoListItem key={video._id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
};
