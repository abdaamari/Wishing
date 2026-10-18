'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { wishSchema } from '@/lib/validation';

const photoMaxDimension = 1280;

async function capturePhoto(video: HTMLVideoElement): Promise<File> {
  if (!video.videoWidth || !video.videoHeight) {
    throw new Error('Kamera belum siap. Tunggu sebentar lalu coba lagi.');
  }

  const scale = Math.min(
    1,
    photoMaxDimension / Math.max(video.videoWidth, video.videoHeight),
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

export default function WishForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    message: '',
    color: 'sky',
    is_anonymous: false,
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!cameraActive) return;

    let cancelled = false;
    setCameraStarting(true);
    if (!window.isSecureContext) {
      setCameraActive(false);
      setCameraStarting(false);
      setErrors([
        'Akses kamera membutuhkan HTTPS. Halaman melalui alamat IP lokal HTTP bisa dibuka, tetapi kamera hanya aktif di HTTPS atau localhost.',
      ]);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraActive(false);
      setCameraStarting(false);
      setErrors(['Browser ini tidak mendukung akses kamera.']);
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
      .catch((error: unknown) => {
        if (cancelled) return;
        setCameraActive(false);
        setErrors([
          error instanceof Error && error.name === 'NotAllowedError'
            ? 'Izin kamera ditolak. Izinkan akses kamera di pengaturan browser.'
            : 'Kamera tidak bisa dibuka. Pastikan perangkat memiliki kamera dan aksesnya tersedia.',
        ]);
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

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = event.target;
    const checked =
      event.target instanceof HTMLInputElement && event.target.checked;
    setFormData((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCapture = async () => {
    setErrors([]);
    try {
      const video = videoRef.current;
      if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        throw new Error('Kamera belum siap. Tunggu sebentar lalu coba lagi.');
      }
      const capturedPhoto = await capturePhoto(video);
      setPhoto(capturedPhoto);
      setPhotoPreviewUrl(URL.createObjectURL(capturedPhoto));
      setCameraActive(false);
    } catch (error) {
      setErrors([
        error instanceof Error ? error.message : 'Foto gagal diambil.',
      ]);
    }
  };

  const handleRetake = () => {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhoto(null);
    setPhotoPreviewUrl('');
    setErrors([]);
    setCameraActive(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors([]);

    const parsed = wishSchema.safeParse(formData);
    if (!parsed.success) {
      setErrors(parsed.error.issues.map((issue) => issue.message));
      return;
    }

    if (!photo) {
      setErrors(['Ambil foto menggunakan kamera terlebih dahulu.']);
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
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Wish gagal dikirim. Coba lagi.');
      }

      router.push('/');
    } catch (error) {
      setErrors([
        error instanceof Error ? error.message : 'Wish gagal dikirim.',
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-xl space-y-5 rounded-[28px] border border-white/80 bg-[#FFFCF3]/90 p-5 text-[#263F4A] shadow-[0_18px_55px_rgba(38,63,74,0.16)] ring-1 ring-[#D9A94D]/25 backdrop-blur-md sm:space-y-6 sm:p-8"
    >
      <div>
        <label
          htmlFor="wish-name"
          className="mb-2 block text-sm font-semibold text-[#426C78]"
        >
          Namamu
        </label>
        <input
          id="wish-name"
          type="text"
          name="name"
          placeholder="Nama kamu"
          value={formData.name}
          onChange={handleChange}
          maxLength={40}
          className="w-full rounded-2xl border border-[#C7D9D5] bg-white/80 px-4 py-3 text-[#263F4A] outline-none transition placeholder:text-[#82979A] focus:border-[#B78A39] focus:ring-4 focus:ring-[#F5D47B]/25 disabled:cursor-not-allowed disabled:bg-[#EEF1EA]"
          disabled={formData.is_anonymous}
          required={!formData.is_anonymous}
        />
      </div>

      <div>
        <label
          htmlFor="wish-message"
          className="mb-2 block text-sm font-semibold text-[#426C78]"
        >
          Harapanmu
        </label>
        <textarea
          id="wish-message"
          name="message"
          placeholder="Tulis harapanmu (maks. 280 karakter)"
          value={formData.message}
          onChange={handleChange}
          maxLength={280}
          rows={4}
          className="w-full resize-none rounded-2xl border border-[#C7D9D5] bg-white/80 px-4 py-3 text-[#263F4A] outline-none transition placeholder:text-[#82979A] focus:border-[#B78A39] focus:ring-4 focus:ring-[#F5D47B]/25"
          required
        />
        <p className="mt-1 text-right text-xs tabular-nums text-[#789096]">
          {formData.message.length}/280
        </p>
      </div>

      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-[#426C78]">
          Pilih warna wish
        </legend>
        <div className="flex flex-wrap gap-3">
          {['sky', 'butter', 'peach', 'mint', 'lavender'].map((color) => (
            <label
              key={color}
              className="flex cursor-pointer items-center gap-2 rounded-full border border-[#C7D9D5] bg-white/70 px-3 py-2 text-xs capitalize transition has-[:checked]:border-[#B78A39] has-[:checked]:bg-[#FFF5D8] has-[:checked]:shadow-sm"
            >
              <input
                type="radio"
                name="color"
                value={color}
                checked={formData.color === color}
                onChange={handleChange}
                className="sr-only"
              />
              <span
                aria-label={color}
                className={`h-5 w-5 rounded-full bg-${color} ring-1 ring-[#263F4A]/15`}
              />
              {color}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[#C7D9D5]/80 bg-white/50 px-4 py-3 text-sm text-[#52717A]">
        <input
          type="checkbox"
          name="is_anonymous"
          checked={formData.is_anonymous}
          onChange={handleChange}
          className="h-4 w-4 accent-[#568E70]"
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
              setErrors([]);
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
            onClick={handleCapture}
            disabled={cameraStarting}
            className="w-full rounded-2xl bg-[#F5D47B] px-4 py-3 font-semibold text-[#5A4B2A] shadow-sm transition hover:bg-[#F0CB68] disabled:cursor-wait disabled:opacity-60"
          >
            {cameraStarting ? 'Membuka kamera...' : 'Ambil foto'}
          </button>
        )}
        {photo && !cameraActive && (
          <button
            type="button"
            onClick={handleRetake}
            className="w-full rounded-2xl border border-[#C7D9D5] bg-white/70 px-4 py-3 text-sm font-medium text-[#426C78] transition hover:bg-white"
          >
            Ambil ulang
          </button>
        )}
        <p className="mt-2 text-xs leading-relaxed text-[#789096]">
          Foto wajib, hanya bisa diambil langsung dari kamera, dan akan tampil
          di wall publik.
        </p>
      </div>

      {errors.length > 0 && (
        <ul
          role="alert"
          className="space-y-1 rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-700"
        >
          {errors.map((error, index) => (
            <li key={`${error}-${index}`}>{error}</li>
          ))}
        </ul>
      )}

      <motion.button
        type="submit"
        whileTap={{ scale: 0.97 }}
        disabled={submitting}
        className="w-full rounded-2xl bg-[#426C78] py-3.5 font-semibold text-white shadow-[0_8px_20px_rgba(66,108,120,0.22)] transition hover:bg-[#345A65] disabled:cursor-wait disabled:opacity-60"
      >
        {submitting ? 'Mengirim...' : 'Kirim Wish'}
      </motion.button>
    </form>
  );
}
