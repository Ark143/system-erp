import { useState, useEffect } from 'react';
import * as api from '../lib/api.js';
import Modal from '../components/Modal.jsx';

export default function Purchasing() {
  const [tab, setTab] = useState('prs');
  const [rows, setRows] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [prsList, setPrsList] = useState([]);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [lines, setLines] = useState([{ item: '', qty: 1, unit_cost: 0 }]);

  const load = async () => {
    setError('');
    try {
      if (tab === 'suppliers') {
        setRows(await api.purchasing.suppliers.list());
      } else if (tab === 'prs') {
        setRows(await api.purchasing.prs.list({ ordering: '-created_at' }));
      } else if (tab === 'pos') {
        setRows(await api.purchasing.pos.list({ ordering: '-created_at' }));
      }
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'LOAD_FAILED');
    }
  };

  const loadDeps = async () => {
    try {
      setSuppliers(await api.purchasing.suppliers.list());
      setItems(await api.inventory.items.list());
      setPrsList(await api.purchasing.prs.list());
    } catch (e) {
      console.error('Failed to load dependencies', e);
    }
  };

  useEffect(() => {
    load();
    loadDeps();
  }, [tab]);

  const addLine = () => {
    setLines([...lines, { item: '', qty: 1, unit_cost: 0 }]);
  };

  const removeLine = (idx) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const updateLine = (idx, field, value) => {
    const updated = [...lines];
    updated[idx][field] = value;
    if (field === 'item') {
      const selectedItem = items.find((it) => it.id === parseInt(value));
      if (selectedItem) {
        updated[idx].unit_cost = parseFloat(selectedItem.unit_cost || 0);
      }
    }
    setLines(updated);
  };

  const calculateGrandTotal = () => {
    return lines.reduce((acc, curr) => {
      const total = parseFloat(curr.qty || 0) * parseFloat(curr.unit_cost || 0);
      return acc + (total > 0 ? total : 0);
    }, 0);
  };

  const doCreate = async () => {
    setError('');
    try {
      if (tab === 'suppliers') {
        if (!form.code || !form.name) {
          throw new Error('Supplier Code and Name are required.');
        }
        await api.purchasing.suppliers.create({
          code: form.code,
          name: form.name,
          email: form.email || '',
          phone: form.phone || '',
          address: form.address || '',
          is_active: form.is_active !== false
        });
      } else if (tab === 'prs') {
        if (!form.pr_no || !form.department || !form.required_date) {
          throw new Error('Please enter PR No., Department, and Required Date.');
        }
        const filteredLines = lines.filter((l) => l.item && l.qty > 0);
        if (filteredLines.length === 0) {
          throw new Error('Please add at least one valid item line.');
        }

        // Create PR
        const newPr = await api.purchasing.prs.create({
          pr_no: form.pr_no,
          department: form.department,
          required_date: form.required_date,
          status: 'DRAFT',
          notes: form.notes || ''
        });

        // Create PR Items
        for (const line of filteredLines) {
          await api.purchasing.prItems.create({
            pr: newPr.id,
            item: parseInt(line.item),
            qty: parseFloat(line.qty),
            unit_cost: parseFloat(line.unit_cost),
            line_total: parseFloat(line.qty) * parseFloat(line.unit_cost)
          });
        }
      } else if (tab === 'pos') {
        if (!form.po_no || !form.supplier || !form.po_date) {
          throw new Error('Please enter PO No., Supplier, and PO Date.');
        }
        const filteredLines = lines.filter((l) => l.item && l.qty > 0);
        if (filteredLines.length === 0) {
          throw new Error('Please add at least one valid item line.');
        }

        // Create PO
        const newPo = await api.purchasing.pos.create({
          po_no: form.po_no,
          supplier: parseInt(form.supplier),
          pr: form.pr ? parseInt(form.pr) : null,
          po_date: form.po_date,
          status: 'DRAFT',
          total_amount: 0,
          tax_amount: 0,
          grand_total: 0
        });

        // Create PO Items
        for (const line of filteredLines) {
          await api.purchasing.poItems.create({
            purchase_order: newPo.id,
            item: parseInt(line.item),
            qty: parseFloat(line.qty),
            unit_cost: parseFloat(line.unit_cost),
            line_total: parseFloat(line.qty) * parseFloat(line.unit_cost)
          });
        }
      }
      setOpen(false);
      setForm({});
      setLines([{ item: '', qty: 1, unit_cost: 0 }]);
      load();
      loadDeps();
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'Action failed');
    }
  };

  const handlePrChange = async (prId) => {
    if (!prId) {
      setForm({ ...form, pr: '' });
      return;
    }

    try {
      // Find the PR to populate details
      const selectedPr = prsList.find(p => p.id === parseInt(prId));
      if (selectedPr) {
        setForm({
          ...form,
          pr: prId
        });
        
        // Fetch items associated with the PR if possible
        // The backend exposes PR items at '/api/purchasing/purchase-requisition-items/' filtered by PR
        const prItems = await api.getList('/purchasing/purchase-requisition-items/', { pr: prId });
        if (prItems && prItems.length > 0) {
          const newLines = prItems.map((pi) => ({
            item: String(pi.item),
            qty: parseFloat(pi.qty),
            unit_cost: parseFloat(pi.unit_cost)
          }));
          setLines(newLines);
        }
      }
    } catch (e) {
      console.error('Error fetching PR items', e);
      setForm({ ...form, pr: prId });
    }
  };

  const submit = async (id) => {
    setError('');
    try {
      await (tab === 'prs' ? api.purchasing.prs.submit(id) : api.purchasing.pos.submit(id));
      load();
    } catch (e) {
      setError(e?.response?.data?.detail || 'ACTION_FAILED');
    }
  };

  const approve = async (id) => {
    setError('');
    try {
      await (tab === 'prs' ? api.purchasing.prs.approve(id) : api.purchasing.pos.approve(id));
      load();
    } catch (e) {
      setError(e?.response?.data?.detail || 'ACTION_FAILED');
    }
  };

  const reject = async (id) => {
    setError('');
    try {
      await (tab === 'prs' ? api.purchasing.prs.reject(id) : api.purchasing.pos.reject(id));
      load();
    } catch (e) {
      setError(e?.response?.data?.detail || 'ACTION_FAILED');
    }
  };

  const header = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--color-border)] pb-4">
      <div>
        <h2 className="text-xl font-bold text-[var(--color-ink)]">Purchasing / Procure-to-Pay (P2P)</h2>
        <p className="text-sm text-[var(--color-ink-secondary)]">Manage suppliers, purchase requisitions, and purchase orders.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {['prs', 'pos', 'suppliers'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === t
                ? 'bg-black text-white'
                : 'bg-black/5 text-[var(--color-ink-secondary)] hover:bg-black/10'
            }`}
          >
            {t === 'prs' ? 'Requisitions (PR)' : t === 'pos' ? 'Orders (PO)' : t}
          </button>
        ))}
        <button
          onClick={() => {
            setError('');
            setForm(tab === 'prs' ? { required_date: new Date().toISOString().slice(0, 10) } : tab === 'pos' ? { po_date: new Date().toISOString().slice(0, 10) } : { is_active: true });
            setLines([{ item: '', qty: 1, unit_cost: 0 }]);
            setOpen(true);
          }}
          className="rounded-xl bg-[var(--color-apple-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition"
        >
          New {tab === 'prs' ? 'PR' : tab === 'pos' ? 'PO' : 'Supplier'}
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

      {/* Modal Form */}
      <Modal open={open} title={tab === 'prs' ? 'Create Purchase Requisition' : tab === 'pos' ? 'Create Purchase Order' : 'Create Supplier'} onClose={() => setOpen(false)}>
        <div className="space-y-4 pt-2">
          {tab === 'suppliers' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Supplier Code *</label>
                  <input
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                    placeholder="e.g. VEND-001"
                    value={form.code || ''}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Supplier Name *</label>
                  <input
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                    placeholder="Name"
                    value={form.name || ''}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                    placeholder="supplier@example.com"
                    value={form.email || ''}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Phone</label>
                  <input
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                    placeholder="Contact Number"
                    value={form.phone || ''}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Address</label>
                <textarea
                  className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)] h-20 resize-none"
                  placeholder="Office/Factory Address"
                  value={form.address || ''}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="supp-active"
                  checked={form.is_active !== false}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="rounded border-[var(--color-border)]"
                />
                <label htmlFor="supp-active" className="text-xs font-semibold text-[var(--color-ink-secondary)]">Active Status</label>
              </div>
            </>
          )}

          {(tab === 'prs' || tab === 'pos') && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">
                    {tab === 'prs' ? 'PR No *' : 'PO No *'}
                  </label>
                  <input
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                    placeholder={tab === 'prs' ? 'e.g. PR-0001' : 'e.g. PO-0001'}
                    value={tab === 'prs' ? (form.pr_no || '') : (form.po_no || '')}
                    onChange={(e) => setForm(tab === 'prs' ? { ...form, pr_no: e.target.value } : { ...form, po_no: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">
                    {tab === 'prs' ? 'Required Date *' : 'PO Date *'}
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                    value={tab === 'prs' ? (form.required_date || '') : (form.po_date || '')}
                    onChange={(e) => setForm(tab === 'prs' ? { ...form, required_date: e.target.value } : { ...form, po_date: e.target.value })}
                  />
                </div>
              </div>

              {tab === 'prs' ? (
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Requesting Department *</label>
                  <input
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                    placeholder="e.g. IT, Finance, Operations"
                    value={form.department || ''}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Supplier *</label>
                    <select
                      className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                      value={form.supplier || ''}
                      onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Source PR (Optional)</label>
                    <select
                      className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                      value={form.pr || ''}
                      onChange={(e) => handlePrChange(e.target.value)}
                    >
                      <option value="">None</option>
                      {prsList.map((pr) => (
                        <option key={pr.id} value={pr.id}>{pr.pr_no} - {pr.department}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Notes / Description</label>
                <textarea
                  className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)] h-16 resize-none"
                  placeholder="Additional context..."
                  value={form.notes || ''}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              {/* Items Grid */}
              <div className="border-t border-[var(--color-border)] pt-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]">Items to Procure</h4>
                  <button onClick={addLine} className="text-xs font-semibold text-[var(--color-apple-blue)] hover:underline">+ Add Line</button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {lines.map((line, idx) => (
                    <div key={idx} className="flex gap-2 items-end border border-black/5 p-2 rounded-xl bg-black/[0.01]">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-[var(--color-ink-secondary)] mb-1">Item</label>
                        <select
                          className="w-full rounded-lg border border-[var(--color-border)] bg-white p-2 text-xs outline-none focus:border-[var(--color-apple-blue)]"
                          value={line.item}
                          onChange={(e) => updateLine(idx, 'item', e.target.value)}
                        >
                          <option value="">Select Item</option>
                          {items.map((it) => (
                            <option key={it.id} value={it.id}>{it.sku} - {it.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-16">
                        <label className="block text-[10px] font-bold text-[var(--color-ink-secondary)] mb-1">Qty</label>
                        <input
                          type="number"
                          className="w-full rounded-lg border border-[var(--color-border)] bg-white p-2 text-xs outline-none focus:border-[var(--color-apple-blue)]"
                          value={line.qty}
                          onChange={(e) => updateLine(idx, 'qty', e.target.value)}
                        />
                      </div>
                      <div className="w-24">
                        <label className="block text-[10px] font-bold text-[var(--color-ink-secondary)] mb-1">Est. Cost</label>
                        <input
                          type="number"
                          step="0.01"
                          className="w-full rounded-lg border border-[var(--color-border)] bg-white p-2 text-xs outline-none focus:border-[var(--color-apple-blue)]"
                          value={line.unit_cost}
                          onChange={(e) => updateLine(idx, 'unit_cost', e.target.value)}
                        />
                      </div>
                      <button onClick={() => removeLine(idx)} className="text-xs text-red-600 font-semibold p-2 hover:bg-red-50 rounded-lg">Delete</button>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-right text-xs font-bold text-[var(--color-ink)]">
                  Total Valuation: ${calculateGrandTotal().toFixed(2)}
                </div>
              </div>
            </>
          )}

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
              {tab === 'prs' && (
                <>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">PR No</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Department</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Required Date</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Status</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Actions</th>
                </>
              )}
              {tab === 'pos' && (
                <>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">PO No</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Supplier</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">PO Date</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Status</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Grand Total</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Actions</th>
                </>
              )}
              {tab === 'suppliers' && (
                <>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Code</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Name</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Email</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Phone</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Address</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {(rows || []).slice(0, 50).map((r) => (
              <tr key={r.id} className="hover:bg-black/[0.01]">
                {tab === 'prs' && (
                  <>
                    <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{r.pr_no}</td>
                    <td className="px-6 py-4 text-[var(--color-ink)]">{r.department}</td>
                    <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.required_date}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${
                        r.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' :
                        r.status === 'SUBMITTED' ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20' :
                        r.status === 'REJECTED' ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20' :
                        'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {r.status === 'DRAFT' && (
                          <button onClick={() => submit(r.id)} className="rounded-lg bg-black/5 px-3 py-1.5 text-xs font-semibold hover:bg-black/10 transition">
                            Submit
                          </button>
                        )}
                        {r.status === 'SUBMITTED' && (
                          <>
                            <button onClick={() => approve(r.id)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition">
                              Approve
                            </button>
                            <button onClick={() => reject(r.id)} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition">
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </>
                )}
                {tab === 'pos' && (
                  <>
                    <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{r.po_no}</td>
                    <td className="px-6 py-4 text-[var(--color-ink)]">{r.supplier_name || `Supplier ID ${r.supplier}`}</td>
                    <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.po_date}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${
                        r.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' :
                        r.status === 'SUBMITTED' ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20' :
                        r.status === 'REJECTED' ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20' :
                        'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">${parseFloat(r.grand_total || r.total_amount || 0).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {r.status === 'DRAFT' && (
                          <button onClick={() => submit(r.id)} className="rounded-lg bg-black/5 px-3 py-1.5 text-xs font-semibold hover:bg-black/10 transition">
                            Submit
                          </button>
                        )}
                        {r.status === 'SUBMITTED' && (
                          <>
                            <button onClick={() => approve(r.id)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition">
                              Approve
                            </button>
                            <button onClick={() => reject(r.id)} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition">
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </>
                )}
                {tab === 'suppliers' && (
                  <>
                    <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{r.code}</td>
                    <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{r.name}</td>
                    <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.email || '—'}</td>
                    <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.phone || '—'}</td>
                    <td className="px-6 py-4 text-[var(--color-ink-secondary)] truncate max-w-xs">{r.address || '—'}</td>
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
