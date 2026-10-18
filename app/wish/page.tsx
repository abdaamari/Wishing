'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import WishForm from '@/components/wish/WishForm';

export default function WishPage() {
  return (
    <main className="relative isolate min-h-svh overflow-hidden bg-[#B9DDF2] text-[#26343A] selection:bg-[#F5D47B]">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#9DD5F2] via-[#D7EAF0] to-[#F8F4E9]" />
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-1/2 top-12 h-72 w-72 -translate-x-1/2 rounded-full bg-[#FFF5C9]/55 blur-3xl sm:top-20 sm:h-96 sm:w-96"
        />
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-1/2 top-16 h-24 w-24 -translate-x-1/2 rounded-full bg-[#F8D77E] shadow-[0_0_70px_rgba(255,244,192,0.7)] sm:top-24 sm:h-32 sm:w-32"
        >
          <div className="absolute inset-3 rounded-full border border-white/40" />
        </motion.div>
        <motion.div
          animate={{ x: [0, 20, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-[7%] top-44 h-7 w-32 rounded-full bg-white/55 blur-[1px] sm:top-52 sm:h-9 sm:w-44"
        />
        <motion.div
          animate={{ x: [0, -24, 0] }}
          transition={{ duration: 27, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute right-[8%] top-64 h-6 w-28 rounded-full bg-white/45 blur-[1px] sm:top-72 sm:h-8 sm:w-40"
        />
        <svg
          viewBox="0 0 300 300"
          className="absolute -left-16 -top-16 w-40 text-[#437F70]/35 sm:-left-20 sm:-top-20 sm:w-64"
          fill="currentColor"
        >
          <path d="M0 0H240C177 28 115 81 62 160C42 104 18 47 0 0Z" />
          <path d="M0 0C67 48 117 112 148 194C102 153 53 122 0 108Z" opacity=".65" />
        </svg>
        <svg
          viewBox="0 0 300 300"
          className="absolute -right-20 top-0 w-44 rotate-90 text-[#437F70]/30 sm:-right-24 sm:-top-8 sm:w-72"
          fill="currentColor"
        >
          <path d="M0 0H240C177 28 115 81 62 160C42 104 18 47 0 0Z" />
          <path d="M0 0C67 48 117 112 148 194C102 153 53 122 0 108Z" opacity=".65" />
        </svg>
        <div
          className="absolute inset-0 opacity-[0.1]"
          style={{
            backgroundImage:
              'radial-gradient(#FFFFFF 0.65px, transparent 0.65px)',
            backgroundSize: '5px 5px',
          }}
        />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between px-5 pt-5 sm:px-8 sm:pt-7">
        <Link
          href="/wall"
          className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-[#FFFDF5]/75 px-4 py-2 text-sm font-medium text-[#426C78] shadow-sm backdrop-blur transition hover:bg-white"
        >
          <span aria-hidden="true">←</span>
          <span>Kembali ke wall</span>
        </Link>
        <span className="rounded-full border border-white/70 bg-[#FFFDF5]/75 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#426C78] shadow-sm backdrop-blur sm:text-xs">
          A little wish
        </span>
      </header>

      <section className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-12 pt-12 sm:px-8 sm:pt-16">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mb-8 max-w-xl text-center sm:mb-10"
        >
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#527C85] sm:text-xs">
            Collected under the same sky
          </p>
          <h1 className="font-serif text-4xl italic leading-[0.98] tracking-tight text-[#294C58]/90 sm:text-6xl">
            Send a little
            <br />
            <span className="not-italic text-[#294C58]">
              wish <span className="text-[#B78A39]">into the world.</span>
            </span>
          </h1>
          <div className="mx-auto mt-5 h-px w-14 bg-[#B78A39]/60" />
          <p className="mt-4 text-sm leading-relaxed text-[#52717A] sm:text-base">
            Tulis harapanmu, ambil foto dari kamera, dan biarkan wish-mu
            melayang di wall.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.8,
            delay: 0.12,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <WishForm />
        </motion.div>
      </section>

      <footer className="relative z-10 px-4 pb-5 text-center">
        <p className="font-serif text-sm italic text-white drop-shadow-[0_1px_3px_rgba(38,63,74,0.35)]">
          Made with a little sunshine.
        </p>
      </footer>
    </main>
  );
}
