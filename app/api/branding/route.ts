import { NextResponse } from 'next/server';
import { getBranding } from '@/lib/branding';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(await getBranding(), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Branding request failed:', error);
    return NextResponse.json(
      { error: 'Unable to load branding settings.' },
      { status: 500 },
    );
  }
}
