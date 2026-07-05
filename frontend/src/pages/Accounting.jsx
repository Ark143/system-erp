import { useState, useEffect } from 'react';
import * as api from '../lib/api.js';
import Modal from '../components/Modal.jsx';

export default function Accounting() {
  const [tab, setTab] = useState('accounts');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});

  const load = async () => {
    setError('');
    try {
      if (tab === 'accounts') setRows(await api.accounting.accounts.list());
      else if (tab === 'entries') setRows(await api.accounting.journalEntries.list({ ordering: '-journal_date' }));
      else setRows(await api.accounting.trialBalance());
    } catch (e) { setError(e?.response?.data?.detail || 'LOAD_FAILED'); }
  };
  useEffect(() => { load(); }, [tab]);

  const doCreate = async () => {
    try {
      if (tab === 'accounts') await api.accounting.accounts.create(form);
      else if (tab === 'entries') await api.accounting.journalEntries.create({ ...form, status: 'DRAFT' });
      setOpen(false); setForm({}); load();
    } catch (e) { setError(e?.response?.data?.detail || e.message); }
  };

  const header = (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-ink)]">Accounting / Finance</h2>
        <p className="text-sm text-[var(--color-ink-secondary)]">Chart of accounts, journal entries, and balance reporting.</p>
      </div>
      <div className="flex gap-2">
        {['accounts','entries','trial-balance'].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${tab===t?'bg-black text-white':'bg-black/5 text-[var(--color-ink-secondary)] hover:bg-black/10'}`}>{t}</button>
        ))}
        {(tab==='accounts' || tab==='entries') && <button onClick={() => { setError(''); setForm({}); setOpen(true); }} className="rounded-xl bg-[var(--color-apple-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">New</button>}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {header}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <Modal open={open} title={`New ${tab.replace('-',' ')}`} onClose={() => setOpen(false)}>
        <div className="space-y-3">
          <input className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" placeholder="name / description / je_no" value={form.name||form.description||form.je_no||''} onChange={(e)=>setForm({...form,name:e.target.value, description:e.target.value, je_no:e.target.value})} />
          <button onClick={doCreate} className="w-full rounded-xl bg-black p-3 text-sm font-semibold text-white hover:opacity-90">Create</button>
        </div>
      </Modal>
      <div className="rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead><tr className="border-b border-[var(--color-border)]">
            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-secondary)]">ID</th>
            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-secondary)]">Name</th>
            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-secondary)]">Status</th>
            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-secondary)]">Updated</th>
          </tr></thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {(rows || []).slice(0, 20).map((r) => (
              <tr key={r.id} className="hover:bg-black/[0.02]">
                <td className="px-6 py-3 font-medium text-[var(--color-ink)]">{r.id}</td>
                <td className="px-6 py-3 text-[var(--color-ink)]">{r.name || r.je_no || '—'}</td>
                <td className="px-6 py-3 text-[var(--color-ink-secondary)]">{r.status || '—'}</td>
                <td className="px-6 py-3 text-[var(--color-ink-secondary)]">{String(r.updated_at || r.created_at || '').slice(0,10)}</td>
              </tr>
            ))}
            {!rows?.length && <tr><td colSpan="4" className="px-6 py-10 text-center text-[var(--color-ink-secondary)]">No records</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
