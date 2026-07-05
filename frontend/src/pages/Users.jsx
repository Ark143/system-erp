import { useState, useEffect } from 'react';
import * as api from '../lib/api.js';

export default function Users() {
  const [tab, setTab] = useState('roles');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      if (tab === 'roles') setRows(await api.governance.roles.list());
      else if (tab === 'permissions') setRows(await api.governance.permissions.list());
      else setRows(await api.governance.rolePermissions.list());
    } catch (e) { setError('LOAD_FAILED'); }
  };

  useEffect(() => { load(); }, [tab]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-ink)]">User</h2>
        <p className="text-sm text-[var(--color-ink-secondary)]">Roles, permissions, and role-permission mappings.</p>
      </div>
      <div className="flex gap-2">
        {['roles','permissions','role-permissions'].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${tab===t?'bg-black text-white':'bg-black/5 text-[var(--color-ink-secondary)] hover:bg-black/10'}`}>{t}</button>
        ))}
      </div>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead><tr className="border-b border-[var(--color-border)]">
            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-secondary)]">ID</th>
            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-secondary)]">Name/Code</th>
          </tr></thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {(rows || []).slice(0, 20).map((r) => (
              <tr key={r.id} className="hover:bg-black/[0.02]">
                <td className="px-6 py-3 font-medium text-[var(--color-ink)]">{r.id}</td>
                <td className="px-6 py-3 text-[var(--color-ink)]">{r.role_name || r.permission_id || '—'}</td>
              </tr>
            ))}
            {!rows?.length && <tr><td colSpan="2" className="px-6 py-10 text-center text-[var(--color-ink-secondary)]">No records</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
