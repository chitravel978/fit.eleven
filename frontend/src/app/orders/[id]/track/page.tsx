'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

type Order = {
  _id: string;
  orderStatus: string;
  timeline: { status: string; at: string }[];
  estimatedDelivery?: string;
  gst?: Record<string, number>;
  billing?: Record<string, string>;
  deliveryAgent?: {
    latitude?: number;
    longitude?: number;
    name?: string;
    phone?: string;
    updatedAt?: string;
  };
  payment?: { status?: string };
};

const STEPS = [
  { key: 'placed', label: 'Order Placed' },
  { key: 'packed', label: 'Packed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
];

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(
  /\/api\/?$/,
  ''
);

export default function TrackPage() {
  const params = useParams();
  const id = params.id as string;
  const { user, loading } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=/orders/${id}/track`);
  }, [user, loading, router, id]);

  useEffect(() => {
    if (!user || !id) return;
    api<Order>(`/orders/${id}/track`)
      .then(setOrder)
      .catch(() => setOrder(null));
  }, [user, id]);

  useEffect(() => {
    if (!id) return;
    const s = io(API_ORIGIN, { transports: ['websocket', 'polling'] });
    s.emit('subscribe:order', id);
    s.on('order:update', (payload: Partial<Order> & { orderId?: string }) => {
      setOrder((prev) => {
        if (!prev) return prev;
        return { ...prev, ...payload } as Order;
      });
    });
    return () => {
      s.emit('unsubscribe:order', id);
      s.close();
    };
  }, [id]);

  const mapUrl = useMemo(() => {
    const lat = order?.deliveryAgent?.latitude;
    const lng = order?.deliveryAgent?.longitude;
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (lat == null || lng == null || !key) return null;
    return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=600x300&markers=color:0xc9a227%7C${lat},${lng}&key=${key}`;
  }, [order?.deliveryAgent?.latitude, order?.deliveryAgent?.longitude]);

  if (loading || !user) {
    return <div className="py-24 text-center text-cream/50">Loading…</div>;
  }

  if (!order) {
    return (
      <div className="py-24 text-center">
        <p className="text-cream/70">Order not found.</p>
        <Link href="/orders" className="mt-4 inline-block text-gold">
          Orders
        </Link>
      </div>
    );
  }

  const idx = STEPS.findIndex((s) => s.key === order.orderStatus);
  const activeIdx = idx >= 0 ? idx : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-6">
      <Link href="/orders" className="text-sm text-gold hover:underline">
        ← All orders
      </Link>
      <h1 className="mt-4 font-display text-4xl text-cream">Track order</h1>
      <p className="mt-2 text-sm text-cream/50">Order #{order._id}</p>

      <div className="mt-10">
        <ol className="flex flex-col gap-4 md:flex-row md:justify-between">
          {STEPS.map((s, i) => (
            <li key={s.key} className="flex flex-1 flex-col items-center text-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-bold ${
                  i <= activeIdx
                    ? 'border-gold bg-gold/20 text-gold'
                    : 'border-white/20 text-cream/40'
                }`}
              >
                {i + 1}
              </div>
              <p className="mt-2 text-[10px] uppercase tracking-wider text-cream/60 md:text-xs">
                {s.label}
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-8 text-sm text-cream/60">
          Current: <span className="text-gold">{order.orderStatus.replace(/_/g, ' ')}</span>
        </p>
        {order.estimatedDelivery && (
          <p className="mt-2 text-sm text-cream/50">
            Est. delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}
          </p>
        )}
      </div>

      <div className="mt-12 rounded-2xl border border-white/10 bg-zinc-900/40 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gold">Timeline</h2>
        <ul className="mt-4 space-y-3">
          {(order.timeline || []).map((t, i) => (
            <li key={i} className="flex justify-between text-sm text-cream/80">
              <span>{t.status.replace(/_/g, ' ')}</span>
              <span className="text-cream/40">{new Date(t.at).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </div>

      {order.deliveryAgent?.latitude != null && (
        <div className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gold">
            Live delivery location
          </h2>
          {mapUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mapUrl} alt="Map" className="mt-4 w-full rounded-2xl border border-white/10" />
          ) : (
            <p className="mt-4 text-sm text-cream/50">
              Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for map preview. Coords:{' '}
              {order.deliveryAgent.latitude?.toFixed(4)}, {order.deliveryAgent.longitude?.toFixed(4)}
            </p>
          )}
          <p className="mt-2 text-xs text-cream/40">
            Updates via Socket.io — agent last seen{' '}
            {order.deliveryAgent.updatedAt
              ? new Date(order.deliveryAgent.updatedAt).toLocaleString()
              : '—'}
          </p>
        </div>
      )}

      <div className="mt-10 rounded-2xl border border-gold/20 bg-black/30 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gold">GST invoice summary</h2>
        <dl className="mt-4 grid grid-cols-2 gap-2 text-sm text-cream/80">
          {order.gst &&
            Object.entries(order.gst).map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-cream/50">{k}</dt>
                <dd>{typeof v === 'number' ? `₹${v.toLocaleString('en-IN')}` : String(v)}</dd>
              </div>
            ))}
        </dl>
      </div>
    </div>
  );
}
