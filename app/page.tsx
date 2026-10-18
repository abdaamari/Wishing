import Link from 'next/link';
import QRCode from '@/components/shared/QRCode';
import BrandIdentity from '@/components/shared/BrandIdentity';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-sky p-4">
      <BrandIdentity className="mb-8" />
      <h1 className="text-5xl font-serif text-primary mb-6 text-center">
        A Little Wish Goes a Long Way
      </h1>
      <p className="text-lg text-secondary mb-8 text-center max-w-xl">
        Share your wishes, hopes, or short messages and watch them appear live on the
        wall. Scan the QR code or click the button below to leave your wish.
      </p>
      <Link
        href="/wish"
        className="px-6 py-3 bg-butter text-primary rounded-full shadow hover:scale-105 transition"
      >
        Leave a Wish
      </Link>
      <div className="mt-8">
        <QRCode url={process.env.NEXT_PUBLIC_SITE_URL + '/wish'} />
      </div>
    </main>
  );
}
