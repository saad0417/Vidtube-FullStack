import React, { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/helpers';
import { Captcha } from '../components/common/Captcha';
import toast from 'react-hot-toast';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [captchaId, setCaptchaId] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const captchaRef = useRef(null);

  const redirectTo = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmed = identifier.trim();
    if (!trimmed || !password) {
      setError('Enter your username or email and your password.');
      return;
    }
    if (!captchaAnswer.trim()) {
      setError('Please complete the captcha.');
      return;
    }

    // The API accepts either field; pick based on what the user actually typed.
    const credentials = trimmed.includes('@')
      ? { email: trimmed.toLowerCase(), password }
      : { username: trimmed.toLowerCase(), password };

    credentials.captchaId = captchaId;
    credentials.captchaAnswer = captchaAnswer.trim();

    try {
      setSubmitting(true);
      const user = await login(credentials);
      toast.success(`Welcome back, ${user?.fullName || user?.username || 'creator'}!`);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const message = getErrorMessage(err, 'Unable to sign in. Please try again.');
      setError(message);
      // Each challenge is single use, so always hand the user a fresh one.
      captchaRef.current?.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-4xl font-display font-bold text-white tracking-tight">Sign in</h2>
        <p className="text-sm text-gray-400 mt-2">
          Pick up where you left off on VidTube.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error && (
          <div
            role="alert"
            className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        <div>
          <label htmlFor="identifier" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
            Username or email
          </label>
          <input
            id="identifier"
            name="identifier"
            type="text"
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="saad417 or you@example.com"
            className="input-field"
            disabled={submitting}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
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
        </div>

        <Captcha
          ref={captchaRef}
          value={captchaAnswer}
          onChange={setCaptchaAnswer}
          onIdChange={setCaptchaId}
          disabled={submitting}
        />

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full py-2.5 text-sm"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Sign in</span>
            </>
          )}
        </button>
      </form>

      <p className="text-sm text-gray-400 text-center mt-8">
        New to VidTube?{' '}
        <Link to="/register" className="text-brand hover:text-brand-light font-semibold transition-colors">
          Create an account
        </Link>
      </p>

      <p className="text-xs text-gray-500 text-center mt-4">
        <Link to="/" className="hover:text-gray-300 transition-colors">
          Continue browsing without signing in
        </Link>
      </p>
    </div>
  );
};
