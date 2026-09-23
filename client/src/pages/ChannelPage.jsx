import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import { videoApi } from '../api/video.api';
import { playlistApi } from '../api/playlist.api';
import { tweetApi } from '../api/tweet.api';
import { subscriptionApi } from '../api/subscription.api';
import { useAuth } from '../context/AuthContext';
import { VideoCard } from '../components/common/VideoCard';
import { TweetCard } from '../components/tweet/TweetCard';
import { EmptyState } from '../components/common/EmptyState';
import { formatSubscribers } from '../utils/formatters';
import { 
  CheckCircle2, 
  Bell, 
  Settings, 
  Video, 
  ListVideo, 
  MessageSquare, 
  Info, 
  Loader2 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DEFAULT_AVATAR, DEFAULT_THUMBNAIL } from '../utils/helpers';

export const ChannelPage = () => {
  const { username } = useParams();
  const { user: currentUser, isAuthenticated, isCreator } = useAuth();

  const [channel, setChannel] = useState(null);
  const [activeTab, setActiveTab] = useState('videos');
  const [loading, setLoading] = useState(true);

  // Tab Data States
  const [channelVideos, setChannelVideos] = useState([]);
  const [channelPlaylists, setChannelPlaylists] = useState([]);
  const [channelTweets, setChannelTweets] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const isChannelOwner = currentUser && channel && (currentUser.username === channel.username || currentUser._id === channel._id);

  const fetchChannelData = useCallback(async () => {
    if (!username) return;
    try {
      setLoading(true);
      const res = await authApi.getUserChannelProfile(username);
      const data = res.data;
      setChannel(data);
      setIsSubscribed(data.isSubscribed || false);
      setSubscribersCount(data.subscribersCount || 0);

      // Fetch user's videos
      const videosRes = await videoApi.getAllVideos({ username });
      setChannelVideos(videosRes.data?.docs || videosRes.data || []);

      // If channel has _id, fetch playlists & tweets
      if (data._id) {
        playlistApi.getUserPlaylists(data._id)
          .then((pRes) => setChannelPlaylists(Array.isArray(pRes.data) ? pRes.data : []))
          .catch(() => setChannelPlaylists([]));

        tweetApi.getUserTweets(data._id)
          .then((tRes) => setChannelTweets(Array.isArray(tRes.data) ? tRes.data : []))
          .catch(() => setChannelTweets([]));
      }
    } catch (error) {
      console.error('Failed to load channel:', error);
      toast.error('Channel not found');
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchChannelData();
  }, [fetchChannelData]);

  const handleToggleSubscription = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to subscribe');
      return;
    }
    if (isChannelOwner) return;
    if (isSubscribing || !channel?._id) return;

    const prevSub = isSubscribed;
    const prevCount = subscribersCount;
    setIsSubscribed(!prevSub);
    setSubscribersCount(prevSub ? Math.max(0, prevCount - 1) : prevCount + 1);
    setIsSubscribing(true);

    try {
      await subscriptionApi.toggleSubscription(channel._id);
      toast.success(prevSub ? 'Unsubscribed' : 'Subscribed to channel!');
    } catch {
      setIsSubscribed(prevSub);
      setSubscribersCount(prevCount);
      toast.error('Failed to update subscription');
    } finally {
      setIsSubscribing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
        <p className="text-sm text-gray-400">Loading channel...</p>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Channel Not Found</h2>
        <p className="text-sm text-gray-400 mb-4">The channel you are looking for does not exist.</p>
        <Link to="/" className="btn-primary">Go to Home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full pb-12">
      {/* Channel Cover Banner */}
      <div className="w-full h-36 sm:h-52 md:h-64 rounded-b-2xl overflow-hidden relative bg-gradient-to-r from-dark-card via-dark-surface to-dark-card">
        {channel.coverImage ? (
          <>
            {/* Banners are uploaded at every aspect ratio. A blurred, scaled
                copy fills the box so the real image can sit inside it whole —
                no cropped-off headline, no letterbox bars. */}
            <img
              src={channel.coverImage}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-60"
            />
            <img
              src={channel.coverImage}
              alt={`${channel.fullName} channel banner`}
              className="relative w-full h-full object-contain"
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 font-display font-bold text-4xl select-none">
            {channel.fullName}
          </div>
        )}
      </div>

      {/* Channel Header Bar */}
      <div className="px-4 sm:px-8 pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <img
            src={channel.avatar || DEFAULT_AVATAR}
            alt={channel.fullName}
            className="w-20 h-20 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-dark-base shadow-xl -mt-10 sm:-mt-14"
          />
          <div className="flex flex-col">
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
              <span>{channel.fullName}</span>
              <CheckCircle2 className="w-5 h-5 text-gray-400" />
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              @{channel.username}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
              <span className="font-semibold text-gray-200">
                {formatSubscribers(subscribersCount)}
              </span>
              <span>•</span>
              <span>{channelVideos.length} videos</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div>
          {isChannelOwner ? (
            <div className="flex items-center gap-3">
              {isCreator ? (
                <Link to="/studio" className="btn-primary">
                  VidTube Studio
                </Link>
              ) : (
                <Link to="/create-channel" className="btn-primary">
                  Create channel
                </Link>
              )}
              <Link to="/settings" className="btn-secondary">
                <Settings className="w-4 h-4" />
                <span>Customize</span>
              </Link>
            </div>
          ) : (
            <button
              onClick={handleToggleSubscription}
              disabled={isSubscribing}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2 shadow-md active:scale-95 ${
                isSubscribed
                  ? 'bg-dark-card hover:bg-dark-hover text-gray-300 border border-dark-border'
                  : 'bg-white hover:bg-gray-200 text-black'
              }`}
            >
              {isSubscribed ? (
                <>
                  <Bell className="w-4 h-4 text-brand" />
                  <span>Subscribed</span>
                </>
              ) : (
                <span>Subscribe</span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-8 px-4 sm:px-8 mt-8 border-b border-dark-border/60">
        {[
          { id: 'videos', label: 'Videos', icon: Video },
          { id: 'playlists', label: 'Playlists', icon: ListVideo },
          { id: 'community', label: 'Community', icon: MessageSquare },
          { id: 'about', label: 'About', icon: Info },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-all capitalize ${
                isActive
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="px-4 sm:px-8 pt-6">
        {/* Videos Tab */}
        {activeTab === 'videos' && (
          channelVideos.length === 0 ? (
            <EmptyState
              title="No videos published"
              description="This creator hasn't published any videos yet."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
              {channelVideos.map((video) => (
                <VideoCard key={video._id} video={video} />
              ))}
            </div>
          )
        )}

        {/* Playlists Tab */}
        {activeTab === 'playlists' && (
          channelPlaylists.length === 0 ? (
            <EmptyState
              icon={ListVideo}
              title="No playlists available"
              description="This channel does not have any public playlists."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {channelPlaylists.map((pl) => (
                <Link
                  key={pl._id}
                  to={`/playlist/${pl._id}`}
                  className="flex flex-col gap-2 group rounded-xl overflow-hidden bg-dark-card border border-dark-border p-3 hover:border-dark-hover transition-all"
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-dark-input">
                    <img
                      src={pl.videos?.[0]?.thumbnail || DEFAULT_THUMBNAIL}
                      alt={pl.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-y-0 right-0 w-2/5 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                      <ListVideo className="w-6 h-6 mb-1" />
                      <span className="text-xs font-bold">{pl.videos?.length || 0} videos</span>
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-white group-hover:text-brand transition-colors truncate mt-1">
                    {pl.title}
                  </h3>
                  <p className="text-xs text-gray-400 line-clamp-2">
                    {pl.description}
                  </p>
                </Link>
              ))}
            </div>
          )
        )}

        {/* Community Tab */}
        {activeTab === 'community' && (
          channelTweets.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No community posts"
              description="This channel has not posted any updates yet."
            />
          ) : (
            <div className="flex flex-col gap-4 max-w-2xl mx-auto">
              {channelTweets.map((tweet) => (
                <TweetCard
                  key={tweet._id}
                  tweet={tweet}
                  onTweetDeleted={(deletedId) =>
                    setChannelTweets((prev) => prev.filter((t) => t._id !== deletedId))
                  }
                  onTweetUpdated={(updated) =>
                    setChannelTweets((prev) =>
                      prev.map((t) => (t._id === updated._id ? updated : t))
                    )
                  }
                />
              ))}
            </div>
          )
        )}

        {/* About Tab */}
        {activeTab === 'about' && (
          <div className="max-w-xl bg-dark-card rounded-2xl border border-dark-border p-6 flex flex-col gap-4">
            <h3 className="text-lg font-bold text-white">About {channel.fullName}</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-400 block text-xs font-semibold uppercase">Email</span>
                <span className="text-gray-200">{channel.email || 'Private'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-xs font-semibold uppercase">Subscribers</span>
                <span className="text-gray-200">{formatSubscribers(subscribersCount)}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-xs font-semibold uppercase">Subscribed Channels</span>
                <span className="text-gray-200">{channel.channelSubscribedCount || 0} channels</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
