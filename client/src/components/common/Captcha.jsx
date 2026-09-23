import React, { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { RefreshCw, Loader2, ShieldCheck } from 'lucide-react';
import { captchaApi } from '../../api/captcha.api';

/**
 * Human-verification field for the auth forms.
 *
 * The server keeps the expected answer and only sends back an id plus a
 * distorted image, so nothing here can be read to solve the challenge.
 * Each challenge is single use — after a failed submit the parent calls
 * `refresh()` through the ref to pull a new one.
 */
export const Captcha = forwardRef(({ value, onChange, onIdChange, disabled = false, error }, ref) => {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setFailed(false);
      const res = await captchaApi.getCaptcha();
      setImage(res.data?.image || null);
      onIdChange(res.data?.captchaId || '');
      onChange('');
    } catch {
      setFailed(true);
      setImage(null);
      onIdChange('');
    } finally {
      setLoading(false);
    }
  }, [onChange, onIdChange]);

  useEffect(() => {
    load();
    // Intentionally run once on mount; refreshes go through the ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({ refresh: load }), [load]);

  return (
    <div>
      <label
        htmlFor="captchaAnswer"
        className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2"
      >
        <ShieldCheck className="w-3.5 h-3.5 text-brand" />
        <span>Type the characters you see</span>
      </label>

      <div className="flex flex-wrap items-stretch gap-2.5 sm:gap-3">
        <div className="relative w-[150px] xs:w-[165px] h-[54px] shrink-0 rounded-lg overflow-hidden border border-dark-border bg-dark-input flex items-center justify-center">
          {loading ? (
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          ) : failed ? (
            <span className="text-[10px] text-red-400 px-2 text-center leading-tight">
              Couldn't load
            </span>
          ) : (
            <img
              src={image}
              alt="Captcha challenge"
              className="w-full h-full object-cover select-none pointer-events-none"
              draggable={false}
            />
          )}
        </div>

        <button
          type="button"
          onClick={load}
          disabled={loading}
          title="Get a new image"
          aria-label="Get a new captcha image"
          className="w-[54px] shrink-0 rounded-lg border border-dark-border bg-dark-card hover:bg-dark-hover text-gray-300 hover:text-white flex items-center justify-center transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>

        <input
          id="captchaAnswer"
          name="captchaAnswer"
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={8}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter code"
          disabled={disabled || loading}
          className="input-field w-full sm:flex-1 sm:w-auto min-w-0 tracking-[0.2em] uppercase font-semibold"
        />
      </div>

      {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
      <p className="text-[11px] text-gray-500 mt-1.5">
        Not case sensitive. Click the refresh icon for a different image.
      </p>
    </div>
  );
});

Captcha.displayName = 'Captcha';
