import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Video as VideoIcon,
  Eye,
  Users,
  ThumbsUp,
  MessageSquare,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { dashboardApi } from '../api/dashboard.api';
import { videoApi } from '../api/video.api';
import { StatsCard } from '../components/studio/StatsCard';
import { UploadVideoModal } from '../components/studio/UploadVideoModal';
import { EditVideoModal } from '../components/studio/EditVideoModal';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { EmptyState } from '../components/common/EmptyState';
import { PageHeader } from '../components/common/PageHeader';
import { Spinner } from '../components/common/Spinner';
import { formatDate, formatDuration } from '../utils/formatters';
import { DEFAULT_THUMBNAIL, getErrorMessage } from '../utils/helpers';
import toast from 'react-hot-toast';

const compact = (value) => {
  const num = Number(value || 0);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(num);
};

export const StudioPage = () => {
  const [stats, setStats] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [videoToEdit, setVideoToEdit] = useState(null);
  const [videoToDelete, setVideoToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, videosRes] = await Promise.all([
        dashboardApi.getChannelStats(),
        dashboardApi.getChannelVideos(),
      ]);
      setStats(statsRes.data || null);
      setVideos(Array.isArray(videosRes.data) ? videosRes.data : []);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not load your studio data'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleTogglePublish = async (video) => {
    // Flip locally first so the switch feels instant, then reconcile on failure.
    const previous = video.isPublished;
    setTogglingId(video._id);
    setVideos((prev) =>
      prev.map((v) => (v._id === video._id ? { ...v, isPublished: !previous } : v))
    );

    try {
      await videoApi.togglePublishStatus(video._id);
      toast.success(previous ? 'Video is now private' : 'Video is now public');
    } catch (error) {
      setVideos((prev) =>
        prev.map((v) => (v._id === video._id ? { ...v, isPublished: previous } : v))
      );
      toast.error(getErrorMessage(error, 'Could not change visibility'));
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!videoToDelete) return;
    try {
      setDeleting(true);
      await videoApi.deleteVideo(videoToDelete._id);
      setVideos((prev) => prev.filter((v) => v._id !== videoToDelete._id));
      setStats((prev) =>
        prev ? { ...prev, totalVideos: Math.max(0, (prev.totalVideos || 1) - 1) } : prev
      );
      toast.success('Video deleted');
      setVideoToDelete(null);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not delete the video'));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Spinner label="Loading your studio..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-8">
      <PageHeader
        icon={LayoutDashboard}
        title="Creator Studio"
        subtitle="Track performance and manage everything you've published"
        action={
          <button onClick={() => setUploadOpen(true)} className="btn-primary text-sm">
            <Plus className="w-4 h-4" />
            <span>Upload video</span>
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        <StatsCard title="Videos" value={compact(stats?.totalVideos)} icon={VideoIcon} />
        <StatsCard
          title="Total views"
          value={compact(stats?.totalViews)}
          icon={Eye}
          color="text-blue-400"
          bgColor="bg-blue-500/10"
        />
        <StatsCard
          title="Subscribers"
          value={compact(stats?.totalSubscribers)}
          icon={Users}
          color="text-emerald-400"
          bgColor="bg-emerald-500/10"
        />
        <StatsCard
          title="Likes"
          value={compact(stats?.totalLikes)}
          icon={ThumbsUp}
          color="text-purple-400"
          bgColor="bg-purple-500/10"
        />
        <StatsCard
          title="Posts"
          value={compact(stats?.totalTweets)}
          icon={MessageSquare}
          color="text-amber-400"
          bgColor="bg-amber-500/10"
        />
      </div>

      {/* Content table */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white tracking-tight">Your content</h2>
          <span className="text-xs text-gray-400">
            {videos.length} {videos.length === 1 ? 'upload' : 'uploads'}
          </span>
        </div>

        {videos.length === 0 ? (
          <EmptyState
            icon={VideoIcon}
            title="You haven't uploaded anything yet"
            description="Publish your first video and it will show up here with its stats."
            actionLabel="Upload a video"
            onAction={() => setUploadOpen(true)}
          />
        ) : (
          <div className="rounded-2xl border border-dark-border/60 bg-dark-surface/40 overflow-hidden">
            {/* Column headings — desktop only, the mobile layout stacks instead */}
            <div className="hidden lg:grid grid-cols-[minmax(0,1fr)_132px_90px_140px_120px] gap-4 px-5 py-3 border-b border-dark-border/60 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              <span>Video</span>
              <span>Visibility</span>
              <span>Views</span>
              <span>Published</span>
              <span className="text-right">Actions</span>
            </div>

            <div className="divide-y divide-dark-border/50">
              {videos.map((video) => (
                <div
                  key={video._id}
                  className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_132px_90px_140px_120px] gap-4 px-5 py-4 items-center hover:bg-dark-hover/40 transition-colors"
                >
                  {/* Video cell */}
                  <div className="flex gap-3.5 min-w-0">
                    <Link
                      to={`/watch/${video._id}`}
                      className="relative w-28 aspect-video rounded-lg overflow-hidden bg-dark-card shrink-0 border border-dark-border/50"
                    >
                      <img
                        src={video.thumbnail || DEFAULT_THUMBNAIL}
                        alt={video.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_THUMBNAIL;
                        }}
                      />
                      {video.duration > 0 && (
                        <span className="overlay-chip absolute bottom-1 right-1 px-1 py-0.5 rounded text-[10px] font-semibold">
                          {formatDuration(video.duration)}
                        </span>
                      )}
                    </Link>

                    <div className="min-w-0 flex flex-col justify-center">
                      <Link
                        to={`/watch/${video._id}`}
                        className="text-sm font-semibold text-white line-clamp-1 hover:text-brand-light transition-colors"
                        title={video.title}
                      >
                        {video.title}
                      </Link>
                      <p className="text-xs text-gray-400 line-clamp-1 mt-1">
                        {video.description}
                      </p>
                      <div className="flex lg:hidden items-center gap-2 text-[11px] text-gray-500 mt-1.5">
                        <span>{video.views || 0} views</span>
                        <span>•</span>
                        <span>{formatDate(video.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Visibility toggle */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTogglePublish(video)}
                      disabled={togglingId === video._id}
                      role="switch"
                      aria-checked={Boolean(video.isPublished)}
                      aria-label={video.isPublished ? 'Make private' : 'Make public'}
                      className={`relative w-9 h-5 rounded-full transition-colors shrink-0 disabled:opacity-60 ${
                        video.isPublished ? 'bg-brand' : 'bg-dark-border'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                          video.isPublished ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span
                      className={`text-xs font-medium whitespace-nowrap ${
                        video.isPublished ? 'text-emerald-400' : 'text-gray-400'
                      }`}
                    >
                      {video.isPublished ? 'Public' : 'Private'}
                    </span>
                  </div>

                  <span className="hidden lg:block text-sm text-gray-300">
                    {compact(video.views)}
                  </span>

                  <span className="hidden lg:block text-sm text-gray-400">
                    {formatDate(video.createdAt)}
                  </span>

                  {/* Row actions */}
                  <div className="flex items-center gap-1 lg:justify-end">
                    <Link
                      to={`/watch/${video._id}`}
                      className="p-2 text-gray-400 hover:text-white hover:bg-dark-hover rounded-full transition-colors"
                      title="Open video"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => setVideoToEdit(video)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-dark-hover rounded-full transition-colors"
                      title="Edit details"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setVideoToDelete(video)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                      title="Delete video"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <UploadVideoModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploadSuccess={() => {
          setUploadOpen(false);
          loadDashboard();
        }}
      />

      <EditVideoModal
        isOpen={Boolean(videoToEdit)}
        onClose={() => setVideoToEdit(null)}
        video={videoToEdit}
        onUpdateSuccess={() => {
          setVideoToEdit(null);
          loadDashboard();
        }}
      />

      <ConfirmationModal
        isOpen={Boolean(videoToDelete)}
        onClose={() => setVideoToDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete video"
        message={`“${videoToDelete?.title}” and its comments will be permanently removed. This cannot be undone.`}
        confirmText="Delete video"
      />
    </div>
  );
};
