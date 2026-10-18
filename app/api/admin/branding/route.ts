import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { getBranding } from '@/lib/branding';
import supabaseAdmin from '@/lib/supabase/server';

const BRAND_BUCKET = 'brand-assets';
const MAX_LOGO_SIZE = 5 * 1024 * 1024;
const LOGO_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);
const brandingInputSchema = z.object({
  brandName: z.string().trim().min(1, 'Brand name is required.').max(60),
  removeLogo: z.boolean(),
  musicEnabled: z.boolean(),
});

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Admin login required.' }, { status: 401 });
  }

  const body = await request.formData();
  const parsed = brandingInputSchema.safeParse({
    brandName: body.get('brandName'),
    removeLogo: body.get('removeLogo') === 'true',
    musicEnabled: body.get('musicEnabled') === 'true',
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid branding settings.' },
      { status: 400 },
    );
  }

  const uploadedLogo = body.get('logo');
  if (
    uploadedLogo !== null &&
    (!(uploadedLogo instanceof File) ||
      uploadedLogo.size === 0 ||
      uploadedLogo.size > MAX_LOGO_SIZE ||
      !LOGO_TYPES.has(uploadedLogo.type))
  ) {
    return NextResponse.json(
      { error: 'Choose a JPEG, PNG, or WebP image no larger than 5 MB.' },
      { status: 400 },
    );
  }

  let currentBranding;
  try {
    currentBranding = await getBranding();
  } catch (error) {
    console.error('Unable to load existing branding before update:', error);
    return NextResponse.json(
      { error: 'Unable to load the current branding settings.' },
      { status: 500 },
    );
  }

  let logoUrl = parsed.data.removeLogo ? null : currentBranding.logoUrl;
  let uploadedPath: string | null = null;

  if (uploadedLogo instanceof File && uploadedLogo.size > 0) {
    const extension = LOGO_TYPES.get(uploadedLogo.type);
    if (!extension) {
      return NextResponse.json(
        { error: 'Choose a JPEG, PNG, or WebP image.' },
        { status: 400 },
      );
    }

    uploadedPath = `${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BRAND_BUCKET)
      .upload(uploadedPath, uploadedLogo, {
        contentType: uploadedLogo.type,
        cacheControl: '31536000',
        upsert: false,
      });

    if (uploadError) {
      console.error('Brand logo upload failed:', uploadError);
      return NextResponse.json(
        { error: 'Unable to upload the logo. Check the Supabase brand-assets bucket.' },
        { status: 500 },
      );
    }

    logoUrl = supabaseAdmin.storage.from(BRAND_BUCKET).getPublicUrl(uploadedPath).data.publicUrl;
  }

  const branding = {
    brandName: parsed.data.brandName,
    logoUrl,
    musicEnabled: parsed.data.musicEnabled,
  };
  const { error: saveError } = await supabaseAdmin
    .from('site_settings')
    .upsert({ id: 'branding', config: branding, updated_at: new Date().toISOString() });

  if (saveError) {
    console.error('Branding settings save failed:', saveError);
    if (uploadedPath) {
      const { error: cleanupError } = await supabaseAdmin.storage
        .from(BRAND_BUCKET)
        .remove([uploadedPath]);
      if (cleanupError) console.error('Failed to clean up unused brand logo:', cleanupError);
    }
    return NextResponse.json(
      { error: 'Unable to save branding settings to Supabase.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ branding });
}
