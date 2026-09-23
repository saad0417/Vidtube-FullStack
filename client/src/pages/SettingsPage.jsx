import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Settings,
  User as UserIcon,
  ImageIcon,
  KeyRound,
  Loader2,
  Camera,
  Eye,
  EyeOff,
  Tv,
  Palette,
  Sun,
  Moon,
  MonitorSmartphone,
  LogOut,
  Check,
  Calendar,
  AtSign,
  Mail,
} from 'lucide-react';
import { authApi } from '../api/auth.api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { PageHeader } from '../components/common/PageHeader';
import { DEFAULT_AVATAR, getErrorMessage } from '../utils/helpers';
import { formatDate } from '../utils/formatters';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import toast from 'react-hot-toast';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

const TABS = [
  { id: 'profile', label: 'Profile', icon: UserIcon },
  { id: 'branding', label: 'Branding', icon: ImageIcon },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'security', label: 'Security', icon: KeyRound },
];

const THEME_OPTIONS = [
  { id: 'light', label: 'Light', icon: Sun, description: 'Always use the light theme' },
  { id: 'dark', label: 'Dark', icon: Moon, description: 'Always use the dark theme' },
  {
    id: 'system',
    label: 'System',
    icon: MonitorSmartphone,
    description: 'Match your device setting',
  },
];

