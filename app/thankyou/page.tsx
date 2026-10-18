import Link from 'next/link';

export default function ThankYouPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#B9DDF2] px-5 text-center text-[#26343A]">
      <section className="w-full max-w-md rounded-[28px] border border-white/80 bg-[#FFFCF3]/90 p-8 shadow-[0_18px_55px_rgba(38,63,74,0.16)] sm:p-12">
        <p aria-hidden="true" className="text-5xl">
          ✨
        </p>
        <h1 className="mt-5 font-serif text-4xl text-[#294C58]">Thankyou</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#52717A]">
          Wish-mu sudah terkirim. Terima kasih sudah berbagi harapan.
        </p>
        <Link
          className="mt-8 inline-flex rounded-full bg-[#426C78] px-6 py-3 font-semibold text-white shadow transition hover:bg-[#345A65]"
          href="/wish"
        >
          Kirim wish lagi
        </Link>
      </section>
    </main>
  );
}
