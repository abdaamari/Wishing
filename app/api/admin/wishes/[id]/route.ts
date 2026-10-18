import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import supabaseAdmin from '@/lib/supabase/server';

const wishUpdateSchema = z.object({
  name: z.string().trim().min(1).max(40),
  message: z.string().trim().min(1).max(280),
  color: z.enum(['sky', 'butter', 'peach', 'mint', 'lavender']),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Admin login required.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const parsed = wishUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid wish details.' },
      { status: 400 },
    );
  }

  const { id } = await context.params;
  const { data, error } = await supabaseAdmin
    .from('wishes')
    .update(parsed.data)
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('Failed to update wish:', error);
    return NextResponse.json({ error: 'Unable to update this wish.' }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'Wish not found.' }, { status: 404 });

  return NextResponse.json({ wish: data });
}

export async function POST(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Admin login required.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const parsed = z.object({ status: z.enum(['published', 'hidden']) }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid wish status.' }, { status: 400 });
  }

  const { id } = await context.params;
  const { data, error } = await supabaseAdmin
    .from('wishes')
    .update({ status: parsed.data.status })
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('Failed to change wish visibility:', error);
    return NextResponse.json({ error: 'Unable to change wish visibility.' }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'Wish not found.' }, { status: 404 });

  return NextResponse.json({ wish: data });
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Admin login required.' }, { status: 401 });
  }

  const { id } = await context.params;
  const { data: wish, error: lookupError } = await supabaseAdmin
    .from('wishes')
    .select('id, photo_url')
    .eq('id', id)
    .maybeSingle();

  if (lookupError) {
    console.error('Failed to find wish before deleting:', lookupError);
    return NextResponse.json({ error: 'Unable to find this wish.' }, { status: 500 });
  }
  if (!wish) return NextResponse.json({ error: 'Wish not found.' }, { status: 404 });

  const { error: deleteError } = await supabaseAdmin.from('wishes').delete().eq('id', id);
  if (deleteError) {
    console.error('Failed to delete wish:', deleteError);
    return NextResponse.json({ error: 'Unable to delete this wish.' }, { status: 500 });
  }

  if (wish.photo_url) {
    try {
      const photoUrl = new URL(wish.photo_url);
      const prefix = '/storage/v1/object/public/wish-photos/';
      const path = photoUrl.pathname.startsWith(prefix)
        ? decodeURIComponent(photoUrl.pathname.slice(prefix.length))
        : '';

      if (/^[a-f0-9-]+\.(jpg|png|webp)$/i.test(path)) {
        const { error: storageError } = await supabaseAdmin.storage
          .from('wish-photos')
          .remove([path]);
        if (storageError) console.error('Failed to remove deleted wish photo:', storageError);
      }
    } catch (cleanupError) {
      console.error('Deleted wish photo URL could not be cleaned up:', cleanupError);
    }
  }

  return NextResponse.json({ success: true });
}
