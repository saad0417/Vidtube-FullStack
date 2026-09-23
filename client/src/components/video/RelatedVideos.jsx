import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { videoApi } from '../../api/video.api';
import { formatDuration, formatViews, timeAgo } from '../../utils/formatters';
import { DEFAULT_THUMBNAIL } from '../../utils/helpers';

export const RelatedVideos = ({ currentVideoId }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    videoApi.getAllVideos({ limit: 12 })
      .then((res) => {
        const docs = res.data?.docs || res.data || [];
        // Exclude currently playing video
        setVideos(docs.filter((v) => v._id !== currentVideoId));
      })
      .catch((err) => console.error('Error fetching related videos:', err))
      .finally(() => setLoading(false));
  }, [currentVideoId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="w-40 aspect-video rounded-xl bg-dark-card skeleton shrink-0" />
            <div className="flex-1 flex flex-col gap-2 pt-1">
              <div className="h-3 w-5/6 rounded bg-dark-card skeleton" />
              <div className="h-2.5 w-1/2 rounded bg-dark-card skeleton" />
              <div className="h-2.5 w-1/3 rounded bg-dark-card skeleton" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-sm text-gray-400 p-4 text-center">
        No related videos found
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-base font-bold text-white mb-1">Up next</h3>
      {videos.map((video) => {
        const owner = video.owner || {};
        const ownerName = owner.fullName || owner.username || 'Creator';

        return (
          <Link
            key={video._id}
            to={`/watch/${video._id}`}
            className="flex gap-3 group hover:bg-dark-hover/40 p-1.5 rounded-xl transition-colors"
          >
            {/* Thumbnail */}
            <div className="relative w-40 aspect-video rounded-lg overflow-hidden bg-dark-card shrink-0">
              <img
                src={video.thumbnail || DEFAULT_THUMBNAIL}
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
              {video.duration > 0 && (
                <div className="overlay-chip absolute bottom-1 right-1 px-1 py-0.2 rounded text-[10px] font-semibold ">
                  {formatDuration(video.duration)}
                </div>
              )}
            </div>

            {/* Meta */}
            <div className="flex flex-col min-w-0 flex-1 justify-start">
              <h4 className="text-xs sm:text-sm font-semibold text-white line-clamp-2 leading-snug group-hover:text-brand-light transition-colors">
                {video.title}
              </h4>
              <p className="text-xs text-gray-400 truncate mt-1">
                {ownerName}
              </p>
              <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                <span>{formatViews(video.views)}</span>
                <span>•</span>
                <span>{timeAgo(video.createdAt)}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};
