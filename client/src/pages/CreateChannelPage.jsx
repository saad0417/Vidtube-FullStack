import React, { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import {
  Upload,
  BarChart3,
  MessageSquare,
  ListVideo,
  Loader2,
  Check,
  ArrowRight,
} from 'lucide-react';
import { authApi } from '../api/auth.api';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_AVATAR, getErrorMessage } from '../utils/helpers';
import toast from 'react-hot-toast';

const PERKS = [
  { icon: Upload, title: 'Upload videos', description: 'Publish to your channel with a title, description and thumbnail.' },
  { icon: BarChart3, title: 'Creator Studio', description: 'Track views, likes and subscribers, and manage every upload.' },
  { icon: ListVideo, title: 'Organise your library', description: 'Group uploads into playlists your audience can follow.' },
  { icon: MessageSquare, title: 'Post to the community', description: 'Share updates with the people who subscribe to you.' },
];

export const CreateChannelPage = () => {
  const { user, isCreator, updateUser, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  // Already a creator? Nothing to do here.
  if (isCreator) return <Navigate to="/studio" replace />;

  const handleCreate = async () => {
    try {
      setSubmitting(true);
      const res = await authApi.becomeCreator();
      updateUser(res.data || { isCreator: true });
      await refreshUser();
      toast.success('Your channel is live. Welcome aboard!');
      navigate('/studio', { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not create your channel'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="text-center">
        <p className="text-xs font-semibold text-brand uppercase tracking-widest mb-3">
          Become a creator
        </p>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight leading-tight">
          Create your channel
        </h1>
        <p className="text-sm text-gray-400 mt-3 max-w-md mx-auto leading-relaxed">
          Your channel is how people find and follow your work. Create one to
          unlock uploading, analytics and community posts.
        </p>
      </div>

      {/* What the channel will look like */}
      <div className="mt-9 p-5 sm:p-6 rounded-2xl bg-dark-surface/50 border border-dark-border/60">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Your channel
        </p>
        <div className="flex items-center gap-4">
          <img
            src={user?.avatar || DEFAULT_AVATAR}
            alt={user?.fullName || 'Your avatar'}
            className="w-16 h-16 rounded-full object-cover border border-dark-border shrink-0"
            onError={(e) => {
              e.currentTarget.src = DEFAULT_AVATAR;
            }}
          />
          <div className="min-w-0">
            <p className="text-lg font-semibold text-white truncate">{user?.fullName}</p>
            <p className="text-sm text-gray-400 truncate">@{user?.username}</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Your name and picture come from your profile — change them any time in{' '}
          <Link to="/settings" className="text-brand hover:text-brand-light font-medium">
            Settings
          </Link>
          .
        </p>
      </div>

      {/* What it unlocks */}
      <div className="mt-6 grid sm:grid-cols-2 gap-3">
        {PERKS.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="flex items-start gap-3 p-4 rounded-xl bg-dark-card border border-dark-border/60"
          >
            <div className="p-2 rounded-lg bg-brand/10 text-brand shrink-0">
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">{title}</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center gap-3">
        <button
          onClick={handleCreate}
          disabled={submitting}
          className="btn-primary px-8 py-3 text-sm w-full sm:w-auto"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating your channel...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Create channel</span>
            </>
          )}
        </button>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
        >
          <span>Not now, keep browsing</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
