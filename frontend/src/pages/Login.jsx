import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context.jsx';

export default function Login() {
  const [form, setForm] = useState({ email: 'admin@example.com', password: 'admin' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const email = emailRef.current?.value || form.email;
    const password = passwordRef.current?.value || form.password;
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      let message = 'Login failed';
      if (err?.message) message = err.message;
      else if (err?.response?.data?.detail) message = err.response.data.detail;
      console.error('Login error:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)]">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="text-lg font-bold tracking-tight text-[var(--color-ink)]">System erp</div>
          <p className="mt-1 text-sm text-[var(--color-ink-secondary)]">Sign in to continue</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-secondary)]">Email</label>
            <input ref={emailRef} defaultValue={form.email} onChange={(e)=> setForm({...form,email:e.target.value})} type="email" autoComplete="email" name="email" className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-secondary)]">Password</label>
            <input ref={passwordRef} defaultValue={form.password} onChange={(e)=> setForm({...form,password:e.target.value})} type="password" autoComplete="current-password" name="password" className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" />
          </div>
          {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
          <button disabled={loading} type="submit" className="w-full rounded-xl bg-[var(--color-apple-blue)] py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-apple-blue-hover)] disabled:opacity-60">{loading? 'Signing in…' : 'Sign in'}</button>
        </form>
      </div>
    </div>
  );
}
