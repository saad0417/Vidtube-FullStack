import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { SlidersHorizontal, SearchX, Loader2, CheckCircle2 } from 'lucide-react';
import { videoApi } from '../api/video.api';
import { authApi } from '../api/auth.api';
import { VideoListItem } from '../components/common/VideoListItem';
import { EmptyState } from '../components/common/EmptyState';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { formatSubscribers } from '../utils/formatters';
import { DEFAULT_AVATAR } from '../utils/helpers';

const SORT_OPTIONS = [
  { label: 'Most recent', sortBy: 'createdAt', sortType: 'desc' },
  { label: 'Oldest first', sortBy: 'createdAt', sortType: 'asc' },
  { label: 'Most viewed', sortBy: 'views', sortType: 'desc' },
  { label: 'A → Z', sortBy: 'title', sortType: 'asc' },
];

const PAGE_SIZE = 10;

export const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = (searchParams.get('q') || '').trim();

  const [videos, setVideos] = useState([]);
  const [channel, setChannel] = useState(null);
  const [totalDocs, setTotalDocs] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortIndex, setSortIndex] = useState(0);
  const [showSort, setShowSort] = useState(false);

  const fetchResults = useCallback(
    async (pageNum = 1, append = false) => {
      if (!query) {
        setVideos([]);
        setChannel(null);
        setLoading(false);
        return;
      }

      const { sortBy, sortType } = SORT_OPTIONS[sortIndex];

      try {
        if (append) setLoadingMore(true);
        else setLoading(true);

        const res = await videoApi.getAllVideos({
          query,
          page: pageNum,
          limit: PAGE_SIZE,
          sortBy,
          sortType,
        });

        const docs = res.data?.docs || [];
        setVideos((prev) => (append ? [...prev, ...docs] : docs));
        setTotalDocs(res.data?.totalDocs ?? docs.length);
        setHasMore(Boolean(res.data?.hasNextPage));
        setPage(pageNum);
      } catch (error) {
        console.error('Search failed:', error);
        if (!append) setVideos([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [query, sortIndex]
  );

  useEffect(() => {
    fetchResults(1, false);
  }, [fetchResults]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchResults(page + 1, true);
    }
  }, [loadingMore, hasMore, page, fetchResults]);

  const supportsObserver = typeof IntersectionObserver !== 'undefined';

  const sentinelRef = useInfiniteScroll(handleLoadMore, {
    enabled: hasMore && !loading && !loadingMore,
  });

  // A search term may also be an exact channel handle — surface it if so.
  useEffect(() => {
    let cancelled = false;
    if (!query) {
      setChannel(null);
      return undefined;
    }

    authApi
      .getUserChannelProfile(query.toLowerCase())
      .then((res) => {
        if (!cancelled) setChannel(res.data || null);
      })
      .catch(() => {
        if (!cancelled) setChannel(null);
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  if (!query) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <EmptyState
          icon={SearchX}
          title="Search VidTube"
          description="Type something into the search bar above to find videos and creators."
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      {/* Header + sort control */}
      <div className="flex items-center justify-between gap-4 border-b border-dark-border/60 pb-4">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-white truncate">
            Results for <span className="text-brand">“{query}”</span>
          </h1>
          {!loading && (
            <p className="text-xs text-gray-400 mt-0.5">
              {totalDocs} {totalDocs === 1 ? 'video' : 'videos'} found
            </p>
          )}
        </div>

        <div className="relative shrink-0">
          <button
            onClick={() => setShowSort((prev) => !prev)}
            className="btn-secondary text-xs px-3.5 py-2"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{SORT_OPTIONS[sortIndex].label}</span>
            <span className="sm:hidden">Sort</span>
          </button>

          {showSort && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowSort(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-dark-surface border border-dark-border rounded-xl shadow-2xl py-1.5 z-20">
                {SORT_OPTIONS.map((option, index) => (
                  <button
                    key={option.label}
                    onClick={() => {
                      setSortIndex(index);
                      setShowSort(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors ${
                      index === sortIndex
                        ? 'text-white bg-dark-hover font-medium'
                        : 'text-gray-300 hover:text-white hover:bg-dark-hover'
                    }`}
                  >
                    <span>{option.label}</span>
                    {index === sortIndex && <CheckCircle2 className="w-3.5 h-3.5 text-brand" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Matching channel */}
      {channel && (
        <Link
          to={`/c/${channel.username}`}
          className="flex items-center gap-5 p-5 rounded-2xl bg-dark-surface/50 border border-dark-border/60 hover:border-brand/40 transition-colors"
        >
          <img
            src={channel.avatar || DEFAULT_AVATAR}
            alt={channel.fullName}
            className="w-20 h-20 rounded-full object-cover border border-dark-border shrink-0"
            onError={(e) => {
              e.currentTarget.src = DEFAULT_AVATAR;
            }}
          />
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-white truncate">{channel.fullName}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              @{channel.username} • {formatSubscribers(channel.subscribersCount)}
            </p>
            <p className="text-xs text-gray-500 mt-2">Channel · View profile</p>
          </div>
        </Link>
      )}

      {/* Video results */}
      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-80 aspect-video rounded-xl bg-dark-card skeleton shrink-0" />
              <div className="flex-1 space-y-3 pt-1">
                <div className="h-4 w-3/4 rounded bg-dark-card skeleton" />
                <div className="h-3 w-1/3 rounded bg-dark-card skeleton" />
                <div className="h-3 w-1/2 rounded bg-dark-card skeleton" />
              </div>
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={channel ? 'No videos matched that search' : 'No results found'}
          description={`Nothing matched “${query}”. Try a different spelling or a broader term.`}
        />
      ) : (
        <div className="space-y-6">
          {videos.map((video) => (
            <VideoListItem key={video._id} video={video} />
          ))}
        </div>
      )}

      {!loading && hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          {loadingMore ? (
            <span className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin text-brand" />
              <span>Loading more results...</span>
            </span>
          ) : supportsObserver ? (
            // The sentinel above triggers the next page as it scrolls into view.
            <span className="h-5" aria-hidden="true" />
          ) : (
            // Fallback for browsers without IntersectionObserver.
            <button onClick={handleLoadMore} className="btn-secondary px-8 py-2.5 text-sm font-semibold">
              Show more results
            </button>
          )}
        </div>
      )}

      {!loading && !hasMore && videos.length > 0 && (
        <p className="text-center text-xs text-gray-500 py-8">
          No more results for this search.
        </p>
      )}
    </div>
  );
};
