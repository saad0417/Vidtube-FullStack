import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { playlistApi } from '../../api/playlist.api';
import { useAuth } from '../../context/AuthContext';
import { Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/helpers';

export const SaveToPlaylistModal = ({ isOpen, onClose, videoId }) => {
  const { user, isAuthenticated } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // New playlist form toggle
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isOpen && isAuthenticated && user?._id) {
      setLoading(true);
      playlistApi.getUserPlaylists(user._id)
        .then((res) => {
          if (Array.isArray(res.data)) {
            setPlaylists(res.data);
          }
        })
        .catch(() => setPlaylists([]))
        .finally(() => setLoading(false));
    }
  }, [isOpen, isAuthenticated, user]);

  const handleToggleVideo = async (playlist) => {
    const isVideoInPlaylist = playlist.videos?.some(
      (v) => (v._id || v) === videoId
    );
    setActionLoadingId(playlist._id);

    try {
      if (isVideoInPlaylist) {
        await playlistApi.removeVideoFromPlaylist(videoId, playlist._id);
        setPlaylists((prev) =>
          prev.map((p) =>
            p._id === playlist._id
              ? { ...p, videos: p.videos.filter((v) => (v._id || v) !== videoId) }
              : p
          )
        );
        toast.success(`Removed from ${playlist.title}`);
      } else {
        await playlistApi.addVideoToPlaylist(videoId, playlist._id);
        setPlaylists((prev) =>
          prev.map((p) =>
            p._id === playlist._id
              ? { ...p, videos: [...(p.videos || []), videoId] }
              : p
          )
        );
        toast.success(`Added to ${playlist.title}`);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update playlist'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsCreating(true);
      const res = await playlistApi.createPlaylist({
        title: title.trim(),
        description: description.trim() || 'Created on VidTube',
      });
      const newPl = res.data;

      // Automatically add video to newly created playlist
      await playlistApi.addVideoToPlaylist(videoId, newPl._id);
      newPl.videos = [videoId];

      setPlaylists((prev) => [newPl, ...prev]);
      setTitle('');
      setDescription('');
      setShowCreate(false);
      toast.success(`Created & added to ${newPl.title}!`);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to create playlist'));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Save to playlist" maxWidth="max-w-sm">
      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="py-6 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-brand animate-spin" />
          </div>
        ) : playlists.length === 0 && !showCreate ? (
          <div className="py-4 text-center text-sm text-gray-400">
            You don't have any playlists yet.
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
            {playlists.map((playlist) => {
              const isChecked = playlist.videos?.some(
                (v) => (v._id || v) === videoId
              );
              const isItemLoading = actionLoadingId === playlist._id;

              return (
                <label
                  key={playlist._id}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-dark-hover cursor-pointer transition-colors"
                >
                  <span className="text-sm font-medium text-white truncate pr-2">
                    {playlist.title}
                  </span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isItemLoading}
                      onChange={() => handleToggleVideo(playlist)}
                      className="w-5 h-5 rounded border-dark-border text-brand focus:ring-brand bg-dark-input cursor-pointer"
                    />
                    {isItemLoading && (
                      <Loader2 className="absolute inset-0 w-5 h-5 text-brand animate-spin bg-dark-surface" />
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        )}

        {/* Create playlist toggle or form */}
        {showCreate ? (
          <form onSubmit={handleCreatePlaylist} className="flex flex-col gap-3 pt-3 border-t border-dark-border">
            <input
              type="text"
              placeholder="Playlist title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              required
              autoFocus
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
            />
            <div className="flex items-center justify-end gap-2 mt-1">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-3 py-1.5 text-xs text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating || !title.trim()}
                className="btn-primary py-1.5 px-4 text-xs"
              >
                {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Create'}
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 p-2.5 text-sm font-medium text-brand hover:text-brand-light rounded-xl hover:bg-brand/10 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create new playlist</span>
          </button>
        )}
      </div>
    </Modal>
  );
};
