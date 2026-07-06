import { useState, useEffect } from 'react';
import * as api from '../lib/api.js';
import Modal from '../components/Modal.jsx';

export default function Users() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    setError('');
    try {
      setRows(await api.auth.list());
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'LOAD_FAILED');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditId(null);
    setForm({ is_active: true, is_staff: false });
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditId(row.id);
    setForm({ ...row, is_active: row.is_active !== false, is_staff: !!row.is_staff });
    setOpen(true);
  };

  const doSave = async () => {
    setError('');
    try {
      const payload = {
        email: form.email,
        full_name: form.full_name || '',
        role: form.role || 'STAFF',
        is_active: form.is_active !== false,
        is_staff: !!form.is_staff,
      };
      if (editId) await api.auth.update(editId, payload); else await api.auth.create(payload);
      setOpen(false);
      setEditId(null);
      setForm({});
      load();
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'Action failed');
    }
  };

  const doDelete = async (id) => {
    setError('');
    try {
      await api.auth.remove(id);
      load();
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'DELETE_FAILED');
    }
  };

  const openDuplicate = async (row) => {
    setError('');
    try {
      const data = await api.duplicateItem('/auth/users/', row.id);
      const src = data || row;
      setEditId(null);
      setForm({
        email: (src.email || '').replace(/@/, '+copy@'),
        full_name: (src.full_name ? src.full_name + ' Copy' : ''),
        role: src.role || 'STAFF',
        is_active: src.is_active !== false,
        is_staff: !!src.is_staff,
      });
      setOpen(true);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'DUPLICATE_FAILED');
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[var(--color-border)] pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--color-ink)]">Users</h2>
            <p className="text-sm text-[var(--color-ink-secondary)]">Administer user accounts, roles, and active status.</p>
          </div>
          <button onClick={openCreate} className="rounded-xl bg-[var(--color-apple-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition">New User</button>
        </div>
      </div>
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-medium">{error}</div>
      )}

      <Modal open={open} title={editId ? 'Edit User' : 'New User'} onClose={() => { setOpen(false); setEditId(null); setForm({}); }}>
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Email *</label>
            <input className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Full Name</label>
            <input className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm" value={form.full_name || ''} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Role</label>
              <select className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm" value={form.role || 'STAFF'} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="STAFF">Staff</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" id="user-active" checked={form.is_active !== false} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              <label htmlFor="user-active" className="text-xs font-semibold text-[var(--color-ink-secondary)]">Active</label>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="user-staff" checked={!!form.is_staff} onChange={(e) => setForm({ ...form, is_staff: e.target.checked })} />
            <label htmlFor="user-staff" className="text-xs font-semibold text-[var(--color-ink-secondary)]">Staff</label>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => { setOpen(false); setEditId(null); setForm({}); }} className="flex-1 rounded-xl border border-[var(--color-border)] p-3 text-sm font-semibold text-[var(--color-ink-secondary)] hover:bg-black/5 transition">Cancel</button>
            <button onClick={doSave} className="flex-1 rounded-xl bg-black p-3 text-sm font-semibold text-white hover:opacity-90 transition">Confirm</button>
          </div>
        </div>
      </Modal>

      <div className="rounded-2xl border border-[var(--color-border)] bg-white shadow-sm overflow-x-auto">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-black/[0.01]">
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">ID</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Email</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Full Name</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Role</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Active</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {(rows || []).map((r) => (
              <tr key={r.id} className="hover:bg-black/[0.01]">
                <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{r.id}</td>
                <td className="px-6 py-4 text-[var(--color-ink)]">{r.email}</td>
                <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.full_name || '—'}</td>
                <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.role || '—'}</td>
                <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.is_active ? 'YES' : 'NO'}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => openEdit(r)} className="font-semibold text-[var(--color-apple-blue)] hover:underline">Edit</button>
                    <button onClick={async () => { const src = await api.duplicateItem('/auth/users/', r.id).catch(() => r); setEditId(null); setForm({ email: (src.email || '').replace(/@/, '+copy@'), full_name: src.full_name ? src.full_name + ' Copy' : '', role: src.role || 'STAFF', is_active: src.is_active !== false, is_staff: !!src.is_staff }); setOpen(true); }} className="font-semibold text-[var(--color-ink)] hover:underline">Duplicate</button>
                    <button onClick={() => doDelete(r.id)} className="font-semibold text-red-600 hover:underline">Delete</button>
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
    </div>
  );
}
