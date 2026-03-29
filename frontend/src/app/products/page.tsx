import Link from 'next/link';
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

type Search = {
  q?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  size?: string;
  trending?: string;
};

async function loadProducts(search: Search) {
  const params = new URLSearchParams();
  if (search.q) params.set('q', search.q);
  if (search.category) params.set('category', search.category);
  if (search.minPrice) params.set('minPrice', search.minPrice);
  if (search.maxPrice) params.set('maxPrice', search.maxPrice);
  if (search.size) params.set('size', search.size);
  if (search.trending === 'true') params.set('trending', 'true');
  params.set('limit', '24');
  try {
    return await api<{ items: Product[]; total: number }>(`/products?${params.toString()}`);
  } catch {
    return { items: [], total: 0 };
  }
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const sp: Search = {
    q: typeof searchParams.q === 'string' ? searchParams.q : undefined,
    category: typeof searchParams.category === 'string' ? searchParams.category : undefined,
    minPrice: typeof searchParams.minPrice === 'string' ? searchParams.minPrice : undefined,
    maxPrice: typeof searchParams.maxPrice === 'string' ? searchParams.maxPrice : undefined,
    size: typeof searchParams.size === 'string' ? searchParams.size : undefined,
    trending: typeof searchParams.trending === 'string' ? searchParams.trending : undefined,
  };

  const { items, total } = await loadProducts(sp);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-gold">Shop</p>
          <h1 className="font-display text-4xl text-cream">All products</h1>
          <p className="mt-2 text-sm text-cream/50">{total} pieces</p>
        </div>
        <form
          className="flex flex-wrap items-center gap-3"
          action="/products"
          method="get"
        >
          <input
            name="q"
            defaultValue={sp.q || ''}
            placeholder="Search"
            className="rounded-full border border-white/15 bg-zinc-900/80 px-4 py-2 text-sm text-cream outline-none focus:border-gold/50"
          />
          <select
            name="category"
            defaultValue={sp.category || ''}
            className="rounded-full border border-white/15 bg-zinc-900/80 px-4 py-2 text-sm text-cream"
          >
            <option value="">All categories</option>
            <option value="jerseys">Jerseys</option>
            <option value="shoes">Shoes</option>
            <option value="leather-jackets">Leather jackets</option>
          </select>
          <input
            name="minPrice"
            defaultValue={sp.minPrice || ''}
            placeholder="Min ₹"
            className="w-24 rounded-full border border-white/15 bg-zinc-900/80 px-3 py-2 text-sm text-cream"
          />
          <input
            name="maxPrice"
            defaultValue={sp.maxPrice || ''}
            placeholder="Max ₹"
            className="w-24 rounded-full border border-white/15 bg-zinc-900/80 px-3 py-2 text-sm text-cream"
          />
          <button
            type="submit"
            className="rounded-full bg-gold px-5 py-2 text-sm font-semibold text-ink"
          >
            Filter
          </button>
        </form>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p._id} {...p} />
        ))}
      </div>
      {items.length === 0 && (
        <p className="mt-12 text-center text-cream/50">No products match. Try adjusting filters.</p>
      )}
      <p className="mt-8 text-center text-sm text-cream/40">
        <Link href="/" className="text-gold hover:underline">
          Back home
        </Link>
      </p>
    </div>
  );
}
