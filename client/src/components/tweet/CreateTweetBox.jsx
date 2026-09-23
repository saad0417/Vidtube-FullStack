import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { tweetApi } from '../../api/tweet.api';
import { Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const CreateTweetBox = ({ onTweetCreated }) => {
  const { user, isAuthenticated } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please sign in to post');
      return;
    }
    if (!content.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await tweetApi.createTweet(content.trim());
      const newTweet = {
        ...res.data,
        owner: {
          _id: user._id,
          username: user.username,
          fullName: user.fullName,
          avatar: user.avatar,
        },
        likesCount: 0,
        isLiked: false,
      };

      toast.success('Post published to Community!');
      setContent('');
      if (onTweetCreated) onTweetCreated(newTweet);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to publish post');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="p-4 rounded-2xl bg-dark-card border border-dark-border/60 shadow-sm">
      <div className="flex gap-4 items-start">
        <img
          src={user?.avatar}
          alt={user?.fullName}
          className="w-10 h-10 rounded-full object-cover border border-dark-border shrink-0 mt-1"
        />
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-3">
          <textarea
            placeholder="Share an update, question, or thought with your community..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full bg-dark-input/60 border border-dark-border/70 rounded-xl p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand transition-colors resize-none"
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {content.length}/500
            </span>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="btn-primary py-1.5 px-4 text-xs font-semibold"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Post</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
