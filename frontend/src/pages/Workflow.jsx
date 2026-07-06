import { useState, useEffect } from 'react';
import * as api from '../lib/api.js';
import Modal from '../components/Modal.jsx';

export default function Workflow() {
  const [tab, setTab] = useState('workflows');
  const [rows, setRows] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);
  const [decision, setDecision] = useState('APPROVED');
  const [notes, setNotes] = useState('');

  const load = async () => {
    setError('');
    try {
      if (tab === 'workflows') {
        setRows(await api.workflow.list());
      } else if (tab === 'steps') {
        setRows(await api.workflow.list());
      } else if (tab === 'approvals') {
        setRows(await api.workflow.approvals.list());
      }
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'LOAD_FAILED');
    }
  };

  const loadDeps = async () => {
    try {
      const wf = await api.workflow.list();
      setWorkflows(wf);
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
    setForm({ is_active: true });
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditId(row.id);
    setForm({ ...row, is_active: row.is_active !== false });
    setOpen(true);
  };

  const openDecide = (row) => {
    if (row.status !== 'PENDING') return;
    setEditId(row.id);
    setDecision('APPROVED');
    setNotes('');
    setOpen(true);
  };

  const saveWorkflow = async () => {
    if (!form.name || !form.entity_type) {
      throw new Error('Workflow Name and Entity Type are required.');
    }
    const payload = {
      name: form.name,
      entity_type: form.entity_type,
      active_version: parseInt(form.active_version || 1),
      is_active: form.is_active !== false,
    };
    if (editId) await api.workflow.update(editId, payload);
    else await api.workflow.create(payload);
  };

  const doSave = async () => {
    setError('');
    try {
      if (tab === 'workflows') {
        await saveWorkflow();
      } else if (tab === 'approvals') {
        await saveWorkflow();
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
      await api.workflow.remove(id);
      load();
      loadDeps();
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'DELETE_FAILED');
    }
  };

  const submitDecision = async () => {
    setError('');
    try {
      await api.workflow.approvals.decide(editId, { status: decision, notes });
      setOpen(false);
      setEditId(null);
      setDecision('APPROVED');
      setNotes('');
      load();
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'ACTION_FAILED');
    }
  };

  const header = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--color-border)] pb-4">
      <div>
        <h2 className="text-xl font-bold text-[var(--color-ink)]">Workflows & Approvals</h2>
        <p className="text-sm text-[var(--color-ink-secondary)]">Create workflows and handle approval decisions.</p>
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

      <Modal
        open={open}
        title={editId ? (tab === 'approvals' ? 'Decision' : 'Edit Workflow') : 'Create Workflow'}
        onClose={() => { setOpen(false); setEditId(null); setDecision('APPROVED'); setNotes(''); }}
      >
        <div className="space-y-4 pt-2">
          {tab !== 'approvals' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Workflow Name *</label>
                <input
                  className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                  placeholder="e.g. Purchase Approval"
                  value={form.name || ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Entity Type *</label>
                <input
                  className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                  placeholder="e.g. PurchaseOrder"
                  value={form.entity_type || ''}
                  onChange={(e) => setForm({ ...form, entity_type: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Active Version</label>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                    value={form.active_version || 1}
                    onChange={(e) => setForm({ ...form, active_version: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="wf-active"
                    checked={form.is_active !== false}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="rounded border-[var(--color-border)]"
                  />
                  <label htmlFor="wf-active" className="text-xs font-semibold text-[var(--color-ink-secondary)]">Active Workflow</label>
                </div>
              </div>
            </>
          )}

          {tab === 'approvals' && editId && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Decision *</label>
                <select
                  className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                >
                  <option value="APPROVED">Approve</option>
                  <option value="REJECTED">Reject</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Notes</label>
                <textarea
                  className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)] h-20 resize-none"
                  placeholder="Optional remarks..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => { setOpen(false); setEditId(null); setDecision('APPROVED'); setNotes(''); }}
              className="flex-1 rounded-xl border border-[var(--color-border)] p-3 text-sm font-semibold text-[var(--color-ink-secondary)] hover:bg-black/5 transition"
            >
              Cancel
            </button>
            {tab === 'approvals' && editId ? (
              <button onClick={submitDecision} className="flex-1 rounded-xl bg-black p-3 text-sm font-semibold text-white hover:opacity-90 transition">
                Submit Decision
              </button>
            ) : (
              <button onClick={doSave} className="flex-1 rounded-xl bg-black p-3 text-sm font-semibold text-white hover:opacity-90 transition">
                Confirm
              </button>
            )}
          </div>
        </div>
      </Modal>

      <div className="rounded-2xl border border-[var(--color-border)] bg-white shadow-sm overflow-x-auto">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-black/[0.01]">
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Name</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Entity</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Status</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {(rows || []).slice(0, 50).map((r) => (
              <tr key={r.id} className="hover:bg-black/[0.01]">
                <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{r.name}</td>
                <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.entity_type}</td>
                <td className="px-6 py-4 text-[var(--color-ink-secondary)]">
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${r.is_active ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' : 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20'}`}>
                    {r.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => openEdit(r)} className="rounded-lg bg-black/5 px-3 py-1.5 text-xs font-semibold hover:bg-black/10 transition">Edit</button>
                    <button onClick={() => doRemove(r.id)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition">Delete</button>
                  </div>
                </td>
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
