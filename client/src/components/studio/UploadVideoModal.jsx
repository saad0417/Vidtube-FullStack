import React, { useState, useRef } from 'react';
import { Modal } from '../common/Modal';
import { videoApi } from '../../api/video.api';
import { Upload, Film, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const UploadVideoModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const videoInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  const handleVideoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        toast.error('Please select a valid video file');
        return;
      }
      setVideoFile(file);
      // Default title to video filename (without extension) if title empty
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleThumbnailSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file for thumbnail');
        return;
      }
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setVideoFile(null);
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setTitle('');
    setDescription('');
    setUploadProgress(0);
    setIsUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile) {
      toast.error('Please select a video file');
      return;
    }
    if (!thumbnailFile) {
      toast.error('Please select a thumbnail image');
      return;
    }
    if (!title.trim() || !description.trim()) {
      toast.error('Please fill in both title and description');
      return;
    }

    const formData = new FormData();
    formData.append('videoFile', videoFile);
    formData.append('thumbnail', thumbnailFile);
    formData.append('title', title.trim());
    formData.append('description', description.trim());

    try {
      setIsUploading(true);
      setUploadProgress(10);

      await videoApi.publishVideo(formData, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          // Keep progress up to 90% until backend confirms Cloudinary processing
          setUploadProgress(Math.min(90, percent));
        }
      });

      setUploadProgress(100);
      toast.success('Video uploaded successfully!');
      resetForm();
      onClose();
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload video');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={isUploading ? () => {} : onClose} title="Upload video" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Step 1: Video File Selection */}
        {!videoFile ? (
          <div
            onClick={() => videoInputRef.current?.click()}
            className="border-2 border-dashed border-dark-border hover:border-brand/60 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-dark-card/50 hover:bg-dark-card transition-colors text-center group"
          >
            <div className="w-16 h-16 rounded-full bg-dark-card flex items-center justify-center text-gray-400 group-hover:text-brand group-hover:scale-110 transition-all">
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                Drag & drop or click to select video
              </p>
              <p className="text-xs text-gray-400 mt-1">MP4, WebM, or MKV</p>
            </div>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 rounded-xl bg-dark-card border border-dark-border">
            <div className="flex items-center gap-3 min-w-0">
              <Film className="w-6 h-6 text-brand shrink-0" />
              <div className="truncate">
                <p className="text-sm font-medium text-white truncate">{videoFile.name}</p>
                <p className="text-xs text-gray-400">
                  {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            {!isUploading && (
              <button
                type="button"
                onClick={() => setVideoFile(null)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Step 2: Thumbnail Selection */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
            Thumbnail Image *
          </label>
          <div className="flex items-start gap-4">
            <div
              onClick={() => !isUploading && thumbnailInputRef.current?.click()}
              className="w-36 aspect-video rounded-xl border border-dashed border-dark-border hover:border-brand/60 bg-dark-card flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group shrink-0"
            >
              {thumbnailPreview ? (
                <img
                  src={thumbnailPreview}
                  alt="Thumbnail Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400 p-2 text-center group-hover:text-white">
                  <ImageIcon className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-medium">Upload Image</span>
                </div>
              )}
            </div>
            <div className="text-xs text-gray-400 leading-relaxed pt-1">
              Select a crisp, high-resolution thumbnail (16:9 ratio recommended). JPG, PNG, or WebP.
            </div>
          </div>
          <input
            ref={thumbnailInputRef}
            type="file"
            accept="image/*"
            onChange={handleThumbnailSelect}
            className="hidden"
          />
        </div>

        {/* Step 3: Title & Description */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
            Title *
          </label>
          <input
            type="text"
            placeholder="Add a title that describes your video"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isUploading}
            className="input-field"
            required
            maxLength={100}
          />
          <div className="text-right text-[11px] text-gray-500 mt-1">
            {title.length}/100
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
            Description *
          </label>
          <textarea
            placeholder="Tell viewers about your video"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isUploading}
            rows={4}
            className="input-field resize-none"
            required
          />
        </div>

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="flex flex-col gap-2 p-4 rounded-xl bg-dark-card border border-dark-border">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-gray-300 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand" />
                Uploading & processing video...
              </span>
              <span className="text-brand font-bold">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-dark-input rounded-full h-2 overflow-hidden">
              <div
                className="bg-brand h-full rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-border">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white rounded-full hover:bg-dark-hover"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isUploading || !videoFile || !thumbnailFile || !title.trim() || !description.trim()}
            className="btn-primary px-6"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <span>Publish Video</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
