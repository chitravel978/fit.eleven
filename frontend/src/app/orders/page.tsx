'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

type Order = {
  _id: string;
  orderStatus: string;
  createdAt: string;
  gst?: { grandTotal?: number };
  payment?: { status?: string };
};

const labels: Record<string, string> = {
  placed: 'Order Placed',
  packed: 'Packed',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!loading && !user) router.replace('/login?next=/orders');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    api<Order[]>('/orders/mine')
      .then(setOrders)
      .catch(() => setOrders([]));
  }, [user]);

  if (loading || !user) {
    return <div className="py-24 text-center text-cream/50">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <h1 className="font-display text-4xl text-cream">Your orders</h1>
      <ul className="mt-10 space-y-4">
        {orders.map((o) => (
          <li
            key={o._id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-zinc-900/40 px-6 py-4"
          >
            <div>
              <p className="text-sm text-cream/50">{new Date(o.createdAt).toLocaleString()}</p>
              <p className="text-gold">{labels[o.orderStatus] || o.orderStatus}</p>
              <p className="text-sm text-cream/60">
                ₹{o.gst?.grandTotal?.toLocaleString('en-IN') || '—'} · {o.payment?.status}
              </p>
            </div>
            <Link
              href={`/orders/${o._id}/track`}
              className="rounded-full border border-gold/40 px-5 py-2 text-sm text-gold hover:bg-gold/10"
            >
              Track
            </Link>
          </li>
        ))}
      </ul>
      {orders.length === 0 && (
        <p className="mt-8 text-cream/50">
          No orders yet.{' '}
          <Link href="/products" className="text-gold hover:underline">
            Shop
          </Link>
        </p>
      )}
    </div>
  );
}
