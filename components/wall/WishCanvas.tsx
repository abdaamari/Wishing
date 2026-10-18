'use client';

import {
  motion,
  useMotionValue,
  useReducedMotion,
  type MotionValue,
} from 'framer-motion';
import type { Wish } from '@/lib/types';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const wishBackgrounds: Record<string, string> = {
  sky: 'bg-sky',
  butter: 'bg-butter',
  peach: 'bg-peach',
  mint: 'bg-mint',
  lavender: 'bg-lavender',
};

function FlowerCluster({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 150"
      fill="none"
      className={className}
    >
      <path
        d="M58 145c2-29-6-48-17-69m18 69c3-34 16-59 32-81M58 145c-3-23 0-42 5-59"
        stroke="#4D8B70"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <path
        d="M43 99c-13-2-19-9-21-19 13 1 21 7 21 19Zm33-22c2-13 10-19 20-20-1 13-8 20-20 20Zm-15 30c-12-1-19-7-22-17 13 0 21 6 22 17Z"
        fill="#74A982"
      />
      <g fill="#FFF8E7" stroke="#D9A94D" strokeWidth="1.5">
        <circle cx="40" cy="68" r="7" />
        <circle cx="28" cy="68" r="7" />
        <circle cx="34" cy="58" r="7" />
        <circle cx="34" cy="78" r="7" />
        <circle cx="86" cy="55" r="6" />
        <circle cx="76" cy="55" r="6" />
        <circle cx="81" cy="46" r="6" />
        <circle cx="81" cy="64" r="6" />
        <circle cx="67" cy="85" r="5.5" />
        <circle cx="58" cy="85" r="5.5" />
        <circle cx="62.5" cy="77" r="5.5" />
        <circle cx="62.5" cy="93" r="5.5" />
      </g>
      <g fill="#E6B94F">
        <circle cx="34" cy="68" r="4" />
        <circle cx="81" cy="55" r="3.5" />
        <circle cx="62.5" cy="85" r="3" />
      </g>
    </svg>
  );
}

type MovingCard = {
  id: string;
  element: HTMLDivElement;
  x: MotionValue<number>;
  y: MotionValue<number>;
  left: number;
  top: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  initialized: boolean;
  spawnOrder: number;
};

type CardOrigin = { left: number; top: number; width: number };

