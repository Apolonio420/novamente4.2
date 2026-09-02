'use client';

import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';

interface VideoCardProps {
  src: string;
  poster: string;
  preview?: string;
  title: string;
  duration?: string;
  accent: 'violet' | 'fuchsia';
}

const ACCENT_GRADIENT: Record<VideoCardProps['accent'], string> = {
  violet: 'from-violet-600/40 via-violet-900/40 to-neutral-950',
  fuchsia: 'from-fuchsia-600/40 via-fuchsia-900/40 to-neutral-950',
};

export default function VideoCard({ src, poster, preview, title, duration, accent }: VideoCardProps) {
  const [playing, setPlaying] = useState(false);
  const [posterError, setPosterError] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hovering, setHovering] = useState(false);
  const previewRef = useRef<HTMLVideoElement>(null);
  const activeVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  useEffect(() => {
    if (playing && activeVideoRef.current) {
      activeVideoRef.current.play().catch(() => {});
    }
  }, [playing]);

  const handleEnterPreview = () => {
    setHovering(true);
    if (reducedMotion || !preview) return;
    previewRef.current?.play().catch(() => {});
  };

  const handleLeavePreview = () => {
    setHovering(false);
    if (previewRef.current) {
      previewRef.current.pause();
      previewRef.current.currentTime = 0;
    }
  };

  const handleActivate = () => {
    setPlaying(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleActivate();
    }
  };

  if (playing) {
    return (
      <div className="aspect-video bg-neutral-900 relative">
        <video
          ref={activeVideoRef}
          controls
          autoPlay
          playsInline
          preload="metadata"
          src={src}
          aria-label={`Video: ${title}`}
          className="w-full h-full object-contain"
        >
          Tu navegador no soporta el formato de video.
        </video>
      </div>
    );
  }

  return (
    <div
      className="aspect-video bg-neutral-900 relative overflow-hidden cursor-pointer"
      onClick={handleActivate}
      onMouseEnter={handleEnterPreview}
      onMouseLeave={handleLeavePreview}
      onFocus={handleEnterPreview}
      onBlur={handleLeavePreview}
    >
      {posterError ? (
        <div className={`absolute inset-0 bg-gradient-to-br ${ACCENT_GRADIENT[accent]}`} />
      ) : (
        <img
          src={poster}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setPosterError(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {preview && !reducedMotion && (
        <video
          ref={previewRef}
          muted
          loop
          playsInline
          preload="none"
          src={preview}
          aria-hidden="true"
          tabIndex={-1}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            hovering ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

      <div className="absolute inset-0 flex items-center justify-center">
        <button
          type="button"
          aria-label={`Reproducir: ${title}`}
          onClick={(e) => {
            e.stopPropagation();
            handleActivate();
          }}
          onKeyDown={handleKeyDown}
          className="w-16 h-16 rounded-full bg-white/90 shadow-xl flex items-center justify-center transition-transform duration-200 hover:scale-105 focus-visible:scale-105 focus-visible:outline-none focus-visible:ring-2 ring-white/70 ring-offset-2 ring-offset-neutral-950"
        >
          <Play className="w-6 h-6 text-neutral-900 translate-x-0.5" fill="currentColor" />
        </button>
      </div>

      {duration && (
        <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/70 text-white text-xs font-medium backdrop-blur-sm">
          {duration}
        </div>
      )}
    </div>
  );
}
