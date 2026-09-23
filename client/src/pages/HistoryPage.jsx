import React, { useState, useEffect } from 'react';
import { History } from 'lucide-react';
import { authApi } from '../api/auth.api';
import { VideoListItem } from '../components/common/VideoListItem';
import { EmptyState } from '../components/common/EmptyState';
import { PageHeader } from '../components/common/PageHeader';
import { Spinner } from '../components/common/Spinner';
import { getErrorMessage } from '../utils/helpers';
import toast from 'react-hot-toast';

export const HistoryPage = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    authApi
      .getWatchHistory()
      .then((res) => {
        if (cancelled) return;
        // Most recently watched should read first.
        setVideos(Array.isArray(res.data) ? [...res.data].reverse() : []);
      })
      .catch((error) => {
        if (cancelled) return;
        toast.error(getErrorMessage(error, 'Could not load your watch history'));
        setVideos([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <Spinner label="Loading your watch history..." />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      <PageHeader
        icon={History}
        title="Watch history"
        subtitle={
          videos.length
            ? `${videos.length} ${videos.length === 1 ? 'video' : 'videos'} you've watched`
            : 'Videos you watch show up here'
        }
      />

      {videos.length === 0 ? (
        <EmptyState
          icon={History}
          title="Nothing watched yet"
          description="Once you start watching videos, they'll appear here so you can pick up where you left off."
          actionLabel="Browse videos"
          onAction={() => window.location.assign('/')}
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
