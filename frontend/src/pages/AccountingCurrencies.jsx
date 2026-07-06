import { useState, useEffect } from 'react';
import * as api from '../lib/api.js';

export default function AccountingCurrencies() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});

  const load = async () => {
    setError('');
    try {
      const data = await api.accounting.currencies.list();
      setRows(Array.isArray(data) ? data : (data && Array.isArray(data.results) ? data.results : []));
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'LOAD_FAILED');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditId(null);
    setForm({ code: '', name: '', symbol: '', is_active: true });
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditId(row.id);
    setForm({
      code: row.code,
      name: row.name,
      symbol: row.symbol || '',
      is_active: row.is_active !== false,
    });
    setOpen(true);
  };

  const doSave = async () => {
    setError('');
    try {
      if (!form.code || !form.name) {
        setError('Code and Name are required.');
        return;
      }
      const payload = {
        code: String(form.code).trim().toUpperCase(),
        name: String(form.name).trim(),
        symbol: String(form.symbol || '').trim(),
        is_active: form.is_active !== false,
      };
      if (editId) await api.accounting.currencies.update(editId, payload);
      else await api.accounting.currencies.create(payload);
      setOpen(false);
      setEditId(null);
      setForm({});
      load();
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'SAVE_FAILED');
    }
  };

  const doRemove = async (id) => {
    setError('');
    try {
      await api.accounting.currencies.remove(id);
      load();
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'DELETE_FAILED');
    }
  };

  const openDuplicate = async (row) => {
    setError('');
    try {
      const data = await api.duplicateItem('/accounting/currencies/', row.id);
      const src = data || row;
      setEditId(null);
      setForm({
        code: (src.code || '') + ' COPY',
        name: (src.name || '') + ' Copy',
        symbol: src.symbol || '',
        is_active: src.is_active !== false,
      });
      setOpen(true);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'DUPLICATE_FAILED');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--color-border)] pb-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-ink)]">Currencies</h2>
          <p className="text-sm text-[var(--color-ink-secondary)]">Currency setup with PHP set as main.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={openCreate}
            className="rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition"
          >
            New Currency
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-medium">{error}</div>
      )}

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-sm overflow-x-auto">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-black/[0.01]">
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Code</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Name</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Symbol</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Status</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Base</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {(rows || []).map((r) => (
              <tr key={r.id} className="hover:bg-black/[0.01]">
                <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{r.code}</td>
                <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.name}</td>
                <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.symbol || '—'}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${r.is_active ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' : 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20'}`}>
                    {r.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {r.code === 'PHP' ? <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold bg-black text-white">Base</span> : '—'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => openEdit(r)} className="font-semibold text-[var(--color-apple-blue)] hover:underline">Edit</button>
                    <button onClick={async () => { const src = await api.duplicateItem('/accounting/currencies/', r.id).catch(() => r); setEditId(null); setForm({ code: src.code || `${r.code}-COPY`, name: src.name ? src.name + ' Copy' : '', symbol: src.symbol || '', is_active: src.is_active !== false }); setOpen(true); }} className="font-semibold text-[var(--color-ink)] hover:underline">Duplicate</button>
                    <button onClick={() => doRemove(r.id)} className="font-semibold text-red-600 hover:underline">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {!rows?.length && (
              <tr>
                <td colSpan="10" className="px-6 py-12 text-center text-[var(--color-ink-secondary)] font-medium">No records found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={`rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-sm ${!open ? 'hidden' : ''}`}>
        <div className="p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-ink-secondary)] pt-2">{editId ? 'Edit Currency' : 'New Currency'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Code *</label>
              <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" placeholder="e.g. PHP" value={form.code || ''} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Name *</label>
              <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" placeholder="e.g. Philippine Peso" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Symbol</label>
              <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" placeholder="₱" value={form.symbol || ''} onChange={(e) => setForm({ ...form, symbol: e.target.value })} />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] p-3">
              <input id="currency-active" type="checkbox" className="h-4 w-4 rounded border-[var(--color-border)]" checked={!!form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              <label htmlFor="currency-active" className="text-sm font-medium text-[var(--color-ink)]">Active</label>
            </div>
          </div>
          {editId && (
            <div className="rounded-xl border border-[var(--color-border)] bg-black/[0.01] p-4 text-xs text-[var(--color-ink-secondary)]">
              Main currency is fixed to PHP. This record remains the base currency.
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button onClick={() => { setOpen(false); setEditId(null); }} className="flex-1 rounded-xl border border-[var(--color-border)] p-3 text-sm font-semibold text-[var(--color-ink-secondary)] hover:bg-black/5 transition">Cancel</button>
            <button onClick={doSave} className="flex-1 rounded-xl bg-black p-3 text-sm font-semibold text-white hover:opacity-90 transition">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
