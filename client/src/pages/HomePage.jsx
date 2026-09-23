import React, { useState, useEffect, useCallback } from 'react';
import { videoApi } from '../api/video.api';
import { VideoCard } from '../components/common/VideoCard';
import { VideoCardSkeleton } from '../components/common/VideoCardSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { Loader2 } from 'lucide-react';

const CATEGORIES = [
  'All',
  'Artificial Intelligence',
  'React',
  'JavaScript',
  'Node.js',
  'Computer Science',
  'Web Development',
  'Coding Tutorials',
  'Recently Uploaded'
];

export const HomePage = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortType, setSortType] = useState('desc');

  const [videos, setVideos] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchVideos = useCallback(async (pageNum = 1, isAppend = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const params = {
        page: pageNum,
        limit: 12,
        sortBy,
        sortType,
      };

      if (selectedCategory !== 'All' && selectedCategory !== 'Recently Uploaded') {
        params.query = selectedCategory;
      }

      const res = await videoApi.getAllVideos(params);
      const docs = res.data?.docs || res.data || [];
      const hasNext = res.data?.hasNextPage || false;

      if (isAppend) {
        setVideos((prev) => [...prev, ...docs]);
      } else {
        setVideos(docs);
      }

      setHasMore(hasNext);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedCategory, sortBy, sortType]);

  useEffect(() => {
    fetchVideos(1, false);
  }, [fetchVideos]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    if (category === 'Recently Uploaded') {
      setSortBy('createdAt');
      setSortType('desc');
    }
  };

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchVideos(page + 1, true);
    }
  }, [loadingMore, hasMore, page, fetchVideos]);

  // Pull the next page in as soon as the sentinel nears the viewport.
  const supportsObserver = typeof IntersectionObserver !== 'undefined';

  const sentinelRef = useInfiniteScroll(handleLoadMore, {
    enabled: hasMore && !loading && !loadingMore,
  });

  return (
    <div className="flex flex-col gap-6 py-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => handleCategoryChange(category)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 ${
              selectedCategory === category
                ? 'bg-white text-black shadow-md'
                : 'bg-dark-card hover:bg-dark-hover text-gray-300 hover:text-white border border-dark-border/60'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Main Video Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <VideoCardSkeleton key={n} />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <EmptyState
          title="No videos found"
          description="Try selecting a different topic or check back later for new uploads."
          actionLabel="Explore All Videos"
          onAction={() => handleCategoryChange('All')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
          {videos.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      {!loading && hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          {loadingMore ? (
            <span className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin text-brand" />
              <span>Loading more videos...</span>
            </span>
          ) : supportsObserver ? (
            // The sentinel above triggers the next page as it scrolls into view.
            <span className="h-5" aria-hidden="true" />
          ) : (
            // Fallback for browsers without IntersectionObserver.
            <button onClick={handleLoadMore} className="btn-secondary px-8 py-2.5 text-sm font-semibold">
              Load more
            </button>
          )}
        </div>
      )}

      {!loading && !hasMore && videos.length > 0 && (
        <p className="text-center text-xs text-gray-500 py-8">
          You've reached the end.
        </p>
      )}
    </div>
  );
};
