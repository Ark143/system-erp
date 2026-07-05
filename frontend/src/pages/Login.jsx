import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context.jsx';

export default function Login() {
  const [form, setForm] = useState({ email: 'admin@example.com', password: 'admin' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)]">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="text-lg font-bold tracking-tight text-[var(--color-ink)]">System erp</div>
          <p className="mt-1 text-sm text-[var(--color-ink-secondary)]">Sign in to continue</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-secondary)]">Email</label>
            <input value={form.email} onChange={(e)=> setForm({...form,email:e.target.value})} type="email" className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-secondary)]">Password</label>
            <input value={form.password} onChange={(e)=> setForm({...form,password:e.target.value})} type="password" className="w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" />
          </div>
          {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
          <button disabled={loading} className="w-full rounded-xl bg-[var(--color-apple-blue)] py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-apple-blue-hover)] disabled:opacity-60">{loading? 'Signing in…' : 'Sign in'}</button>
        </form>
      </div>
    </div>
  );
}
