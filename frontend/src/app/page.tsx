import Link from 'next/link';
import Image from 'next/image';
import { ProductCard } from '@/components/ProductCard';
import { api } from '@/lib/api';

export const dynamic = 'force-dynamic';

type Product = {
  _id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  images?: string[];
  category: string;
  trending?: boolean;
};

async function getFeatured() {
  try {
    const { items } = await api<{ items: Product[] }>('/products?featured=true&limit=4');
    return items;
  } catch {
    return [];
  }
}

const reviews = [
  {
    name: 'Arjun M.',
    text: 'The leather jacket exceeded expectations. Packaging felt like a luxury house.',
    city: 'Mumbai',
  },
  {
    name: 'Kavya R.',
    text: 'Limited sneaker drop was smooth. Tracking with live map is a nice touch.',
    city: 'Bengaluru',
  },
  {
    name: 'Rahul S.',
    text: 'GST invoice was clear. SAVE10 worked perfectly at checkout.',
    city: 'Delhi',
  },
];

export default async function HomePage() {
  const featured = await getFeatured();

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80"
            alt=""
            fill
            className="object-cover opacity-40"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-transparent" />
        </div>
        <div className="relative z-10 mx-auto flex min-h-[85vh] max-w-7xl flex-col justify-end px-4 pb-24 pt-32 md:px-6">
          <p className="animate-fade-up text-xs font-semibold uppercase tracking-[0.35em] text-gold">
            New season · India
          </p>
          <h1 className="animate-fade-up font-display text-5xl leading-tight text-cream md:text-7xl md:leading-[1.05]">
            Wear the <span className="text-gold">night</span>.
            <br />
            Own the street.
          </h1>
          <p className="mt-6 max-w-lg animate-fade-up text-lg text-cream/70">
            Jerseys built for movement. Sneakers that never blend in. Leather forged for the long ride.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/products"
              className="rounded-full bg-gold px-8 py-3 text-sm font-semibold uppercase tracking-widest text-ink transition hover:bg-gold-light"
            >
              Shop collection
            </Link>
            <Link
              href="/products?category=leather-jackets"
              className="rounded-full border border-gold/50 px-8 py-3 text-sm font-semibold uppercase tracking-widest text-cream hover:border-gold hover:text-gold"
            >
              Leather edit
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-gold">Categories</p>
            <h2 className="font-display text-3xl text-cream md:text-4xl">Featured edits</h2>
          </div>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              href: '/products?category=jerseys',
              title: 'Jerseys',
              sub: 'Sports · Oversized · Street',
              img: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
            },
            {
              href: '/products?category=shoes',
              title: 'Shoes',
              sub: 'Sneakers · Limited',
              img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
            },
            {
              href: '/products?category=leather-jackets',
              title: 'Leather',
              sub: 'Luxury · Biker',
              img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80',
            },
          ].map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10"
            >
              <Image src={c.img} alt={c.title} fill className="object-cover transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="font-display text-2xl text-cream">{c.title}</h3>
                <p className="text-sm text-cream/60">{c.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-white/5 bg-zinc-950/50 py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-gold">Members</p>
              <h2 className="font-display text-3xl text-cream">Free shipping over ₹4,999</h2>
              <p className="mt-3 text-cream/60">
                Stack your cart with premium pieces — standard delivery on us when you cross the threshold.
              </p>
            </div>
            <div className="rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/10 to-transparent p-8 text-center">
              <p className="text-sm text-gold">Use code</p>
              <p className="font-display text-3xl tracking-widest text-cream">SAVE10</p>
              <p className="mt-2 text-sm text-cream/50">10% off · min order ₹2,000 · FLAT200 also live</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-gold">Spotlight</p>
            <h2 className="font-display text-3xl text-cream md:text-4xl">Trending now</h2>
          </div>
          <Link href="/products?trending=true" className="hidden text-sm text-gold hover:underline md:inline">
            View all
          </Link>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.length > 0 ? (
            featured.map((p) => <ProductCard key={p._id} {...p} />)
          ) : (
            <p className="col-span-full text-cream/50">Start the API and seed data to see products.</p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <p className="text-center text-xs uppercase tracking-[0.25em] text-gold">Reviews</p>
        <h2 className="text-center font-display text-3xl text-cream">Loved by the culture</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {reviews.map((r) => (
            <blockquote
              key={r.name}
              className="rounded-2xl border border-white/10 bg-zinc-900/40 p-6"
            >
              <p className="text-cream/80">&ldquo;{r.text}&rdquo;</p>
              <footer className="mt-4 text-sm text-gold">
                {r.name} · {r.city}
              </footer>
            </blockquote>
          ))}
        </div>
      </section>
    </>
  );
}
