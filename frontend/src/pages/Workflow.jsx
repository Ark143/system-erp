import { useState, useEffect } from 'react';
import * as api from '../lib/api.js';
import Modal from '../components/Modal.jsx';

export default function Workflow() {
  const [tab, setTab] = useState('workflows');
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [steps, setSteps] = useState([{ name: 'Step 1', order: 1, approver_role: 'MANAGER', approver_user: '', is_required: true }]);
  const [decisionNotes, setDecisionNotes] = useState({});

  const load = async () => {
    setError('');
    try {
      if (tab === 'workflows') {
        setRows(await api.workflow.list());
      } else {
        setRows(await api.workflow.approvals.list());
      }
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'LOAD_FAILED');
    }
  };

  const loadDeps = async () => {
    try {
      setUsers(await api.auth.list());
    } catch (e) {
      console.error('Failed to load users list', e);
    }
  };

  useEffect(() => {
    load();
    loadDeps();
  }, [tab]);

  const addStep = () => {
    const nextOrder = steps.length + 1;
    setSteps([...steps, { name: `Step ${nextOrder}`, order: nextOrder, approver_role: 'MANAGER', approver_user: '', is_required: true }]);
  };

  const removeStep = (idx) => {
    const filtered = steps.filter((_, i) => i !== idx);
    // Re-index order field
    const reindexed = filtered.map((step, i) => ({ ...step, order: i + 1 }));
    setSteps(reindexed);
  };

  const updateStep = (idx, field, value) => {
    const updated = [...steps];
    updated[idx][field] = value;
    setSteps(updated);
  };

  const doCreate = async () => {
    setError('');
    try {
      if (tab === 'workflows') {
        if (!form.name || !form.entity_type) {
          throw new Error('Workflow name and entity type are required.');
        }
        if (steps.length === 0) {
          throw new Error('Please add at least one workflow step.');
        }

        const payload = {
          name: form.name,
          entity_type: form.entity_type,
          is_active: form.is_active !== false,
          steps: steps.map((s) => ({
            name: s.name,
            order: parseInt(s.order),
            approver_role: s.approver_role || '',
            approver_user: s.approver_user ? parseInt(s.approver_user) : null,
            is_required: s.is_required !== false
          }))
        };

        await api.workflow.create(payload);
      }
      setOpen(false);
      setForm({});
      setSteps([{ name: 'Step 1', order: 1, approver_role: 'MANAGER', approver_user: '', is_required: true }]);
      load();
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'Action failed');
    }
  };

  const decide = async (id, statusValue) => {
    setError('');
    const notes = decisionNotes[id] || '';
    try {
      await api.workflow.approvals.decide(id, { status: statusValue, notes });
      setDecisionNotes({ ...decisionNotes, [id]: '' });
      load();
    } catch (e) {
      setError(e?.response?.data?.detail || 'ACTION_FAILED');
    }
  };

  const header = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--color-border)] pb-4">
      <div>
        <h2 className="text-xl font-bold text-[var(--color-ink)]">Workflow & Approvals</h2>
        <p className="text-sm text-[var(--color-ink-secondary)]">Configure document approval routing and process pending reviews.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {['workflows', 'approvals'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === t
                ? 'bg-black text-white'
                : 'bg-black/5 text-[var(--color-ink-secondary)] hover:bg-black/10'
            }`}
          >
            {t}
          </button>
        ))}
        {tab === 'workflows' && (
          <button
            onClick={() => {
              setError('');
              setForm({ is_active: true, entity_type: 'SalesOrder' });
              setSteps([{ name: 'Step 1', order: 1, approver_role: 'MANAGER', approver_user: '', is_required: true }]);
              setOpen(true);
            }}
            className="rounded-xl bg-[var(--color-apple-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition"
          >
            New Workflow
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

      {/* Modal Form */}
      <Modal open={open} title="Create New Approval Workflow" onClose={() => setOpen(false)}>
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Workflow Name *</label>
            <input
              className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
              placeholder="e.g. Sales Order Approval"
              value={form.name || ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Document Type *</label>
              <select
                className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                value={form.entity_type || 'SalesOrder'}
                onChange={(e) => setForm({ ...form, entity_type: e.target.value })}
              >
                <option value="SalesOrder">Sales Order (SO)</option>
                <option value="PurchaseOrder">Purchase Order (PO)</option>
                <option value="PurchaseRequisition">Purchase Requisition (PR)</option>
              </select>
            </div>
            <div className="flex items-end pb-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-[var(--color-ink-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active !== false}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="rounded border-[var(--color-border)]"
                />
                Active Configuration
              </label>
            </div>
          </div>

          {/* Workflow Steps Section */}
          <div className="border-t border-[var(--color-border)] pt-3">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]">Approval Routing Steps</h4>
              <button onClick={addStep} className="text-xs font-semibold text-[var(--color-apple-blue)] hover:underline">+ Add Step</button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {steps.map((step, idx) => (
                <div key={idx} className="flex gap-2 items-end border border-black/5 p-2 rounded-xl bg-black/[0.01]">
                  <div className="w-12">
                    <label className="block text-[10px] font-bold text-[var(--color-ink-secondary)] mb-1">Order</label>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-[var(--color-border)] bg-white p-2 text-xs outline-none focus:border-[var(--color-apple-blue)] text-center"
                      value={step.order}
                      onChange={(e) => updateStep(idx, 'order', e.target.value)}
                      disabled
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-[var(--color-ink-secondary)] mb-1">Step Name</label>
                    <input
                      className="w-full rounded-lg border border-[var(--color-border)] bg-white p-2 text-xs outline-none focus:border-[var(--color-apple-blue)]"
                      placeholder="e.g. Dept Head Review"
                      value={step.name}
                      onChange={(e) => updateStep(idx, 'name', e.target.value)}
                    />
                  </div>
                  <div className="w-28">
                    <label className="block text-[10px] font-bold text-[var(--color-ink-secondary)] mb-1">Approver Role</label>
                    <select
                      className="w-full rounded-lg border border-[var(--color-border)] bg-white p-2 text-xs outline-none focus:border-[var(--color-apple-blue)]"
                      value={step.approver_role}
                      onChange={(e) => updateStep(idx, 'approver_role', e.target.value)}
                    >
                      <option value="MANAGER">Manager</option>
                      <option value="ADMIN">Admin</option>
                      <option value="STAFF">Staff</option>
                    </select>
                  </div>
                  <div className="w-28">
                    <label className="block text-[10px] font-bold text-[var(--color-ink-secondary)] mb-1">Assign User</label>
                    <select
                      className="w-full rounded-lg border border-[var(--color-border)] bg-white p-2 text-xs outline-none focus:border-[var(--color-apple-blue)]"
                      value={step.approver_user || ''}
                      onChange={(e) => updateStep(idx, 'approver_user', e.target.value)}
                    >
                      <option value="">Any</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.first_name || u.username}</option>
                      ))}
                    </select>
                  </div>
                  <button onClick={() => removeStep(idx)} className="text-xs text-red-600 font-semibold p-2 hover:bg-red-50 rounded-lg">Delete</button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setOpen(false)}
              className="flex-1 rounded-xl border border-[var(--color-border)] p-3 text-sm font-semibold text-[var(--color-ink-secondary)] hover:bg-black/5 transition"
            >
              Cancel
            </button>
            <button
              onClick={doCreate}
              className="flex-1 rounded-xl bg-black p-3 text-sm font-semibold text-white hover:opacity-90 transition"
            >
              Confirm
            </button>
          </div>
        </div>
      </Modal>

      {/* Data Table */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-white shadow-sm overflow-x-auto">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-black/[0.01]">
              {tab === 'workflows' && (
                <>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Workflow ID</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Workflow Name</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Document Type</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Active</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Steps Routing</th>
                </>
              )}
              {tab === 'approvals' && (
                <>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Workflow</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Step Name</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Document</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Status</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Assignee</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Decision Note</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Actions</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {(rows || []).slice(0, 50).map((r) => (
              <tr key={r.id} className="hover:bg-black/[0.01]">
                {tab === 'workflows' && (
                  <>
                    <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">#{r.id}</td>
                    <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{r.name}</td>
                    <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.entity_type}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${
                        r.is_active
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
                          : 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20'
                      }`}>
                        {r.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[var(--color-ink-secondary)]">
                      <div className="flex items-center gap-1">
                        {(r.steps || []).map((step, idx) => (
                          <span key={step.id} className="inline-flex items-center rounded bg-black/5 px-2 py-1 text-xs text-[var(--color-ink)]">
                            {idx > 0 && ' → '}{step.order}. {step.name} ({step.approver_role || step.approver_user_name || 'Any'})
                          </span>
                        ))}
                        {!r.steps?.length && '—'}
                      </div>
                    </td>
                  </>
                )}
                {tab === 'approvals' && (
                  <>
                    <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{r.workflow_name || `Workflow ${r.workflow}`}</td>
                    <td className="px-6 py-4 text-[var(--color-ink)]">{r.step_name || `Step ID ${r.step}`}</td>
                    <td className="px-6 py-4 text-[var(--color-ink-secondary)] font-semibold">{r.entity_type} #{r.entity_id}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${
                        r.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' :
                        r.status === 'PENDING' ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20' :
                        r.status === 'REJECTED' ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20' :
                        'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.assigned_to_name || `User ID ${r.assigned_to}`}</td>
                    <td className="px-6 py-4 text-[var(--color-ink-secondary)] max-w-xs truncate">{r.notes || '—'}</td>
                    <td className="px-6 py-4">
                      {r.status === 'PENDING' && (
                        <div className="flex gap-2 items-center">
                          <input
                            className="rounded-lg border border-[var(--color-border)] bg-white px-2 py-1 text-xs outline-none focus:border-[var(--color-apple-blue)] w-32"
                            placeholder="Decision Notes..."
                            value={decisionNotes[r.id] || ''}
                            onChange={(e) => setDecisionNotes({ ...decisionNotes, [r.id]: e.target.value })}
                          />
                          <button onClick={() => decide(r.id, 'APPROVED')} className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 transition">
                            Approve
                          </button>
                          <button onClick={() => decide(r.id, 'REJECTED')} className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 transition">
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
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
