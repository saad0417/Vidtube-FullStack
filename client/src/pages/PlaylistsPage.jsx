import React, { useState, useEffect, useCallback } from 'react';
import { ListVideo, Plus, Loader2 } from 'lucide-react';
import { playlistApi } from '../api/playlist.api';
import { useAuth } from '../context/AuthContext';
import { PlaylistCard } from '../components/common/PlaylistCard';
import { EmptyState } from '../components/common/EmptyState';
import { PageHeader } from '../components/common/PageHeader';
import { Spinner } from '../components/common/Spinner';
import { Modal } from '../components/common/Modal';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { getErrorMessage } from '../utils/helpers';
import toast from 'react-hot-toast';

const emptyForm = { title: '', description: '' };

export const PlaylistsPage = () => {
  const { user } = useAuth();

  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadPlaylists = useCallback(async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      const res = await playlistApi.getUserPlaylists(user._id);
      setPlaylists(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not load your playlists'));
      setPlaylists([]);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (playlist) => {
    setEditing(playlist);
    setForm({ title: playlist.title || '', description: playlist.description || '' });
    setFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const title = form.title.trim();
    const description = form.description.trim();

    // The API requires both fields when creating a playlist.
    if (!title || !description) {
      toast.error('A title and description are both required');
      return;
    }

    try {
      setSaving(true);

      if (editing) {
        await playlistApi.updatePlaylist(editing._id, { title, description });
        toast.success('Playlist updated');
      } else {
        await playlistApi.createPlaylist({ title, description });
        toast.success('Playlist created');
      }

      setFormOpen(false);
      setForm(emptyForm);
      setEditing(null);
      await loadPlaylists();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save the playlist'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      setDeleting(true);
      await playlistApi.deletePlaylist(toDelete._id);
      setPlaylists((prev) => prev.filter((pl) => pl._id !== toDelete._id));
      toast.success('Playlist deleted');
      setToDelete(null);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not delete the playlist'));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Spinner label="Loading your playlists..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      <PageHeader
        icon={ListVideo}
        title="Your playlists"
        subtitle={
          playlists.length
            ? `${playlists.length} ${playlists.length === 1 ? 'playlist' : 'playlists'}`
            : 'Group videos into collections'
        }
        action={
          <button onClick={openCreate} className="btn-primary text-sm">
            <Plus className="w-4 h-4" />
            <span>New playlist</span>
          </button>
        }
      />

      {playlists.length === 0 ? (
        <EmptyState
          icon={ListVideo}
          title="No playlists yet"
          description="Create a playlist to group videos you want to keep together."
          actionLabel="Create your first playlist"
          onAction={openCreate}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
          {playlists.map((playlist) => (
            <PlaylistCard
              key={playlist._id}
              playlist={playlist}
              onEdit={openEdit}
              onDelete={setToDelete}
            />
          ))}
        </div>
      )}

      {/* Create / edit form */}
      <Modal
        isOpen={formOpen}
        onClose={() => (saving ? null : setFormOpen(false))}
        title={editing ? 'Edit playlist' : 'Create playlist'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label htmlFor="pl-title" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Title
            </label>
            <input
              id="pl-title"
              type="text"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. React deep dives"
              className="input-field"
              maxLength={100}
              disabled={saving}
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="pl-desc" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              id="pl-desc"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="What is this playlist about?"
              rows={3}
              className="input-field resize-none"
              maxLength={500}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-dark-border">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-dark-hover rounded-full transition-colors"
            >
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{editing ? 'Save changes' : 'Create playlist'}</span>
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete playlist"
        message={`“${toDelete?.title}” will be removed permanently. The videos inside it are not deleted.`}
        confirmText="Delete playlist"
      />
    </div>
  );
};
