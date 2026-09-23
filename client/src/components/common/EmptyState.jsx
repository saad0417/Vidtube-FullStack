import React from 'react';
import { VideoOff } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = VideoOff,
  title = 'No content found',
  description = 'There is nothing to display here yet.',
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 my-6 rounded-2xl bg-dark-surface/40 border border-dark-border/40 max-w-md mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-dark-card border border-dark-border/80 flex items-center justify-center text-gray-400 mb-4 shadow-inner">
        <Icon className="w-8 h-8 text-brand/80" />
      </div>
      <h3 className="text-xl font-display font-semibold text-white mb-1.5">{title}</h3>
      <p className="text-sm text-gray-400 max-w-xs mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn-primary"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
