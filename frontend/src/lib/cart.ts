export type CartItem = {
  productId: string;
  quantity: number;
  size?: string;
  name?: string;
  price?: number;
  image?: string;
};

const KEY = 'luxestreet_cart';

export function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function cartCount(items: CartItem[]) {
  return items.reduce((n, i) => n + i.quantity, 0);
}

export function cartSubtotal(items: CartItem[]) {
  return items.reduce((s, i) => s + (i.price || 0) * i.quantity, 0);
}
