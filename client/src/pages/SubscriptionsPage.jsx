import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Tv, Users } from 'lucide-react';
import { subscriptionApi } from '../api/subscription.api';
import { videoApi } from '../api/video.api';
import { useAuth } from '../context/AuthContext';
import { VideoCard } from '../components/common/VideoCard';
import { VideoCardSkeleton } from '../components/common/VideoCardSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { PageHeader } from '../components/common/PageHeader';
import { DEFAULT_AVATAR, getErrorMessage } from '../utils/helpers';
import toast from 'react-hot-toast';

export const SubscriptionsPage = () => {
  const { user } = useAuth();
  const userId = user?._id;

  const [channels, setChannels] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFeed = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);

      const subsRes = await subscriptionApi.getSubscribedChannels(userId);
      const subscribed = (Array.isArray(subsRes.data) ? subsRes.data : [])
        .map((sub) => sub.channel)
        .filter(Boolean);

      setChannels(subscribed);

      if (subscribed.length === 0) {
        setVideos([]);
        return;
      }

      // There is no combined feed endpoint, so pull each channel's uploads and
      // merge them into one reverse-chronological list.
      const perChannel = await Promise.all(
        subscribed.map((channel) =>
          videoApi
            .getAllVideos({ username: channel.username, limit: 12, sortBy: 'createdAt', sortType: 'desc' })
            .then((res) => res.data?.docs || [])
            .catch(() => [])
        )
      );

      const merged = perChannel
        .flat()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setVideos(merged);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not load your subscriptions'));
      setChannels([]);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      <PageHeader
        icon={Tv}
        title="Subscriptions"
        subtitle={
          channels.length
            ? `Latest uploads from ${channels.length} ${channels.length === 1 ? 'channel' : 'channels'}`
            : 'Uploads from channels you follow'
        }
      />

      {/* Channel strip */}
      {channels.length > 0 && (
        <div className="flex items-center gap-5 overflow-x-auto pb-3 border-b border-dark-border/60">
          {channels.map((channel) => (
            <Link
              key={channel._id}
              to={`/c/${channel.username}`}
              className="flex flex-col items-center gap-2 shrink-0 w-20 group"
            >
              <img
                src={channel.avatar || DEFAULT_AVATAR}
                alt={channel.fullName}
                className="w-14 h-14 rounded-full object-cover border-2 border-transparent group-hover:border-brand/60 transition-colors"
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_AVATAR;
                }}
              />
              <span className="text-[11px] text-gray-400 group-hover:text-white text-center truncate w-full transition-colors">
                {channel.fullName || channel.username}
              </span>
            </Link>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <VideoCardSkeleton key={n} />
          ))}
        </div>
      ) : channels.length === 0 ? (
        <EmptyState
          icon={Users}
          title="You haven't subscribed to anyone yet"
          description="Subscribe to a channel and their newest uploads will collect here."
          actionLabel="Find channels"
          onAction={() => window.location.assign('/')}
        />
      ) : videos.length === 0 ? (
        <EmptyState
          icon={Tv}
          title="No uploads yet"
          description="The channels you follow haven't published anything so far."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
          {videos.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
};
