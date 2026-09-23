import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LogoMark } from '../components/common/Logo';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
      <LogoMark id="notfound" className="w-16 h-16 mb-6" />

      <p className="text-sm font-semibold text-brand uppercase tracking-widest mb-2">404</p>
      <h1 className="text-4xl font-display font-bold text-white tracking-tight mb-3">
        This page doesn't exist
      </h1>
      <p className="text-sm text-gray-400 max-w-sm mb-8">
        The link may be broken, or the video or channel you're after has been removed.
      </p>

      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-secondary">
          <ArrowLeft className="w-4 h-4" />
          <span>Go back</span>
        </button>
        <Link to="/" className="btn-primary">
          Back to home
        </Link>
      </div>
    </div>
  );
};
