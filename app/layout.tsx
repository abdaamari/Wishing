import '../styles/globals.css';

export const metadata = {
  title: "Wishing Wall",
  description: "Interactive summer‑dreamy wish wall",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="" >
      <body className="font-sans antialiased bg-white text-primary">{children}</body>
    </html>
  );
}
