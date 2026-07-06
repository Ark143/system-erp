import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../lib/api.js';

export default function GovernanceCompanies() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    setError('');
    try {
      const data = await api.governance.companies.list();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'LOAD_FAILED');
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--color-border)] pb-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-ink)]">Companies</h2>
          <p className="text-sm text-[var(--color-ink-secondary)]">Manage company configurations and defaults.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => navigate('/governance/companies/new')} className="rounded-xl bg-[var(--color-apple-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition">Create Company</button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-medium">{error}</div>}

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-sm overflow-x-auto">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Company Name</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Abbreviation</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Parent Company</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Currency</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Country</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Stock Valuation</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {(rows || []).map((r) => (
              <tr key={r.id} onClick={() => navigate(`/governance/companies/${r.id}`)} className="hover:bg-[var(--color-muted)] cursor-pointer">
                <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{r.company_name || r.name}</td>
                <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.abbreviation || '—'}</td>
                <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.parent_company_name || r.parent_company || '—'}</td>
                <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.base_currency || r.default_currency || '—'}</td>
                <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.country || '—'}</td>
                <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.default_valuation_method || '—'}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/governance/companies/${r.id}`); }} className="rounded-lg bg-black/5 px-3 py-1.5 text-xs font-semibold hover:bg-black/10 transition">View</button>
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/governance/companies/${r.id}/edit`); }} className="rounded-lg bg-black/5 px-3 py-1.5 text-xs font-semibold hover:bg-black/10 transition">Edit</button>
                  </div>
                </td>
              </tr>
            ))}
            {!rows?.length && (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-[var(--color-ink-secondary)] font-medium">No companies found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
