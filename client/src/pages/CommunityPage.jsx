import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare } from 'lucide-react';
import { tweetApi } from '../api/tweet.api';
import { CreateTweetBox } from '../components/tweet/CreateTweetBox';
import { TweetCard } from '../components/tweet/TweetCard';
import { EmptyState } from '../components/common/EmptyState';
import { PageHeader } from '../components/common/PageHeader';
import { getErrorMessage } from '../utils/helpers';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;

export const CommunityPage = () => {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  // The API returns the whole feed at once, so reveal it a page at a time
  // rather than rendering hundreds of posts up front.
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const loadTweets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await tweetApi.getAllTweets();
      setTweets(Array.isArray(res.data) ? res.data : []);
      setVisibleCount(PAGE_SIZE);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not load the community feed'));
      setTweets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTweets();
  }, [loadTweets]);

  const hasMore = visibleCount < tweets.length;

  const sentinelRef = useInfiniteScroll(
    () => setVisibleCount((count) => Math.min(count + PAGE_SIZE, tweets.length)),
    { enabled: hasMore && !loading }
  );

  // A newly created post comes back without its owner joined in, so refetch
  // rather than rendering a post with a missing author.
  const handleCreated = () => loadTweets();

  const handleDeleted = (tweetId) =>
    setTweets((prev) => prev.filter((tweet) => tweet._id !== tweetId));

  const handleUpdated = (updated) =>
    setTweets((prev) =>
      prev.map((tweet) =>
        tweet._id === updated?._id ? { ...tweet, content: updated.content } : tweet
      )
    );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
      <PageHeader
        icon={MessageSquare}
        title="Community"
        subtitle="Short posts from creators across VidTube"
      />

      <CreateTweetBox onTweetCreated={handleCreated} />

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="p-5 rounded-2xl bg-dark-card border border-dark-border/60">
              <div className="flex gap-3.5">
                <div className="w-10 h-10 rounded-full bg-dark-hover skeleton shrink-0" />
                <div className="flex-1 space-y-2.5 pt-1">
                  <div className="h-3 w-1/3 rounded bg-dark-hover skeleton" />
                  <div className="h-3 w-full rounded bg-dark-hover skeleton" />
                  <div className="h-3 w-2/3 rounded bg-dark-hover skeleton" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : tweets.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No posts yet"
          description="Be the first to share an update with the VidTube community."
        />
      ) : (
        <div className="space-y-4">
          {tweets.slice(0, visibleCount).map((tweet) => (
            <TweetCard
              key={tweet._id}
              tweet={tweet}
              onTweetDeleted={handleDeleted}
              onTweetUpdated={handleUpdated}
            />
          ))}

          {hasMore && <div ref={sentinelRef} className="h-8" aria-hidden="true" />}
        </div>
      )}
    </div>
  );
};
