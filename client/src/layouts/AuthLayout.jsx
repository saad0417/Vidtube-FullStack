import React from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { Loader2, Upload, MessageSquare, ListVideo } from 'lucide-react';
import { Logo } from '../components/common/Logo';
import { useAuth } from '../context/AuthContext';

const HIGHLIGHTS = [
  {
    icon: Upload,
    title: 'Publish in seconds',
    description: 'Drop a file, add a thumbnail, and your video is live.',
  },
  {
    icon: ListVideo,
    title: 'Organise everything',
    description: 'Playlists, watch history, and liked videos in one library.',
  },
  {
    icon: MessageSquare,
    title: 'Talk to your audience',
    description: 'Comments and community posts built into every channel.',
  },
];

export const AuthLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-base">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  // Someone already signed in has no business on the login screen.
  if (isAuthenticated) {
    return <Navigate to={location.state?.from?.pathname || '/'} replace />;
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-dark-base">
      {/* Brand panel — hidden on small screens where the form needs the room */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-dark-surface via-dark-base to-black border-r border-dark-border/60 relative overflow-hidden">
        <div className="absolute -top-32 -left-24 w-96 h-96 rounded-full bg-brand/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-20 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

        <Link to="/" className="relative z-10 w-fit" aria-label="VidTube home">
          <Logo id="auth" markClassName="w-10 h-10" className="gap-2.5 [&>span:last-child]:text-2xl" />
        </Link>

        <div className="relative z-10 max-w-md">
          <h1 className="text-[2.75rem] font-display font-bold text-white leading-[1.1] tracking-tight mb-4">
            Your videos deserve a better home.
          </h1>
          <p className="text-gray-400 leading-relaxed mb-10">
            Upload, organise, and grow an audience on a platform built for creators
            who want their work to look the part.
          </p>

          <div className="space-y-5">
            {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-3.5">
                <div className="p-2 rounded-lg bg-dark-card border border-dark-border/70 text-brand shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-sm text-gray-400">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-gray-500">
          © {new Date().getFullYear()} VidTube. Built with React, Express and MongoDB.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <Link to="/" className="flex lg:hidden justify-center mb-8" aria-label="VidTube home">
            <Logo id="auth-mobile" markClassName="w-10 h-10" className="gap-2.5 [&>span:last-child]:text-2xl" />
          </Link>

          <Outlet />
        </div>
      </div>
    </div>
  );
};
