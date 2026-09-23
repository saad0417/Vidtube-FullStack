import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import { SidebarProvider } from './context/SidebarContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { CreatorRoute } from './components/common/CreatorRoute';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ScrollToTop } from './components/common/ScrollToTop';

import { MainLayout } from './layouts/MainLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { Spinner } from './components/common/Spinner';

// Route-level code splitting: each page ships as its own chunk.
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const WatchPage = lazy(() => import('./pages/WatchPage').then((m) => ({ default: m.WatchPage })));
const ChannelPage = lazy(() => import('./pages/ChannelPage').then((m) => ({ default: m.ChannelPage })));
const SearchPage = lazy(() => import('./pages/SearchPage').then((m) => ({ default: m.SearchPage })));
const SubscriptionsPage = lazy(() => import('./pages/SubscriptionsPage').then((m) => ({ default: m.SubscriptionsPage })));
const CommunityPage = lazy(() => import('./pages/CommunityPage').then((m) => ({ default: m.CommunityPage })));
const HistoryPage = lazy(() => import('./pages/HistoryPage').then((m) => ({ default: m.HistoryPage })));
const LikedVideosPage = lazy(() => import('./pages/LikedVideosPage').then((m) => ({ default: m.LikedVideosPage })));
const PlaylistsPage = lazy(() => import('./pages/PlaylistsPage').then((m) => ({ default: m.PlaylistsPage })));
const PlaylistDetailPage = lazy(() => import('./pages/PlaylistDetailPage').then((m) => ({ default: m.PlaylistDetailPage })));
const StudioPage = lazy(() => import('./pages/StudioPage').then((m) => ({ default: m.StudioPage })));
const CreateChannelPage = lazy(() => import('./pages/CreateChannelPage').then((m) => ({ default: m.CreateChannelPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));


function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <SidebarProvider>
              <ScrollToTop />

              <Suspense fallback={<Spinner label="Loading..." />}>
                  <Routes>
                  {/* Auth routes render standalone, without the app chrome */}
                  <Route element={<AuthLayout />}>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                  </Route>

                  {/* Everything else lives inside the navbar + sidebar shell */}
                  <Route element={<MainLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/watch/:videoId" element={<WatchPage />} />
                    <Route path="/c/:username" element={<ChannelPage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/community" element={<CommunityPage />} />
                    <Route path="/playlist/:playlistId" element={<PlaylistDetailPage />} />

                    {/* Signed-in only */}
                    <Route
                      path="/subscriptions"
                      element={
                        <ProtectedRoute>
                          <SubscriptionsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/history"
                      element={
                        <ProtectedRoute>
                          <HistoryPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/liked-videos"
                      element={
                        <ProtectedRoute>
                          <LikedVideosPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/playlists"
                      element={
                        <ProtectedRoute>
                          <PlaylistsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/create-channel"
                      element={
                        <ProtectedRoute>
                          <CreateChannelPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/studio"
                      element={
                        <CreatorRoute>
                          <StudioPage />
                        </CreatorRoute>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute>
                          <SettingsPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route path="*" element={<NotFoundPage />} />
                  </Route>
                  </Routes>
              </Suspense>

              <Toaster
                position="bottom-center"
                toastOptions={{
                  duration: 3500,
                  style: {
                    background: '#212121',
                    color: '#f3f4f6',
                    border: '1px solid #303030',
                    borderRadius: '12px',
                    fontSize: '14px',
                    padding: '10px 14px',
                  },
                  success: { iconTheme: { primary: '#FF0033', secondary: '#fff' } },
                  error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
                }}
              />
            </SidebarProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
