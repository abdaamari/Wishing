import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const ADMIN_SESSION_COOKIE = 'wishing-admin-session';
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

export function getAdminSetupError(): string | null {
  if (!process.env.ADMIN_PASSWORD) {
    return 'Set ADMIN_PASSWORD in the server environment to enable the admin dashboard.';
  }

  if (!process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET.length < 32) {
    return 'Set ADMIN_SESSION_SECRET to a random value of at least 32 characters.';
  }

  return null;
}

function sign(value: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not configured.');

  return createHmac('sha256', secret).update(value).digest('base64url');
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  return !!expected && safeEqual(password, expected);
}

export function createAdminSessionToken(): string {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;
  const payload = String(expiresAt);
  return `${payload}.${sign(payload)}`;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  if (getAdminSetupError()) return false;

  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return false;

  const [expiresAt, signature, extra] = token.split('.');
  if (!expiresAt || !signature || extra !== undefined) return false;

  const expiresAtNumber = Number(expiresAt);
  if (!Number.isSafeInteger(expiresAtNumber) || expiresAtNumber <= Date.now() / 1000) {
    return false;
  }

  return safeEqual(signature, sign(expiresAt));
}

export async function setAdminSessionCookie(): Promise<void> {
  (await cookies()).set(ADMIN_SESSION_COOKIE, createAdminSessionToken(), {
    httpOnly: true,
    maxAge: SESSION_DURATION_SECONDS,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}

export async function clearAdminSessionCookie(): Promise<void> {
  (await cookies()).delete(ADMIN_SESSION_COOKIE);
}
