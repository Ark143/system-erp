import { useState, useEffect } from 'react';
import * as api from '../lib/api.js';
import Modal from '../components/Modal.jsx';

export default function Inventory() {
  const [tab, setTab] = useState('items');
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      if (tab === 'items') {
        const data = await api.inventory.items.list();
        setRows(data);
      } else if (tab === 'categories') {
        const data = await api.inventory.categories.list();
        setRows(data);
      } else {
        const data = await api.inventory.stockMoves.list();
        setRows(data);
      }
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'LOAD_FAILED');
    }
  };

  const loadDeps = async () => {
    try {
      const catData = await api.inventory.categories.list();
      setCategories(catData);
      const itemData = await api.inventory.items.list();
      setItemsList(itemData);
    } catch (e) {
      console.error('Failed to load dependencies', e);
    }
  };

  useEffect(() => {
    load();
    loadDeps();
  }, [tab]);

  const doCreate = async () => {
    setError('');
    try {
      if (tab === 'items') {
        if (!form.sku || !form.name || !form.category) {
          throw new Error('Please fill in SKU, Name, and Category.');
        }
        await api.inventory.items.create({
          sku: form.sku,
          name: form.name,
          category: parseInt(form.category),
          uom: form.uom || 'PC',
          warehouse: form.warehouse || 'MAIN',
          qty_on_hand: parseFloat(form.qty_on_hand || 0),
          reorder_level: parseFloat(form.reorder_level || 10),
          unit_cost: parseFloat(form.unit_cost || 0),
          selling_price: parseFloat(form.selling_price || 0),
          is_active: true
        });
      } else if (tab === 'categories') {
        if (!form.name) {
          throw new Error('Category name is required.');
        }
        await api.inventory.categories.create({
          name: form.name,
          description: form.description || ''
        });
      } else if (tab === 'stock-moves') {
        if (!form.item || !form.move_type || !form.qty) {
          throw new Error('Please select an Item, Move Type, and Qty.');
        }
        await api.inventory.items.adjust(parseInt(form.item), {
          move_type: form.move_type,
          qty: parseFloat(form.qty),
          reference: form.reference || '',
          notes: form.notes || ''
        });
      }
      setOpen(false);
      setForm({});
      load();
      loadDeps();
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'Action failed');
    }
  };

  const header = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--color-border)] pb-4">
      <div>
        <h2 className="text-xl font-bold text-[var(--color-ink)]">Inventory Management</h2>
        <p className="text-sm text-[var(--color-ink-secondary)]">Catalog items, categories, and stock movement adjustments.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {['items', 'categories', 'stock-moves'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === t
                ? 'bg-black text-white'
                : 'bg-black/5 text-[var(--color-ink-secondary)] hover:bg-black/10'
            }`}
          >
            {t.replace('-', ' ')}
          </button>
        ))}
        <button
          onClick={() => {
            setError('');
            setForm(tab === 'items' ? { uom: 'PC', warehouse: 'MAIN', qty_on_hand: 0, reorder_level: 10, unit_cost: 0, selling_price: 0 } : tab === 'stock-moves' ? { move_type: 'IN' } : {});
            setOpen(true);
          }}
          className="rounded-xl bg-[var(--color-apple-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition"
        >
          {tab === 'stock-moves' ? 'Adjust Stock' : `New ${tab.slice(0, -1)}`}
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
      <Modal open={open} title={tab === 'stock-moves' ? 'Adjust Stock Level' : `Create New ${tab.slice(0, -1).replace('-',' ')}`} onClose={() => setOpen(false)}>
        <div className="space-y-4 pt-2">
          {tab === 'items' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">SKU *</label>
                  <input
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                    placeholder="e.g. ITEM-001"
                    value={form.sku || ''}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Name *</label>
                  <input
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                    placeholder="Item Name"
                    value={form.name || ''}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Category *</label>
                  <select
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                    value={form.category || ''}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Warehouse *</label>
                  <select
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                    value={form.warehouse || 'MAIN'}
                    onChange={(e) => setForm({ ...form, warehouse: e.target.value })}
                  >
                    <option value="MAIN">Main Warehouse</option>
                    <option value="BRANCH_A">Branch A</option>
                    <option value="BRANCH_B">Branch B</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">UOM</label>
                  <input
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                    placeholder="e.g. PC"
                    value={form.uom || ''}
                    onChange={(e) => setForm({ ...form, uom: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Qty on Hand</label>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                    value={form.qty_on_hand ?? ''}
                    onChange={(e) => setForm({ ...form, qty_on_hand: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Reorder Lvl</label>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                    value={form.reorder_level ?? ''}
                    onChange={(e) => setForm({ ...form, reorder_level: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Unit Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                    value={form.unit_cost ?? ''}
                    onChange={(e) => setForm({ ...form, unit_cost: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Selling Price</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                    value={form.selling_price ?? ''}
                    onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

          {tab === 'categories' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Category Name *</label>
                <input
                  className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                  placeholder="Name"
                  value={form.name || ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Description</label>
                <textarea
                  className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)] h-20 resize-none"
                  placeholder="Details..."
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </>
          )}

          {tab === 'stock-moves' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Select Item *</label>
                <select
                  className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                  value={form.item || ''}
                  onChange={(e) => setForm({ ...form, item: e.target.value })}
                >
                  <option value="">Select Item</option>
                  {itemsList.map((itm) => (
                    <option key={itm.id} value={itm.id}>{itm.sku} - {itm.name} ({itm.qty_on_hand} {itm.uom} on hand)</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Adjustment Type *</label>
                  <select
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                    value={form.move_type || 'IN'}
                    onChange={(e) => setForm({ ...form, move_type: e.target.value })}
                  >
                    <option value="IN">Increase Stock (IN)</option>
                    <option value="OUT">Decrease Stock (OUT)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Quantity *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                    value={form.qty || ''}
                    onChange={(e) => setForm({ ...form, qty: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Reference / Document No.</label>
                <input
                  className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                  placeholder="e.g. PO-001, Adjustment"
                  value={form.reference || ''}
                  onChange={(e) => setForm({ ...form, reference: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Notes</label>
                <textarea
                  className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)] h-20 resize-none"
                  placeholder="Reason for adjustment..."
                  value={form.notes || ''}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
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
              {tab === 'items' && (
                <>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">SKU</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Name</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Category</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Warehouse</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Qty On Hand</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Unit Cost</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Price</th>
                </>
              )}
              {tab === 'categories' && (
                <>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">ID</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Name</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Description</th>
                </>
              )}
              {tab === 'stock-moves' && (
                <>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Date</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Item</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Type</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Qty</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Reference</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Notes</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {(rows || []).slice(0, 50).map((r) => (
              <tr key={r.id} className="hover:bg-black/[0.01]">
                {tab === 'items' && (
                  <>
                    <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{r.sku}</td>
                    <td className="px-6 py-4 text-[var(--color-ink)]">{r.name}</td>
                    <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.category_name || r.category}</td>
                    <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.warehouse}</td>
                    <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{r.qty_on_hand} {r.uom}</td>
                    <td className="px-6 py-4 text-[var(--color-ink-secondary)]">${parseFloat(r.unit_cost).toFixed(2)}</td>
                    <td className="px-6 py-4 text-[var(--color-ink)] font-semibold">${parseFloat(r.selling_price).toFixed(2)}</td>
                  </>
                )}
                {tab === 'categories' && (
                  <>
                    <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{r.id}</td>
                    <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{r.name}</td>
                    <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.description || '—'}</td>
                  </>
                )}
                {tab === 'stock-moves' && (
                  <>
                    <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{String(r.created_at || '').slice(0, 16).replace('T', ' ')}</td>
                    <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{r.item_sku} - {r.item_name}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${
                        r.move_type === 'IN'
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
                          : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'
                      }`}>
                        {r.move_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{r.qty}</td>
                    <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.reference || '—'}</td>
                    <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.notes || '—'}</td>
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
