'use client';

import { useEffect, useState, type FormEvent } from 'react';
import type { BrandingConfig } from '@/lib/brand-config';
import WishManager from '@/components/admin/WishManager';

type AdminDashboardProps = {
  initialBranding: BrandingConfig;
};

export default function AdminDashboard({ initialBranding }: AdminDashboardProps) {
  const [brandName, setBrandName] = useState(initialBranding.brandName);
  const [musicEnabled, setMusicEnabled] = useState(initialBranding.musicEnabled);
  const [logoUrl, setLogoUrl] = useState(initialBranding.logoUrl);
  const [logo, setLogo] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(initialBranding.logoUrl);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (!logo) {
      setPreviewUrl(removeLogo ? null : logoUrl);
      return;
    }

    const objectUrl = URL.createObjectURL(logo);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [logo, logoUrl, removeLogo]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSaving(true);

    const formData = new FormData();
    formData.set('brandName', brandName);
    formData.set('removeLogo', String(removeLogo));
    formData.set('musicEnabled', String(musicEnabled));
    if (logo) formData.set('logo', logo);

    try {
      const response = await fetch('/api/admin/branding', {
        method: 'PUT',
        body: formData,
      });
      const result: { branding?: BrandingConfig; error?: string } = await response.json();

      if (!response.ok || !result.branding) {
        setError(result.error ?? 'Unable to save branding settings.');
        return;
      }

      setBrandName(result.branding.brandName);
      setMusicEnabled(result.branding.musicEnabled);
      setLogoUrl(result.branding.logoUrl);
      setLogo(null);
      setRemoveLogo(false);
      setMessage('Branding saved. Changes are now visible on the site.');
    } catch (requestError) {
      console.error('Saving branding failed:', requestError);
      setError('Could not reach the server. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      const response = await fetch('/api/admin/session', { method: 'DELETE' });
      if (!response.ok) throw new Error('Unable to sign out.');
      window.location.assign('/admin/login');
    } catch (requestError) {
      console.error('Admin sign-out failed:', requestError);
      setError('Unable to sign out. Please try again.');
      setIsSigningOut(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F4EE] px-4 py-8 text-[#26343A] sm:px-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#527C85]">
              Wishing Wall
            </p>
            <h1 className="mt-2 font-serif text-3xl sm:text-4xl">Brand settings</h1>
            <p className="mt-2 text-sm text-[#687D8C]">
              Saved settings override the defaults in lib/brand-config.ts.
            </p>
          </div>
          <button
            className="rounded-full border border-[#C9D7D6] px-4 py-2 text-sm font-medium text-[#426C78] hover:bg-white disabled:opacity-60"
            disabled={isSigningOut}
            onClick={handleSignOut}
            type="button"
          >
            {isSigningOut ? 'Signing out…' : 'Sign out'}
          </button>
        </header>

        <form
          className="space-y-7 rounded-3xl bg-white p-6 shadow-xl sm:p-9"
          onSubmit={handleSubmit}
        >
          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="brand-name">
              Brand name
            </label>
            <input
              className="w-full rounded-xl border border-[#D8E0DF] px-4 py-3 outline-none focus:border-[#527C85] focus:ring-2 focus:ring-[#527C85]/15"
              id="brand-name"
              maxLength={60}
              onChange={(event) => setBrandName(event.target.value)}
              required
              value={brandName}
            />
          </div>

          <div>
            <span className="mb-2 block text-sm font-semibold">Logo</span>
            <div className="flex min-h-36 items-center justify-center rounded-2xl border border-dashed border-[#C9D7D6] bg-[#F8FAF8] p-5">
              {previewUrl ? (
                <img
                  alt="Logo preview"
                  className="max-h-28 max-w-full object-contain"
                  src={previewUrl}
                />
              ) : (
                <span className="text-sm text-[#687D8C]">No logo selected</span>
              )}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label className="cursor-pointer rounded-full bg-[#EAF2F0] px-4 py-2 text-sm font-medium text-[#294C58] hover:bg-[#DDEAE7]">
                Choose image
                <input
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => {
                    setLogo(event.target.files?.[0] ?? null);
                    setRemoveLogo(false);
                    setError('');
                    setMessage('');
                  }}
                  type="file"
                />
              </label>
              {(logo || logoUrl) && !removeLogo && (
                <button
                  className="text-sm text-[#8B4A40] hover:underline"
                  onClick={() => {
                    setLogo(null);
                    setRemoveLogo(true);
                    setMessage('');
                  }}
                  type="button"
                >
                  Remove logo
                </button>
              )}
            </div>
            <p className="mt-2 text-xs leading-5 text-[#687D8C]">
              JPEG, PNG, or WebP; maximum 5 MB. The image is stored in your Supabase
              project.
            </p>
          </div>

          <fieldset className="rounded-2xl border border-[#D8E0DF] bg-[#F8FAF8] p-4 sm:p-5">
            <legend className="px-1 text-sm font-semibold text-[#294C58]">
              Wall background music
            </legend>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                checked={musicEnabled}
                className="mt-1 h-4 w-4 accent-[#568E70]"
                onChange={(event) => setMusicEnabled(event.target.checked)}
                type="checkbox"
              />
              <span>
                <span className="block text-sm font-medium text-[#426C78]">
                  Enable looping music on the wall
                </span>
                <span className="mt-1 block text-xs leading-5 text-[#687D8C]">
                  Add your MP3 file as <code>public/audio/background.mp3</code>. Browsers
                  start playback after the visitor interacts with the page.
                </span>
              </span>
            </label>
          </fieldset>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800" role="status">
              {message}
            </p>
          )}

          <button
            className="w-full rounded-xl bg-[#294C58] px-4 py-3 font-medium text-white transition hover:bg-[#203D47] disabled:cursor-wait disabled:opacity-60"
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        </form>

        <WishManager />
      </div>
    </main>
  );
}
