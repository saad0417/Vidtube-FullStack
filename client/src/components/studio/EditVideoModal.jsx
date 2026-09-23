import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { videoApi } from '../../api/video.api';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const EditVideoModal = ({ isOpen, onClose, video, onUpdateSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const thumbnailInputRef = useRef(null);

  useEffect(() => {
    if (video) {
      setTitle(video.title || '');
      setDescription(video.description || '');
      setThumbnailPreview(video.thumbnail || null);
      setThumbnailFile(null);
    }
  }, [video]);

  const handleThumbnailSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!video?._id) return;
    if (!title.trim() && !description.trim() && !thumbnailFile) {
      toast.error('No changes to update');
      return;
    }

    const formData = new FormData();
    if (title.trim()) formData.append('title', title.trim());
    if (description.trim()) formData.append('description', description.trim());
    if (thumbnailFile) {
      formData.append('thumbnail', thumbnailFile);
    }

    try {
      setIsUpdating(true);
      await videoApi.updateVideo(video._id, formData);
      toast.success('Video updated successfully!');
      onClose();
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update video');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={isUpdating ? () => {} : onClose} title="Edit video details" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Thumbnail Preview / Change */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
            Thumbnail
          </label>
          <div className="flex items-center gap-4">
            <div
              onClick={() => thumbnailInputRef.current?.click()}
              className="w-36 aspect-video rounded-xl overflow-hidden bg-dark-card border border-dark-border cursor-pointer relative group shrink-0"
            >
              <img
                src={thumbnailPreview || video?.thumbnail}
                alt="Thumbnail"
                className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 transition-opacity text-xs font-semibold text-white">
                Change
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Click thumbnail to upload a new replacement image.
            </p>
          </div>
          <input
            ref={thumbnailInputRef}
            type="file"
            accept="image/*"
            onChange={handleThumbnailSelect}
            className="hidden"
          />
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
            required
            maxLength={100}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="input-field resize-none"
            required
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-border">
          <button
            type="button"
            onClick={onClose}
            disabled={isUpdating}
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white rounded-full hover:bg-dark-hover"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isUpdating}
            className="btn-primary px-6"
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
