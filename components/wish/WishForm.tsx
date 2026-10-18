'use client';

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { wishSchema } from '@/lib/validation';

const PHOTO_MAX_DIMENSION = 1280;
const PHOTO_MAX_SIZE = 5 * 1024 * 1024;

async function capturePhoto(video: HTMLVideoElement): Promise<File> {
  if (!video.videoWidth || !video.videoHeight) {
    throw new Error('Kamera belum siap. Tunggu sebentar lalu coba lagi.');
  }

  const scale = Math.min(
    1,
    PHOTO_MAX_DIMENSION / Math.max(video.videoWidth, video.videoHeight),
  );
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Kamera tidak bisa diproses di perangkat ini.');

  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.82),
  );
  if (!blob) throw new Error('Foto gagal diambil. Coba ambil ulang.');

  return new File([blob], 'wish-camera.jpg', { type: 'image/jpeg' });
}

const colorSwatches: Record<string, string> = {
  sky: 'bg-sky',
  butter: 'bg-butter',
  peach: 'bg-peach',
  mint: 'bg-mint',
  lavender: 'bg-lavender',
};

export default function WishForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [color, setColor] = useState('sky');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!cameraActive) return;

    let cancelled = false;
    setCameraStarting(true);
    if (!window.isSecureContext) {
      setCameraActive(false);
      setCameraStarting(false);
      setCameraError(
        'Akses kamera membutuhkan HTTPS atau localhost. Halaman IP lokal HTTP tidak dapat membuka kamera.',
      );
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraActive(false);
      setCameraStarting(false);
      setCameraError('Browser ini tidak mendukung akses kamera.');
      return;
    }

    void navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        cameraStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          return videoRef.current.play();
        }
      })
      .catch((cameraRequestError: unknown) => {
        if (cancelled) return;
        setCameraActive(false);
        setCameraError(
          cameraRequestError instanceof Error &&
            cameraRequestError.name === 'NotAllowedError'
            ? 'Izin kamera ditolak. Izinkan akses kamera di pengaturan browser.'
            : 'Kamera tidak bisa dibuka. Pastikan perangkat memiliki kamera.',
        );
      })
      .finally(() => {
        if (!cancelled) setCameraStarting(false);
      });

    return () => {
      cancelled = true;
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [cameraActive]);

  useEffect(
    () => () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    },
    [photoPreviewUrl],
  );

  useEffect(() => {
    if (!photo) {
      setPhotoPreviewUrl('');
      return;
    }

    const url = URL.createObjectURL(photo);
    setPhotoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  async function handleCapture() {
    setCameraError('');
    try {
      const video = videoRef.current;
      if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        throw new Error('Kamera belum siap. Tunggu sebentar lalu coba lagi.');
      }
      setPhoto(await capturePhoto(video));
      setCameraActive(false);
    } catch (captureError) {
      setCameraError(
        captureError instanceof Error ? captureError.message : 'Foto gagal diambil.',
      );
    }
  }

  async function sendWish() {
    if (submitting) return;
    setError('');

    const parsed = wishSchema.safeParse({
      name: isAnonymous ? undefined : name,
      message,
      color,
      is_anonymous: isAnonymous,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Periksa isi wish-mu.');
      return;
    }
    if (!photo) {
      setError('Ambil foto terlebih dahulu.');
      return;
    }
    if (photo.size > PHOTO_MAX_SIZE) {
      setError('Foto harus berukuran maksimal 5 MB.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.set('name', parsed.data.name ?? '');
      payload.set('message', parsed.data.message);
      payload.set('color', parsed.data.color);
      payload.set('is_anonymous', String(parsed.data.is_anonymous ?? false));
      payload.set('photo', photo);

      const response = await fetch('/api/wishes', {
        method: 'POST',
        body: payload,
      });
      const result: { success?: boolean; error?: string } = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Wish gagal dikirim. Coba lagi.');
      }

      router.push('/thankyou');
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Wish gagal dikirim.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendWish();
  }

  function handleSwipeKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      void sendWish();
    }
  }

  return (
    <form
      className="mx-auto max-w-xl space-y-5 rounded-[28px] border border-white/80 bg-[#FFFCF3]/90 p-5 text-[#263F4A] shadow-[0_18px_55px_rgba(38,63,74,0.16)] ring-1 ring-[#D9A94D]/25 backdrop-blur-md sm:space-y-6 sm:p-8"
      onSubmit={handleSubmit}
    >
      <div>
        <label
          className="mb-2 block text-sm font-semibold text-[#426C78]"
          htmlFor="wish-name"
        >
          Namamu
        </label>
        <input
          className="w-full rounded-2xl border border-[#C7D9D5] bg-white/80 px-4 py-3 text-[#263F4A] outline-none transition placeholder:text-[#82979A] focus:border-[#B78A39] focus:ring-4 focus:ring-[#F5D47B]/25 disabled:cursor-not-allowed disabled:bg-[#EEF1EA]"
          disabled={isAnonymous}
          id="wish-name"
          maxLength={40}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nama kamu"
          required={!isAnonymous}
          value={name}
        />
      </div>

      <div>
        <label
          className="mb-2 block text-sm font-semibold text-[#426C78]"
          htmlFor="wish-message"
        >
          Harapanmu
        </label>
        <textarea
          className="w-full resize-none rounded-2xl border border-[#C7D9D5] bg-white/80 px-4 py-3 text-[#263F4A] outline-none transition placeholder:text-[#82979A] focus:border-[#B78A39] focus:ring-4 focus:ring-[#F5D47B]/25"
          id="wish-message"
          maxLength={280}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Tulis harapanmu (maks. 280 karakter)"
          required
          rows={4}
          value={message}
        />
        <p className="mt-1 flex justify-between text-xs text-[#789096]">
          <span>Emoji bisa diketik langsung dari keyboard HP.</span>
          <span className="tabular-nums">{message.length}/280</span>
        </p>
      </div>

      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-[#426C78]">
          Pilih warna wish
        </legend>
        <div className="flex flex-wrap gap-3">
          {Object.entries(colorSwatches).map(([wishColor, swatch]) => (
            <label
              className="flex cursor-pointer items-center gap-2 rounded-full border border-[#C7D9D5] bg-white/70 px-3 py-2 text-xs capitalize transition has-[:checked]:border-[#B78A39] has-[:checked]:bg-[#FFF5D8] has-[:checked]:shadow-sm"
              key={wishColor}
            >
              <input
                checked={color === wishColor}
                className="sr-only"
                name="color"
                onChange={() => setColor(wishColor)}
                type="radio"
                value={wishColor}
              />
              <span
                aria-label={wishColor}
                className={`h-5 w-5 rounded-full ${swatch} ring-1 ring-[#263F4A]/15`}
              />
              {wishColor}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[#C7D9D5]/80 bg-white/50 px-4 py-3 text-sm text-[#52717A]">
        <input
          checked={isAnonymous}
          className="h-4 w-4 accent-[#568E70]"
          onChange={(event) => setIsAnonymous(event.target.checked)}
          type="checkbox"
        />
        <span>Kirim tanpa mencantumkan nama</span>
      </label>

      <div className="rounded-2xl border border-[#C7D9D5]/80 bg-white/55 p-4 sm:p-5">
        <p className="mb-2 block text-sm font-medium">
          Foto kenangan <span aria-hidden="true" className="text-[#B78A39]">*</span>
        </p>
        {cameraActive && (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            aria-label="Pratinjau kamera"
            className="mb-3 max-h-72 w-full rounded-2xl bg-[#263F4A] object-cover shadow-md"
          />
        )}
        {photoPreviewUrl && !cameraActive && (
          <img
            src={photoPreviewUrl}
            alt="Pratinjau foto wish"
            className="mb-3 max-h-64 w-full rounded-2xl object-cover shadow-md"
          />
        )}
        {!cameraActive && !photo && (
          <button
            type="button"
            onClick={() => {
              setCameraError('');
              setCameraActive(true);
            }}
            className="w-full rounded-2xl border border-dashed border-[#B78A39]/60 bg-[#FFF5D8]/60 px-4 py-3 text-sm font-medium text-[#426C78] transition hover:bg-[#FFF5D8]"
          >
            📷 Buka kamera
          </button>
        )}
        {cameraActive && (
          <button
            type="button"
            onClick={() => void handleCapture()}
            disabled={cameraStarting}
            className="w-full rounded-2xl bg-[#F5D47B] px-4 py-3 font-semibold text-[#5A4B2A] shadow-sm transition hover:bg-[#F0CB68] disabled:cursor-wait disabled:opacity-60"
          >
            {cameraStarting ? 'Membuka kamera...' : 'Ambil foto'}
          </button>
        )}
        {photo && !cameraActive && (
          <button
            type="button"
            onClick={() => {
              setPhoto(null);
              setCameraError('');
              setCameraActive(true);
            }}
            className="w-full rounded-2xl border border-[#C7D9D5] bg-white/70 px-4 py-3 text-sm font-medium text-[#426C78] transition hover:bg-white"
          >
            Ambil ulang
          </button>
        )}
        {cameraError && (
          <p className="mt-2 text-sm text-red-700" role="alert">
            {cameraError}
          </p>
        )}
        <p className="mt-2 text-xs leading-relaxed text-[#789096]">
          Foto wajib, hanya bisa diambil langsung dari kamera, dan akan tampil di wall publik.
        </p>
      </div>

      {error && (
        <p
          className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="rounded-2xl border border-[#D9A94D]/40 bg-[#FFF5D8]/60 p-4 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#789096]">
          Swipe up to send your wish
        </p>
        <motion.div
          aria-describedby="wish-swipe-hint"
          aria-label="Swipe up to send your wish"
          className="mx-auto flex w-full max-w-xs cursor-grab touch-pan-x flex-col items-center rounded-2xl bg-[#426C78] px-5 py-4 text-white shadow-lg active:cursor-grabbing"
          drag="y"
          dragConstraints={{ top: -130, bottom: 0 }}
          dragElastic={0.18}
          dragMomentum={false}
          onDragEnd={(_, info) => {
            if (info.offset.y < -70 || info.velocity.y < -500) void sendWish();
          }}
          onKeyDown={handleSwipeKeyDown}
          role="button"
          tabIndex={0}
          whileDrag={{ scale: 0.98 }}
        >
          <motion.span
            aria-hidden="true"
            animate={{ y: [0, -5, 0] }}
            className="text-2xl"
            transition={{ duration: 1.3, repeat: Infinity }}
          >
            ↑
          </motion.span>
          <span className="mt-1 font-semibold">
            {submitting ? 'Meluncurkan wish…' : 'Tarik kartu ini ke atas'}
          </span>
        </motion.div>
        <p className="mt-3 text-xs text-[#789096]" id="wish-swipe-hint">
          Satu scan untuk satu wish. Scan barcode lagi kalau mau mengirim wish lain.
        </p>
        <button
          className="mt-3 rounded-full px-4 py-2 text-xs font-medium text-[#426C78] underline underline-offset-2 disabled:opacity-60"
          disabled={submitting}
          type="submit"
        >
          {submitting ? 'Mengirim…' : 'Atau ketuk untuk mengirim'}
        </button>
      </div>
    </form>
  );
}
