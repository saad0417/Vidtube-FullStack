import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { Sidebar } from '../components/common/Sidebar';
import { UploadVideoModal } from '../components/studio/UploadVideoModal';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const MainLayout = () => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { isAuthenticated, isCreator } = useAuth();
  const navigate = useNavigate();

  const handleOpenUpload = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to upload a video');
      navigate('/login');
      return;
    }
    // Uploading needs a channel; the API rejects it otherwise.
    if (!isCreator) {
      navigate('/create-channel');
      return;
    }
    setIsUploadOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-dark-base">
      <Navbar onOpenUpload={handleOpenUpload} />

      <div className="flex flex-1 min-h-0">
        <Sidebar />

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      <UploadVideoModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {
          setIsUploadOpen(false);
          navigate('/studio');
        }}
      />
    </div>
  );
};
