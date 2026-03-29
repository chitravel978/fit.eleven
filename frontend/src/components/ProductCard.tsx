import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';

export type ProductCardProps = {
  _id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  images?: string[];
  category?: string;
  trending?: boolean;
};

export function ProductCard(p: ProductCardProps) {
  const img = p.images?.[0] || '/placeholder.jpg';
  return (
    <Link
      href={`/products/${p.slug}`}
      className="group card-hover block overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-zinc-800">
        <Image
          src={img}
          alt={p.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width:768px) 50vw, 25vw"
        />
        {p.trending && (
          <span className="absolute left-3 top-3 rounded-full bg-gold/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink">
            Trending
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gold/80">{p.category}</p>
        <h3 className="mt-1 font-display text-lg text-cream group-hover:text-gold">{p.name}</h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-cream">₹{p.price.toLocaleString('en-IN')}</span>
          {p.compareAtPrice && p.compareAtPrice > p.price && (
            <span className="text-sm text-cream/40 line-through">
              ₹{p.compareAtPrice.toLocaleString('en-IN')}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
