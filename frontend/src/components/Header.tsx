'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import clsx from 'clsx';

const nav = [
  { href: '/products?category=jerseys', label: 'Jerseys' },
  { href: '/products?category=shoes', label: 'Shoes' },
  { href: '/products?category=leather-jackets', label: 'Leather' },
];

export function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { totalQty } = useCart();

  return (
    <header className="sticky top-0 z-50 border-b border-gold/20 bg-ink/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
        <Link href="/" className="font-display text-xl font-semibold tracking-[0.2em] text-cream md:text-2xl">
          LUXE<span className="text-gold">STREET</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={clsx(
                'text-sm uppercase tracking-widest transition hover:text-gold',
                pathname?.startsWith('/products') ? 'text-gold' : 'text-cream/80'
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4 md:gap-6">
          <Link
            href="/products"
            className="text-sm text-cream/70 hover:text-gold"
          >
            Shop
          </Link>
          {user && (
            <Link href="/wishlist" className="text-sm text-cream/70 hover:text-gold">
              Wishlist
            </Link>
          )}
          <Link
            href="/cart"
            className="relative text-sm font-medium text-cream hover:text-gold"
          >
            Bag
            {totalQty > 0 && (
              <span className="absolute -right-3 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-ink">
                {totalQty}
              </span>
            )}
          </Link>
          {user ? (
            <>
              <Link href="/orders" className="hidden text-sm text-cream/70 hover:text-gold sm:inline">
                Orders
              </Link>
              {user.role === 'admin' && (
                <Link href="/admin" className="text-sm text-gold hover:underline">
                  Admin
                </Link>
              )}
              <button
                type="button"
                onClick={() => logout()}
                className="text-sm text-cream/50 hover:text-cream"
              >
                Out
              </button>
            </>
          ) : (
            <Link href="/login" className="text-sm text-gold hover:underline">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
