'use client';

import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Wish } from '@/lib/types';

interface WishCanvasProps {
  wishes: Wish[];
}

export default function WishCanvas({ wishes }: WishCanvasProps) {
  // Container ref sebagai batasan area drag (constraints)
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[calc(100vh-4rem)] overflow-hidden rounded-3xl"
    >
      <AnimatePresence>
        {wishes.map((wish, index) => {
          // Membuat variasi posisi awal & durasi floating acak berdasarkan index/ID
          const randomDuration = 3.5 + (index % 5) * 0.6; // Durasi floating 3.5s - 6s
          const randomDelay = (index % 3) * 0.4;
          const rotateAngle = ((index % 7) - 3) * 2; // Kemiringan acak -6deg s/d 6deg

          return (
            <motion.div
              key={wish.id}
              drag
              dragConstraints={containerRef}
              dragElastic={0.15}
              dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
              initial={{ opacity: 0, scale: 0.6, y: 30 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: [0, -10, 0], // Efek mengapung naik-turun yang halus
                rotate: rotateAngle,
              }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.25 } }}
              transition={{
                y: {
                  duration: randomDuration,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  ease: 'easeInOut',
                  delay: randomDelay,
                },
                opacity: { duration: 0.4 },
                scale: { duration: 0.4 },
              }}
              whileHover={{
                scale: 1.08,
                rotate: 0,
                zIndex: 50,
                boxShadow: '0px 20px 30px rgba(0, 0, 0, 0.12)',
              }}
              whileTap={{
                scale: 1.02,
                cursor: 'grabbing',
              }}
              className="absolute p-5 max-w-xs bg-white/85 backdrop-blur-md rounded-2xl border border-white/60 shadow-lg cursor-grab select-none transition-colors hover:bg-white/95"
              style={{
                // Menata posisi layout offset secara bertahap agar kartu tidak menumpuk di satu titik
                left: `${10 + ((index * 22) % 75)}%`,
                top: `${12 + ((index * 18) % 65)}%`,
              }}
            >
              {/* Header Kartu */}
              <div className="flex items-center justify-between gap-3 mb-2 border-b border-emerald-100 pb-2">
                <span className="text-xs font-bold text-emerald-800 tracking-wide truncate">
                  {wish.name || 'Anonim'}
                </span>
                <span className="text-[10px] text-emerald-600/70 font-medium">
                  {wish.created_at
                    ? new Date(wish.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </span>
              </div>

              {/* Isi Pesan */}
              <p className="text-sm text-slate-700 leading-relaxed font-normal break-words">
                {wish.message}
              </p>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}