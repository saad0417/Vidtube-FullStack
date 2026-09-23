import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  PictureInPicture2,
  RotateCcw,
  RotateCw,
  Check,
  Loader2,
  Repeat,
  RectangleHorizontal,
} from 'lucide-react';

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const SEEK_STEPS = [5, 10, 15, 30];
const VOLUME_KEY = 'vidtube:volume';
const SEEK_STEP_KEY = 'vidtube:seekStep';

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return hrs > 0 ? `${hrs}:${pad(mins)}:${pad(secs)}` : `${mins}:${pad(secs)}`;
};

export const VideoPlayer = ({
  videoSrc,
  poster,
  autoPlay = true,
  isTheater = false,
  onToggleTheater,
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const timelineRef = useRef(null);
  const hideControlsTimer = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [waiting, setWaiting] = useState(false);
  const [ended, setEnded] = useState(false);
  // Uploads are not all 16:9 — phone clips are portrait. Size the frame to the
  // video instead of pillarboxing it into a landscape box.
  const [aspectRatio, setAspectRatio] = useState(null);

  const [volume, setVolume] = useState(() => {
    const stored = Number(localStorage.getItem(VOLUME_KEY));
    return Number.isFinite(stored) && stored >= 0 && stored <= 1 ? stored : 1;
  });
  const [muted, setMuted] = useState(false);

  const [speed, setSpeed] = useState(1);
  const [seekStep, setSeekStep] = useState(() => {
    const stored = Number(localStorage.getItem(SEEK_STEP_KEY));
    return SEEK_STEPS.includes(stored) ? stored : 10;
  });
  // Transient badge shown in the middle of the frame after a seek / volume nudge.
  const [flash, setFlash] = useState(null);
  const flashTimer = useRef(null);
  const [looping, setLooping] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isHovering, setIsHovering] = useState(false);

  // Scrubbing state
  const [scrubbing, setScrubbing] = useState(false);
  const [hoverRatio, setHoverRatio] = useState(null);

  /* ---------------------------------------------------------------- helpers */

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused || video.ended) {
      video.play().catch(() => {
        /* autoplay policies can reject; the poster stays up */
      });
    } else {
      video.pause();
    }
  }, []);

  const showFlash = useCallback((payload) => {
    setFlash(payload);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 650);
  }, []);

  const seekBy = useCallback(
    (delta, { silent = false } = {}) => {
      const video = videoRef.current;
      if (!video || !Number.isFinite(video.duration)) return;
      video.currentTime = Math.min(Math.max(video.currentTime + delta, 0), video.duration);
      if (!silent) {
        showFlash({ kind: delta > 0 ? 'forward' : 'back', label: `${Math.abs(delta)}s` });
      }
    },
    [showFlash]
  );

  const changeSeekStep = useCallback((next) => {
    setSeekStep(next);
    try {
      localStorage.setItem(SEEK_STEP_KEY, String(next));
    } catch {
      /* storage may be unavailable */
    }
  }, []);

  const seekToRatio = useCallback((ratio) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    video.currentTime = Math.min(Math.max(ratio, 0), 1) * video.duration;
  }, []);

  const applyVolume = useCallback((next) => {
    const clamped = Math.min(Math.max(next, 0), 1);
    const video = videoRef.current;
    if (video) {
      video.volume = clamped;
      video.muted = clamped === 0;
    }
    setVolume(clamped);
    setMuted(clamped === 0);
    try {
      localStorage.setItem(VOLUME_KEY, String(clamped));
    } catch {
      /* storage may be unavailable in private mode */
    }
  }, []);

  const nudgeVolume = useCallback(
    (delta) => {
      const video = videoRef.current;
      const base = video?.muted ? 0 : video?.volume ?? 0;
      const next = Math.min(Math.max(base + delta, 0), 1);
      applyVolume(next);
      showFlash({ kind: delta > 0 ? 'volUp' : 'volDown', label: `${Math.round(next * 100)}%` });
    },
    [applyVolume, showFlash]
  );

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const next = !video.muted;
    video.muted = next;
    setMuted(next);
    if (!next && video.volume === 0) applyVolume(0.5);
  }, [applyVolume]);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      container.requestFullscreen?.().catch(() => {});
    }
  }, []);

  const togglePip = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !document.pictureInPictureEnabled) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await video.requestPictureInPicture();
    } catch {
      /* the browser can refuse PiP; nothing else to do */
    }
  }, []);

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(hideControlsTimer.current);
    // Keep them up while paused or while a menu is open.
    if (videoRef.current && !videoRef.current.paused && !showSettings) {
      hideControlsTimer.current = setTimeout(() => setControlsVisible(false), 2800);
    }
  }, [showSettings]);

  /* ------------------------------------------------------- media element sync */

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    video.volume = volume;

    const onPlay = () => {
      setIsPlaying(true);
      setEnded(false);
      revealControls();
    };
    const onPause = () => {
      setIsPlaying(false);
      setControlsVisible(true);
    };
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onLoadedMetadata = () => {
      setDuration(video.duration || 0);
      if (video.videoWidth && video.videoHeight) {
        setAspectRatio(video.videoWidth / video.videoHeight);
      }
    };
    const onProgress = () => {
      if (video.buffered.length) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };
    const onWaiting = () => setWaiting(true);
    const onPlaying = () => setWaiting(false);
    const onEnded = () => {
      setIsPlaying(false);
      setEnded(true);
      setControlsVisible(true);
    };
    const onVolumeChange = () => setMuted(video.muted);
    const onRateChange = () => setSpeed(video.playbackRate);

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('progress', onProgress);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('ended', onEnded);
    video.addEventListener('volumechange', onVolumeChange);
    video.addEventListener('ratechange', onRateChange);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('progress', onProgress);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('volumechange', onVolumeChange);
      video.removeEventListener('ratechange', onRateChange);
    };
    // `volume` is only used for the initial assignment here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealControls]);

  // Reset when a different video is loaded into the same player.
  useEffect(() => {
    setCurrentTime(0);
    setBuffered(0);
    setDuration(0);
    setEnded(false);
    setAspectRatio(null);
  }, [videoSrc]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  useEffect(() => () => {
    clearTimeout(hideControlsTimer.current);
    clearTimeout(flashTimer.current);
  }, []);

  /* ------------------------------------------------------------- scrubbing */

  const ratioFromEvent = useCallback((clientX) => {
    const rail = timelineRef.current;
    if (!rail) return 0;
    const rect = rail.getBoundingClientRect();
    return Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
  }, []);

  useEffect(() => {
    if (!scrubbing) return undefined;

    const onMove = (e) => {
      const clientX = e.touches?.[0]?.clientX ?? e.clientX;
      const ratio = ratioFromEvent(clientX);
      setHoverRatio(ratio);
      if (duration) setCurrentTime(ratio * duration);
    };
    const onUp = (e) => {
      const clientX = e.changedTouches?.[0]?.clientX ?? e.clientX;
      seekToRatio(ratioFromEvent(clientX));
      setScrubbing(false);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [scrubbing, duration, ratioFromEvent, seekToRatio]);

  /* ------------------------------------------------------ keyboard shortcuts */

  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;

      const key = e.key.toLowerCase();

      if (e.code === 'Space' || key === 'k') {
        e.preventDefault();
        togglePlay();
      } else if (key === 'arrowright') {
        e.preventDefault();
        seekBy(5);
      } else if (key === 'arrowleft') {
        e.preventDefault();
        seekBy(-5);
      } else if (key === 'l') {
        seekBy(seekStep);
      } else if (key === 'j') {
        seekBy(-seekStep);
      } else if (key === 'arrowup') {
        e.preventDefault();
        nudgeVolume(0.1);
      } else if (key === 'arrowdown') {
        e.preventDefault();
        nudgeVolume(-0.1);
      } else if (key === 'm') {
        toggleMute();
      } else if (key === 'f') {
        toggleFullscreen();
      } else if (key === 't') {
        onToggleTheater?.();
      } else if (key === 'i') {
        togglePip();
      } else if (key === '>' || (key === '.' && e.shiftKey)) {
        const next = SPEEDS[Math.min(SPEEDS.indexOf(speed) + 1, SPEEDS.length - 1)];
        if (videoRef.current) videoRef.current.playbackRate = next;
      } else if (key === '<' || (key === ',' && e.shiftKey)) {
        const next = SPEEDS[Math.max(SPEEDS.indexOf(speed) - 1, 0)];
        if (videoRef.current) videoRef.current.playbackRate = next;
      } else if (/^[0-9]$/.test(key)) {
        seekToRatio(Number(key) / 10);
      } else {
        return;
      }

      revealControls();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    togglePlay,
    seekBy,
    seekStep,
    seekToRatio,
    nudgeVolume,
    toggleMute,
    toggleFullscreen,
    togglePip,
    onToggleTheater,
    revealControls,
    speed,
  ]);

  /* ------------------------------------------------------------------ render */

  // Landscape fills the column width; portrait and square are driven by height
  // and centred, so they never stretch into a letterboxed slab.
  const isPortrait = aspectRatio !== null && aspectRatio < 1;
  const frameStyle = isFullscreen
    ? undefined
    : isPortrait
      ? {
          // `fit-content` is the key: a block box with `width: auto` fills its
          // container, so aspect-ratio would never shrink it back.
          aspectRatio: String(aspectRatio),
          height: 'min(78vh, 720px)',
          width: 'fit-content',
          maxWidth: '100%',
          margin: '0 auto',
        }
      : { aspectRatio: aspectRatio ? String(aspectRatio) : '16 / 9', maxHeight: '82vh' };

  const progressRatio = duration ? Math.min(currentTime / duration, 1) : 0;
  const bufferedRatio = duration ? Math.min(buffered / duration, 1) : 0;
  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  const iconButton =
    'p-2 rounded-full text-white/90 hover:text-white hover:bg-white/15 transition-colors shrink-0';

  return (
    <div
      ref={containerRef}
      // The player chrome stays dark in both themes: its controls sit over the
      // video, not over a page surface. Re-declaring the theme here rebinds the
      // colour tokens for this subtree only.
      data-theme="dark"
      onMouseMove={revealControls}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        if (isPlaying && !showSettings) setControlsVisible(false);
      }}
      onDoubleClick={toggleFullscreen}
      style={frameStyle}
      className={`relative bg-black overflow-hidden group/player select-none ${
        isFullscreen ? 'h-screen w-full rounded-none' : 'rounded-xl'
      } ${isFullscreen || !isPortrait ? 'w-full' : ''} ${
        controlsVisible || !isPlaying ? '' : 'cursor-none'
      }`}
    >
      <video
        ref={videoRef}
        src={videoSrc}
        poster={poster}
        autoPlay={autoPlay}
        loop={looping}
        playsInline
        preload="metadata"
        onClick={togglePlay}
        className="w-full h-full object-contain bg-black"
      />

      {/* Buffering indicator */}
      {waiting && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 className="w-12 h-12 text-white/90 animate-spin drop-shadow-lg" />
        </div>
      )}

      {/* Double-tap zones: tap the left/right third to jump, like a phone player */}
      <button
        aria-label={`Back ${seekStep} seconds`}
        onDoubleClick={(e) => {
          e.stopPropagation();
          seekBy(-seekStep);
        }}
        className="absolute inset-y-0 left-0 w-1/4 opacity-0 focus:outline-none"
        tabIndex={-1}
      />
      <button
        aria-label={`Forward ${seekStep} seconds`}
        onDoubleClick={(e) => {
          e.stopPropagation();
          seekBy(seekStep);
        }}
        className="absolute inset-y-0 right-0 w-1/4 opacity-0 focus:outline-none"
        tabIndex={-1}
      />

      {/* Transient feedback badge */}
      {flash && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-black/70 backdrop-blur-sm text-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {flash.kind === 'forward' && <RotateCw className="w-5 h-5" />}
            {flash.kind === 'back' && <RotateCcw className="w-5 h-5" />}
            {flash.kind === 'volUp' && <Volume2 className="w-5 h-5" />}
            {flash.kind === 'volDown' && <Volume1 className="w-5 h-5" />}
            <span className="text-sm font-semibold tabular-nums">{flash.label}</span>
          </div>
        </div>
      )}

      {/* Centre cluster: skip back, play/pause, skip forward. Appears while the
          pointer is over the video (and whenever playback is stopped) behind a
          light scrim, so the controls read clearly against any frame. */}
      {!waiting && (
        <div
          className={`absolute inset-0 flex items-center justify-center gap-5 sm:gap-8 bg-black/30 transition-opacity duration-200 pointer-events-none ${
            isHovering || !isPlaying ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              seekBy(-10);
            }}
            aria-label="Back 10 seconds"
            title="Back 10 seconds (j)"
            className="pointer-events-auto relative w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-black/45 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center text-white transition-colors active:scale-95"
          >
            <RotateCcw className="w-5 h-5 sm:w-7 sm:h-7" />
            <span className="absolute inset-0 flex items-center justify-center text-[8px] sm:text-[10px] font-bold pt-[1px]">
              10
            </span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            aria-label={ended ? 'Replay' : isPlaying ? 'Pause' : 'Play'}
            title={ended ? 'Replay' : isPlaying ? 'Pause (k)' : 'Play (k)'}
            className="pointer-events-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/55 hover:bg-brand backdrop-blur-sm flex items-center justify-center text-white transition-colors active:scale-95"
          >
            {ended ? (
              <RotateCcw className="w-7 h-7 sm:w-9 sm:h-9" />
            ) : isPlaying ? (
              <Pause className="w-7 h-7 sm:w-9 sm:h-9 fill-current" />
            ) : (
              <Play className="w-7 h-7 sm:w-9 sm:h-9 fill-current ml-1" />
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              seekBy(10);
            }}
            aria-label="Forward 10 seconds"
            title="Forward 10 seconds (l)"
            className="pointer-events-auto relative w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-black/45 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center text-white transition-colors active:scale-95"
          >
            <RotateCw className="w-5 h-5 sm:w-7 sm:h-7" />
            <span className="absolute inset-0 flex items-center justify-center text-[8px] sm:text-[10px] font-bold pt-[1px]">
              10
            </span>
          </button>
        </div>
      )}

      {/* Controls */}
      <div
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        className={`absolute inset-x-0 bottom-0 px-2 sm:px-4 pb-1.5 sm:pb-2 pt-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-200 ${
          controlsVisible || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Timeline */}
        <div
          ref={timelineRef}
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={Math.floor(duration)}
          aria-valuenow={Math.floor(currentTime)}
          tabIndex={0}
          onMouseDown={(e) => {
            setScrubbing(true);
            seekToRatio(ratioFromEvent(e.clientX));
          }}
          onTouchStart={(e) => {
            setScrubbing(true);
            seekToRatio(ratioFromEvent(e.touches[0].clientX));
          }}
          onMouseMove={(e) => setHoverRatio(ratioFromEvent(e.clientX))}
          onMouseLeave={() => !scrubbing && setHoverRatio(null)}
          className="relative h-6 flex items-center cursor-pointer group/rail touch-none"
        >
          <div
            className={`relative w-full rounded-full bg-white/25 transition-all ${
              scrubbing ? 'h-1.5' : 'h-1 group-hover/rail:h-1.5'
            }`}
          >
            {/* Buffered ahead of the playhead */}
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-white/40 transition-[width] duration-300"
              style={{ width: `${bufferedRatio * 100}%` }}
            />

            {/* Faint preview of where a click would land */}
            {hoverRatio !== null && hoverRatio > progressRatio && (
              <div
                className="absolute inset-y-0 rounded-full bg-white/25"
                style={{
                  left: `${progressRatio * 100}%`,
                  width: `${(hoverRatio - progressRatio) * 100}%`,
                }}
              />
            )}

            {/* Played portion */}
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${progressRatio * 100}%`,
                backgroundImage:
                  'linear-gradient(90deg, rgb(255 77 109), rgb(255 0 51) 60%, rgb(209 0 43))',
                boxShadow: '0 0 10px rgb(255 0 51 / 0.65)',
              }}
            />

            {/* Playhead */}
            <span
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white ring-[3px] ring-brand shadow-lg transition-transform ${
                scrubbing ? 'scale-125' : 'scale-0 group-hover/rail:scale-100'
              }`}
              style={{ left: `${progressRatio * 100}%` }}
            />
          </div>

          {/* Hover time tooltip */}
          {hoverRatio !== null && duration > 0 && (
            <span
              className="absolute -top-1 -translate-x-1/2 -translate-y-full px-1.5 py-0.5 rounded bg-black/90 text-white text-[11px] font-semibold pointer-events-none"
              style={{ left: `${hoverRatio * 100}%` }}
            >
              {formatTime(hoverRatio * duration)}
            </span>
          )}
        </div>

        {/* Button row */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          <button onClick={togglePlay} className={iconButton} aria-label={isPlaying ? 'Pause (k)' : 'Play (k)'} title={isPlaying ? 'Pause (k)' : 'Play (k)'}>
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
          </button>

          <button
            onClick={() => seekBy(-seekStep)}
            className={`${iconButton} relative`}
            aria-label={`Back ${seekStep} seconds (j)`}
            title={`Back ${seekStep} seconds (j)`}
          >
            <RotateCcw className="w-[19px] h-[19px]" />
            <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold pt-[1px]">
              {seekStep}
            </span>
          </button>
          <button
            onClick={() => seekBy(seekStep)}
            className={`${iconButton} relative`}
            aria-label={`Forward ${seekStep} seconds (l)`}
            title={`Forward ${seekStep} seconds (l)`}
          >
            <RotateCw className="w-[19px] h-[19px]" />
            <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold pt-[1px]">
              {seekStep}
            </span>
          </button>

          {/* Volume — the slider expands on hover to keep the bar compact */}
          <div className="flex items-center group/vol">
            <button onClick={toggleMute} className={iconButton} aria-label={muted ? 'Unmute (m)' : 'Mute (m)'} title={muted ? 'Unmute (m)' : 'Mute (m)'}>
              <VolumeIcon className="w-5 h-5" />
            </button>

            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => applyVolume(Number(e.target.value))}
              aria-label="Volume"
              style={{
                backgroundImage: `linear-gradient(90deg, rgb(255 0 51) ${
                  (muted ? 0 : volume) * 100
                }%, rgb(255 255 255 / 0.3) ${(muted ? 0 : volume) * 100}%)`,
              }}
              className="w-16 sm:w-20 h-1 rounded-full appearance-none accent-brand cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3
                [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow
                [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white"
            />
          </div>

          <span className="px-2 text-[11px] sm:text-xs font-medium text-white/90 tabular-nums whitespace-nowrap">
            {formatTime(currentTime)} <span className="text-white/50">/ {formatTime(duration)}</span>
          </span>

          <div className="flex-1" />

          {/* Settings menu */}
          <div className="relative">
            <button
              onClick={() => setShowSettings((prev) => !prev)}
              className={iconButton}
              aria-label="Settings"
              aria-expanded={showSettings}
              title="Settings"
            >
              <Settings className={`w-5 h-5 transition-transform ${showSettings ? 'rotate-45' : ''}`} />
            </button>

            {showSettings && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSettings(false)} />
                <div className="absolute right-0 bottom-full mb-3 w-52 rounded-xl bg-black/95 border border-white/15 shadow-2xl py-2 z-20 backdrop-blur-sm">
                  <p className="px-4 pb-1.5 text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                    Playback speed
                  </p>
                  <div className="max-h-56 overflow-y-auto">
                    {SPEEDS.map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          if (videoRef.current) videoRef.current.playbackRate = option;
                          setShowSettings(false);
                        }}
                        className="w-full flex items-center justify-between px-4 py-1.5 text-sm text-white/90 hover:bg-white/10 transition-colors"
                      >
                        <span>{option === 1 ? 'Normal' : `${option}×`}</span>
                        {speed === option && <Check className="w-3.5 h-3.5 text-brand" />}
                      </button>
                    ))}
                  </div>

                  <div className="h-px bg-white/10 my-1.5" />

                  <p className="px-4 pt-1.5 pb-1.5 text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                    Skip amount
                  </p>
                  <div className="flex items-center gap-1.5 px-4 pb-2">
                    {SEEK_STEPS.map((step) => (
                      <button
                        key={step}
                        onClick={() => changeSeekStep(step)}
                        className={`flex-1 py-1 rounded-md text-xs font-semibold transition-colors ${
                          seekStep === step
                            ? 'bg-brand text-white'
                            : 'bg-white/10 text-white/80 hover:bg-white/20'
                        }`}
                      >
                        {step}s
                      </button>
                    ))}
                  </div>

                  <div className="h-px bg-white/10 my-1.5" />

                  <button
                    onClick={() => setLooping((prev) => !prev)}
                    className="w-full flex items-center justify-between px-4 py-1.5 text-sm text-white/90 hover:bg-white/10 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Repeat className="w-3.5 h-3.5" />
                      <span>Loop</span>
                    </span>
                    {looping && <Check className="w-3.5 h-3.5 text-brand" />}
                  </button>
                </div>
              </>
            )}
          </div>

          {document.pictureInPictureEnabled && (
            <button onClick={togglePip} className={`${iconButton} hidden sm:inline-flex`} aria-label="Picture in picture (i)" title="Picture in picture (i)">
              <PictureInPicture2 className="w-5 h-5" />
            </button>
          )}

          {onToggleTheater && (
            <button
              onClick={onToggleTheater}
              className={`${iconButton} hidden lg:inline-flex`}
              aria-label={isTheater ? 'Default view (t)' : 'Theater mode (t)'}
              title={isTheater ? 'Default view (t)' : 'Theater mode (t)'}
            >
              <RectangleHorizontal className={`w-5 h-5 ${isTheater ? 'text-brand' : ''}`} />
            </button>
          )}

          <button onClick={toggleFullscreen} className={iconButton} aria-label={isFullscreen ? 'Exit fullscreen (f)' : 'Fullscreen (f)'} title={isFullscreen ? 'Exit fullscreen (f)' : 'Fullscreen (f)'}>
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
