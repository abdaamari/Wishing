import supabaseAdmin from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { wishSchema } from '@/lib/validation';
import { type WishInput } from '@/lib/types';

// Simple in‑memory rate limiter (development safeguard only).
// Keeps a map of IP → array of request timestamps (ms).
// Limits to 5 requests per minute per IP. This is NOT suitable for production
// because the map is per‑process and lost on restart, and it does not work across
// multiple server instances.
const rateLimitMap = new Map<string, number[]>();
const MAX_REQUESTS = 5;
const WINDOW_MS = 60_000; // 1 minute
const PHOTO_BUCKET = 'wish-photos';
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) ?? [];
  // Remove timestamps older than the window
  const recent = timestamps.filter(t => now - t < WINDOW_MS);
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return recent.length <= MAX_REQUESTS;
}

export async function POST(req: Request) {
  try {
    // ----- Rate limiting -----
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip')?.trim() ||
      'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests – please try again later.' },
        { status: 429 }
      );
    }

    // ----- Payload validation -----
    const body = await req.formData();
    const getTextField = (name: string) => {
      const value = body.get(name);
      return typeof value === 'string' ? value : undefined;
    };
    const parsed = wishSchema.safeParse({
      name: getTextField('name'),
      message: getTextField('message'),
      color: getTextField('color'),
      is_anonymous: getTextField('is_anonymous') === 'true',
    });
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.issues.map(i => i.message) },
        { status: 400 }
      );
    }

    const photo = body.get('photo');
    if (!(photo instanceof File) || photo.size === 0) {
      return NextResponse.json(
        { success: false, error: 'A photo is required.' },
        { status: 400 }
      );
    }
    if (!PHOTO_TYPES.has(photo.type) || photo.size > MAX_PHOTO_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Photo must be JPEG, PNG, or WebP and no larger than 5 MB.' },
        { status: 400 }
      );
    }

    const data: WishInput = parsed.data;
    // ----- Business rules -----
    const name = data.is_anonymous
      ? 'Anonymous'
      : data.name?.trim() || 'Anonymous';

    const wishId = crypto.randomUUID();
    const extension = photo.type === 'image/jpeg'
      ? 'jpg'
      : photo.type === 'image/png'
        ? 'png'
        : 'webp';
    const photoPath = `${wishId}.${extension}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from(PHOTO_BUCKET)
      .upload(photoPath, photo, {
        contentType: photo.type,
        cacheControl: '31536000',
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase photo upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: 'Failed to save photo' },
        { status: 500 }
      );
    }

    const { data: photoData } = supabaseAdmin.storage
      .from(PHOTO_BUCKET)
      .getPublicUrl(photoPath);
    const { data: result, error } = await supabaseAdmin
      .from('wishes')
      .insert({
        id: wishId,
        name,
        message: data.message.trim(),
        photo_url: photoData.publicUrl,
        color: data.color,
        is_anonymous: !!data.is_anonymous,
        status: 'published', // force status – never trust client value
      })
      .select()
      .single();

    if (error) {
      // Do not expose internal Supabase error details to the client
      console.error('Supabase insert error:', error);
      const { error: cleanupError } = await supabaseAdmin.storage
        .from(PHOTO_BUCKET)
        .remove([photoPath]);
      if (cleanupError) {
        console.error('Supabase photo cleanup error:', cleanupError);
      }
      return NextResponse.json(
        { success: false, error: 'Failed to save wish' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, wish: result });
  } catch (err) {
    console.error('Unexpected server error:', err);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
