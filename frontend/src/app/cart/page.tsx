'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function CartPage() {
  const { items, updateQty, remove, subtotal } = useCart();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <h1 className="font-display text-4xl text-cream">Your bag</h1>
      {items.length === 0 ? (
        <p className="mt-8 text-cream/50">
          Your cart is empty.{' '}
          <Link href="/products" className="text-gold hover:underline">
            Continue shopping
          </Link>
        </p>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {items.map((line) => (
              <div
                key={`${line.productId}-${line.size}`}
                className="flex gap-4 rounded-2xl border border-white/10 bg-zinc-900/40 p-4"
              >
                <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                  {line.image && (
                    <Image src={line.image} alt="" fill className="object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-cream">{line.name}</p>
                  {line.size && <p className="text-sm text-cream/50">Size {line.size}</p>}
                  <p className="mt-1 text-gold">₹{(line.price || 0).toLocaleString('en-IN')}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) =>
                        updateQty(line.productId, line.size, Number(e.target.value) || 1)
                      }
                      className="w-16 rounded border border-white/15 bg-zinc-900 px-2 py-1 text-sm text-cream"
                    />
                    <button
                      type="button"
                      onClick={() => remove(line.productId, line.size)}
                      className="text-sm text-red-400/80 hover:text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="h-fit rounded-2xl border border-gold/20 bg-zinc-900/60 p-6">
            <p className="text-sm uppercase tracking-widest text-cream/50">Subtotal</p>
            <p className="mt-2 font-display text-3xl text-cream">₹{subtotal.toLocaleString('en-IN')}</p>
            <p className="mt-2 text-xs text-cream/40">GST & coupons calculated at checkout</p>
            <Link
              href="/checkout"
              className="mt-6 block w-full rounded-full bg-gold py-3 text-center text-sm font-semibold uppercase tracking-widest text-ink"
            >
              Checkout
            </Link>
            <Link
              href="/products"
              className="mt-4 block text-center text-sm text-gold hover:underline"
            >
              Keep shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
