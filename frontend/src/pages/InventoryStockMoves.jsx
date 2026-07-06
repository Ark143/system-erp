import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../lib/api.js';

export default function InventoryStockMoves() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [moveTypeFilter, setMoveTypeFilter] = useState('');
  const [customFilters, setCustomFilters] = useState([]);
  const [selectedField, setSelectedField] = useState('move_type');
  const [selectedValue, setSelectedValue] = useState('');
  const navigate = useNavigate();

  const FIELDS = [
    { key: 'move_type', label: 'Move Type', type: 'text' },
    { key: 'item_sku', label: 'Item SKU', type: 'text' },
    { key: 'item_name', label: 'Item Name', type: 'text' },
    { key: 'reference', label: 'Reference', type: 'text' },
    { key: 'notes', label: 'Notes', type: 'text' },
    { key: 'qty', label: 'Qty', type: 'number' },
    { key: 'date', label: 'Date', type: 'text' },
  ];

  const fieldDefinition = (key) => FIELDS.find((item) => item.key === key) || { key, label: key, type: 'text' };

  const applyCustomFilters = (items) => {
    if (!Array.isArray(items)) return items;
    return items.filter((r) => {
      return customFilters.every((f) => {
        const def = fieldDefinition(f.field);
        const raw = f.value ?? '';
        const q = String(raw).trim();
        if (q === '') return true;

        let target = '';
        if (f.field === 'date') target = String(r.created_at || '').slice(0, 10);
        else if (f.field === 'move_type') target = String(r.move_type || '');
        else target = String(r[f.field] || '');

        const qn = String(q).toLowerCase();
        switch (f.mode) {
          case 'eq': return target.toLowerCase() === qn;
          case 'starts': return target.toLowerCase().startsWith(qn);
          default: return target.toLowerCase().includes(qn);
        }
      });
    });
  };

  const load = async () => {
    setError('');
    try {
      const data = await api.inventory.stockMoves.list({ page_size: 100 }).catch(() => []);
      let items = Array.isArray(data) ? data : [];

      if (moveTypeFilter) {
        const q = String(moveTypeFilter).toUpperCase();
        items = items.filter((r) => String(r.move_type || '').toUpperCase() === q);
      }

      items = applyCustomFilters(items);
      setRows(items);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'LOAD_FAILED');
    }
  };

  useEffect(() => {
    load();
  }, [moveTypeFilter, customFilters]);

  const addFilter = () => {
    const value = String(selectedValue || '').trim();
    if (!value) return;
    setCustomFilters((s) => [...s, { field: selectedField, value, mode: 'contains', id: crypto.randomUUID() }]);
    setSelectedValue('');
  };

  const removeFilter = (id) => setCustomFilters((s) => s.filter((f) => f.id !== id));

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--color-border)] pb-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--color-ink)]">Stock Moves</h2>
            <p className="text-sm text-[var(--color-ink-secondary)]">Transaction history and stock adjustments.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setFilterOpen((v) => !v)} className={`rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold transition ${filterOpen ? 'bg-[var(--color-muted)]' : 'hover:bg-[var(--color-muted)]'}`}>Filter</button>
            <button onClick={() => navigate('/inventory/stock-moves/new')} className="rounded-xl bg-[var(--color-apple-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition">New Adjustment</button>
          </div>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-medium">{error}</div>}

        {filterOpen && (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-sm p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Field</label>
                <select className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={selectedField} onChange={(e) => setSelectedField(e.target.value)}>
                  {FIELDS.map((item) => (
                    <option key={item.key} value={item.key}>{item.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Value</label>
                <input value={selectedValue} onChange={(e) => setSelectedValue(e.target.value)} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" placeholder="Enter filter value" />
              </div>
              <div className="flex items-end gap-2">
                <button onClick={addFilter} className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--color-muted)] transition">Add</button>
                <button onClick={() => { setMoveTypeFilter(''); setCustomFilters([]); }} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 transition">Clear</button>
              </div>
            </div>

            {(customFilters || []).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {customFilters.map((f) => (
                  <span key={f.id} className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink-secondary)]">
                    <span className="font-semibold">{fieldDefinition(f.field).label}</span>
                    <span>:</span>
                    <span>{f.value}</span>
                    <button onClick={() => removeFilter(f.id)} className="font-bold text-red-700 hover:underline">remove</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-sm overflow-x-auto">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Date</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Item</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Type</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Qty</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Reference</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {(rows || []).slice(0, 100).map((r) => (
                <tr key={r.id} className="hover:bg-[var(--color-muted)]">
                  <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{String(r.created_at || '').slice(0, 16).replace('T', ' ')}</td>
                  <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{r.item_sku} - {r.item_name}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${r.move_type === 'IN' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'}`}>
                      {r.move_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{r.qty || 0}</td>
                  <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.reference || '—'}</td>
                  <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.notes || '—'}</td>
                </tr>
              ))}
              {!rows?.length && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-[var(--color-ink-secondary)] font-medium">No records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
