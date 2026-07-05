import { useState, useEffect } from 'react';
import * as api from '../lib/api.js';
import Modal from '../components/Modal.jsx';

export default function Sales() {
  const [tab, setTab] = useState('orders');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});

  const load = async () => {
    setError('');
    try {
      if (tab === 'orders') setRows(await api.sales.orders.list({ ordering: '-created_at' }));
      else if (tab === 'customers') setRows(await api.sales.customers.list());
      else setRows(await api.sales.invoices.list());
    } catch (e) { setError(e?.response?.data?.detail || 'LOAD_FAILED'); }
  };
  useEffect(() => { load(); }, [tab]);

  const doCreate = async () => {
    try {
      if (tab === 'orders') await api.sales.orders.create({ ...form, status: 'DRAFT' });
      else if (tab === 'customers') await api.sales.customers.create(form);
      else throw new Error('READ_ONLY');
      setOpen(false); setForm({}); load();
    } catch (e) { setError(e?.response?.data?.detail || e.message); }
  };

  const submit = async (id) => { setError(''); try { await api.sales.orders.submit(id); load(); } catch (e) { setError(e?.response?.data?.detail || 'ACTION_FAILED'); } };
  const approve = async (id) => { setError(''); try { await api.sales.orders.approve(id); load(); } catch (e) { setError(e?.response?.data?.detail || 'ACTION_FAILED'); } };
  const reject = async (id) => { setError(''); try { await api.sales.orders.reject(id); load(); } catch (e) { setError(e?.response?.data?.detail || 'ACTION_FAILED'); } };

  const header = (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-ink)]">Sales / O2C</h2>
        <p className="text-sm text-[var(--color-ink-secondary)]">Customers, orders, and invoices.</p>
      </div>
      <div className="flex gap-2">
        {['orders','customers','invoices'].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${tab===t?'bg-black text-white':'bg-black/5 text-[var(--color-ink-secondary)] hover:bg-black/10'}`}>{t}</button>
        ))}
        <button onClick={() => { setError(''); setForm({}); setOpen(true); }} className="rounded-xl bg-[var(--color-apple-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">New</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {header}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <Modal open={open} title={`New ${tab.replace('-',' ')}`} onClose={() => setOpen(false)}>
        <div className="space-y-3">
          <input className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" placeholder="name / order_no / customer name" value={form.name||form.order_no||''} onChange={(e)=>setForm({...form,name:e.target.value, order_no:e.target.value})} />
          <button onClick={doCreate} className="w-full rounded-xl bg-black p-3 text-sm font-semibold text-white hover:opacity-90">Create</button>
        </div>
      </Modal>
      <div className="rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead><tr className="border-b border-[var(--color-border)]">
            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-secondary)]">ID</th>
            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-secondary)]">Name</th>
            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-secondary)]">Status</th>
            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-secondary)]">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {(rows || []).slice(0, 20).map((r) => (
              <tr key={r.id} className="hover:bg-black/[0.02]">
                <td className="px-6 py-3 font-medium text-[var(--color-ink)]">{r.id}</td>
                <td className="px-6 py-3 text-[var(--color-ink)]">{r.name || r.order_no || r.invoice_no || '—'}</td>
                <td className="px-6 py-3 text-[var(--color-ink-secondary)]">{r.status || '—'}</td>
                <td className="px-6 py-3">
                  {tab==='orders' && <div className="flex gap-2">
                    <button onClick={() => submit(r.id)} className="rounded-lg bg-black/5 px-3 py-1 text-xs font-semibold hover:bg-black/10">Submit</button>
                    <button onClick={() => approve(r.id)} className="rounded-lg bg-emerald-600/90 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700">Approve</button>
                    <button onClick={() => reject(r.id)} className="rounded-lg bg-red-600/90 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700">Reject</button>
                  </div>}
                </td>
              </tr>
            ))}
            {!rows?.length && <tr><td colSpan="4" className="px-6 py-10 text-center text-[var(--color-ink-secondary)]">No records</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
