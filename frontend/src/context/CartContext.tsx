'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  CartItem,
  cartCount,
  cartSubtotal,
  loadCart,
  saveCart,
} from '@/lib/cart';

type CartCtx = {
  items: CartItem[];
  add: (item: CartItem) => void;
  updateQty: (productId: string, size: string | undefined, qty: number) => void;
  remove: (productId: string, size?: string) => void;
  clear: () => void;
  totalQty: number;
  subtotal: number;
};

const Ctx = createContext<CartCtx | null>(null);

function key(id: string, size?: string) {
  return `${id}::${size || ''}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(loadCart());
  }, []);

  const persist = useCallback((next: CartItem[]) => {
    saveCart(next);
    setItems(next);
  }, []);

  const add = useCallback(
    (item: CartItem) => {
      const cur = loadCart();
      const i = cur.findIndex(
        (x) => x.productId === item.productId && x.size === item.size
      );
      if (i >= 0) {
        cur[i].quantity += item.quantity;
      } else {
        cur.push({ ...item });
      }
      persist(cur);
    },
    [persist]
  );

  const updateQty = useCallback(
    (productId: string, size: string | undefined, qty: number) => {
      const cur = loadCart();
      const next = cur
        .map((x) =>
          key(x.productId, x.size) === key(productId, size)
            ? { ...x, quantity: Math.max(0, qty) }
            : x
        )
        .filter((x) => x.quantity > 0);
      persist(next);
    },
    [persist]
  );

  const remove = useCallback(
    (productId: string, size?: string) => {
      const cur = loadCart().filter((x) => key(x.productId, x.size) !== key(productId, size));
      persist(cur);
    },
    [persist]
  );

  const clear = useCallback(() => persist([]), [persist]);

  const value = useMemo(
    () => ({
      items,
      add,
      updateQty,
      remove,
      clear,
      totalQty: cartCount(items),
      subtotal: cartSubtotal(items),
    }),
    [items, add, updateQty, remove, clear]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useCart outside provider');
  return c;
}
