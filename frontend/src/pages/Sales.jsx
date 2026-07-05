import { useState, useEffect } from 'react';
import * as api from '../lib/api.js';
import Modal from '../components/Modal.jsx';

export default function Sales() {
  const [tab, setTab] = useState('orders');
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [orderLines, setOrderLines] = useState([{ item: '', qty: 1, unit_price: 0, discount: 0 }]);

  const load = async () => {
    setError('');
    try {
      if (tab === 'orders') {
        setRows(await api.sales.orders.list({ ordering: '-created_at' }));
      } else if (tab === 'customers') {
        setRows(await api.sales.customers.list());
      } else if (tab === 'invoices') {
        setRows(await api.sales.invoices.list());
      }
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'LOAD_FAILED');
    }
  };

  const loadDeps = async () => {
    try {
      setCustomers(await api.sales.customers.list());
      setItems(await api.inventory.items.list());
      setOrdersList(await api.sales.orders.list());
    } catch (e) {
      console.error('Failed to load dependencies', e);
    }
  };

  useEffect(() => {
    load();
    loadDeps();
  }, [tab]);

  const addLine = () => {
    setOrderLines([...orderLines, { item: '', qty: 1, unit_price: 0, discount: 0 }]);
  };

  const removeLine = (idx) => {
    setOrderLines(orderLines.filter((_, i) => i !== idx));
  };

  const updateLine = (idx, field, value) => {
    const updated = [...orderLines];
    updated[idx][field] = value;
    if (field === 'item') {
      const selectedItem = items.find((it) => it.id === parseInt(value));
      if (selectedItem) {
        updated[idx].unit_price = parseFloat(selectedItem.selling_price || 0);
      }
    }
    setOrderLines(updated);
  };

  const calculateGrandTotal = () => {
    return orderLines.reduce((acc, curr) => {
      const total = (parseFloat(curr.qty || 0) * parseFloat(curr.unit_price || 0)) - parseFloat(curr.discount || 0);
      return acc + (total > 0 ? total : 0);
    }, 0);
  };

  const doCreate = async () => {
    setError('');
    try {
      if (tab === 'customers') {
        if (!form.code || !form.name) {
          throw new Error('Customer Code and Name are required.');
        }
        await api.sales.customers.create({
          code: form.code,
          name: form.name,
          email: form.email || '',
          phone: form.phone || '',
          address: form.address || '',
          is_active: form.is_active !== false
        });
      } else if (tab === 'orders') {
        if (!form.order_no || !form.customer || !form.order_date) {
          throw new Error('Please enter Order No., Customer, and Order Date.');
        }
        const filteredLines = orderLines.filter((l) => l.item && l.qty > 0);
        if (filteredLines.length === 0) {
          throw new Error('Please add at least one valid item line.');
        }

        // Create the Sales Order
        const newOrder = await api.sales.orders.create({
          order_no: form.order_no,
          customer: parseInt(form.customer),
          order_date: form.order_date,
          status: 'DRAFT',
          total_amount: 0,
          tax_amount: 0,
          grand_total: 0
        });

        // Create Order Items
        for (const line of filteredLines) {
          await api.sales.orderItems.create({
            sales_order: newOrder.id,
            item: parseInt(line.item),
            qty: parseFloat(line.qty),
            unit_price: parseFloat(line.unit_price),
            discount: parseFloat(line.discount || 0),
            line_total: (parseFloat(line.qty) * parseFloat(line.unit_price)) - parseFloat(line.discount || 0)
          });
        }
      } else if (tab === 'invoices') {
        if (!form.invoice_no || !form.sales_order || !form.customer || !form.invoice_date) {
          throw new Error('Please enter Invoice No., Sales Order, Customer, and Invoice Date.');
        }
        await api.sales.invoices.create({
          invoice_no: form.invoice_no,
          sales_order: parseInt(form.sales_order),
          customer: parseInt(form.customer),
          invoice_date: form.invoice_date
        });
      }
      setOpen(false);
      setForm({});
      setOrderLines([{ item: '', qty: 1, unit_price: 0, discount: 0 }]);
      load();
      loadDeps();
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'Action failed');
    }
  };

  const submit = async (id) => {
    setError('');
    try {
      await api.sales.orders.submit(id);
      load();
    } catch (e) {
      setError(e?.response?.data?.detail || 'ACTION_FAILED');
    }
  };

  const approve = async (id) => {
    setError('');
    try {
      await api.sales.orders.approve(id);
      load();
    } catch (e) {
      setError(e?.response?.data?.detail || 'ACTION_FAILED');
    }
  };

  const reject = async (id) => {
    setError('');
    try {
      await api.sales.orders.reject(id);
      load();
    } catch (e) {
      setError(e?.response?.data?.detail || 'ACTION_FAILED');
    }
  };

  const handleOrderChange = (orderId) => {
    const selectedOrder = ordersList.find(o => o.id === parseInt(orderId));
    if (selectedOrder) {
      setForm({
        ...form,
        sales_order: orderId,
        customer: selectedOrder.customer
      });
    } else {
      setForm({
        ...form,
        sales_order: orderId
      });
    }
  };

  const header = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--color-border)] pb-4">
      <div>
        <h2 className="text-xl font-bold text-[var(--color-ink)]">Sales / Order-to-Cash (O2C)</h2>
        <p className="text-sm text-[var(--color-ink-secondary)]">Manage customers, draft sales orders, and issue invoices.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {['orders', 'customers', 'invoices'].map((t) => (
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
        <button
          onClick={() => {
            setError('');
            setForm(tab === 'orders' ? { order_date: new Date().toISOString().slice(0, 10) } : tab === 'invoices' ? { invoice_date: new Date().toISOString().slice(0, 10) } : { is_active: true });
            setOrderLines([{ item: '', qty: 1, unit_price: 0, discount: 0 }]);
            setOpen(true);
          }}
          className="rounded-xl bg-[var(--color-apple-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition"
        >
          New {tab.slice(0, -1)}
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
      <Modal open={open} title={`Create New ${tab.slice(0, -1)}`} onClose={() => setOpen(false)}>
        <div className="space-y-4 pt-2">
          {tab === 'customers' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Customer Code *</label>
                  <input
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                    placeholder="e.g. CUST-001"
                    value={form.code || ''}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Customer Name *</label>
                  <input
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                    placeholder="Name / Company"
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
                    placeholder="email@example.com"
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
                  placeholder="Billing/Shipping Address"
                  value={form.address || ''}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="cust-active"
                  checked={form.is_active !== false}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="rounded border-[var(--color-border)]"
                />
                <label htmlFor="cust-active" className="text-xs font-semibold text-[var(--color-ink-secondary)]">Active Status</label>
              </div>
            </>
          )}

          {tab === 'orders' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Order No *</label>
                  <input
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                    placeholder="e.g. SO-0001"
                    value={form.order_no || ''}
                    onChange={(e) => setForm({ ...form, order_no: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Order Date *</label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                    value={form.order_date || ''}
                    onChange={(e) => setForm({ ...form, order_date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Customer *</label>
                <select
                  className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                  value={form.customer || ''}
                  onChange={(e) => setForm({ ...form, customer: e.target.value })}
                >
                  <option value="">Select Customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Order Items Section */}
              <div className="border-t border-[var(--color-border)] pt-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]">Order Items</h4>
                  <button onClick={addLine} className="text-xs font-semibold text-[var(--color-apple-blue)] hover:underline">+ Add Line</button>
                </div>
                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {orderLines.map((line, idx) => (
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
                      <div className="w-20">
                        <label className="block text-[10px] font-bold text-[var(--color-ink-secondary)] mb-1">Cost</label>
                        <input
                          type="number"
                          className="w-full rounded-lg border border-[var(--color-border)] bg-white p-2 text-xs outline-none focus:border-[var(--color-apple-blue)]"
                          value={line.unit_price}
                          onChange={(e) => updateLine(idx, 'unit_price', e.target.value)}
                        />
                      </div>
                      <div className="w-16">
                        <label className="block text-[10px] font-bold text-[var(--color-ink-secondary)] mb-1">Disc</label>
                        <input
                          type="number"
                          className="w-full rounded-lg border border-[var(--color-border)] bg-white p-2 text-xs outline-none focus:border-[var(--color-apple-blue)]"
                          value={line.discount}
                          onChange={(e) => updateLine(idx, 'discount', e.target.value)}
                        />
                      </div>
                      <button onClick={() => removeLine(idx)} className="text-xs text-red-600 font-semibold p-2 hover:bg-red-50 rounded-lg">Delete</button>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-right text-xs font-bold text-[var(--color-ink)]">
                  Total Amount: ${calculateGrandTotal().toFixed(2)}
                </div>
              </div>
            </>
          )}

          {tab === 'invoices' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Invoice No *</label>
                  <input
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                    placeholder="e.g. INV-0001"
                    value={form.invoice_no || ''}
                    onChange={(e) => setForm({ ...form, invoice_no: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Invoice Date *</label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                    value={form.invoice_date || ''}
                    onChange={(e) => setForm({ ...form, invoice_date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Sales Order Source *</label>
                <select
                  className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                  value={form.sales_order || ''}
                  onChange={(e) => handleOrderChange(e.target.value)}
                >
                  <option value="">Select Sales Order</option>
                  {ordersList.map((ord) => (
                    <option key={ord.id} value={ord.id}>{ord.order_no} - {ord.customer_name || `Customer ID ${ord.customer}`} (${parseFloat(ord.grand_total).toFixed(2)})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Customer *</label>
                <select
                  className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                  value={form.customer || ''}
                  onChange={(e) => setForm({ ...form, customer: e.target.value })}
                >
                  <option value="">Select Customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
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
              {tab === 'orders' && (
                <>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Order No</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Customer</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Date</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Status</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Total Amount</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Actions</th>
                </>
              )}
              {tab === 'customers' && (
                <>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Code</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Name</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Email</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Phone</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Address</th>
                </>
              )}
              {tab === 'invoices' && (
                <>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Invoice No</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Order Source</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Customer</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Invoice Date</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {(rows || []).slice(0, 50).map((r) => (
              <tr key={r.id} className="hover:bg-black/[0.01]">
                {tab === 'orders' && (
                  <>
                    <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{r.order_no}</td>
                    <td className="px-6 py-4 text-[var(--color-ink)]">{r.customer_name || `Customer ID ${r.customer}`}</td>
                    <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.order_date}</td>
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
                {tab === 'customers' && (
                  <>
                    <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{r.code}</td>
                    <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{r.name}</td>
                    <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.email || '—'}</td>
                    <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.phone || '—'}</td>
                    <td className="px-6 py-4 text-[var(--color-ink-secondary)] truncate max-w-xs">{r.address || '—'}</td>
                  </>
                )}
                {tab === 'invoices' && (
                  <>
                    <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{r.invoice_no}</td>
                    <td className="px-6 py-4 text-[var(--color-ink-secondary)]">Order ID {r.sales_order}</td>
                    <td className="px-6 py-4 text-[var(--color-ink)]">{r.customer_name || `Customer ID ${r.customer}`}</td>
                    <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.invoice_date}</td>
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
