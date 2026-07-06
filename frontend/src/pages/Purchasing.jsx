import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../lib/api.js';
import Modal from '../components/Modal.jsx';

const fmtNum = (v) =>
  typeof v === 'number'
    ? '$' + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '$0.00';

export default function Purchasing() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('prs');
  const [rows, setRows] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [prsList, setPrsList] = useState([]);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [lines, setLines] = useState([{ item: '', qty: 1, unit_cost: 0 }]);
  const [editId, setEditId] = useState(null);

  const load = async () => {
    setError('');
    try {
      if (tab === 'suppliers') {
        setRows(await api.purchasing.suppliers.list());
      } else if (tab === 'prs') {
        setRows(await api.purchasing.prs.list({ ordering: '-created_at' }));
      } else if (tab === 'pos') {
        setRows(await api.purchasing.purchaseOrders.list({ ordering: '-created_at' }));
      } else if (tab === 'quotations') {
        setRows(await api.purchasing.quotations.list({ ordering: '-created_at' }));
      } else if (tab === 'grns') {
        setRows(await api.purchasing.grns.list({ ordering: '-received_date' }));
      } else if (tab === 'invoices') {
        setRows(await api.purchasing.invoices.list({ ordering: '-invoice_date' }));
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

  const openCreate = () => {
    setEditId(null);
    setForm({ is_active: true });
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditId(row.id);
    setForm({ ...row });
    setOpen(true);
  };

  const openDuplicate = async (row) => {
    setError('');
    try {
      const data = await api.duplicateItem('/purchasing/suppliers/', row.id);
      const src = data || row;
      setEditId(null);
      setForm({
        code: (src.code || '') + ' COPY',
        name: src.name ? src.name + ' Copy' : '',
        email: src.email || '',
        phone: src.phone || '',
        address: src.address || '',
        is_active: src.is_active !== false,
      });
      setOpen(true);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'DUPLICATE_FAILED');
    }
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
      if (tab === 'prs') await api.purchasing.prs.submit(id);
      else if (tab === 'pos') await api.purchasing.purchaseOrders.submit(id);
      else if (tab === 'quotations') await api.purchasing.quotations.submit(id);
      else if (tab === 'grns') await api.purchasing.grns.update(id, { ...(await api.purchasing.grns.get(id)).data, status: 'RECEIVED' });
      else if (tab === 'invoices') await api.purchasing.invoices.submit(id);
      load();
    } catch (e) {
      setError(e?.response?.data?.detail || 'ACTION_FAILED');
    }
  };

  const approve = async (id) => {
    setError('');
    try {
      if (tab === 'prs') await api.purchasing.prs.approve(id);
      else if (tab === 'pos') await api.purchasing.purchaseOrders.approve(id);
      else if (tab === 'quotations') await api.purchasing.quotations.approve(id);
      else if (tab === 'invoices') await api.purchasing.invoices.approve(id);
      load();
    } catch (e) {
      setError(e?.response?.data?.detail || 'ACTION_FAILED');
    }
  };

  const reject = async (id) => {
    setError('');
    try {
      if (tab === 'prs') await api.purchasing.prs.reject(id);
      else if (tab === 'pos') await api.purchasing.purchaseOrders.reject(id);
      else if (tab === 'quotations') await api.purchasing.quotations.reject(id);
      else if (tab === 'invoices') await api.purchasing.invoices.reject(id);
      load();
    } catch (e) {
      setError(e?.response?.data?.detail || 'ACTION_FAILED');
    }
  };

  const payInvoice = async (id) => {
    setError('');
    try {
      await api.purchasing.invoices.mark_paid(id);
      load();
    } catch (e) {
      setError(e?.response?.data?.detail || 'ACTION_FAILED');
    }
  };

  const header = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--color-border)] pb-4">
      <div>
        <h2 className="text-xl font-bold text-[var(--color-ink)]">Purchasing / Procure-to-Pay (P2P)</h2>
        <p className="text-sm text-[var(--color-ink-secondary)]">Manage suppliers, purchase requisitions, orders, GRN, invoices, and quotations.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {['prs', 'pos', 'grns', 'quotations', 'invoices', 'suppliers'].map((t) => (
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
            if (tab === 'suppliers') {
              openCreate();
            } else if (tab === 'prs') {
              navigate('/purchasing/prs/new');
            } else if (tab === 'pos') {
              navigate('/purchasing/pos/new');
            } else if (tab === 'quotations') {
              navigate('/purchasing/quotations/new');
            } else if (tab === 'invoices') {
              navigate('/purchasing/invoices/new');
            } else if (tab === 'grns') {
              navigate('/purchasing/grns/new');
            }
          }}
          className="rounded-xl bg-[var(--color-apple-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition"
        >
          New {tab === 'prs' ? 'PR' : tab === 'pos' ? 'PO' : tab === 'grns' ? 'GRN' : tab === 'quotations' ? 'Quotation' : tab === 'invoices' ? 'Invoice' : 'Supplier'}
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
      <Modal open={open} title={editId ? 'Edit Supplier' : 'Create Supplier'} onClose={() => { setOpen(false); setEditId(null); }}>
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

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => { setOpen(false); setEditId(null); }}
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
              {tab === 'quotations' && (
                <>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Quotation No</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Supplier</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Date</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Valid Until</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Total</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Status</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Actions</th>
                </>
              )}
              {tab === 'grns' && (
                <>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">GRN No</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Purchase Order</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Received Date</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Notes</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Actions</th>
                </>
              )}
              {tab === 'invoices' && (
                <>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Invoice No</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Supplier</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">PO</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Date</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Total</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Status</th>
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
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Actions</th>
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
                {tab === 'quotations' && (
                  <>
                    <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{r.quotation_no}</td>
                    <td className="px-6 py-4 text-[var(--color-ink)]">{r.supplier_name || `Supplier ID ${r.supplier}`}</td>
                    <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.quotation_date}</td>
                    <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.valid_until}</td>
                    <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{fmtNum(r.grand_total)}</td>
                    <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.status}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {r.status === 'DRAFT' && (
                          <button onClick={() => submit(r.id)} className="rounded-lg bg-black/5 px-3 py-1.5 text-xs font-semibold hover:bg-black/10 transition">Submit</button>
                        )}
                        {r.status === 'SUBMITTED' && (
                          <>
                            <button onClick={() => approve(r.id)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition">Approve</button>
                            <button onClick={() => reject(r.id)} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition">Reject</button>
                          </>
                        )}
                      </div>
                    </td>
                  </>
                )}
                {tab === 'grns' && (
                  <>
                    <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{r.grn_no}</td>
                    <td className="px-6 py-4 text-[var(--color-ink)]">{r.purchase_order_name || `PO ${r.purchase_order}`}</td>
                    <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.received_date}</td>
                    <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.notes || '—'}</td>
                    <td className="px-6 py-4"><div className="flex gap-2"><button onClick={() => doRemove(r.id)} className="font-semibold text-red-600 hover:underline">Delete</button></div></td>
                  </>
                )}
                {tab === 'invoices' && (
                  <>
                    <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{r.invoice_no}</td>
                    <td className="px-6 py-4 text-[var(--color-ink)]">{r.supplier_name || `Supplier ${r.supplier}`}</td>
                    <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.purchase_order_name || r.purchase_order || '—'}</td>
                    <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.invoice_date}</td>
                    <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{fmtNum(r.invoice_total || r.balance || 0)}</td>
                    <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.status}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {r.status === 'DRAFT' && (
                          <button onClick={() => submit(r.id)} className="rounded-lg bg-black/5 px-3 py-1.5 text-xs font-semibold hover:bg-black/10 transition">Submit</button>
                        )}
                        {r.status === 'SUBMITTED' && (
                          <>
                            <button onClick={() => approve(r.id)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition">Approve</button>
                            <button onClick={() => reject(r.id)} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition">Reject</button>
                          </>
                        )}
                        {(r.status === 'APPROVED' || r.status === 'POSTED') && (
                          <button onClick={() => payInvoice(r.id)} className="rounded-lg bg-black/5 px-3 py-1.5 text-xs font-semibold hover:bg-black/10 transition">Mark Paid</button>
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
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(r)} className="font-semibold text-[var(--color-apple-blue)] hover:underline">Edit</button>
                        <button onClick={() => openDuplicate(r)} className="font-semibold text-[var(--color-ink)] hover:underline">Duplicate</button>
                        <button onClick={async () => { await api.purchasing.suppliers.remove(r.id); load(); }} className="font-semibold text-red-600 hover:underline">Delete</button>
                      </div>
                    </td>
                  </>
                )}
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
