import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ThumbsUp, Trash2, Edit3, Loader2 } from 'lucide-react';
import { timeAgo } from '../../utils/formatters';
import { likeApi } from '../../api/like.api';
import { tweetApi } from '../../api/tweet.api';
import { useAuth } from '../../context/AuthContext';
import { ConfirmationModal } from '../common/ConfirmationModal';
import toast from 'react-hot-toast';
import { getErrorMessage, DEFAULT_AVATAR } from '../../utils/helpers';

export const TweetCard = ({ tweet, onTweetDeleted, onTweetUpdated }) => {
  const { user, isAuthenticated } = useAuth();

  const [isLiked, setIsLiked] = useState(tweet?.isLiked || false);
  const [likesCount, setLikesCount] = useState(tweet?.likesCount || 0);
  const [isLiking, setIsLiking] = useState(false);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(tweet?.content || '');
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!tweet) return null;

  const author = tweet.owner || {};
  const isAuthor = user?._id && (user._id === author._id || user._id === tweet.owner);

  const handleToggleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to like this post');
      return;
    }
    if (isLiking) return;

    // Optimistic toggle
    const prevLiked = isLiked;
    const prevCount = likesCount;
    setIsLiked(!prevLiked);
    setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);
    setIsLiking(true);

    try {
      await likeApi.toggleTweetLike(tweet._id);
    } catch (error) {
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
      toast.error(getErrorMessage(error, 'Failed to update like'));
    } finally {
      setIsLiking(false);
    }
  };

  const handleUpdate = async () => {
    if (!editContent.trim()) return;
    try {
      setIsUpdating(true);
      const res = await tweetApi.updateTweet(tweet._id, editContent.trim());
      setIsEditing(false);
      toast.success('Post updated');
      if (onTweetUpdated) onTweetUpdated(res.data);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update post'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await tweetApi.deleteTweet(tweet._id);
      setShowDeleteModal(false);
      toast.success('Post deleted');
      if (onTweetDeleted) onTweetDeleted(tweet._id);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to delete post'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-dark-card border border-dark-border/60 hover:border-dark-border transition-colors">
      <div className="flex gap-3.5 items-start">
        {/* Author Avatar */}
        <Link to={`/c/${author.username || ''}`} className="shrink-0">
          <img
            src={author.avatar || DEFAULT_AVATAR}
            alt={author.fullName || 'Author'}
            className="w-10 h-10 rounded-full object-cover border border-dark-border"
          />
        </Link>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2 truncate">
              <Link
                to={`/c/${author.username || ''}`}
                className="text-sm font-semibold text-white hover:underline truncate"
              >
                {author.fullName || author.username || 'Creator'}
              </Link>
              <span className="text-xs text-gray-400">
                @{author.username || 'user'}
              </span>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs text-gray-400">
                {timeAgo(tweet.createdAt)}
              </span>
            </div>

            {/* Author Controls */}
            {isAuthor && !isEditing && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-dark-hover transition-colors"
                  title="Edit post"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-dark-hover transition-colors"
                  title="Delete post"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Post Content */}
          {isEditing ? (
            <div className="mt-2 flex flex-col gap-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                className="input-field w-full text-sm"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(tweet.content);
                  }}
                  className="px-3 py-1 text-xs text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={isUpdating || !editContent.trim()}
                  className="btn-primary py-1 px-3 text-xs"
                >
                  {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed break-words">
              {tweet.content}
            </p>
          )}

          {/* Like Action */}
          <div className="flex items-center gap-4 mt-3">
            <button
              onClick={handleToggleLike}
              disabled={isLiking}
              className={`flex items-center gap-1.5 text-xs font-medium py-1 px-2.5 rounded-full transition-colors active:scale-95 ${
                isLiked
                  ? 'bg-brand/15 text-brand font-semibold'
                  : 'text-gray-400 hover:text-white hover:bg-dark-hover'
              }`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-brand text-brand' : ''}`} />
              <span>{likesCount > 0 ? likesCount : 'Like'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete post"
        message="Are you sure you want to delete this community post?"
        confirmText="Delete"
        loading={isDeleting}
      />
    </div>
  );
};
