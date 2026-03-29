import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { AddToCart } from './AddToCart';

export const dynamic = 'force-dynamic';

type Product = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  sizes: string[];
  stock: number;
  category: string;
  gstRate?: number;
};

async function getProduct(slug: string) {
  try {
    return await api<Product>(`/products/slug/${slug}`);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const p = await getProduct(params.slug);
  if (!p) return { title: 'Product' };
  return {
    title: p.name,
    description: p.description?.slice(0, 160),
    openGraph: { images: p.images?.[0] ? [p.images[0]] : [] },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const p = await getProduct(params.slug);
  if (!p) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
            <Image
              src={p.images[0]}
              alt={p.name}
              fill
              className="object-cover"
              priority
            />
          </div>
          {p.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {p.images.slice(1, 5).map((src) => (
                <div key={src} className="relative aspect-square overflow-hidden rounded-lg border border-white/10">
                  <Image src={src} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">{p.category.replace('-', ' ')}</p>
          <h1 className="mt-2 font-display text-4xl text-cream md:text-5xl">{p.name}</h1>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl text-cream">₹{p.price.toLocaleString('en-IN')}</span>
            {p.compareAtPrice && p.compareAtPrice > p.price && (
              <span className="text-lg text-cream/40 line-through">
                ₹{p.compareAtPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-cream/50">
            Incl. GST framework: {p.gstRate || 18}% — CGST/SGST split on invoice
          </p>
          <p className="mt-8 leading-relaxed text-cream/70">{p.description}</p>
          <p className="mt-4 text-sm text-cream/40">
            {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
          </p>
          <AddToCart product={p} />
          <Link href="/products" className="mt-8 inline-block text-sm text-gold hover:underline">
            ← Back to shop
          </Link>
        </div>
      </div>
    </div>
  );
}
