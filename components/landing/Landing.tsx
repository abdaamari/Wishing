import QRCode from '@/components/shared/QRCode';

export default function Landing() {
  return (
    <div className="p-8 bg-sky min-h-screen flex flex-col items-center">
      <h1 className="text-5xl font-serif text-primary mb-6 text-center">
        A Little Wish Goes a Long Way
      </h1>
      <p className="text-lg text-secondary mb-8 text-center max-w-xl">
        Share your wishes, hopes, or short messages and watch them appear live on the wall.
      </p>
      <a href="/wish" className="px-6 py-3 bg-butter text-primary rounded-full shadow hover:scale-105 transition">
        Leave a Wish
      </a>
      <div className="mt-8">
        <QRCode url={process.env.NEXT_PUBLIC_SITE_URL + '/wish'} />
      </div>
    </div>
  );
}
