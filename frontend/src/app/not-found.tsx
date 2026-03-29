import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-32 text-center">
      <h1 className="font-display text-5xl text-cream">404</h1>
      <p className="mt-4 text-cream/60">This page does not exist.</p>
      <Link href="/" className="mt-8 inline-block text-gold hover:underline">
        Back home
      </Link>
    </div>
  );
}
