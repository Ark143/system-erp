import { useState, useEffect } from 'react';
import * as api from '../lib/api.js';
import { useExport } from '../lib/reportExport.js';
import Modal from '../components/Modal.jsx';

const COLUMNS = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'is_active', label: 'Active' },
  { key: 'created_at', label: 'Created' },
];

export default function InventoryItemCategories() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', is_active: true });
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const exportApi = useExport({ api, endpoint: '/inventory/categories/', defaultColumns: COLUMNS });

  const load = async () => {
    setError('');
    try {
      const data = await api.inventory.categories.list(q ? { search: q } : {});
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'LOAD_FAILED');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditId(null);
    setForm({ name: '', description: '', is_active: true });
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditId(row.id);
    setForm({ name: row.name, description: row.description || '', is_active: row.is_active !== false });
    setOpen(true);
  };

  const openDuplicate = (row) => {
    setEditId(null);
    setForm({
      name: row.name ? row.name + ' Copy' : '',
      description: row.description || '',
      is_active: row.is_active !== false,
    });
    setOpen(true);
  };

  const doSave = async () => {
    setError('');
    try {
      if (!form.name.trim()) throw new Error('Category name is required.');
      if (editId) await api.inventory.categories.update(editId, { name: form.name.trim(), description: form.description || '', is_active: !!form.is_active });
      else await api.inventory.categories.create({ name: form.name.trim(), description: form.description || '', is_active: !!form.is_active });
      setOpen(false);
      setEditId(null);
      setForm({ name: '', description: '', is_active: true });
      load();
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'Action failed');
    }
  };

  const doRemove = async (id) => {
    setError('');
    try {
      await api.inventory.categories.remove(id);
      load();
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'DELETE_FAILED');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--color-border)] pb-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-ink)]">Item Categories</h2>
          <p className="text-sm text-[var(--color-ink-secondary)]">Full list of item categories with create, edit, delete, exports.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder="Search categories..."
            className="w-56 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
          />
          <button onClick={load} className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--color-muted)] transition">Search</button>
          <button onClick={openCreate} className="rounded-xl bg-[var(--color-apple-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition">New Category</button>
          <button onClick={() => exportApi.toPdf(COLUMNS)} className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--color-muted)] transition">Print PDF</button>
          <button onClick={() => exportApi.toCsv(COLUMNS)} className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--color-muted)] transition">Export CSV</button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-medium">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-sm overflow-x-auto">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-black/[0.01]">
              {COLUMNS.map((c) => (
                <th key={c.key} className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">{c.label}</th>
              ))}
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {(rows || []).slice(0, 100).map((r) => (
              <tr key={r.id} className="hover:bg-black/[0.01]">
                <td className="px-6 py-4 text-[var(--color-ink)]">{r.id}</td>
                <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{r.name}</td>
                <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.description || '—'}</td>
                <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.is_active !== false ? 'Yes' : 'No'}</td>
                <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{String(r.created_at || '').slice(0, 16).replace('T', ' ')}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(r)} className="font-semibold text-[var(--color-apple-blue)] hover:underline">Edit</button>
                    <button onClick={() => openDuplicate(r)} className="font-semibold text-[var(--color-ink)] hover:underline">Duplicate</button>
                    <button onClick={() => doRemove(r.id)} className="font-semibold text-red-600 hover:underline">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {!rows?.length && (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-[var(--color-ink-secondary)] font-medium">No records found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={open} title={editId ? 'Edit Category' : 'New Category'} onClose={() => { setOpen(false); setEditId(null); }}>
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Category Name *</label>
            <input
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
              placeholder="Name"
              value={form.name || ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Description</label>
            <textarea
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)] h-20 resize-none"
              placeholder="Details..."
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            <span className="text-sm font-medium text-[var(--color-ink-secondary)]">Active</span>
          </label>
          <div className="flex gap-2 pt-2">
            <button onClick={() => { setOpen(false); setEditId(null); }} className="flex-1 rounded-xl border border-[var(--color-border)] p-3 text-sm font-semibold text-[var(--color-ink-secondary)] hover:bg-black/5 transition">Cancel</button>
            <button onClick={doSave} className="flex-1 rounded-xl bg-black p-3 text-sm font-semibold text-white hover:opacity-90 transition">Confirm</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
