import { useState, useEffect } from 'react';
import * as api from '../lib/api.js';
import Modal from '../components/Modal.jsx';

export default function Purchasing() {
  const [tab, setTab] = useState('prs');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});

  const load = async () => {
    setError('');
    try {
      if (tab === 'suppliers') setRows(await api.purchasing.suppliers.list());
      else if (tab === 'prs') setRows(await api.purchasing.prs.list({ ordering: '-created_at' }));
      else setRows(await api.purchasing.pos.list({ ordering: '-created_at' }));
    } catch (e) { setError(e?.response?.data?.detail || 'LOAD_FAILED'); }
  };
  useEffect(() => { load(); }, [tab]);

  const doCreate = async () => {
    try {
      if (tab === 'suppliers') await api.purchasing.suppliers.create(form);
      else if (tab === 'prs') await api.purchasing.prs.create({ ...form, status: 'DRAFT' });
      else if (tab === 'pos') await api.purchasing.pos.create({ ...form, status: 'DRAFT' });
      setOpen(false); setForm({}); load();
    } catch (e) { setError(e?.response?.data?.detail || e.message); }
  };

  const submit = async (id) => { setError(''); try { await (tab==='prs'?api.purchasing.prs.submit(id):api.purchasing.pos.submit(id)); load(); } catch (e) { setError('ACTION_FAILED');} };
  const approve = async (id) => { setError(''); try { await (tab==='prs'?api.purchasing.prs.approve(id):api.purchasing.pos.approve(id)); load(); } catch (e) { setError('ACTION_FAILED');} };
  const reject = async (id) => { setError(''); try { await (tab==='prs'?api.purchasing.prs.reject(id):api.purchasing.pos.reject(id)); load(); } catch (e) { setError('ACTION_FAILED');} };

  const header = (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-ink)]">Purchasing / P2P</h2>
        <p className="text-sm text-[var(--color-ink-secondary)]">Suppliers, PRs, and POs.</p>
      </div>
      <div className="flex gap-2">
        {['suppliers','prs','pos'].map((t) => (
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
          <input className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" placeholder="name / no" value={form.name||form.pr_no||form.po_no||''} onChange={(e)=>setForm({...form,name:e.target.value, pr_no:e.target.value, po_no:e.target.value})} />
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
                <td className="px-6 py-3 text-[var(--color-ink)]">{r.name || r.pr_no || r.po_no || '—'}</td>
                <td className="px-6 py-3 text-[var(--color-ink-secondary)]">{r.status || '—'}</td>
                <td className="px-6 py-3">
                  {(tab==='prs' || tab==='pos') && <div className="flex gap-2">
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
