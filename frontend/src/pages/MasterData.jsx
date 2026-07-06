import { useState, useEffect } from 'react';
import * as api from '../lib/api.js';
import Modal from '../components/Modal.jsx';

export default function MasterData() {
  const [tab, setTab] = useState('customers');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);

  const load = async () => {
    setError('');
    try {
      if (tab === 'customers') setRows(await api.sales.customers.list());
      else if (tab === 'suppliers') setRows(await api.purchasing.suppliers.list());
      else if (tab === 'taxes') setRows(await api.masterdata.taxes.list());
      else if (tab === 'leads') setRows(await api.masterdata.leads.list());
      else if (tab === 'employees') setRows(await api.masterdata.employees.list());
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'LOAD_FAILED');
    }
  };

  useEffect(() => {
    load();
  }, [tab]);

  const openCreate = () => {
    setEditId(null);
    setForm({ is_active: true });
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditId(row.id);
    setForm({ ...row, is_active: row.is_active !== false });
    setOpen(true);
  };

  const openDuplicate = (row) => {
    setEditId(null);
    const base = {
      ...row,
      is_active: row.is_active !== false,
      id: undefined,
    };
    if (base.name) base.name = base.name + ' Copy';
    if (base.code && base.code) base.code = base.code + ' COPY';
    setForm(base);
    setOpen(true);
  };

  const doSave = async () => {
    setError('');
    try {
      if (tab === 'customers') {
        if (!form.code || !form.name) throw new Error('Customer Code and Name are required.');
        const payload = { code: form.code, name: form.name, email: form.email || '', phone: form.phone || '', address: form.address || '', is_active: form.is_active !== false };
        if (editId) await api.sales.customers.update(editId, payload); else await api.sales.customers.create(payload);
      } else if (tab === 'suppliers') {
        if (!form.code || !form.name) throw new Error('Supplier Code and Name are required.');
        const payload = { code: form.code, name: form.name, email: form.email || '', phone: form.phone || '', address: form.address || '', is_active: form.is_active !== false };
        if (editId) await api.purchasing.suppliers.update(editId, payload); else await api.purchasing.suppliers.create(payload);
      } else if (tab === 'taxes') {
        if (!form.tax_name) throw new Error('Tax name is required.');
        const payload = { tax_name: form.tax_name, tax_rate: parseFloat(form.tax_rate || 0), is_recoverable: !!form.is_recoverable };
        if (editId) await api.masterdata.taxes.update(editId, payload); else await api.masterdata.taxes.create(payload);
      } else if (tab === 'leads') {
        if (!form.lead_name) throw new Error('Lead name is required.');
        const payload = { lead_name: form.lead_name, email: form.email || '', phone: form.phone || '', status: form.status || 'NEW', notes: form.notes || '' };
        if (editId) await api.masterdata.leads.update(editId, payload); else await api.masterdata.leads.create(payload);
      } else if (tab === 'employees') {
        if (!form.full_name) throw new Error('Employee name is required.');
        const payload = { full_name: form.full_name, email: form.email || '', phone: form.phone || '', department: form.department || '', job_title: form.job_title || '', hire_date: form.hire_date || '' };
        if (editId) await api.masterdata.employees.update(editId, payload); else await api.masterdata.employees.create(payload);
      }
      setOpen(false);
      setEditId(null);
      setForm({});
      load();
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'Action failed');
    }
  };

  const doRemove = async (id) => {
    setError('');
    try {
      if (tab === 'customers') await api.sales.customers.remove(id);
      else if (tab === 'suppliers') await api.purchasing.suppliers.remove(id);
      else if (tab === 'taxes') await api.masterdata.taxes.remove(id);
      else if (tab === 'leads') await api.masterdata.leads.remove(id);
      else if (tab === 'employees') await api.masterdata.employees.remove(id);
      load();
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'DELETE_FAILED');
    }
  };

  const header = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--color-border)] pb-4">
      <div>
        <h2 className="text-xl font-bold text-[var(--color-ink)]">Master Data</h2>
        <p className="text-sm text-[var(--color-ink-secondary)]">Shared lead, employee, tax, customer, and supplier records.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {['customers', 'suppliers', 'taxes', 'leads', 'employees'].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${tab===t?'bg-black text-white':'bg-black/5 text-[var(--color-ink-secondary)] hover:bg-black/10'}`}>{t}</button>
        ))}
        <button onClick={openCreate} className="rounded-xl bg-[var(--color-apple-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition">New {tab.slice(0, -1)}</button>
      </div>
    </div>
  );

  const rowActions = (r) => (
    <td className="px-6 py-4">
      <div className="flex gap-2">
        <button onClick={() => openEdit(r)} className="font-semibold text-[var(--color-apple-blue)] hover:underline">Edit</button>
        <button onClick={() => openDuplicate(r)} className="font-semibold text-[var(--color-ink)] hover:underline">Duplicate</button>
        <button onClick={() => doRemove(r.id)} className="font-semibold text-red-600 hover:underline">Delete</button>
      </div>
    </td>
  );

  return (
    <div className="space-y-6">
      {header}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-medium">{error}</div>
      )}

      <Modal open={open} title={editId ? `Edit ${tab.slice(0, -1)}` : `New ${tab.slice(0, -1)}`} onClose={() => { setOpen(false); setEditId(null); }}>
        <div className="space-y-4 pt-2">
          {tab === 'customers' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Code *</label>
                  <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm" value={form.code || ''} onChange={(e) => setForm({ ...form, code: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Name *</label>
                  <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Email</label>
                  <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Phone</label>
                  <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Address</label>
                <textarea className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm h-20 resize-none" value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="master-cust-active" checked={form.is_active !== false} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                <label htmlFor="master-cust-active" className="text-xs font-semibold text-[var(--color-ink-secondary)]">Active</label>
              </div>
            </>
          )}

          {tab === 'suppliers' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Code *</label>
                  <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm" value={form.code || ''} onChange={(e) => setForm({ ...form, code: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Name *</label>
                  <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Email</label>
                  <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Phone</label>
                  <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="master-supp-active" checked={form.is_active !== false} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                <label htmlFor="master-supp-active" className="text-xs font-semibold text-[var(--color-ink-secondary)]">Active</label>
              </div>
            </>
          )}

          {tab === 'taxes' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Tax Name *</label>
                <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm" value={form.tax_name || ''} onChange={(e) => setForm({ ...form, tax_name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Rate</label>
                  <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm" value={form.tax_rate || ''} onChange={(e) => setForm({ ...form, tax_rate: e.target.value })} />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input type="checkbox" id="master-tax" checked={!!form.is_recoverable} onChange={(e) => setForm({ ...form, is_recoverable: e.target.checked })} />
                  <label htmlFor="master-tax" className="text-xs font-semibold text-[var(--color-ink-secondary)]">Recoverable</label>
                </div>
              </div>
            </>
          )}

          {tab === 'leads' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Lead Name *</label>
                <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm" value={form.lead_name || ''} onChange={(e) => setForm({ ...form, lead_name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Email</label>
                  <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Phone</label>
                  <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Status</label>
                <select className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm" value={form.status || 'NEW'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option>NEW</option>
                  <option>CONTACTED</option>
                  <option>QUALIFIED</option>
                  <option>LOST</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Notes</label>
                <textarea className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm h-20 resize-none" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </>
          )}

          {tab === 'employees' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Full Name *</label>
                <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm" value={form.full_name || ''} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Email</label>
                  <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Phone</label>
                  <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Department</label>
                  <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm" value={form.department || ''} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Job Title</label>
                  <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm" value={form.job_title || ''} onChange={(e) => setForm({ ...form, job_title: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Hire Date</label>
                <input type="date" className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm" value={form.hire_date || ''} onChange={(e) => setForm({ ...form, hire_date: e.target.value })} />
              </div>
            </>
          )}

          <div className="flex gap-2 pt-2">
            <button onClick={() => { setOpen(false); setEditId(null); }} className="flex-1 rounded-xl border border-[var(--color-border)] p-3 text-sm font-semibold text-[var(--color-ink-secondary)] hover:bg-black/5 transition">Cancel</button>
            <button onClick={doSave} className="flex-1 rounded-xl bg-black p-3 text-sm font-semibold text-white hover:opacity-90 transition">Confirm</button>
          </div>
        </div>
      </Modal>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-sm overflow-x-auto">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-black/[0.01]">
              {tab === 'customers' && (<>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Code</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Name</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Email</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Phone</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Actions</th>
              </>)}
              {tab === 'suppliers' && (<>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Code</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Name</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Email</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Phone</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Actions</th>
              </>)}
              {tab === 'taxes' && (<>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Tax</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Rate</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Recoverable</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Actions</th>
              </>)}
              {tab === 'leads' && (<>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Name</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Email</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Status</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Actions</th>
              </>)}
              {tab === 'employees' && (<>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Name</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Email</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Department</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Title</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Actions</th>
              </>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {(rows || []).map((r) => (
              <tr key={r.id} className="hover:bg-black/[0.01]">
                {tab === 'customers' && (<>
                  <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{r.code}</td>
                  <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{r.name}</td>
                  <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.email || '—'}</td>
                  <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.phone || '—'}</td>
                  {rowActions(r)}
                </>)}
                {tab === 'suppliers' && (<>
                  <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{r.code}</td>
                  <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{r.name}</td>
                  <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.email || '—'}</td>
                  <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.phone || '—'}</td>
                  {rowActions(r)}
                </>)}
                {tab === 'taxes' && (<>
                  <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{r.tax_name || r.name}</td>
                  <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.tax_rate}%</td>
                  <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.is_recoverable ? 'YES' : 'NO'}</td>
                  {rowActions(r)}
                </>)}
                {tab === 'leads' && (<>
                  <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{r.lead_name || r.name}</td>
                  <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.email || '—'}</td>
                  <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.status || '—'}</td>
                  {rowActions(r)}
                </>)}
                {tab === 'employees' && (<>
                  <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{r.full_name || r.name}</td>
                  <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.email || '—'}</td>
                  <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.department || '—'}</td>
                  <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.job_title || '—'}</td>
                  {rowActions(r)}
                </>)}
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
