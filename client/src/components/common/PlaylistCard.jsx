import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ListVideo, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { DEFAULT_THUMBNAIL } from '../../utils/helpers';

export const PlaylistCard = ({ playlist, onEdit, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  if (!playlist) return null;

  const videos = Array.isArray(playlist.videos) ? playlist.videos : [];
  const cover = videos[0]?.thumbnail || DEFAULT_THUMBNAIL;
  const showMenu = Boolean(onEdit || onDelete);

  return (
    <div className="flex flex-col gap-3 group relative">
      <Link
        to={`/playlist/${playlist._id}`}
        className="relative block aspect-video rounded-xl overflow-hidden bg-dark-card border border-dark-border/40"
      >
        <img
          src={cover}
          alt={playlist.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.src = DEFAULT_THUMBNAIL;
          }}
        />

        {/* Stacked-sheet affordance on the right edge */}
        <div className="overlay-chip absolute inset-y-0 right-0 w-[38%] flex flex-col items-center justify-center gap-1">
          <ListVideo className="w-5 h-5" />
          <span className="text-sm font-semibold">{videos.length}</span>
          <span className="text-[10px] uppercase tracking-wider text-gray-300">
            {videos.length === 1 ? 'video' : 'videos'}
          </span>
        </div>
      </Link>

      <div className="flex items-start gap-2 px-0.5">
        <div className="flex-1 min-w-0">
          <Link to={`/playlist/${playlist._id}`}>
            <h3 className="text-sm font-semibold text-white line-clamp-2 leading-snug group-hover:text-brand-light transition-colors">
              {playlist.title}
            </h3>
          </Link>
          {playlist.description && (
            <p className="text-xs text-gray-400 line-clamp-2 mt-1 leading-relaxed">
              {playlist.description}
            </p>
          )}
          <Link
            to={`/playlist/${playlist._id}`}
            className="inline-block text-xs text-gray-400 hover:text-white mt-1.5 transition-colors"
          >
            View full playlist
          </Link>
        </div>

        {showMenu && (
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-dark-hover rounded-full transition-colors"
              aria-label="Playlist options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-1 w-40 bg-dark-surface border border-dark-border rounded-xl shadow-2xl py-1.5 z-20">
                  {onEdit && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit(playlist);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-dark-hover transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit details</span>
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(playlist);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
