'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

function LoginForm() {
  const { login, register } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get('next') || '/';
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    try {
      if (mode === 'login') await login(email, password);
      else await register(email, password, name);
      router.push(next);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-24">
      <h1 className="font-display text-4xl text-cream">
        {mode === 'login' ? 'Sign in' : 'Create account'}
      </h1>
      <form onSubmit={submit} className="mt-8 space-y-4">
        {mode === 'register' && (
          <input
            className="w-full rounded-lg border border-white/15 bg-zinc-900 px-4 py-3 text-cream"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}
        <input
          required
          type="email"
          className="w-full rounded-lg border border-white/15 bg-zinc-900 px-4 py-3 text-cream"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          required
          type="password"
          className="w-full rounded-lg border border-white/15 bg-zinc-900 px-4 py-3 text-cream"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {err && <p className="text-sm text-red-400">{err}</p>}
        <button
          type="submit"
          className="w-full rounded-full bg-gold py-3 text-sm font-semibold uppercase tracking-widest text-ink"
        >
          {mode === 'login' ? 'Sign in' : 'Register'}
        </button>
      </form>
      <button
        type="button"
        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        className="mt-6 w-full text-center text-sm text-gold hover:underline"
      >
        {mode === 'login' ? 'Need an account?' : 'Already have an account?'}
      </button>
      <Link href="/" className="mt-8 block text-center text-sm text-cream/40 hover:text-cream">
        ← Home
      </Link>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-cream/50">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
