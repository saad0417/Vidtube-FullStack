import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDuration, formatViews, timeAgo } from '../../utils/formatters';
import { getVideoOwner, DEFAULT_THUMBNAIL, DEFAULT_AVATAR } from '../../utils/helpers';

export const VideoCard = ({ video }) => {
  const [thumbError, setThumbError] = useState(false);

  if (!video) return null;

  const owner = getVideoOwner(video);
  const channelPath = owner.username ? `/c/${owner.username}` : null;

  return (
    <div className="flex flex-col gap-3 group">
      {/* Thumbnail */}
      <Link
        to={`/watch/${video._id}`}
        className="relative block aspect-video rounded-xl overflow-hidden bg-dark-card border border-dark-border/40"
      >
        <img
          src={thumbError ? DEFAULT_THUMBNAIL : video.thumbnail || DEFAULT_THUMBNAIL}
          alt={video.title}
          onError={() => setThumbError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
          loading="lazy"
        />

        {video.duration > 0 && (
          <span className="overlay-chip absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-xs font-semibold tracking-wide">
            {formatDuration(video.duration)}
          </span>
        )}

        {video.isPublished === false && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-yellow-500/90 text-black text-[10px] font-bold uppercase tracking-wide">
            Private
          </span>
        )}
      </Link>

      {/* Details */}
      <div className="flex gap-3 items-start px-0.5">
        {channelPath ? (
          <Link to={channelPath} className="shrink-0 hover:opacity-80 transition-opacity">
            <img
              src={owner.avatar}
              alt={owner.fullName}
              className="w-9 h-9 rounded-full object-cover border border-dark-border/80"
              onError={(e) => {
                e.currentTarget.src = DEFAULT_AVATAR;
              }}
            />
          </Link>
        ) : (
          <img
            src={DEFAULT_AVATAR}
            alt=""
            className="w-9 h-9 rounded-full object-cover border border-dark-border/80 shrink-0"
          />
        )}

        <div className="flex flex-col flex-1 min-w-0">
          <Link to={`/watch/${video._id}`}>
            <h3
              className="text-sm font-semibold text-white line-clamp-2 leading-snug group-hover:text-brand-light transition-colors"
              title={video.title}
            >
              {video.title}
            </h3>
          </Link>

          {channelPath ? (
            <Link
              to={channelPath}
              className="text-xs text-gray-400 hover:text-white mt-1 truncate transition-colors w-fit max-w-full"
            >
              {owner.fullName}
            </Link>
          ) : (
            <span className="text-xs text-gray-500 mt-1">Unknown creator</span>
          )}

          <div className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
            <span>{formatViews(video.views)}</span>
            <span>•</span>
            <span>{timeAgo(video.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
