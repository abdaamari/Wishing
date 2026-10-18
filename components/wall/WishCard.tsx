import { motion } from 'framer-motion';

// Class lengkap ditulis eksplisit supaya Tailwind tidak membuangnya
// (`bg-${wish.color}` yang dinamis tidak terdeteksi saat build).
const cardBackgrounds: Record<string, string> = {
  sky: 'bg-sky',
  butter: 'bg-butter',
  peach: 'bg-peach',
  mint: 'bg-mint',
  lavender: 'bg-lavender',
};

// Kemiringan kecil yang konsisten per wish, seperti catatan yang ditempel.
function tiltFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return ((Math.abs(hash) % 7) - 3) * 0.8;
}

export default function WishCard({ wish }: { wish: any }) {
  const tilt = tiltFor(String(wish.id ?? wish.name ?? wish.message ?? ''));

  return (
    <motion.div
      className={`relative break-words rounded-2xl border border-white/90 p-4 pt-5 text-primary shadow-[0_12px_28px_-12px_rgba(70,60,100,0.35)] ring-1 ring-black/5 ${
        cardBackgrounds[wish.color] ?? 'bg-white/85'
      }`}
      initial={{ opacity: 0, y: 16, rotate: tilt }}
      animate={{ opacity: 1, y: 0, rotate: tilt }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{
        scale: 1.04,
        y: -4,
        rotate: 0,
        boxShadow: '0 20px 36px -14px rgba(70,60,100,0.45)',
      }}
      layout
    >
      {/* washi tape */}
      <span
        aria-hidden="true"
        className="absolute -top-2 left-1/2 h-4 w-14 -translate-x-1/2 -rotate-3 rounded-sm bg-white/70 shadow-sm"
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, rgba(255,255,255,0) 0 6px, rgba(255,190,200,0.35) 6px 9px)',
        }}
      />

      {/* tanda kutip dekoratif */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1 select-none font-serif text-5xl leading-none opacity-15"
      >
        &rdquo;
      </span>

      <p className="relative font-serif text-sm leading-relaxed md:text-base">
        {wish.message}
      </p>

      <div className="mt-3 flex items-center gap-2 border-t border-black/5 pt-2">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5 shrink-0 text-rose-400/80"
          fill="currentColor"
        >
          <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.8 5 6.1 5c2 0 3.3 1.1 3.9 2.2C10.6 6.1 11.9 5 13.9 5c3.3 0 5.2 3.4 3.7 6.8C19.5 16.4 12 21 12 21Z" />
        </svg>
        <p className="text-sm font-medium italic opacity-80">{wish.name}</p>
      </div>
    </motion.div>
  );
}
