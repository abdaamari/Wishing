'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_BRANDING, type BrandingConfig } from '@/lib/brand-config';

export default function BrandIdentity({ className = '' }: { className?: string }) {
  const [branding, setBranding] = useState(DEFAULT_BRANDING);

  useEffect(() => {
    let cancelled = false;

    void fetch('/api/branding', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load branding settings.');
        return (await response.json()) as BrandingConfig;
      })
      .then((result) => {
        if (!cancelled) setBranding(result);
      })
      .catch((error: unknown) => {
        console.error('Unable to load branding settings:', error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {branding.logoUrl ? (
        <img
          alt=""
          className="h-10 w-10 rounded-full object-contain"
          src={branding.logoUrl}
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70 font-serif text-lg text-[#426C78]"
        >
          W
        </span>
      )}
      <span className="max-w-48 truncate text-sm font-semibold text-[#294C58] sm:text-base">
        {branding.brandName}
      </span>
    </div>
  );
}
