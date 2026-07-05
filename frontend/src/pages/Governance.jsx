import { useState, useEffect } from 'react';
import { governance } from '../lib/api.js';
import Modal from '../components/Modal.jsx';

const TABS = [
  { key: 'companies', label: 'Companies' },
  { key: 'branches', label: 'Branches' },
  { key: 'warehouses', label: 'Warehouses' },
  { key: 'item-categories', label: 'Item Categories' },
];

export default function Governance() {
  const [tab, setTab] = useState('companies');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await governance[tab].list({});
      setRecords(Array.isArray(res) ? res : []);
    } catch (e) {
      setRecords([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [tab]);

  const titleMap = {
    companies: 'company_name',
    branches: 'branch_name',
    warehouses: 'warehouse_name',
    'item-categories': 'category_name',
  };
  const titleField = titleMap[tab] || 'name';

  const openCreate = () => {
    setEditId(null);
    setForm({});
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditId(row.id ?? row.pk ?? row[nameKey(tab)]);
    setForm(row);
    setOpen(true);
  };

  const nameKey = (t) => (t === 'companies' ? 'company_id' : t === 'branches' ? 'branch_id' : t === 'warehouses' ? 'warehouse_id' : 'category_id');

  const remove = async (id) => {
    await governance[tab].remove(id);
    load();
  };

  const save = async () => {
    const idField = nameKey(tab);
    const payload = { ...form };
    if (!payload[idField]) delete payload[idField];
    if (editId) await governance[tab].update(editId, payload);
    else await governance[tab].create(payload);
    setOpen(false);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[var(--color-ink)]">Governance</h2>
        <button onClick={openCreate} className="rounded-lg bg-[var(--color-apple-blue)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--color-apple-blue-hover)]">New Record</button>
      </div>
      <div className="flex gap-2 border-b border-[var(--color-border)]">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 pb-3 text-sm font-semibold transition ${tab === t.key ? 'border-b-2 border-[var(--color-apple-blue)] text-[var(--color-ink)]' : 'text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]'}`}>{t.label}</button>
        ))}
      </div>
      {loading ? (
        <div className="p-6 text-sm text-[var(--color-ink-secondary)]">Loading...</div>
      ) : records.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] p-10 text-center text-sm text-[var(--color-ink-secondary)]">No records found</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-black/[0.02] text-[var(--color-ink-secondary)]">
              <tr>
                <th className="px-4 py-3 font-medium">{titleField.toUpperCase()}</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {records.map((row) => (
                <tr key={row.id ?? row.pk}>
                  <td className="px-4 py-3 font-medium text-[var(--color-ink)]">{row[titleField]}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => openEdit(row)} className="font-semibold text-[var(--color-apple-blue)] hover:underline">Edit</button>
                      <button onClick={() => remove(row.id ?? row.pk)} className="font-semibold text-red-600 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title={editId ? 'Edit' : 'Create'}>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{titleField}</label>
            <input className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form[titleField] || ''} onChange={(e) => setForm({ ...form, [titleField]: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setOpen(false)} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-ink-secondary)] hover:bg-black/5">Cancel</button>
            <button onClick={save} className="rounded-lg bg-[var(--color-apple-blue)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-apple-blue-hover)]">Save</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
