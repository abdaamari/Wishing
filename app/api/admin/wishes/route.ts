import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import supabaseAdmin from '@/lib/supabase/server';

const PAGE_SIZE = 100;

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Admin login required.' }, { status: 401 });
  }

  const offset = Number(new URL(request.url).searchParams.get('offset') ?? 0);
  if (!Number.isSafeInteger(offset) || offset < 0) {
    return NextResponse.json({ error: 'Invalid page.' }, { status: 400 });
  }

  const { data, count, error } = await supabaseAdmin
    .from('wishes')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (error) {
    console.error('Failed to load wishes for admin:', error);
    return NextResponse.json({ error: 'Unable to load wishes.' }, { status: 500 });
  }

  return NextResponse.json({ wishes: data, total: count ?? data.length });
}
