import { NextResponse } from 'next/server';
import {
  clearAdminSessionCookie,
  getAdminSetupError,
  setAdminSessionCookie,
  verifyAdminPassword,
} from '@/lib/admin-auth';

export async function POST(request: Request) {
  const setupError = getAdminSetupError();
  if (setupError) {
    return NextResponse.json({ error: setupError }, { status: 503 });
  }

  let password: unknown;
  try {
    const body: unknown = await request.json();
    password =
      typeof body === 'object' && body !== null && 'password' in body
        ? body.password
        : undefined;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (typeof password !== 'string' || !verifyAdminPassword(password)) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
  }

  await setAdminSessionCookie();
  return NextResponse.json({ success: true });
}

export async function DELETE() {
  await clearAdminSessionCookie();
  return NextResponse.json({ success: true });
}
