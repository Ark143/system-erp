import { useState, useEffect } from 'react';
import * as api from '../lib/api.js';
import Modal from '../components/Modal.jsx';

export default function Accounting() {
  const [tab, setTab] = useState('journal-entries');
  const [rows, setRows] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);

  const load = async () => {
    setError('');
    try {
      if (tab === 'journal-entries') {
        const params = {};
        if (statusFilter) params.status = statusFilter;
        setRows(await api.accounting.journalEntries.list(params));
      } else if (tab === 'accounts') {
        setRows(await api.accounting.accounts.list());
      } else if (tab === 'trial-balance') {
        const data = await api.accounting.trialBalance();
        setRows(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'LOAD_FAILED');
    }
  };

  const loadDeps = async () => {
    try {
      setAccounts(await api.accounting.accounts.list());
      setCustomers(await api.sales.customers.list());
    } catch (e) {
      console.error('Failed to load dependencies', e);
    }
  };

  useEffect(() => {
    load();
    loadDeps();
  }, [tab]);

  const openCreate = () => {
    setEditId(null);
    setForm({ status: 'DRAFT', journal_date: new Date().toISOString().slice(0, 10) });
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditId(row.id);
    setForm({ ...row });
    setOpen(true);
  };

  const doSave = async () => {
    setError('');
    try {
      if (tab === 'accounts') {
        if (!form.code || !form.name) {
          throw new Error('Account Code and Name are required.');
        }
        const payload = {
          code: form.code,
          name: form.name,
          account_type: form.account_type || '',
          parent: form.parent || null,
          is_active: form.is_active !== false,
        };
        if (editId) await api.accounting.accounts.update(editId, payload);
        else await api.accounting.accounts.create(payload);
      } else if (tab === 'journal-entries') {
        if (!form.je_no || !form.journal_date) {
          throw new Error('Journal Entry No and Date are required.');
        }
        const payload = {
          je_no: form.je_no,
          journal_date: form.journal_date,
          description: form.description || '',
          status: 'DRAFT',
          total_debit: parseFloat(form.total_debit || 0),
          total_credit: parseFloat(form.total_credit || 0),
        };
        if (editId) await api.accounting.journalEntries.update(editId, payload);
        else await api.accounting.journalEntries.create(payload);
      }
      setOpen(false);
      setEditId(null);
      setForm({});
      load();
      loadDeps();
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'Action failed');
    }
  };

  const doRemove = async (id) => {
    setError('');
    try {
      if (tab === 'accounts') await api.accounting.accounts.remove(id);
      load();
      loadDeps();
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'DELETE_FAILED');
    }
  };

  const header = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--color-border)] pb-4">
      <div>
        <h2 className="text-xl font-bold text-[var(--color-ink)]">Accounting</h2>
        <p className="text-sm text-[var(--color-ink-secondary)]">Journals, accounts, and financial reporting.</p>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        {['journal-entries', 'accounts', 'trial-balance'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === t ? 'bg-black text-white' : 'bg-black/5 text-[var(--color-ink-secondary)] hover:bg-black/10'
            }`}
          >
            {t.replace('-', ' ')}
          </button>
        ))}
        {tab !== 'trial-balance' && (
          <button
            onClick={openCreate}
            className="rounded-xl bg-[var(--color-apple-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition"
          >
            New {tab === 'accounts' ? 'Account' : 'Journal Entry'}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {header}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-medium">
          {error}
        </div>
      )}

      <Modal open={open} title={editId ? `Edit ${tab}` : `Create ${tab}`} onClose={() => { setOpen(false); setEditId(null); }}>
        <div className="space-y-4 pt-2">
          {tab === 'accounts' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Account Code *</label>
                  <input
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                    placeholder="e.g. 5000"
                    value={form.code || ''}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Account Name *</label>
                  <input
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                    placeholder="e.g. Sales Revenue"
                    value={form.name || ''}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Account Type</label>
                <input
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                  placeholder="e.g. Revenue / Expense / Asset"
                  value={form.account_type || ''}
                  onChange={(e) => setForm({ ...form, account_type: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="account-active"
                  checked={form.is_active !== false}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="rounded border-[var(--color-border)]"
                />
                <label htmlFor="account-active" className="text-xs font-semibold text-[var(--color-ink-secondary)]">Active Status</label>
              </div>
            </>
          )}

          {tab === 'journal-entries' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">JE No *</label>
                  <input
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                    placeholder="e.g. JE-0001"
                    value={form.je_no || ''}
                    onChange={(e) => setForm({ ...form, je_no: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Date *</label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                    value={form.journal_date || ''}
                    onChange={(e) => setForm({ ...form, journal_date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Description</label>
                <textarea
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)] h-20 resize-none"
                  placeholder="Entry description"
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => { setOpen(false); setEditId(null); }}
              className="flex-1 rounded-xl border border-[var(--color-border)] p-3 text-sm font-semibold text-[var(--color-ink-secondary)] hover:bg-black/5 transition"
            >
              Cancel
            </button>
            <button
              onClick={doSave}
              className="flex-1 rounded-xl bg-black p-3 text-sm font-semibold text-white hover:opacity-90 transition"
            >
              Confirm
            </button>
          </div>
        </div>
      </Modal>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-sm overflow-x-auto">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-black/[0.01]">
              {tab === 'accounts' && (
                <>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Code</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Name</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Type</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Actions</th>
                </>
              )}
              {tab === 'journal-entries' && (
                <>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">JE No</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Date</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Description</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Status</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Actions</th>
                </>
              )}
              {tab === 'trial-balance' && (
                <>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Account</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Debit</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Credit</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {(rows || []).slice(0, 50).map((r) => (
              <tr key={r.id} className="hover:bg-black/[0.01]">
                {tab === 'accounts' && (
                  <>
                    <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{r.code}</td>
                    <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{r.name}</td>
                    <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.account_type || '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(r)} className="font-semibold text-[var(--color-apple-blue)] hover:underline">Edit</button>
                        <button onClick={() => doRemove(r.id)} className="font-semibold text-red-600 hover:underline">Delete</button>
                      </div>
                    </td>
                  </>
                )}
                {tab === 'journal-entries' && (
                  <>
                    <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{r.je_no}</td>
                    <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.journal_date}</td>
                    <td className="px-6 py-4 text-[var(--color-ink-secondary)] truncate max-w-xs">{r.description || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${r.status === 'POSTED' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' : 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(r)} className="font-semibold text-[var(--color-apple-blue)] hover:underline">Edit</button>
                        <button onClick={async () => { await api.accounting.journalEntries.remove(r.id); load(); }} className="font-semibold text-red-600 hover:underline">Delete</button>
                      </div>
                    </td>
                  </>
                )}
                {tab === 'trial-balance' && (
                  <>
                    <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{r.account_name || r.account}</td>
                    <td className="px-6 py-4 text-[var(--color-ink-secondary)]">${parseFloat(r.debit || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-[var(--color-ink-secondary)]">${parseFloat(r.credit || 0).toFixed(2)}</td>
                  </>
                )}
              </tr>
            ))}
            {!rows?.length && (
              <tr>
                <td colSpan="10" className="px-6 py-12 text-center text-[var(--color-ink-secondary)] font-medium">
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
