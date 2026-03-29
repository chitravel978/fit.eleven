import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-gold/15 bg-black/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-3 md:px-6">
        <div>
          <p className="font-display text-lg tracking-widest text-cream">
            LUXE<span className="text-gold">STREET</span>
          </p>
          <p className="mt-3 max-w-xs text-sm text-cream/50">
            Premium jerseys, limited sneakers, and luxury leather — crafted for those who move the culture.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gold">Explore</p>
          <ul className="mt-4 space-y-2 text-sm text-cream/60">
            <li>
              <Link href="/products?category=jerseys" className="hover:text-gold">
                Jerseys
              </Link>
            </li>
            <li>
              <Link href="/products?category=shoes" className="hover:text-gold">
                Shoes
              </Link>
            </li>
            <li>
              <Link href="/products?category=leather-jackets" className="hover:text-gold">
                Leather Jackets
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gold">Support</p>
          <p className="mt-4 text-sm text-cream/50">
            GST invoices · Secure Razorpay checkout · Real-time order tracking
          </p>
        </div>
      </div>
      <div className="border-t border-white/5 py-6 text-center text-xs text-cream/30">
        © {new Date().getFullYear()} LuxeStreet. India.
      </div>
    </footer>
  );
}