export const SettingsPage = () => {
  const { user, updateUser, logout } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('profile');
  const [signOutOpen, setSignOutOpen] = useState(false);

  // Profile
  const [profile, setProfile] = useState({ fullName: '', email: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  // Branding
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [savingCover, setSavingCover] = useState(false);
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // Security
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '', confirm: '' });
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({ fullName: user.fullName || '', email: user.email || '' });
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [avatarPreview, coverPreview]);

  const validImage = (file) => {
    if (!file.type.startsWith('image/')) {
      toast.error('That file is not an image');
      return false;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error('Images must be smaller than 5 MB');
      return false;
    }
    return true;
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    const fullName = profile.fullName.trim();
    const email = profile.email.trim().toLowerCase();

    // The API updates both fields together, so both must be present.
    if (!fullName || !email) {
      toast.error('Name and email are both required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Enter a valid email address');
      return;
    }
    if (fullName === user?.fullName && email === user?.email) {
      toast('Nothing changed');
      return;
    }

    try {
      setSavingProfile(true);
      const res = await authApi.updateAccountDetails({ fullName, email });
      updateUser(res.data || { fullName, email });
      toast.success('Profile updated');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not update your profile'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file
    if (!file || !validImage(file)) return;

    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setSavingAvatar(true);
      const res = await authApi.updateAvatar(formData);
      updateUser(res.data || {});
      toast.success('Profile picture updated');
    } catch (error) {
      setAvatarPreview(null);
      toast.error(getErrorMessage(error, 'Could not update your picture'));
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleCoverChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !validImage(file)) return;

    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append('coverImage', file);

    try {
      setSavingCover(true);
      const res = await authApi.updateCoverImage(formData);
      updateUser(res.data || {});
      toast.success('Cover image updated');
    } catch (error) {
      setCoverPreview(null);
      toast.error(getErrorMessage(error, 'Could not update your cover image'));
    } finally {
      setSavingCover(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    const { oldPassword, newPassword, confirm } = passwords;

    if (!oldPassword || !newPassword) {
      toast.error('Fill in both password fields');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword === oldPassword) {
      toast.error('Choose a password different from your current one');
      return;
    }

    try {
      setSavingPassword(true);
      await authApi.changePassword({ oldPassword, newPassword });
      setPasswords({ oldPassword: '', newPassword: '', confirm: '' });
      toast.success('Password changed successfully');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not change your password'));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      <PageHeader
        icon={Settings}
        title="Settings"
        subtitle="Manage your account, channel branding and password"
        action={
          user?.username && (
            <Link to={`/c/${user.username}`} className="btn-secondary text-sm">
              <Tv className="w-4 h-4" />
              <span>View channel</span>
            </Link>
          )
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-dark-border/60 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === id
                ? 'border-brand text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Profile */}
      {activeTab === 'profile' && (
        <form
          onSubmit={handleSaveProfile}
          className="p-6 rounded-2xl bg-dark-surface/40 border border-dark-border/60 flex flex-col gap-5"
        >
          <div>
            <h2 className="text-base font-semibold text-white">Account details</h2>
            <p className="text-xs text-gray-400 mt-1">
              Your name is shown on your channel, videos and comments.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fullName" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                value={profile.fullName}
                onChange={(e) => setProfile((prev) => ({ ...prev, fullName: e.target.value }))}
                className="input-field"
                disabled={savingProfile}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
                className="input-field"
                disabled={savingProfile}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Username
            </label>
            <input
              type="text"
              value={user?.username ? `@${user.username}` : ''}
              className="input-field opacity-60 cursor-not-allowed"
              disabled
              readOnly
            />
            <p className="text-xs text-gray-500 mt-1.5">
              Your username is permanent and cannot be changed.
            </p>
          </div>

          <div className="flex justify-end pt-2 border-t border-dark-border/60">
            <button type="submit" disabled={savingProfile} className="btn-primary">
              {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Save changes</span>
            </button>
          </div>
        </form>
      )}

      {/* Branding */}
      {activeTab === 'branding' && (
        <div className="p-6 rounded-2xl bg-dark-surface/40 border border-dark-border/60 flex flex-col gap-6">
          <div>
            <h2 className="text-base font-semibold text-white">Channel branding</h2>
            <p className="text-xs text-gray-400 mt-1">
              Changes are uploaded and applied as soon as you pick a file.
            </p>
          </div>

          {/* Cover */}
          <div>
            <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Cover image
            </p>
            <div
              onClick={() => !savingCover && coverInputRef.current?.click()}
              className="relative h-36 sm:h-44 rounded-xl overflow-hidden bg-dark-card border border-dashed border-dark-border hover:border-brand/50 cursor-pointer group transition-colors"
            >
              {coverPreview || user?.coverImage ? (
                <img
                  src={coverPreview || user.coverImage}
                  alt="Channel cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-gray-500 group-hover:text-gray-300 transition-colors">
                  <ImageIcon className="w-6 h-6" />
                  <span className="text-xs font-medium">Click to upload a cover image</span>
                </div>
              )}

              {savingCover && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-brand animate-spin" />
                </div>
              )}
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverChange}
            />
            <p className="text-xs text-gray-500 mt-2">
              Recommended 2048 × 1152 px, under 5 MB.
            </p>
          </div>

          {/* Avatar */}
          <div className="pt-2 border-t border-dark-border/60">
            <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3 mt-4">
              Profile picture
            </p>
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => !savingAvatar && avatarInputRef.current?.click()}
                className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-dark-border bg-dark-card shrink-0 group"
              >
                <img
                  src={avatarPreview || user?.avatar || DEFAULT_AVATAR}
                  alt={user?.fullName || 'Profile'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_AVATAR;
                  }}
                />
                <span className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 text-white transition-opacity">
                  <Camera className="w-5 h-5" />
                  <span className="text-[10px] font-semibold">Change</span>
                </span>
                {savingAvatar && (
                  <span className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-brand animate-spin" />
                  </span>
                )}
              </button>

              <div className="text-sm">
                <p className="font-semibold text-white">{user?.fullName}</p>
                <p className="text-gray-400 text-xs mt-0.5">@{user?.username}</p>
                <p className="text-xs text-gray-500 mt-2 max-w-xs">
                  A square image of at least 98 × 98 px works best. PNG or JPG, under 5 MB.
                </p>
              </div>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
        </div>
      )}

      {/* Appearance */}
      {activeTab === 'appearance' && (
        <div className="p-6 rounded-2xl bg-dark-surface/40 border border-dark-border/60 flex flex-col gap-6">
          <div>
            <h2 className="text-base font-semibold text-white">Theme</h2>
            <p className="text-xs text-gray-400 mt-1">
              Choose how VidTube looks. Your choice is saved on this device — currently showing the{' '}
              <span className="font-semibold text-gray-300">{resolvedTheme}</span> theme.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            {THEME_OPTIONS.map(({ id, label, icon: Icon, description }) => {
              const isActive = theme === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTheme(id)}
                  aria-pressed={isActive}
                  className={`relative flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-colors ${
                    isActive
                      ? 'border-brand bg-brand/10'
                      : 'border-dark-border bg-dark-card hover:bg-dark-hover'
                  }`}
                >
                  {isActive && (
                    <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand text-on-accent flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                  <Icon className={`w-5 h-5 ${isActive ? 'text-brand' : 'text-gray-400'}`} />
                  <span className="text-sm font-semibold text-white">{label}</span>
                  <span className="text-xs text-gray-400 leading-snug">{description}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-dark-border/60">
            <h3 className="text-sm font-semibold text-white mb-3">Preview</h3>
            <div className="rounded-xl border border-dark-border bg-dark-card p-4 flex items-center gap-4">
              <div className="w-24 aspect-video rounded-lg bg-dark-hover shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <p className="text-sm font-semibold text-white truncate">
                  This is how a video title looks
                </p>
                <p className="text-xs text-gray-400">Channel name • 1.2K views • 2 days ago</p>
                <div className="flex gap-2 pt-1">
                  <span className="px-3 py-1 rounded-full bg-brand text-on-accent text-[11px] font-semibold">
                    Primary
                  </span>
                  <span className="px-3 py-1 rounded-full bg-dark-hover border border-dark-border text-gray-300 text-[11px] font-semibold">
                    Secondary
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security */}
      {activeTab === 'security' && (
        <form
          onSubmit={handleChangePassword}
          className="p-6 rounded-2xl bg-dark-surface/40 border border-dark-border/60 flex flex-col gap-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-white">Change password</h2>
              <p className="text-xs text-gray-400 mt-1">
                You'll stay signed in on this device after changing it.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPasswords((prev) => !prev)}
              className="btn-ghost shrink-0"
              aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
            >
              {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div>
            <label htmlFor="oldPassword" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Current password
            </label>
            <input
              id="oldPassword"
              type={showPasswords ? 'text' : 'password'}
              autoComplete="current-password"
              value={passwords.oldPassword}
              onChange={(e) => setPasswords((prev) => ({ ...prev, oldPassword: e.target.value }))}
              className="input-field"
              disabled={savingPassword}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="newPassword" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                New password
              </label>
              <input
                id="newPassword"
                type={showPasswords ? 'text' : 'password'}
                autoComplete="new-password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords((prev) => ({ ...prev, newPassword: e.target.value }))}
                className="input-field"
                disabled={savingPassword}
              />
            </div>

            <div>
              <label htmlFor="confirmNew" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Confirm new password
              </label>
              <input
                id="confirmNew"
                type={showPasswords ? 'text' : 'password'}
                autoComplete="new-password"
                value={passwords.confirm}
                onChange={(e) => setPasswords((prev) => ({ ...prev, confirm: e.target.value }))}
                className="input-field"
                disabled={savingPassword}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-dark-border/60">
            <button type="submit" disabled={savingPassword} className="btn-primary">
              {savingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Update password</span>
            </button>
          </div>
        </form>
      )}

      {/* Account summary + sign out — shown alongside every tab */}
      <div className="p-6 rounded-2xl bg-dark-surface/40 border border-dark-border/60 flex flex-col gap-5">
        <h2 className="text-base font-semibold text-white">Account</h2>

        <dl className="grid sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-2.5">
            <AtSign className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <dt className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Username
              </dt>
              <dd className="text-sm text-white truncate">@{user?.username}</dd>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Mail className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <dt className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Email
              </dt>
              <dd className="text-sm text-white truncate">{user?.email}</dd>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Calendar className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <dt className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Joined
              </dt>
              <dd className="text-sm text-white truncate">
                {user?.createdAt ? formatDate(user.createdAt) : '—'}
              </dd>
            </div>
          </div>
        </dl>

        <div className="flex items-center justify-between gap-4 pt-4 border-t border-dark-border/60">
          <p className="text-xs text-gray-400">
            Signing out clears your session on this device.
          </p>
          <button
            type="button"
            onClick={() => setSignOutOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/30 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={signOutOpen}
        onClose={() => setSignOutOpen(false)}
        onConfirm={() => {
          setSignOutOpen(false);
          logout();
        }}
        title="Sign out"
        message="You'll need to sign in again to upload, comment or manage your channel."
        confirmText="Sign out"
      />
    </div>
  );
};
