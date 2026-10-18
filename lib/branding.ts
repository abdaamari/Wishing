import 'server-only';

import { z } from 'zod';
import { DEFAULT_BRANDING, type BrandingConfig } from '@/lib/brand-config';
import supabaseAdmin from '@/lib/supabase/server';

const brandingSchema = z.object({
  brandName: z.string().trim().min(1).max(60),
  logoUrl: z.url().nullable(),
  musicEnabled: z.boolean().default(false),
});

export async function getBranding(): Promise<BrandingConfig> {
  const { data, error } = await supabaseAdmin
    .from('site_settings')
    .select('config')
    .eq('id', 'branding')
    .maybeSingle();

  if (error) {
    console.error('Failed to read branding settings:', error);
    throw new Error('Failed to read branding settings from Supabase.');
  }

  if (!data) return DEFAULT_BRANDING;

  const parsed = brandingSchema.safeParse(data.config);
  if (!parsed.success) {
    console.error('Stored branding settings are invalid:', parsed.error);
    throw new Error('Stored branding settings are invalid.');
  }

  return parsed.data;
}
