import React, { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  Home, 
  Tv, 
  MessageSquare, 
  History, 
  ListVideo, 
  ThumbsUp, 
  LayoutDashboard, 
  Settings, 
  Video,
  BadgePlus,
} from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';
import { useAuth } from '../../context/AuthContext';
import { subscriptionApi } from '../../api/subscription.api';
import { Logo } from './Logo';
import { DEFAULT_AVATAR } from '../../utils/helpers';

export const Sidebar = () => {
  const { isExpanded, isMobileOpen, overlayMode, closeMobileSidebar } = useSidebar();
  const { user, isAuthenticated, isCreator } = useAuth();
  const [subscribedChannels, setSubscribedChannels] = useState([]);

  useEffect(() => {
    if (isAuthenticated && user?._id) {
      subscriptionApi.getSubscribedChannels(user._id)
        .then((res) => {
          if (Array.isArray(res.data)) {
            setSubscribedChannels(res.data.slice(0, 8)); // Top 8 channels
          }
        })
        .catch(() => setSubscribedChannels([]));
    } else {
      setSubscribedChannels([]);
    }
  }, [isAuthenticated, user]);

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-4 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
      isActive
        ? 'bg-dark-card text-white font-semibold'
        : 'text-gray-300 hover:text-white hover:bg-dark-hover'
    }`;

  const compactNavLinkClass = ({ isActive }) =>
    `flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-xl text-[10px] font-medium transition-colors ${
      isActive
        ? 'text-brand font-semibold'
        : 'text-gray-400 hover:text-white hover:bg-dark-hover'
    }`;

  // Content for desktop expanded sidebar
  const renderExpandedContent = () => (
    <div className="space-y-4 px-3 py-3 select-none">
      {/* Primary Navigation */}
      <div className="space-y-1">
        <NavLink to="/" end className={navLinkClass}>
          <Home className="w-5 h-5 text-gray-300" />
          <span>Home</span>
        </NavLink>
        <NavLink to="/subscriptions" className={navLinkClass}>
          <Tv className="w-5 h-5 text-gray-300" />
          <span>Subscriptions</span>
        </NavLink>
        <NavLink to="/community" className={navLinkClass}>
          <MessageSquare className="w-5 h-5 text-gray-300" />
          <span>Community</span>
        </NavLink>
      </div>

      <div className="h-px bg-dark-border/60" />

      {/* You / Library Section */}
      <div className="space-y-1">
        <div className="px-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Library
        </div>
        <NavLink to="/history" className={navLinkClass}>
          <History className="w-5 h-5 text-gray-300" />
          <span>History</span>
        </NavLink>
        <NavLink to="/playlists" className={navLinkClass}>
          <ListVideo className="w-5 h-5 text-gray-300" />
          <span>Playlists</span>
        </NavLink>
        <NavLink to="/liked-videos" className={navLinkClass}>
          <ThumbsUp className="w-5 h-5 text-gray-300" />
          <span>Liked Videos</span>
        </NavLink>
      </div>

      {/* Creator tools, or the invitation to become one */}
      {isAuthenticated && (
        <>
          <div className="h-px bg-dark-border/60" />
          <div className="space-y-1">
            <div className="px-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {isCreator ? 'Creator' : 'You'}
            </div>

            {isCreator ? (
              <>
                <NavLink to="/studio" className={navLinkClass}>
                  <LayoutDashboard className="w-5 h-5 text-brand" />
                  <span>Studio Dashboard</span>
                </NavLink>
                <NavLink to={`/c/${user?.username}`} className={navLinkClass}>
                  <Video className="w-5 h-5 text-gray-300" />
                  <span>Your Content</span>
                </NavLink>
              </>
            ) : (
              <NavLink to="/create-channel" className={navLinkClass}>
                <BadgePlus className="w-5 h-5 text-brand" />
                <span>Create channel</span>
              </NavLink>
            )}

            <NavLink to="/settings" className={navLinkClass}>
              <Settings className="w-5 h-5 text-gray-300" />
              <span>Settings</span>
            </NavLink>
          </div>
        </>
      )}

      {/* Subscribed Channels List */}
      {isAuthenticated && subscribedChannels.length > 0 && (
        <>
          <div className="h-px bg-dark-border/60" />
          <div className="space-y-1">
            <div className="px-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Subscriptions
            </div>
            {subscribedChannels.map((sub) => {
              const channel = sub.channel;
              if (!channel) return null;
              return (
                <Link
                  key={sub._id}
                  to={`/c/${channel.username}`}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-dark-hover transition-colors"
                >
                  <img
                    src={channel.avatar || DEFAULT_AVATAR}
                    alt={channel.fullName}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span className="truncate">{channel.fullName || channel.username}</span>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* Footer Info */}
      <div className="px-3 pt-3 pb-1 text-[11px] text-gray-400 space-y-1.5 border-t border-dark-border/40">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <Link to="/" className="hover:underline">About</Link>
          <Link to="/" className="hover:underline">Press</Link>
          <Link to="/" className="hover:underline">Copyright</Link>
          <Link to="/" className="hover:underline">Terms</Link>
          <Link to="/" className="hover:underline">Privacy</Link>
        </div>
        <p className="text-gray-400">© 2026 VidTube LLC</p>
      </div>
    </div>
  );

  // Content for desktop compact sidebar (icon-only)
  const renderCompactContent = () => (
    <div className="flex flex-col gap-1 py-3 px-1.5 items-center select-none">
      <NavLink to="/" end className={compactNavLinkClass} title="Home">
        <Home className="w-5 h-5" />
        <span>Home</span>
      </NavLink>
      <NavLink to="/subscriptions" className={compactNavLinkClass} title="Subscriptions">
        <Tv className="w-5 h-5" />
        <span>Subs</span>
      </NavLink>
      <NavLink to="/community" className={compactNavLinkClass} title="Community">
        <MessageSquare className="w-5 h-5" />
        <span>Community</span>
      </NavLink>
      <NavLink to="/history" className={compactNavLinkClass} title="History">
        <History className="w-5 h-5" />
        <span>History</span>
      </NavLink>
      <NavLink to="/playlists" className={compactNavLinkClass} title="Playlists">
        <ListVideo className="w-5 h-5" />
        <span>Playlists</span>
      </NavLink>
      {isAuthenticated &&
        (isCreator ? (
          <NavLink to="/studio" className={compactNavLinkClass} title="Studio">
            <LayoutDashboard className="w-5 h-5 text-brand" />
            <span>Studio</span>
          </NavLink>
        ) : (
          <NavLink to="/create-channel" className={compactNavLinkClass} title="Create channel">
            <BadgePlus className="w-5 h-5 text-brand" />
            <span>Channel</span>
          </NavLink>
        ))}
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-200 ${
            overlayMode ? '' : 'lg:hidden'
          }`}
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        aria-hidden={!isMobileOpen}
        className={`fixed top-0 bottom-0 left-0 w-64 bg-dark-base border-r border-dark-border z-50 overflow-y-auto overscroll-contain shadow-2xl transform transition-transform duration-200 ease-in-out ${
          overlayMode ? '' : 'lg:hidden'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-3 border-b border-dark-border flex items-center justify-between">
          <Link to="/" onClick={closeMobileSidebar} aria-label="VidTube home">
            <Logo id="drawer" markClassName="w-7 h-7" className="[&>span:last-child]:text-lg" />
          </Link>
        </div>
        <div onClick={closeMobileSidebar}>
          {renderExpandedContent()}
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={`${
          overlayMode ? 'hidden' : 'hidden lg:block'
        } sticky top-[61px] h-[calc(100dvh-61px)] overflow-y-auto overscroll-contain shrink-0 bg-dark-base border-r border-dark-border/60 transition-all duration-200 z-30 ${
          isExpanded ? 'w-60' : 'w-[72px]'
        }`}
      >
        {isExpanded ? renderExpandedContent() : renderCompactContent()}
      </aside>
    </>
  );
};
