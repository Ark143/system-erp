import { useState, useEffect } from 'react';
import * as api from '../lib/api.js';
import { useExport } from '../lib/reportExport.js';
import Modal from '../components/Modal.jsx';

const COLUMNS = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'address', label: 'Address' },
  { key: 'branch', label: 'Branch' },
  { key: 'parent_name', label: 'Parent Warehouse' },
  { key: 'cost_center', label: 'Cost Center' },
  { key: 'profit_center', label: 'Profit Center' },
  { key: 'gl_account', label: 'GL Account' },
  { key: 'status', label: 'Status' },
  { key: 'warehouse_type', label: 'Type' },
  { key: 'contact_person', label: 'Contact' },
  { key: 'phone', label: 'Phone' },
  { key: 'is_active', label: 'Active' },
];

const WAREHOUSE_TYPES = [
  'MAIN', 'BRANCH', 'SUB', 'VIRTUAL'
];

export default function InventoryWarehouses() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    code: '', name: '', address: '', warehouse_type: 'MAIN', branch: '', parent: '', cost_center: '', profit_center: '', gl_account: '', contact_person: '', email: '', phone: '', status: 'ACTIVE', is_active: true
  });
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const exportApi = useExport({ api, endpoint: '/inventory/warehouses/', defaultColumns: COLUMNS });

  const load = async () => {
    setError('');
    try {
      const data = await api.inventory.warehouses.list(q ? { search: q } : {});
      const items = Array.isArray(data) ? data : [];
      setRows(items.map((r) => ({
        ...r,
        parent_name: typeof r.parent === 'object' ? r.parent?.name : r.parent || ''
      })));
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'LOAD_FAILED');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditId(null);
    setForm({
      code:'',name:'',address:'',warehouse_type:'MAIN',branch:'',parent:'',cost_center:'',profit_center:'',gl_account:'',contact_person:'',email:'',phone:'',status:'ACTIVE',is_active:true
    });
    setOpen(true);
  };

  const openDuplicate = (row) => {
    setEditId(null);
    setForm({
      code: row.code ? row.code + ' COPY' : '',
      name: row.name ? row.name + ' Copy' : '',
      address: row.address || '',
      warehouse_type: row.warehouse_type || 'MAIN',
      branch: row.branch || '',
      parent: typeof row.parent === 'object' ? row.parent?.id || '' : row.parent || '',
      cost_center: row.cost_center || '',
      profit_center: row.profit_center || '',
      gl_account: row.gl_account || '',
      contact_person: row.contact_person || '',
      email: row.email || '',
      phone: row.phone || '',
      status: row.status || 'ACTIVE',
      is_active: row.is_active !== false,
    });
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditId(row.id);
    setForm({
      code: row.code || '',
      name: row.name || '',
      address: row.address || '',
      warehouse_type: row.warehouse_type || 'MAIN',
      branch: row.branch || '',
      parent: typeof row.parent === 'object' ? row.parent?.id || '' : row.parent || '',
      cost_center: row.cost_center || '',
      profit_center: row.profit_center || '',
      gl_account: row.gl_account || '',
      contact_person: row.contact_person || '',
      email: row.email || '',
      phone: row.phone || '',
      status: row.status || 'ACTIVE',
      is_active: row.is_active !== false,
    });
    setOpen(true);
  };

  const doSave = async () => {
    setError('');
    try {
      if (!form.code.trim() || !form.name.trim()) throw new Error('Code and Name are required.');
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        address: form.address || '',
        warehouse_type: form.warehouse_type,
        branch: form.branch || '',
        parent: form.parent || '',
        cost_center: form.cost_center || '',
        profit_center: form.profit_center || '',
        gl_account: form.gl_account || '',
        contact_person: form.contact_person || '',
        email: form.email || '',
        phone: form.phone || '',
        status: form.status,
        is_active: !!form.is_active,
      };
      const clean = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== '' && v !== null && v !== undefined));
      if (form.parent === '' || form.parent === null || form.parent === undefined) clean.parent = null; else clean.parent = Number(form.parent);
      if (editId) await api.inventory.warehouses.update(editId, clean);
      else await api.inventory.warehouses.create(clean);
      setOpen(false);
      setEditId(null);
      load();
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'Action failed');
    }
  };

  const doRemove = async (id) => {
    setError('');
    try {
      await api.inventory.warehouses.remove(id);
      load();
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'DELETE_FAILED');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--color-border)] pb-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-ink)]">Warehouses</h2>
          <p className="text-sm text-[var(--color-ink-secondary)]">List and manage warehouses with GL/cost/profit centers and branch mapping.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder="Search warehouses..."
            className="w-56 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
          />
          <button onClick={load} className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--color-muted)] transition">Search</button>
          <button onClick={openCreate} className="rounded-xl bg-[var(--color-apple-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition">New Warehouse</button>
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
                <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{r.code}</td>
                <td className="px-6 py-4 text-[var(--color-ink)]">{r.name}</td>
                <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.address || '—'}</td>
                <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.branch || '—'}</td>
                <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.parent_name || '—'}</td>
                <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.cost_center || '—'}</td>
                <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.profit_center || '—'}</td>
                <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.gl_account || '—'}</td>
                <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.status}</td>
                <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.warehouse_type}</td>
                <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.contact_person || '—'}</td>
                <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.phone || '—'}</td>
                <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.is_active !== false ? 'Yes' : 'No'}</td>
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
                <td colSpan="14" className="px-6 py-12 text-center text-[var(--color-ink-secondary)] font-medium">No records found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={open} title={editId ? 'Edit Warehouse' : 'New Warehouse'} onClose={() => { setOpen(false); setEditId(null); }}>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Code *</label>
              <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Name *</label>
              <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Warehouse Type</label>
              <select className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.warehouse_type} onChange={(e) => setForm({ ...form, warehouse_type: e.target.value })}>
                {WAREHOUSE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Branch</label>
              <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Address</label>
            <textarea className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)] h-20 resize-none" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Parent Warehouse</label>
              <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.parent} onChange={(e) => setForm({ ...form, parent: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Contact Person</label>
              <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Email</label>
              <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Phone</label>
              <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Cost Center</label>
              <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.cost_center} onChange={(e) => setForm({ ...form, cost_center: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Profit Center</label>
              <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.profit_center} onChange={(e) => setForm({ ...form, profit_center: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Warehouse GL Account</label>
            <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.gl_account} onChange={(e) => setForm({ ...form, gl_account: e.target.value })} />
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