function MovingWish({
  wish,
  index,
  origin,
  spawnOrder,
  register,
}: {
  wish: Wish;
  index: number;
  origin?: CardOrigin;
  spawnOrder: number;
  register: (
    id: string,
    element: HTMLDivElement | null,
    x: MotionValue<number>,
    y: MotionValue<number>,
  ) => void;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const setRef = useCallback(
    (element: HTMLDivElement | null) => register(wish.id, element, x, y),
    [register, wish.id, x, y],
  );

  return (
    <motion.div
      ref={setRef}
      className={`${origin ? 'absolute left-0 top-0' : 'relative w-full max-w-72'} break-words rounded-2xl border border-white/80 p-3 text-primary shadow-lg ${
        wishBackgrounds[wish.color] ?? 'bg-white/85'
      }`}
      style={{
        x,
        y,
        left: origin?.left,
        top: origin?.top,
        width: origin?.width,
        zIndex: spawnOrder,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ opacity: { duration: 0.6, delay: index * 0.08 } }}
    >
      {wish.photo_url && (
        <img
          src={wish.photo_url}
          alt={`Foto wish dari ${wish.name}`}
          className="mb-2 aspect-[4/3] w-full rounded-xl object-cover"
          draggable={false}
        />
      )}
      <p className="font-serif text-sm md:text-base">{wish.message}</p>
      <p className="mt-1 text-xs md:text-sm">- {wish.name}</p>
    </motion.div>
  );
}

function WishMotionCanvas({ wishes }: { wishes: Wish[] }) {
  const shouldReduceMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef(new Map<string, MovingCard>());
  const nextSpawnOrderRef = useRef(0);
  const [positioned, setPositioned] = useState(false);
  const [origins, setOrigins] = useState<Record<string, CardOrigin>>({});

  const registerCard = useCallback(
    (
      id: string,
      element: HTMLDivElement | null,
      x: MotionValue<number>,
      y: MotionValue<number>,
    ) => {
      if (!element) {
        cardsRef.current.delete(id);
        return;
      }

      const existing = cardsRef.current.get(id);
      const spawnOrder = existing?.spawnOrder ?? nextSpawnOrderRef.current++;
      cardsRef.current.set(id, {
        id,
        element,
        x,
        y,
        left: existing?.left ?? 0,
        top: existing?.top ?? 0,
        width: existing?.width ?? 0,
        height: existing?.height ?? 0,
        vx: existing?.vx ?? 0,
        vy: existing?.vy ?? 0,
        initialized: existing?.initialized ?? false,
        spawnOrder,
      });
    },
    [],
  );

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || wishes.length === 0) return;

    const stageRect = stage.getBoundingClientRect();
    const qrPanel = document.querySelector<HTMLElement>(
      '[aria-label="Scan to leave a wish"]',
    );
    const qrRect = qrPanel?.getBoundingClientRect();
    const qrZone = qrRect
      ? {
          left: qrRect.left - stageRect.left - 12,
          top: qrRect.top - stageRect.top - 12,
          right: qrRect.right - stageRect.left + 12,
          bottom: qrRect.bottom - stageRect.top + 12,
        }
      : null;
    const nextOrigins: Record<string, CardOrigin> = {};
    const cards = wishes
      .map((wish) => {
        const card = cardsRef.current.get(wish.id);
        if (!card) return null;

        const rect = card.element.getBoundingClientRect();
        const initialX = Math.max(0, Math.min(
          card.initialized ? card.left + card.x.get() : rect.left - stageRect.left,
          stageRect.width - rect.width,
        ));
        const initialY = Math.max(0, Math.min(
          card.initialized ? card.top + card.y.get() : rect.top - stageRect.top,
          stageRect.height - rect.height,
        ));
        const direction = card.spawnOrder * 2.399;
        const speed = 20 + (card.spawnOrder % 4) * 3;

        card.left = initialX;
        card.top = initialY;
        card.width = rect.width;
        card.height = rect.height;
        if (!card.initialized || (card.vx === 0 && card.vy === 0)) {
          card.vx = Math.cos(direction) * speed;
          card.vy = Math.sin(direction) * speed;
        }
        card.x.set(0);
        card.y.set(0);
        card.initialized = true;
        nextOrigins[wish.id] = {
          left: initialX,
          top: initialY,
          width: rect.width,
        };

        return card;
      })
      .filter((card): card is MovingCard => card !== null);

    const worldX = (card: MovingCard) => card.left + card.x.get();
    const worldY = (card: MovingCard) => card.top + card.y.get();

    if (qrZone) {
      for (const card of cards) {
        const x = worldX(card);
        const y = worldY(card);
        const overlapsQr =
          x < qrZone.right &&
          x + card.width > qrZone.left &&
          y < qrZone.bottom &&
          y + card.height > qrZone.top;

        if (!overlapsQr) continue;

        const options = [
          { left: qrZone.left - card.width, top: y },
          { left: qrZone.right, top: y },
          { left: x, top: qrZone.top - card.height },
          { left: x, top: qrZone.bottom },
        ]
          .map((position) => ({
            left: Math.max(0, Math.min(position.left, stageRect.width - card.width)),
            top: Math.max(0, Math.min(position.top, stageRect.height - card.height)),
          }))
          .sort((a, b) => {
            const aDistance = Math.hypot(a.left - x, a.top - y);
            const bDistance = Math.hypot(b.left - x, b.top - y);
            return aDistance - bDistance;
          });

        card.left = options[0].left;
        card.top = options[0].top;
        card.x.set(0);
        card.y.set(0);
        nextOrigins[card.id] = {
          left: card.left,
          top: card.top,
          width: card.width,
        };
      }
    }

    if (qrZone) {
      for (const card of cards) {
        const x = worldX(card);
        const y = worldY(card);
        const overlapsQr =
          x < qrZone.right &&
          x + card.width > qrZone.left &&
          y < qrZone.bottom &&
          y + card.height > qrZone.top;

        if (!overlapsQr) continue;

        const above = qrZone.top - card.height;
        const left = qrZone.left - card.width;
        const nextPosition =
          above >= 0
            ? { left: x, top: above }
            : { left: Math.max(0, left), top: y };
        card.left = nextPosition.left;
        card.top = nextPosition.top;
        card.x.set(0);
        card.y.set(0);
        nextOrigins[card.id] = {
          ...nextPosition,
          width: card.width,
        };
      }
    }

    setOrigins(nextOrigins);
    setPositioned(true);
  }, [wishes]);

  useEffect(() => {
    if (!positioned) return;

    let frameId = 0;
    let previousTime: number | null = null;

    const animate = (time: number) => {
      const frameDelta = previousTime === null ? 0 : time - previousTime;
      previousTime = time;

      const stage = stageRef.current;
      if (!stage) return;

      const delta = Math.min(frameDelta, 32) / 1000;
      const cards = [...cardsRef.current.values()];
      const stageRect = stage.getBoundingClientRect();
      const width = stage.clientWidth;
      const height = stage.clientHeight;
      const qrPanel = document.querySelector<HTMLElement>(
        '[aria-label="Scan to leave a wish"]',
      );
      const qrRect = qrPanel?.getBoundingClientRect();
      const qrZone = qrRect
        ? {
            left: qrRect.left - stageRect.left - 12,
            top: qrRect.top - stageRect.top - 12,
            right: qrRect.right - stageRect.left + 12,
            bottom: qrRect.bottom - stageRect.top + 12,
          }
        : null;

      for (const card of cards) {
        if (card.vx === 0 && card.vy === 0) {
          const direction = card.spawnOrder * 2.399;
          const speed = 20 + (card.spawnOrder % 4) * 3;
          card.vx = Math.cos(direction) * speed;
          card.vy = Math.sin(direction) * speed;
        }

        const previousX = card.left + card.x.get();
        const previousY = card.top + card.y.get();
        let x = previousX + card.vx * delta;
        let y = previousY + card.vy * delta;
        const maxX = Math.max(0, width - card.width);
        const maxY = Math.max(0, height - card.height);

        if (
          qrZone &&
          x < qrZone.right &&
          x + card.width > qrZone.left &&
          y < qrZone.bottom &&
          y + card.height > qrZone.top
        ) {
          const overlapX =
            Math.min(x + card.width, qrZone.right) - Math.max(x, qrZone.left);
          const overlapY =
            Math.min(y + card.height, qrZone.bottom) - Math.max(y, qrZone.top);

          if (overlapX < overlapY) {
            if (previousX + card.width / 2 < (qrZone.left + qrZone.right) / 2) {
              x = qrZone.left - card.width;
              if (card.vx > 0) card.vx *= -1;
            } else {
              x = qrZone.right;
              if (card.vx < 0) card.vx *= -1;
            }
          } else if (
            previousY + card.height / 2 <
            (qrZone.top + qrZone.bottom) / 2
          ) {
            y = qrZone.top - card.height;
            if (card.vy > 0) card.vy *= -1;
          } else {
            y = qrZone.bottom;
            if (card.vy < 0) card.vy *= -1;
          }
        }

        if (x <= 0 || x >= maxX) {
          x = Math.max(0, Math.min(x, maxX));
          card.vx *= -1;
        }
        if (y <= 0 || y >= maxY) {
          y = Math.max(0, Math.min(y, maxY));
          card.vy *= -1;
        }

        card.x.set(Math.max(0, Math.min(x, maxX)) - card.left);
        card.y.set(Math.max(0, Math.min(y, maxY)) - card.top);
      }

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [positioned]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-0 left-0 z-0 w-20 opacity-80 sm:w-28"
        animate={shouldReduceMotion ? undefined : { y: [0, -5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <FlowerCluster className="h-auto w-full" />
      </motion.div>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-0 right-[min(28vw,18rem)] z-0 w-16 opacity-65 sm:w-24"
        animate={shouldReduceMotion ? undefined : { y: [0, -4, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
      >
        <FlowerCluster className="h-auto w-full -scale-x-100" />
      </motion.div>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed right-3 top-5 z-0 w-12 opacity-55 sm:right-10 sm:w-16"
        animate={shouldReduceMotion ? undefined : { y: [0, -4, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
      >
        <FlowerCluster className="h-auto w-full" />
      </motion.div>

      <div
        ref={stageRef}
        className="absolute inset-0 overflow-hidden"
      >
        <div className="relative grid h-full w-full grid-cols-2 content-start justify-items-center gap-2 pb-16 pl-4 pr-[calc(clamp(12rem,28vw,26rem)+1rem)] pt-20 sm:grid-cols-3 sm:pl-6 md:grid-cols-4 lg:grid-cols-5">
          {wishes.map((wish, index) => (
            <MovingWish
              key={wish.id}
              wish={wish}
              index={index}
              origin={origins[wish.id]}
              spawnOrder={cardsRef.current.get(wish.id)?.spawnOrder ?? index}
              register={registerCard}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function WishCanvas({ wishes }: { wishes: Wish[] }) {
  return (
    <WishMotionCanvas wishes={wishes} />
  );
}
