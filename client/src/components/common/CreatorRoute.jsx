import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from './Spinner';

/**
 * Guards the creator-only screens. A signed-in viewer who has not created a
 * channel yet is sent to the opt-in page rather than an empty dashboard.
 */
export const CreatorRoute = ({ children }) => {
  const { user, isCreator, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner label="Checking your channel..." />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isCreator) {
    return <Navigate to="/create-channel" state={{ from: location }} replace />;
  }

  return children;
};
