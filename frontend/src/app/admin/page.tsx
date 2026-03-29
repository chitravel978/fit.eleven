'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

type Summary = {
  paidOrders: number;
  revenue: number;
  productCount: number;
  pendingPayments: number;
};

type OrderRow = {
  _id: string;
  orderStatus: string;
  user?: { email?: string };
  gst?: { grandTotal?: number };
};

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [statusId, setStatusId] = useState('');
  const [newStatus, setNewStatus] = useState('packed');
  const [agentOrder, setAgentOrder] = useState('');
  const [lat, setLat] = useState('19.076');
  const [lng, setLng] = useState('72.8777');

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) router.replace('/');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    api<Summary>('/admin/analytics/summary')
      .then(setSummary)
      .catch(() => setSummary(null));
    api<OrderRow[]>('/orders/admin/all')
      .then(setOrders)
      .catch(() => setOrders([]));
  }, [user]);

  const updateStatus = async () => {
    if (!statusId) return;
    await api(`/orders/admin/${statusId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ orderStatus: newStatus }),
    });
    const list = await api<OrderRow[]>('/orders/admin/all');
    setOrders(list);
  };

  const pushLocation = async () => {
    if (!agentOrder) return;
    await api(`/orders/admin/${agentOrder}/agent-location`, {
      method: 'PATCH',
      body: JSON.stringify({ latitude: lat, longitude: lng, name: 'Rider', phone: '9999999999' }),
    });
  };

  if (loading || !user || user.role !== 'admin') {
    return <div className="py-24 text-center text-cream/50">…</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
      <h1 className="font-display text-4xl text-cream">Admin</h1>
      {summary && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Paid orders', summary.paidOrders],
            ['Revenue (₹)', summary.revenue],
            ['Products', summary.productCount],
            ['Pending pay', summary.pendingPayments],
          ].map(([k, v]) => (
            <div key={String(k)} className="rounded-2xl border border-white/10 bg-zinc-900/50 p-4">
              <p className="text-xs uppercase tracking-widest text-gold">{k}</p>
              <p className="mt-2 font-display text-2xl text-cream">{v}</p>
            </div>
          ))}
        </div>
      )}

      <section className="mt-12">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gold">Orders</h2>
        <ul className="mt-4 space-y-2">
          {orders.map((o) => (
            <li
              key={o._id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-zinc-900/40 px-4 py-3 text-sm"
            >
              <span className="text-cream/70">{o._id}</span>
              <span className="text-cream/50">{o.user?.email}</span>
              <span className="text-gold">{o.orderStatus}</span>
              <span>₹{o.gst?.grandTotal?.toLocaleString('en-IN')}</span>
              <Link href={`/orders/${o._id}/track`} className="text-gold hover:underline">
                View
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 rounded-2xl border border-gold/20 bg-black/30 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gold">Update order status</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <input
            className="rounded-lg border border-white/15 bg-zinc-900 px-3 py-2 text-sm text-cream"
            placeholder="Order ID"
            value={statusId}
            onChange={(e) => setStatusId(e.target.value)}
          />
          <select
            className="rounded-lg border border-white/15 bg-zinc-900 px-3 py-2 text-sm text-cream"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
          >
            {['placed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button type="button" onClick={updateStatus} className="rounded-full bg-gold px-4 py-2 text-sm text-ink">
            Save
          </button>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-gold/20 bg-black/30 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gold">Simulate rider GPS (Socket.io)</h2>
        <p className="mt-2 text-xs text-cream/50">
          Paste order ID, set lat/lng, push — customer tracking page updates live.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <input
            className="rounded-lg border border-white/15 bg-zinc-900 px-3 py-2 text-sm text-cream"
            placeholder="Order ID"
            value={agentOrder}
            onChange={(e) => setAgentOrder(e.target.value)}
          />
          <input
            className="w-24 rounded-lg border border-white/15 bg-zinc-900 px-3 py-2 text-sm text-cream"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
          />
          <input
            className="w-24 rounded-lg border border-white/15 bg-zinc-900 px-3 py-2 text-sm text-cream"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
          />
          <button type="button" onClick={pushLocation} className="rounded-full bg-gold px-4 py-2 text-sm text-ink">
            Push location
          </button>
        </div>
      </section>

      <p className="mt-8 text-sm text-cream/40">
        Product CRUD: use{' '}
        <code className="text-gold">POST /api/products</code> with admin JWT, or extend this UI.
      </p>
    </div>
  );
}
