import React from 'react';

export const VideoCardSkeleton = () => {
  return (
    <div className="flex flex-col gap-3">
      {/* Thumbnail skeleton */}
      <div className="w-full aspect-video rounded-xl bg-dark-card skeleton" />

      {/* Details skeleton */}
      <div className="flex gap-3 items-start px-0.5">
        <div className="w-9 h-9 rounded-full bg-dark-card skeleton shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-4 w-5/6 rounded bg-dark-card skeleton" />
          <div className="h-3 w-1/2 rounded bg-dark-card skeleton" />
          <div className="h-3 w-1/3 rounded bg-dark-card skeleton" />
        </div>
      </div>
    </div>
  );
};
