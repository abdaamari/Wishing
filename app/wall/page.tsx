
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import WishCanvas from '@/components/wall/WishCanvas';
import type { Wish } from '@/lib/types';
import QRCode from '@/components/shared/QRCode';

export default function WallPage() {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [qrUrl, setQrUrl] = useState('');
  const [qrError, setQrError] = useState('');

  useEffect(() => {
    const envUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
    const origin = window.location.origin;
    const originHostname = window.location.hostname;
    const isLocalHostname =
      originHostname === 'localhost' ||
      originHostname === '127.0.0.1' ||
      originHostname === '[::1]';

    if (envUrl && !/localhost|127\.0\.0\.1/.test(new URL(envUrl).hostname)) {
      setQrUrl(`${envUrl.replace(/\/+$/, '')}/wish`);
      return;
    }

    if (!isLocalHostname) {
      setQrUrl(`${origin.replace(/\/+$/, '')}/wish`);
      return;
    }

    let cancelled = false;
    void fetch('/api/local-site-url')
      .then(async (response) => {
        const result: { siteUrl?: string; error?: string } =
          await response.json();
        if (!response.ok || !result.siteUrl) {
          throw new Error(result.error || 'Failed to determine the local Wi-Fi address.');
        }
        return result.siteUrl;
      })
      .then((siteUrl) => {
        if (!cancelled) setQrUrl(siteUrl);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error('Failed to create a local QR destination:', error);
        setQrError(
          error instanceof Error
            ? error.message
            : 'Failed to determine the local Wi-Fi address.',
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Initial fetch and Supabase Realtime subscription.
  useEffect(() => {
    let isMounted = true;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const fetchWishes = async () => {
      const { data, error } = await supabase
        .from('wishes')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (isMounted && !error && data) {
        setWishes(data as Wish[]);
      }

      if (error) {
        console.error('Failed to fetch wishes:', error);
      }
    };

    fetchWishes();

    const channel = supabase
      .channel('public:wishes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wishes' },
        (payload) => {
          const newWish = payload.new as Wish | null;
          const oldWish = payload.old as Wish | null;

          if (newWish && newWish.status === 'published') {
            setWishes((prev) => {
              const index = prev.findIndex(
                (wish) => wish.id === newWish.id,
              );

              if (index !== -1) {
                const updated = [...prev];
                updated[index] = newWish;
                return updated;
              }

              return [newWish, ...prev];
            });
          }

          // Remove deleted or newly hidden published wishes.
          if (
            oldWish &&
            oldWish.status === 'published' &&
            (!newWish || newWish.status !== 'published')
          ) {
            setWishes((prev) =>
              prev.filter((wish) => wish.id !== oldWish.id),
            );
          }
        },
      )
      .subscribe((status, error) => {
        if (error) {
          console.error('Realtime subscription error:', error);
        }

        if (status === 'CLOSED' && isMounted) {
          if (reconnectTimer) clearTimeout(reconnectTimer);

          reconnectTimer = setTimeout(() => {
            if (isMounted) fetchWishes();
          }, 2000);
        }
      });

    return () => {
      isMounted = false;

      if (reconnectTimer) clearTimeout(reconnectTimer);

      void supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="relative isolate h-[100svh] w-full overflow-hidden bg-[#B9DDF2] text-[#26343A] selection:bg-[#F5D47B]">
      {/* BACKGROUND */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* Open summer sky */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#9DD5F2] via-[#D7EAF0] to-[#F8F4E9]" />

        {/* Sun halo */}
        <motion.div
          aria-hidden="true"
          animate={{ scale: [1, 1.045, 1], opacity: [0.45, 0.65, 0.45] }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute left-1/2 top-[15%] h-64 w-64 -translate-x-1/2 rounded-full bg-[#FFF5C9]/50 blur-3xl sm:top-[12%] sm:h-80 sm:w-80"
        />

        {/* Sun */}
        <motion.div
          aria-hidden="true"
          animate={{ y: [0, -8, 0] }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute left-1/2 top-[17%] h-24 w-24 -translate-x-1/2 rounded-full bg-[#F8D77E] shadow-[0_0_70px_rgba(255,244,192,0.7)] sm:top-[14%] sm:h-32 sm:w-32"
        >
          <div className="absolute inset-3 rounded-full border border-white/30" />
        </motion.div>

        {/* Drifting clouds */}
        <motion.div
          aria-hidden="true"
          animate={{ x: [0, 24, 0] }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute left-[7%] top-[23%] h-7 w-32 rounded-full bg-white/55 blur-[1px] sm:h-9 sm:w-44"
        />

        <motion.div
          aria-hidden="true"
          animate={{ x: [0, -30, 0] }}
          transition={{
            duration: 27,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute right-[8%] top-[31%] h-6 w-28 rounded-full bg-white/45 blur-[1px] sm:h-8 sm:w-40"
        />

        {/* Distant hills */}
        <div
          className="absolute -bottom-2 -left-[18%] h-[23%] w-[85%] rounded-[50%] bg-[#B8DCCB]/70"
          style={{ transform: 'rotate(-5deg)' }}
        />

        <div
          className="absolute -bottom-[8%] -right-[20%] h-[30%] w-[90%] rounded-[50%] bg-[#86C7C2]/75"
          style={{ transform: 'rotate(7deg)' }}
        />

        {/* Foreground landscape */}
        <div
          className="absolute -bottom-[18%] left-[-15%] h-[32%] w-[80%] rounded-[50%] bg-[#4D9E9B]/70"
          style={{ transform: 'rotate(4deg)' }}
        />

        <div
          className="absolute -bottom-[20%] right-[-12%] h-[34%] w-[82%] rounded-[50%] bg-[#368C91]/65"
          style={{ transform: 'rotate(-5deg)' }}
        />

        {/* Organic corner foliage */}
        <svg
          aria-hidden="true"
          viewBox="0 0 300 300"
          className="absolute -left-14 -top-16 w-40 text-[#437F70]/65 sm:-left-16 sm:-top-20 sm:w-64"
          fill="currentColor"
        >
          <path d="M0 0H240C177 28 115 81 62 160C42 104 18 47 0 0Z" />
          <path d="M0 0C67 48 117 112 148 194C102 153 53 122 0 108Z" opacity=".65" />
          <path d="M8 0C31 63 51 113 78 157" fill="none" stroke="#F8F4E9" strokeWidth="1.2" opacity=".55" />
        </svg>

        <svg
          aria-hidden="true"
          viewBox="0 0 300 300"
          className="absolute -right-20 top-0 w-44 rotate-90 text-[#437F70]/55 sm:-right-24 sm:-top-8 sm:w-72"
          fill="currentColor"
        >
          <path d="M0 0H240C177 28 115 81 62 160C42 104 18 47 0 0Z" />
          <path d="M0 0C67 48 117 112 148 194C102 153 53 122 0 108Z" opacity=".65" />
        </svg>

        {/* Fine grain */}
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'radial-gradient(#FFFFFF 0.65px, transparent 0.65px)',
            backgroundSize: '5px 5px',
          }}
        />
      </div>

      {/* HEADER */}
      <header className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 px-4 pt-4 sm:px-8 sm:pt-7 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="flex items-center gap-3"
        >
          
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="flex items-center gap-2 rounded-full border border-white/70 bg-[#FFFDF5]/80 px-3 py-2 shadow-sm backdrop-blur-md sm:gap-2.5 sm:px-4"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#75A98A] opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#568E70]" />
          </span>

          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#426C78] sm:text-xs">
            Live
          </span>

          <span className="h-4 w-px bg-[#C7D9D5]" />

          <span
            className="text-xs font-semibold tabular-nums text-[#263F4A] sm:text-sm"
            aria-live="polite"
          >
            {wishes.length}
          </span>

          <span className="hidden text-xs text-[#64818A] sm:inline">
            wishes
          </span>
        </motion.div>
      </header>

      {/* ATMOSPHERIC HEADLINE */}
      <div className="pointer-events-none absolute left-1/2 top-[13%] z-[1] w-full -translate-x-1/2 px-5 text-center sm:top-[12%] [@media(max-height:600px)]:top-[22%]">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="mb-2 text-[9px] font-semibold uppercase tracking-[0.28em] text-[#527C85] sm:mb-3 sm:text-[11px] sm:tracking-[0.38em]"
        >
          Collected under the same sky
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <p className="font-serif text-4xl italic leading-none tracking-tight text-[#294C58]/90 sm:text-5xl lg:text-7xl [@media(max-height:600px)]:text-4xl">
            Little wishes,
          </p>
          <p className="mt-1 font-serif text-4xl leading-none tracking-tight text-[#294C58] sm:mt-2 sm:text-5xl lg:text-7xl [@media(max-height:600px)]:text-4xl">
            endless <span className="text-[#B78A39]">summer.</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scaleX: 0.4 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.65 }}
          className="mx-auto mt-4 h-px w-12 bg-[#B78A39]/60 sm:mt-5 sm:w-16"
        />
      </div>

      {/* WISH CANVAS */}
      <main className="absolute inset-0 z-[5]">
        <div className="absolute inset-0">
          <WishCanvas wishes={wishes} />
        </div>
      </main>

      {/* QR PANEL */}
      <motion.aside
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.8,
          delay: 0.5,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="fixed bottom-3 right-3 z-30 sm:bottom-6 sm:right-6 lg:bottom-8 lg:right-8"
        aria-label="Scan to leave a wish"
      >
        <div className="relative flex flex-col items-center rounded-[20px] border border-[#D9A94D]/50 bg-[#FFFCF3] p-2.5 shadow-[0_12px_40px_rgba(38,63,74,0.18)] ring-4 ring-white/60 sm:rounded-[26px] sm:p-4 lg:p-5">
          {/* Small sun ornament */}
          <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#FFFCF3] bg-[#F5D47B] sm:h-9 sm:w-9">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4 text-[#85662D] sm:h-5 sm:w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42m0-14.14-1.42 1.42m-11.3 11.3-1.42 1.42" />
            </svg>
          </div>

          <p className="mb-2 text-[8px] font-semibold uppercase tracking-[0.18em] text-[#69838A] sm:mb-3 sm:text-[9px] sm:tracking-[0.22em]">
            Your turn to dream
          </p>

          {qrUrl ? (
            <div className="rounded-xl bg-white p-1.5 sm:rounded-2xl sm:p-2">
              <QRCode url={qrUrl} size={112} />
            </div>
          ) : (
            <div className="flex h-[112px] w-[112px] items-center justify-center rounded-xl bg-[#E9F1E9] sm:h-[150px] sm:w-[150px]">
              <span className="px-2 text-center text-[10px] text-[#527C85]">
                {qrError || 'Loading QR…'}
              </span>
            </div>
          )}
        </div>
      </motion.aside>

      {/* FOOTER */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.8 }}
        className="pointer-events-none absolute bottom-4 left-4 z-10 sm:bottom-7 sm:left-8 lg:left-12"
      >
        <p className="font-serif text-sm italic text-white/90 drop-shadow-[0_1px_3px_rgba(38,63,74,0.3)] sm:text-lg">
          Made by abdaamarii.
        </p>
      </motion.footer>
    </div>
  );
}
