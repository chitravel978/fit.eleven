const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export async function api<T>(
  path: string,
  opts: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token, ...init } = opts;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init.headers || {}),
  };
  const t = token ?? getToken();
  if (t) (headers as Record<string, string>).Authorization = `Bearer ${t}`;
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || res.statusText);
  return data as T;
}

export { API };
