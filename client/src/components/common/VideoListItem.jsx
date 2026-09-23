import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDuration, formatViews, timeAgo } from '../../utils/formatters';
import { getVideoOwner, DEFAULT_THUMBNAIL, DEFAULT_AVATAR } from '../../utils/helpers';

/**
 * Wide, horizontal video row used by search results, history and liked videos —
 * the layouts where a description and more metadata earn their space.
 */
export const VideoListItem = ({ video, showDescription = true, action = null }) => {
  const [thumbError, setThumbError] = useState(false);

  if (!video) return null;

  const owner = getVideoOwner(video);

  return (
    <div className="flex flex-col sm:flex-row gap-4 group">
      <Link
        to={`/watch/${video._id}`}
        className="relative block w-full sm:w-64 md:w-80 shrink-0 aspect-video rounded-xl overflow-hidden bg-dark-card border border-dark-border/40"
      >
        <img
          src={thumbError ? DEFAULT_THUMBNAIL : video.thumbnail || DEFAULT_THUMBNAIL}
          alt={video.title}
          onError={() => setThumbError(true)}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
        />
        {video.duration > 0 && (
          <span className="overlay-chip absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-xs font-semibold">
            {formatDuration(video.duration)}
          </span>
        )}
      </Link>

      <div className="flex-1 min-w-0 flex gap-3">
        <div className="flex-1 min-w-0">
          <Link to={`/watch/${video._id}`}>
            <h3
              className="text-base font-semibold text-white line-clamp-2 leading-snug group-hover:text-brand-light transition-colors"
              title={video.title}
            >
              {video.title}
            </h3>
          </Link>

          <div className="text-xs text-gray-400 flex items-center gap-1.5 mt-1.5">
            <span>{formatViews(video.views)}</span>
            <span>•</span>
            <span>{timeAgo(video.createdAt)}</span>
          </div>

          {owner.username ? (
            <Link
              to={`/c/${owner.username}`}
              className="inline-flex items-center gap-2 mt-3 text-xs text-gray-400 hover:text-white transition-colors"
            >
              <img
                src={owner.avatar}
                alt={owner.fullName}
                className="w-6 h-6 rounded-full object-cover border border-dark-border"
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_AVATAR;
                }}
              />
              <span className="truncate">{owner.fullName}</span>
            </Link>
          ) : (
            <span className="inline-block mt-3 text-xs text-gray-500">Unknown creator</span>
          )}

          {showDescription && video.description && (
            <p className="hidden md:block text-xs text-gray-400 line-clamp-2 mt-2 leading-relaxed">
              {video.description}
            </p>
          )}
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
};
