import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, 
  Search, 
  X, 
  Plus, 
  User as UserIcon, 
  LogOut, 
  Settings, 
  LayoutDashboard, 
  Tv, 
  Sun,
  BadgePlus,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import { useTheme } from '../../context/ThemeContext';
import { Logo } from './Logo';
import { DEFAULT_AVATAR } from '../../utils/helpers';

export const Navbar = ({ onOpenUpload }) => {
  const { user, isAuthenticated, isCreator, logout } = useAuth();
  const { toggleSidebar } = useSidebar();
  const { resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync search input if location is /search
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q) setSearchQuery(q);
  }, [location.search]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileSearchOpen(false);
    }
  };

  return (
    <header
      className="sticky top-0 z-40 w-full px-3 sm:px-4 py-2 flex items-center justify-between gap-2 sm:gap-4
        bg-dark-base/60 supports-[backdrop-filter]:bg-dark-base/45
        backdrop-blur-2xl backdrop-saturate-[1.8]
        border-b border-white/10
        shadow-[0_1px_0_0_rgb(255_255_255/0.06)_inset,0_8px_32px_-12px_rgb(0_0_0/0.45)]"
    >
      {/* Left: Hamburger & Logo */}
      <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
        <button
          onClick={toggleSidebar}
          className="p-2 text-gray-300 hover:text-white hover:bg-dark-hover rounded-full transition-colors"
          title="Guide"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/" className="group shrink-0" aria-label="VidTube home">
          <Logo
            id="nav"
            markClassName="w-9 h-9 sm:w-11 sm:h-11 group-hover:scale-105 transition-transform duration-200"
            wordmarkClassName="text-[19px] sm:text-[23px]"
          />
        </Link>
      </div>

      {/* Center: Search Bar */}
      <div className="hidden sm:flex flex-1 max-w-2xl justify-center">
        <form
          onSubmit={handleSearch}
          className="w-full flex items-stretch h-10 rounded-full overflow-hidden border border-dark-border focus-within:border-brand/60 focus-within:ring-1 focus-within:ring-brand/40 transition-colors"
        >
          <div className="relative flex-1 flex items-center bg-dark-input">
            <input
              type="text"
              placeholder="Search videos, creators, and topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search"
              className="w-full h-full bg-transparent text-gray-100 placeholder-gray-500 text-sm pl-4 pr-9 border-0 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-2.5 p-1 text-gray-400 hover:text-white rounded-full hover:bg-dark-hover transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="flex items-center justify-center w-14 shrink-0 bg-dark-card hover:bg-dark-hover border-l border-dark-border text-gray-300 hover:text-white transition-colors"
            title="Search"
            aria-label="Search"
          >
            <Search className="w-[18px] h-[18px]" />
          </button>
        </form>
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Search Toggle */}
        <button
          onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
          className="sm:hidden p-2 text-gray-300 hover:text-white hover:bg-dark-hover rounded-full"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-gray-300 hover:text-white hover:bg-dark-hover rounded-full transition-colors"
          title={resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          aria-label={resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        {isAuthenticated ? (
          <>
            {/* Create / Upload Video */}
            {isCreator ? (
              <button
                onClick={onOpenUpload}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-dark-card hover:bg-dark-hover border border-dark-border text-gray-200 hover:text-white text-sm font-medium transition-all hover:border-brand/40 group"
                title="Upload video"
              >
                <Plus className="w-4 h-4 text-brand group-hover:rotate-90 transition-transform duration-200" />
                <span className="hidden md:inline">Create</span>
              </button>
            ) : (
              <Link
                to="/create-channel"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-dark-card hover:bg-dark-hover border border-dark-border text-gray-200 hover:text-white text-sm font-medium transition-all hover:border-brand/40"
                title="Create your channel"
              >
                <BadgePlus className="w-4 h-4 text-brand" />
                <span className="hidden md:inline">Create channel</span>
              </Link>
            )}

            {/* Profile Menu Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center rounded-full ring-2 ring-transparent hover:ring-brand/60 transition-all focus:outline-none"
              >
                <img
                  src={user?.avatar || DEFAULT_AVATAR}
                  alt={user?.fullName || 'User'}
                  className="w-8 h-8 rounded-full object-cover border border-dark-border"
                  onError={(e) => {
                    e.target.src = DEFAULT_AVATAR;
                  }}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-dark-surface border border-dark-border rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* User Profile Header */}
                  <div className="px-4 py-3 border-b border-dark-border/60 flex items-center gap-3">
                    <img
                      src={user?.avatar}
                      alt={user?.fullName}
                      className="w-10 h-10 rounded-full object-cover border border-dark-border"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {user?.fullName}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        @{user?.username}
                      </p>
                    </div>
                  </div>

                  {/* Links */}
                  <div className="py-1">
                    {isCreator && (
                      <Link
                        to={`/c/${user?.username}`}
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-dark-hover transition-colors"
                      >
                        <Tv className="w-4 h-4 text-gray-400" />
                        <span>Your Channel</span>
                      </Link>
                    )}

                    {isCreator ? (
                      <Link
                        to="/studio"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-dark-hover transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-brand" />
                        <span>VidTube Studio</span>
                      </Link>
                    ) : (
                      <Link
                        to="/create-channel"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-dark-hover transition-colors"
                      >
                        <BadgePlus className="w-4 h-4 text-brand" />
                        <span>Create channel</span>
                      </Link>
                    )}

                    <Link
                      to="/settings"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-dark-hover transition-colors"
                    >
                      <Settings className="w-4 h-4 text-gray-400" />
                      <span>Settings</span>
                    </Link>
                  </div>

                  <div className="border-t border-dark-border/60 pt-1">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/50 hover:bg-blue-500/10 text-blue-400 hover:text-blue-300 text-sm font-medium transition-all"
          >
            <UserIcon className="w-4 h-4" />
            <span>Sign In</span>
          </Link>
        )}
      </div>

      {/* Mobile Search Overlay */}
      {isMobileSearchOpen && (
        <div className="absolute inset-x-0 top-full bg-dark-base border-b border-dark-border p-3 sm:hidden shadow-lg animate-in slide-in-from-top-1">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search VidTube..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-dark-input text-white text-sm rounded-full border border-dark-border px-4 py-2 focus:outline-none focus:border-brand"
              autoFocus
            />
            <button
              type="submit"
              className="p-2 bg-brand text-on-accent rounded-full"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(false)}
              className="p-2 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}
    </header>
  );
};
