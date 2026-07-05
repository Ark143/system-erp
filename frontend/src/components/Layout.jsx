import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context.jsx';
import { LayoutDashboard, Package, ShoppingCart, Truck, Calculator, CheckSquare, LogOut } from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const doLogout = () => { logout(); navigate('/login'); };

  const linkBase = 'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold no-underline transition hover:bg-black/5';
  const active = 'bg-black/[0.04] text-[var(--color-ink)]';
  const base = 'text-[var(--color-ink-secondary)]';

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex w-64 flex-col border-r border-[var(--color-border)] bg-white">
        <div className="px-6 py-5 text-lg font-bold tracking-tight text-[var(--color-ink)]">System erp</div>
        <nav className="flex-1 px-3 space-y-1">
          <NavLink to="/" end className={({isActive}) => `${linkBase} ${isActive?active:base}`}><LayoutDashboard size={18}/>Dashboard</NavLink>
          <NavLink to="/inventory" className={({isActive}) => `${linkBase} ${isActive?active:base}`}><Package size={18}/>Inventory</NavLink>
          <NavLink to="/sales" className={({isActive}) => `${linkBase} ${isActive?active:base}`}><ShoppingCart size={18}/>Sales</NavLink>
          <NavLink to="/purchasing" className={({isActive}) => `${linkBase} ${isActive?active:base}`}><Truck size={18}/>Purchasing</NavLink>
          <NavLink to="/accounting" className={({isActive}) => `${linkBase} ${isActive?active:base}`}><Calculator size={18}/>Accounting</NavLink>
          <NavLink to="/workflow" className={({isActive}) => `${linkBase} ${isActive?active:base}`}><CheckSquare size={18}/>Workflow</NavLink>
        </nav>
        <div className="p-3">
          <button onClick={doLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[var(--color-ink-secondary)] transition hover:bg-black/5">Logout</button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-[var(--color-surface)]">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-border)] bg-white/80 px-8 py-4 backdrop-blur">
          <h1 className="text-base font-semibold uppercase tracking-widest text-[var(--color-ink-secondary)]">{user?.role || 'User'}</h1>
          <div className="text-sm font-medium text-[var(--color-ink-secondary)]">{user?.email}</div>
        </header>
        <div className="mx-auto max-w-6xl p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
