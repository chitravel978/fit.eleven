'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import clsx from 'clsx';

type P = {
  _id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  sizes: string[];
  stock: number;
};

export function AddToCart({ product }: { product: P }) {
  const { add } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [size, setSize] = useState(product.sizes?.[0] || '');
  const [qty, setQty] = useState(1);
  const [wishLoading, setWishLoading] = useState(false);

  const addCart = () => {
    if (product.stock < 1) return;
    add({
      productId: product._id,
      quantity: qty,
      size,
      name: product.name,
      price: product.price,
      image: product.images[0],
    });
  };

  const buyNow = () => {
    addCart();
    router.push('/checkout');
  };

  const toggleWish = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setWishLoading(true);
    try {
      await api(`/wishlist/${product._id}`, { method: 'POST' });
    } catch {
      /* ignore */
    } finally {
      setWishLoading(false);
    }
  };

  return (
    <div className="mt-8 space-y-6">
      {product.sizes.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-widest text-cream/50">Size</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className={clsx(
                  'min-w-[3rem] rounded-full border px-4 py-2 text-sm transition',
                  size === s
                    ? 'border-gold bg-gold/10 text-gold'
                    : 'border-white/15 text-cream/80 hover:border-gold/40'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center gap-4">
        <label className="text-sm text-cream/60">Qty</label>
        <input
          type="number"
          min={1}
          max={product.stock}
          value={qty}
          onChange={(e) => setQty(Math.max(1, Math.min(product.stock, Number(e.target.value) || 1)))}
          className="w-20 rounded-lg border border-white/15 bg-zinc-900 px-3 py-2 text-cream"
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={addCart}
          disabled={product.stock < 1}
          className="rounded-full bg-gold px-8 py-3 text-sm font-semibold uppercase tracking-widest text-ink disabled:opacity-40"
        >
          Add to cart
        </button>
        <button
          type="button"
          onClick={buyNow}
          disabled={product.stock < 1}
          className="rounded-full border border-gold px-8 py-3 text-sm font-semibold uppercase tracking-widest text-cream hover:bg-gold/10 disabled:opacity-40"
        >
          Buy now
        </button>
        <button
          type="button"
          onClick={toggleWish}
          disabled={wishLoading}
          className="rounded-full border border-white/15 px-6 py-3 text-sm text-cream/70 hover:border-gold/40"
        >
          Wishlist
        </button>
      </div>
    </div>
  );
}
