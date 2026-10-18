'use client';

import { useEffect, useRef } from 'react';
import type { BrandingConfig } from '@/lib/brand-config';

export default function WallMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const musicEnabledRef = useRef(false);
  const playbackStartedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    const attemptPlayback = () => {
      const audio = audioRef.current;
      if (
        !musicEnabledRef.current ||
        playbackStartedRef.current ||
        !audio
      ) {
        return;
      }

      playbackStartedRef.current = true;
      void audio
        .play()
        .then(() => {
          if (!musicEnabledRef.current) {
            audio.pause();
            audio.currentTime = 0;
            playbackStartedRef.current = false;
          }
        })
        .catch((error: unknown) => {
          playbackStartedRef.current = false;
          if (!(error instanceof DOMException && error.name === 'NotAllowedError')) {
            console.error('Unable to play configured wall background music:', error);
          }
        });
    };
    const startPlaybackAfterInteraction = () => {
      attemptPlayback();
    };

    const refreshSettings = async () => {
      try {
        const response = await fetch('/api/branding', { cache: 'no-store' });
        if (!response.ok) throw new Error('Unable to load music settings.');
        const settings = (await response.json()) as BrandingConfig;
        if (cancelled) return;

        musicEnabledRef.current = settings.musicEnabled;
        const audio = audioRef.current;

        if (!settings.musicEnabled) {
          playbackStartedRef.current = false;
          if (audio && !audio.paused) {
            audio.pause();
            audio.currentTime = 0;
          }
          return;
        }

        attemptPlayback();
      } catch (error: unknown) {
        if (!cancelled) console.error('Unable to load wall music settings:', error);
      } finally {
        if (!cancelled) {
          refreshTimer = setTimeout(() => void refreshSettings(), 2500);
        }
      }
    };

    document.addEventListener('pointerdown', startPlaybackAfterInteraction, {
      passive: true,
    });
    document.addEventListener('keydown', startPlaybackAfterInteraction);

    void refreshSettings();

    return () => {
      cancelled = true;
      if (refreshTimer) clearTimeout(refreshTimer);
      document.removeEventListener('pointerdown', startPlaybackAfterInteraction);
      document.removeEventListener('keydown', startPlaybackAfterInteraction);
      audioRef.current?.pause();
    };
  }, []);

  return (
    <audio
      ref={audioRef}
      loop
      preload="none"
      src="/audio/background.mp3"
    />
  );
}
