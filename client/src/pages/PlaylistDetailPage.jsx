import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ListVideo, Play, Trash2, Pencil, Loader2, AlertCircle } from 'lucide-react';
import { playlistApi } from '../api/playlist.api';
import { useAuth } from '../context/AuthContext';
import { VideoListItem } from '../components/common/VideoListItem';
import { EmptyState } from '../components/common/EmptyState';
import { Spinner } from '../components/common/Spinner';
import { Modal } from '../components/common/Modal';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { DEFAULT_AVATAR, DEFAULT_THUMBNAIL, getErrorMessage } from '../utils/helpers';
import { formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';

export const PlaylistDetailPage = () => {
  const { playlistId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });
  const [saving, setSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const loadPlaylist = useCallback(async () => {
    if (!playlistId) return;
    try {
      setLoading(true);
      setError('');
      const res = await playlistApi.getPlaylistById(playlistId);
      setPlaylist(res.data || null);
    } catch (err) {
      setError(getErrorMessage(err, 'This playlist could not be loaded'));
      setPlaylist(null);
    } finally {
      setLoading(false);
    }
  }, [playlistId]);

  useEffect(() => {
    loadPlaylist();
  }, [loadPlaylist]);

  const owner = playlist?.owner && typeof playlist.owner === 'object' ? playlist.owner : null;
  const ownerId = owner?._id || playlist?.owner;
  const isOwner = Boolean(user?._id && ownerId && String(user._id) === String(ownerId));
  const videos = Array.isArray(playlist?.videos) ? playlist.videos : [];

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    const title = form.title.trim();
    const description = form.description.trim();

    if (!title && !description) {
      toast.error('Nothing to update');
      return;
    }

    try {
      setSaving(true);
      await playlistApi.updatePlaylist(playlistId, { title, description });
      toast.success('Playlist updated');
      setEditOpen(false);
      await loadPlaylist();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update the playlist'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlaylist = async () => {
    try {
      setDeleting(true);
      await playlistApi.deletePlaylist(playlistId);
      toast.success('Playlist deleted');
      navigate('/playlists', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete the playlist'));
      setDeleting(false);
    }
  };

  const handleRemoveVideo = async (videoId) => {
    try {
      setRemovingId(videoId);
      await playlistApi.removeVideoFromPlaylist(videoId, playlistId);
      setPlaylist((prev) =>
        prev ? { ...prev, videos: prev.videos.filter((v) => v._id !== videoId) } : prev
      );
      toast.success('Removed from playlist');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not remove the video'));
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) return <Spinner label="Loading playlist..." />;

  if (error || !playlist) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-display font-bold text-white mb-2">Playlist unavailable</h2>
        <p className="text-sm text-gray-400 mb-6">{error || 'This playlist no longer exists.'}</p>
        <Link to="/" className="btn-primary">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sticky playlist summary */}
        <aside className="w-full lg:w-[340px] shrink-0">
          <div className="lg:sticky lg:top-[73px] rounded-2xl overflow-hidden bg-gradient-to-b from-dark-surface to-dark-card border border-dark-border/60">
            <div className="relative aspect-video">
              <img
                src={videos[0]?.thumbnail || DEFAULT_THUMBNAIL}
                alt={playlist.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_THUMBNAIL;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            </div>

            <div className="p-5 flex flex-col gap-4">
              <div>
                <h1 className="text-2xl font-display font-bold text-white leading-tight">{playlist.title}</h1>
                <p className="text-xs text-gray-400 mt-2">
                  {videos.length} {videos.length === 1 ? 'video' : 'videos'} · Updated{' '}
                  {formatDate(playlist.updatedAt)}
                </p>
              </div>

              {owner && (
                <Link
                  to={`/c/${owner.username}`}
                  className="flex items-center gap-2.5 text-sm text-gray-300 hover:text-white transition-colors w-fit"
                >
                  <img
                    src={owner.avatar || DEFAULT_AVATAR}
                    alt={owner.fullName}
                    className="w-8 h-8 rounded-full object-cover border border-dark-border"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_AVATAR;
                    }}
                  />
                  <span className="font-medium truncate">{owner.fullName || owner.username}</span>
                </Link>
              )}

              {playlist.description && (
                <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">
                  {playlist.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                {videos.length > 0 && (
                  <Link to={`/watch/${videos[0]._id}`} className="btn-primary text-sm">
                    <Play className="w-4 h-4 fill-current" />
                    <span>Play all</span>
                  </Link>
                )}

                {isOwner && (
                  <>
                    <button
                      onClick={() => {
                        setForm({
                          title: playlist.title || '',
                          description: playlist.description || '',
                        });
                        setEditOpen(true);
                      }}
                      className="btn-secondary text-sm"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setDeleteOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/30 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Video list */}
        <div className="flex-1 min-w-0">
          {videos.length === 0 ? (
            <EmptyState
              icon={ListVideo}
              title="This playlist is empty"
              description={
                isOwner
                  ? 'Open any video and use “Save” to add it to this playlist.'
                  : 'The creator has not added any videos yet.'
              }
            />
          ) : (
            <div className="space-y-6">
              {videos.map((video, index) => (
                <div key={video._id} className="flex gap-3 items-start">
                  <span className="hidden sm:block w-6 shrink-0 text-sm text-gray-500 font-medium pt-16 text-right">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <VideoListItem
                      video={video}
                      action={
                        isOwner ? (
                          <button
                            onClick={() => handleRemoveVideo(video._id)}
                            disabled={removingId === video._id}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                            title="Remove from playlist"
                          >
                            {removingId === video._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        ) : null
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={editOpen}
        onClose={() => (saving ? null : setEditOpen(false))}
        title="Edit playlist"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveDetails} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="input-field"
              maxLength={100}
              disabled={saving}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="input-field resize-none"
              maxLength={500}
              disabled={saving}
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-dark-border">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white rounded-full hover:bg-dark-hover transition-colors"
            >
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Save changes</span>
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeletePlaylist}
        loading={deleting}
        title="Delete playlist"
        message={`“${playlist.title}” will be removed permanently. The videos inside it are not deleted.`}
        confirmText="Delete playlist"
      />
    </div>
  );
};
