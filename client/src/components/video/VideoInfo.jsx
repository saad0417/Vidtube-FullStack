import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ThumbsUp, 
  Share2, 
  BookmarkPlus, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Bell 
} from 'lucide-react';
import { formatViews, formatSubscribers, formatDate } from '../../utils/formatters';
import { copyToClipboard, getErrorMessage, DEFAULT_AVATAR } from '../../utils/helpers';
import { likeApi } from '../../api/like.api';
import { subscriptionApi } from '../../api/subscription.api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export const VideoInfo = ({ video, onOpenSavePlaylist }) => {
  const { user, isAuthenticated } = useAuth();
  
  const [isLiked, setIsLiked] = useState(video?.isLiked || false);
  const [likesCount, setLikesCount] = useState(video?.likesCount || 0);
  const [isSubscribed, setIsSubscribed] = useState(video?.isSubscribed || false);
  const [subscribersCount, setSubscribersCount] = useState(video?.subscribersCount || 0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  if (!video) return null;

  const owner = video.owner || {};
  const isChannelOwner = user?._id && (user._id === owner._id || user.username === owner.username);

  const handleToggleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to like this video');
      return;
    }
    if (isLiking) return;

    // Optimistic UI update
    const prevLiked = isLiked;
    const prevCount = likesCount;
    setIsLiked(!prevLiked);
    setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);
    setIsLiking(true);

    try {
      await likeApi.toggleVideoLike(video._id);
    } catch (error) {
      // Revert on error
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
      toast.error(getErrorMessage(error, 'Failed to update like status'));
    } finally {
      setIsLiking(false);
    }
  };

  const handleToggleSubscription = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to subscribe');
      return;
    }
    if (isChannelOwner) {
      toast('You cannot subscribe to your own channel', { icon: 'ℹ️' });
      return;
    }
    if (!owner._id) return;
    if (isSubscribing) return;

    // Optimistic UI update
    const prevSub = isSubscribed;
    const prevCount = subscribersCount;
    setIsSubscribed(!prevSub);
    setSubscribersCount(prevSub ? Math.max(0, prevCount - 1) : prevCount + 1);
    setIsSubscribing(true);

    try {
      await subscriptionApi.toggleSubscription(owner._id);
      toast.success(prevSub ? 'Unsubscribed' : 'Subscribed to channel!');
    } catch {
      setIsSubscribed(prevSub);
      setSubscribersCount(prevCount);
      toast.error('Failed to update subscription');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleShare = async () => {
    const success = await copyToClipboard(window.location.href);
    if (success) {
      toast.success('Link copied to clipboard!');
    } else {
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className="flex flex-col gap-4 mt-4">
      {/* Video Title */}
      <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight">
        {video.title}
      </h1>

      {/* Channel Bar & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
        {/* Channel Details */}
        <div className="flex items-center gap-3">
          <Link to={`/c/${owner.username}`}>
            <img
              src={owner.avatar || DEFAULT_AVATAR}
              alt={owner.fullName || owner.username}
              className="w-11 h-11 rounded-full object-cover border border-dark-border"
              onError={(e) => {
                e.target.src = DEFAULT_AVATAR;
              }}
            />
          </Link>

          <div className="flex flex-col">
            <Link
              to={`/c/${owner.username}`}
              className="text-base font-semibold text-white hover:text-gray-200 flex items-center gap-1.5 transition-colors"
            >
              <span>{owner.fullName || owner.username}</span>
              <CheckCircle2 className="w-4 h-4 text-gray-400" />
            </Link>
            <span className="text-xs text-gray-400">
              {formatSubscribers(subscribersCount)}
            </span>
          </div>

          {/* Subscribe Button */}
          {!isChannelOwner && (
            <button
              onClick={handleToggleSubscription}
              disabled={isSubscribing}
              className={`ml-3 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 shadow-sm active:scale-95 ${
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

        {/* Action Buttons: Like, Share, Save */}
        <div className="flex items-center gap-2">
          {/* Like Button */}
          <button
            onClick={handleToggleLike}
            disabled={isLiking}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all active:scale-95 ${
              isLiked
                ? 'bg-brand/15 border-brand/40 text-brand font-semibold'
                : 'bg-dark-card hover:bg-dark-hover border-dark-border text-white'
            }`}
            title="Like this video"
          >
            <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-brand text-brand' : ''}`} />
            <span>{likesCount > 0 ? likesCount : 'Like'}</span>
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-dark-card hover:bg-dark-hover border border-dark-border text-white transition-all active:scale-95"
            title="Share video link"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>

          {/* Save to Playlist */}
          <button
            onClick={onOpenSavePlaylist}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-dark-card hover:bg-dark-hover border border-dark-border text-white transition-all active:scale-95"
            title="Save to playlist"
          >
            <BookmarkPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Save</span>
          </button>
        </div>
      </div>

      {/* Video Description Box */}
      <div
        className="p-4 rounded-2xl bg-dark-card/90 border border-dark-border/60 text-sm cursor-pointer hover:bg-dark-card transition-colors"
        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
      >
        <div className="flex items-center gap-3 font-semibold text-white mb-2">
          <span>{formatViews(video.views)}</span>
          <span>•</span>
          <span>Published {formatDate(video.createdAt)}</span>
        </div>

        <p className={`text-gray-300 whitespace-pre-line leading-relaxed ${isDescriptionExpanded ? '' : 'line-clamp-3'}`}>
          {video.description}
        </p>

        <button
          className="mt-2 text-xs font-semibold text-gray-400 hover:text-white flex items-center gap-1 focus:outline-none"
        >
          <span>{isDescriptionExpanded ? 'Show less' : '...more'}</span>
          {isDescriptionExpanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
};
