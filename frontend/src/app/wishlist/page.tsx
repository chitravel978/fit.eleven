'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

type Product = {
  _id: string;
  name: string;
  slug: string;
  price: number;
  images?: string[];
};

export default function WishlistPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    if (!loading && !user) router.replace('/login?next=/wishlist');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    api<Product[]>('/wishlist')
      .then(setItems)
      .catch(() => setItems([]));
  }, [user]);

  const remove = async (id: string) => {
    await api(`/wishlist/${id}`, { method: 'DELETE' });
    setItems((prev) => prev.filter((p) => p._id !== id));
  };

  if (loading || !user) {
    return <div className="py-24 text-center text-cream/50">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <h1 className="font-display text-4xl text-cream">Wishlist</h1>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((p) => (
          <div
            key={p._id}
            className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/40"
          >
            <Link href={`/products/${p.slug}`} className="relative block aspect-[4/5] bg-zinc-800">
              {p.images?.[0] && (
                <Image src={p.images[0]} alt={p.name} fill className="object-cover" />
              )}
            </Link>
            <div className="p-4">
              <Link href={`/products/${p.slug}`} className="font-medium text-cream hover:text-gold">
                {p.name}
              </Link>
              <p className="mt-1 text-gold">₹{p.price.toLocaleString('en-IN')}</p>
              <button
                type="button"
                onClick={() => remove(p._id)}
                className="mt-3 text-sm text-red-400/80 hover:text-red-400"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 && (
        <p className="mt-8 text-cream/50">
          Nothing saved yet.{' '}
          <Link href="/products" className="text-gold hover:underline">
            Browse
          </Link>
        </p>
      )}
    </div>
  );
}
