'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const result: { error?: string } = await response.json();

      if (!response.ok) {
        setError(result.error ?? 'Unable to sign in.');
        return;
      }

      router.replace('/admin');
    } catch (requestError) {
      console.error('Admin sign-in failed:', requestError);
      setError('Could not reach the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F4EE] p-5 text-[#26343A]">
      <section className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-xl sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#527C85]">
          Wishing Wall
        </p>
        <h1 className="mt-3 font-serif text-3xl">Admin sign in</h1>
        <p className="mt-2 text-sm text-[#687D8C]">
          Sign in to update your brand name, logo, and wishes.
        </p>
        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium" htmlFor="admin-password">
            Admin password
          </label>
          <input
            autoComplete="current-password"
            className="w-full rounded-xl border border-[#D8E0DF] px-4 py-3 outline-none focus:border-[#527C85] focus:ring-2 focus:ring-[#527C85]/15"
            id="admin-password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
          {error && (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <button
            className="w-full rounded-xl bg-[#294C58] px-4 py-3 font-medium text-white transition hover:bg-[#203D47] disabled:cursor-wait disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}
