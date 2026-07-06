import { useState, useEffect } from 'react';
import * as api from '../lib/api.js';
import Modal from '../components/Modal.jsx';

export default function ChartOfAccounts() {
  const [rows, setRows] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const PAGE_SIZE = 50;

  const load = async () => {
    setError('');
    try {
      const [accountRows, companyRows, currencyRows] = await Promise.all([
        api.accounting.charts.list({ ordering: 'code' }),
        api.governance.companies.list(),
        api.accounting.currencies.list(),
      ]);
      setRows(Array.isArray(accountRows) ? accountRows : []);
      setAccounts(Array.isArray(accountRows) ? accountRows : []);
      setCompanies(Array.isArray(companyRows) ? companyRows : []);
      setCurrencies(Array.isArray(currencyRows) ? currencyRows : []);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'LOAD_FAILED');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditId(null);
    setForm({ is_active: true, is_group: false, disabled: false, tax_rate: 0 });
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
      if (!form.code || !form.name) {
        throw new Error('Account Code and Name are required.');
      }
      const payload = {
        code: String(form.code).trim(),
        name: String(form.name).trim(),
        account_number: String(form.account_number || '').trim(),
        company: form.company || null,
        is_group: !!form.is_group,
        parent: form.parent || null,
        root_type: String(form.root_type || '').trim(),
        report_type: String(form.report_type || '').trim(),
        account_type: String(form.account_type || '').trim(),
        account_currency: String(form.account_currency || '').trim(),
        tax_rate: parseFloat(form.tax_rate || 0),
        disabled: !!form.disabled,
        is_active: form.is_active !== false,
      };
      if (editId) await api.accounting.charts.update(editId, payload);
      else await api.accounting.charts.create(payload);
      setOpen(false);
      setEditId(null);
      setForm({});
      load();
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'Action failed');
    }
  };

  const buildTree = (items) => {
    const map = new Map();
    const roots = [];
    const list = Array.isArray(items) ? [...items] : [];
    for (const item of list) map.set(item.id, { ...item, children: [] });
    for (const item of list) {
      const parentId = item.parent;
      if (parentId && map.has(parentId)) {
        map.get(parentId).children.push(map.get(item.id));
      } else {
        roots.push(map.get(item.id));
      }
    }
    return roots;
  };

  const flattenTree = (nodes, out = []) => {
    if (!Array.isArray(nodes)) return out;
    for (const node of nodes) {
      out.push(node);
      flattenTree(node.children, out);
    }
    return out;
  };

  const toggle = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderTree = (nodes, depth = 0) => {
    if (!Array.isArray(nodes)) return null;
    const out = [];
    for (const node of nodes) {
      const hasChildren = Array.isArray(node.children) && node.children.length > 0;
      const isExpanded = !!expanded[node.id];
      const checked = selectedIds.includes(node.id);
      out.push(
        <tr key={node.id} className={checked ? 'bg-black/[0.01]' : 'hover:bg-black/[0.01]'}>
          <td className="px-6 py-4 text-[var(--color-ink)]">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => {
                setSelectedIds((prev) => e.target.checked ? [...prev, node.id] : prev.filter((id) => id !== node.id));
              }}
            />
          </td>
          <td className="px-6 py-4 text-[var(--color-ink)]" style={{ paddingLeft: `${depth * 20 + 24}px` }}>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggle(node.id)}
                className={`inline-flex h-6 w-6 items-center justify-center rounded-md border border-[var(--color-border)] text-xs transition ${hasChildren ? 'bg-[var(--color-background)]' : 'opacity-0 pointer-events-none'}`}
              >
                {isExpanded ? '−' : '+'}
              </button>
              <span className="font-semibold">{node.code}</span>
            </div>
          </td>
          <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{node.name}</td>
          <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{node.account_number || '—'}</td>
          <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{node.account_type || '—'}</td>
          <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{node.root_type || '—'}</td>
          <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{node.report_type || '—'}</td>
          <td className="px-6 py-4">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => openEdit(node)} className="font-semibold text-[var(--color-apple-blue)] hover:underline">Edit</button>
              <button onClick={() => openDuplicate(node)} className="font-semibold text-[var(--color-ink)] hover:underline">Duplicate</button>
              <button onClick={() => doRemove(node.id)} className="font-semibold text-red-600 hover:underline">Delete</button>
            </div>
          </td>
        </tr>
      );
      if (isExpanded && hasChildren) {
        out.push(...renderTree(node.children, depth + 1));
      }
    }
    return out;
  }

  const treeRows = buildTree(rows);
  const allNodes = flattenTree(treeRows);
  const flatListIds = allNodes.map((n) => n.id);
  const visibleNodes = showAll ? allNodes : allNodes.slice(0, PAGE_SIZE);

  const doRemove = async (id) => {
    setError('');
    try {
      await api.accounting.charts.remove(id);
      load();
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'DELETE_FAILED');
    }
  };

  const openDuplicate = async (row) => {
    setError('');
    try {
      const data = await api.duplicateItem('/accounting/accounts/', row.id);
      const src = data || row;
      setEditId(null);
      setForm({
        code: (src.code || '') + ' COPY',
        name: (src.name || '') + ' Copy',
        company: src.company || '',
        parent: src.parent || '',
        disable: src.disable || false,
        account_number: src.account_number || '',
        is_group: src.is_group || false,
        root_type: src.root_type || '',
        report_type: src.report_type || '',
        currency: src.currency || 'PHP',
        account_category: src.account_category || '',
        account_type: src.account_type || '',
        tax_rate: src.tax_rate || '',
        frozen_balance: src.frozen_balance || false,
        old_parent: src.old_parent || '',
        include_in_gross: src.include_in_gross || false,
      });
      setOpen(true);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'DUPLICATE_FAILED');
    }
  };

  const header = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--color-border)] pb-4">
      <div>
        <h2 className="text-xl font-bold text-[var(--color-ink)]">Chart of Accounts</h2>
        <p className="text-sm text-[var(--color-ink-secondary)]">Manage ledger accounts, groups, and classifications.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={openCreate}
          className="rounded-xl bg-[var(--color-apple-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition"
        >
          Create Account
        </button>
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

      <Modal open={open} title={editId ? 'Edit Account' : 'Create Account'} onClose={() => { setOpen(false); setEditId(null); }}>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Account Code *</label>
              <input
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-apple-blue)]"
                placeholder="e.g. 1110"
                value={form.code || ''}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Account Name *</label>
              <input
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-apple-blue)]"
                placeholder="e.g. Petty Cash"
                value={form.name || ''}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Account Number</label>
              <input
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-apple-blue)]"
                placeholder="e.g. 1110"
                value={form.account_number || ''}
                onChange={(e) => setForm({ ...form, account_number: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Company</label>
              <select
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-apple-blue)]"
                value={form.company || ''}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              >
                <option value="">Select Company</option>
                {(companies || []).map((c) => (
                  <option key={c.company_id || c.id} value={c.company_id || c.id}>{c.company_name || c.legal_name || c.company_id || c.id}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Root Type</label>
              <select
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-apple-blue)]"
                value={form.root_type || ''}
                onChange={(e) => setForm({ ...form, root_type: e.target.value })}
              >
                <option value="">Select</option>
                <option value="Asset">Asset</option>
                <option value="Liability">Liability</option>
                <option value="Equity">Equity</option>
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Report Type</label>
              <select
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-apple-blue)]"
                value={form.report_type || ''}
                onChange={(e) => setForm({ ...form, report_type: e.target.value })}
              >
                <option value="">Select</option>
                <option value="Balance Sheet">Balance Sheet</option>
                <option value="Profit and Loss">Profit and Loss</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Account Type</label>
              <select
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-apple-blue)]"
                value={form.account_type || ''}
                onChange={(e) => setForm({ ...form, account_type: e.target.value })}
              >
                <option value="">Select</option>
                <option value="ASSET">Asset</option>
                <option value="LIABILITY">Liability</option>
                <option value="EQUITY">Equity</option>
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expense</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Account Currency</label>
              <select
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-apple-blue)]"
                value={form.account_currency || ''}
                onChange={(e) => setForm({ ...form, account_currency: e.target.value })}
              >
                <option value="">Inherits company default if blank</option>
                {(currencies || []).map((c) => (
                  <option key={c.id} value={c.code || c.id}>{c.code || c.id} - {c.name || ''}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Parent Account</label>
              <select
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-apple-blue)]"
                value={form.parent || ''}
                onChange={(e) => setForm({ ...form, parent: e.target.value })}
              >
                <option value="">None</option>
                {(accounts || []).map((a) => (
                  <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Tax Rate</label>
              <input
                type="number"
                step="0.01"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-apple-blue)]"
                value={form.tax_rate ?? ''}
                onChange={(e) => setForm({ ...form, tax_rate: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3">
              <span className="text-sm font-medium text-[var(--color-ink)]">Is Group</span>
              <input type="checkbox" checked={!!form.is_group} onChange={(e) => setForm({ ...form, is_group: e.target.checked })} />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3">
              <span className="text-sm font-medium text-[var(--color-ink)]">Disabled</span>
              <input type="checkbox" checked={!!form.disabled} onChange={(e) => setForm({ ...form, disabled: e.target.checked })} />
            </label>
          </div>

          <label className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3">
            <span className="text-sm font-medium text-[var(--color-ink)]">Active Status</span>
            <input type="checkbox" checked={form.is_active !== false} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
          </label>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => { setOpen(false); setEditId(null); }}
              className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm font-semibold text-[var(--color-ink-secondary)] hover:bg-black/5 transition"
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

      <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-sm">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-black/[0.01]">
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">
                <input
                  type="checkbox"
                  checked={flatListIds.length > 0 && selectedIds.length === flatListIds.length}
                  onChange={(e) => setSelectedIds(e.target.checked ? [...flatListIds] : [])}
                />
              </th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Code</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Name</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Number</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Type</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Root</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Report</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {renderTree(visibleNodes)}
            {treeRows.length ? (
              <tr>
                <td colSpan="8" className="px-6 py-3 text-center text-xs text-[var(--color-ink-secondary)]">
                  {showAll
                    ? `Showing all ${allNodes.length} accounts`
                    : <>Showing first {Math.min(PAGE_SIZE, allNodes.length)} of {allNodes.length} accounts — <button type="button" onClick={() => setShowAll(true)} className="font-semibold text-[var(--color-apple-blue)] hover:underline">View more in list view</button></>}
                </td>
              </tr>
            ) : (
              <tr>
                <td colSpan="8" className="px-6 py-12 text-center text-[var(--color-ink-secondary)] font-medium">
                  No accounts found. Use Create Account to add your first ledger.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
