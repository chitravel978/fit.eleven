'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { api } from '@/lib/api';

type Preview = {
  items: unknown[];
  gstBreakdown: {
    subtotal: number;
    discount: number;
    taxableAmount: number;
    gstPercent: number;
    cgst: number;
    sgst: number;
    totalGst: number;
    shipping: number;
    grandTotal: number;
  };
  couponCode?: string;
};

declare global {
  interface Window {
    Razorpay: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

export default function CheckoutPage() {
  const { user, loading } = useAuth();
  const { items, clear } = useCart();
  const router = useRouter();
  const [coupon, setCoupon] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [err, setErr] = useState('');
  const [billing, setBilling] = useState({
    name: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login?next=/checkout');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || items.length === 0) return;
    const run = async () => {
      try {
        const p = await api<Preview>('/orders/preview', {
          method: 'POST',
          body: JSON.stringify({
            cartItems: items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              size: i.size,
            })),
            couponCode: coupon || undefined,
          }),
        });
        setPreview(p);
        setErr('');
      } catch (e) {
        setErr((e as Error).message);
      }
    };
    const t = setTimeout(run, 300);
    return () => clearTimeout(t);
  }, [user, items, coupon]);

  const applyCoupon = () => {
    /* preview effect uses coupon state */
  };

  const placeOrder = async () => {
    if (!user || items.length === 0) return;
    setSubmitting(true);
    setErr('');
    try {
      const res = await api<{
        order: { _id: string };
        razorpayOrderId?: string;
        amount: number;
        keyId?: string;
      }>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          cartItems: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            size: i.size,
          })),
          couponCode: coupon || undefined,
          billing: { ...billing, email: billing.email || user.email },
        }),
      });

      const { order, razorpayOrderId, keyId } = res;

      if (!razorpayOrderId || !keyId) {
        await api(`/orders/${order._id}/mock-pay`, { method: 'POST' });
        clear();
        router.push(`/orders/${order._id}/track`);
        return;
      }

      await new Promise<void>((resolve, reject) => {
        const max = 80;
        let n = 0;
        const t = setInterval(() => {
          if (typeof window !== 'undefined' && window.Razorpay) {
            clearInterval(t);
            resolve();
          } else if (++n > max) {
            clearInterval(t);
            reject(new Error('Razorpay script failed to load'));
          }
        }, 50);
      });

      const rzp = new window.Razorpay({
        key: keyId,
        amount: Math.round(res.amount * 100),
        currency: 'INR',
        name: 'LuxeStreet',
        description: `Order ${order._id}`,
        order_id: razorpayOrderId,
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          await api(`/orders/${order._id}/verify-payment`, {
            method: 'POST',
            body: JSON.stringify(response),
          });
          clear();
          router.push(`/orders/${order._id}/track`);
        },
        theme: { color: '#c9a227' },
        modal: { ondismiss: () => setSubmitting(false) },
      });
      rzp.open();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center text-cream/50">
        Checking session…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <p className="text-cream/70">Your cart is empty.</p>
        <Link href="/products" className="mt-4 inline-block text-gold hover:underline">
          Shop
        </Link>
      </div>
    );
  }

  const g = preview?.gstBreakdown;

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <h1 className="font-display text-4xl text-cream">Checkout</h1>
        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-gold">Shipping & GST</h2>
            {(['name', 'email', 'phone', 'addressLine1', 'addressLine2', 'city', 'state', 'pincode'] as const).map(
              (field) => (
                <div key={field}>
                  <label className="text-xs uppercase text-cream/50">{field}</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-white/15 bg-zinc-900 px-3 py-2 text-cream"
                    value={billing[field]}
                    onChange={(e) => setBilling({ ...billing, [field]: e.target.value })}
                    placeholder={field}
                  />
                </div>
              )
            )}
          </div>
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-gold">Coupon</h2>
              <div className="mt-3 flex gap-2">
                <input
                  className="flex-1 rounded-lg border border-white/15 bg-zinc-900 px-3 py-2 text-cream uppercase"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="SAVE10 or FLAT200"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  className="rounded-lg bg-gold/20 px-4 py-2 text-sm text-gold"
                >
                  Apply
                </button>
              </div>
            </div>
            <div className="rounded-2xl border border-gold/25 bg-black/40 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-gold">Invoice preview (India GST)</h2>
              {g && (
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-cream/80">
                    <dt>Subtotal</dt>
                    <dd>₹{g.subtotal.toLocaleString('en-IN')}</dd>
                  </div>
                  <div className="flex justify-between text-emerald-400/90">
                    <dt>Discount</dt>
                    <dd>−₹{g.discount.toLocaleString('en-IN')}</dd>
                  </div>
                  <div className="flex justify-between text-cream/80">
                    <dt>Taxable (after discount)</dt>
                    <dd>₹{g.taxableAmount.toLocaleString('en-IN')}</dd>
                  </div>
                  <div className="gold-line my-3" />
                  <div className="flex justify-between text-cream/70">
                    <dt>GST ({g.gstPercent}%)</dt>
                    <dd>₹{g.totalGst.toLocaleString('en-IN')}</dd>
                  </div>
                  <div className="flex justify-between pl-3 text-xs text-cream/50">
                    <dt>CGST ({g.gstPercent / 2}%)</dt>
                    <dd>₹{g.cgst.toLocaleString('en-IN')}</dd>
                  </div>
                  <div className="flex justify-between pl-3 text-xs text-cream/50">
                    <dt>SGST ({g.gstPercent / 2}%)</dt>
                    <dd>₹{g.sgst.toLocaleString('en-IN')}</dd>
                  </div>
                  <div className="flex justify-between text-cream/80">
                    <dt>Shipping</dt>
                    <dd>{g.shipping === 0 ? 'FREE' : `₹${g.shipping}`}</dd>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-3 font-display text-xl text-cream">
                    <dt>Total</dt>
                    <dd>₹{g.grandTotal.toLocaleString('en-IN')}</dd>
                  </div>
                </dl>
              )}
              {preview?.couponCode && (
                <p className="mt-2 text-xs text-gold">Coupon applied: {preview.couponCode}</p>
              )}
            </div>
            {err && <p className="text-sm text-red-400">{err}</p>}
            <button
              type="button"
              disabled={submitting}
              onClick={placeOrder}
              className="w-full rounded-full bg-gold py-4 text-sm font-semibold uppercase tracking-widest text-ink disabled:opacity-50"
            >
              {submitting ? 'Processing…' : 'Pay with Razorpay'}
            </button>
            <p className="text-center text-xs text-cream/40">
              UPI · Cards · Netbanking via Razorpay. If keys are not set, dev mode completes without payment.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
