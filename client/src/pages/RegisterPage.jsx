import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, UserPlus, Camera, ImagePlus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/helpers';
import { Captcha } from '../components/common/Captcha';
import toast from 'react-hot-toast';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

export const RegisterPage = () => {
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [captchaId, setCaptchaId] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const captchaRef = useRef(null);

  // Object URLs leak unless they're explicitly released.
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [avatarPreview, coverPreview]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const pickImage = (e, setFile, setPreview, previousPreview) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('That file is not an image');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error('Images must be smaller than 5 MB');
      return;
    }

    if (previousPreview) URL.revokeObjectURL(previousPreview);
    setFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const next = {};

    if (!form.fullName.trim()) next.fullName = 'Full name is required.';

    const username = form.username.trim();
    if (!username) next.username = 'Username is required.';
    else if (!/^[a-zA-Z0-9_]{3,20}$/.test(username))
      next.username = '3-20 characters, letters, numbers and underscores only.';

    const email = form.email.trim();
    if (!email) next.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email address.';

    if (!form.password) next.password = 'Password is required.';
    else if (form.password.length < 6) next.password = 'Use at least 6 characters.';

    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match.';

    if (!avatar) next.avatar = 'A profile picture is required.';

    if (!captchaAnswer.trim()) next.captcha = 'Please complete the captcha.';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = new FormData();
    payload.append('fullName', form.fullName.trim());
    payload.append('username', form.username.trim().toLowerCase());
    payload.append('email', form.email.trim().toLowerCase());
    payload.append('password', form.password);
    payload.append('avatar', avatar);
    if (coverImage) payload.append('coverImage', coverImage);
    payload.append('captchaId', captchaId);
    payload.append('captchaAnswer', captchaAnswer.trim());

    try {
      setSubmitting(true);
      await register(payload);

      // Sign the new account straight in so they land on a usable app.
      await login({
        username: form.username.trim().toLowerCase(),
        password: form.password,
      });

      toast.success('Account created. Welcome to VidTube!');
      navigate('/', { replace: true });
    } catch (err) {
      const message = getErrorMessage(err, 'Registration failed. Please try again.');
      toast.error(message);
      setErrors((prev) => ({ ...prev, form: message }));
      // The challenge is consumed on every attempt, successful or not.
      captchaRef.current?.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const fieldError = (name) =>
    errors[name] ? <p className="text-xs text-red-400 mt-1.5">{errors[name]}</p> : null;

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-4xl font-display font-bold text-white tracking-tight leading-tight">Create your account</h2>
        <p className="text-sm text-gray-400 mt-2">
          Start uploading and building an audience in a couple of minutes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {errors.form && (
          <div
            role="alert"
            className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-300"
          >
            {errors.form}
          </div>
        )}

        {/* Cover + avatar pickers */}
        <div>
          <div
            onClick={() => coverInputRef.current?.click()}
            className="relative h-28 rounded-xl overflow-hidden bg-dark-card border border-dashed border-dark-border hover:border-brand/50 cursor-pointer group transition-colors"
          >
            {coverPreview ? (
              <>
                <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    URL.revokeObjectURL(coverPreview);
                    setCoverImage(null);
                    setCoverPreview(null);
                  }}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-white hover:bg-black"
                  aria-label="Remove cover image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-gray-500 group-hover:text-gray-300 transition-colors">
                <ImagePlus className="w-5 h-5" />
                <span className="text-xs font-medium">Add a cover image (optional)</span>
              </div>
            )}
          </div>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pickImage(e, setCoverImage, setCoverPreview, coverPreview)}
          />

          {/* The avatar deliberately overlaps the cover, the way a channel header
              reads. `items-end` keeps the caption on the avatar's baseline
              instead of floating against its middle. */}
          <div className="flex items-end gap-4 -mt-10 ml-5 mb-1 relative z-10">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              aria-label="Choose a profile picture"
              className={`w-20 h-20 rounded-full overflow-hidden border-4 border-dark-base bg-dark-card flex items-center justify-center text-gray-500 hover:text-white transition-colors relative group shrink-0 ${
                errors.avatar ? 'ring-2 ring-red-500/60' : ''
              }`}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-6 h-6" />
              )}
              <span className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-semibold text-white transition-opacity">
                Change
              </span>
            </button>

            <div className="pb-1.5 min-w-0">
              <p className="text-xs font-semibold text-gray-300">
                Profile picture <span className="text-brand">*</span>
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Square image, PNG or JPG, under 5 MB.
              </p>
            </div>
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              pickImage(e, setAvatar, setAvatarPreview, avatarPreview);
              setErrors((prev) => ({ ...prev, avatar: undefined }));
            }}
          />
          {fieldError('avatar')}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="fullName" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Full name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Saad Akhtar"
              className="input-field"
              disabled={submitting}
            />
            {fieldError('fullName')}
          </div>

          <div>
            <label htmlFor="username" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={form.username}
              onChange={handleChange}
              placeholder="saad417"
              className="input-field"
              disabled={submitting}
            />
            {fieldError('username')}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className="input-field"
            disabled={submitting}
          />
          {fieldError('email')}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                className="input-field pr-12"
                disabled={submitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldError('password')}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat your password"
              className="input-field"
              disabled={submitting}
            />
            {fieldError('confirmPassword')}
          </div>
        </div>

        <Captcha
          ref={captchaRef}
          value={captchaAnswer}
          onChange={(val) => {
            setCaptchaAnswer(val);
            setErrors((prev) => ({ ...prev, captcha: undefined }));
          }}
          onIdChange={setCaptchaId}
          disabled={submitting}
          error={errors.captcha}
        />

        <button type="submit" disabled={submitting} className="btn-primary w-full py-2.5 text-sm">
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating your account...</span>
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Create account</span>
            </>
          )}
        </button>
      </form>

      <p className="text-sm text-gray-400 text-center mt-8">
        Already have an account?{' '}
        <Link to="/login" className="text-brand hover:text-brand-light font-semibold transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
};
