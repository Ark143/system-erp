import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as api from '../lib/api.js';

export default function InventoryStockMoveForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [itemsList, setItemsList] = useState([]);
  const [form, setForm] = useState({
    item: '',
    move_type: 'IN',
    qty: '',
    reference: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const items = await api.inventory.items.list({ page_size: 200 }).catch(() => []);
        if (!cancelled) setItemsList(Array.isArray(items) ? items : []);
      } catch (e) {
        if (!cancelled) setError('Failed to load items');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const doSave = async () => {
    setError('');
    if (!form.item || !String(form.qty).trim()) {
      setError('Please select an Item and enter Quantity.');
      return;
    }
    setSaving(true);
    try {
      await api.inventory.items.adjust(parseInt(form.item), {
        move_type: form.move_type,
        qty: parseFloat(form.qty),
        reference: form.reference || '',
        notes: form.notes || '',
      });
      navigate('/inventory/stock-moves');
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'SAVE_FAILED');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--color-border)] pb-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-ink)]">New Stock Adjustment</h2>
          <p className="text-sm text-[var(--color-ink-secondary)]">Adjust stock quantity with a move type.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(-1)} className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-ink-secondary)] hover:bg-[var(--color-muted)] transition">Back</button>
          <button onClick={doSave} disabled={saving} className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-60">{saving ? 'Saving...' : 'Confirm'}</button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-medium">{error}</div>}

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-sm p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Select Item *</label>
            <select className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })}>
              <option value="">Select Item</option>
              {itemsList.map((itm) => (
                <option key={itm.id} value={itm.id}>{itm.sku} - {itm.name} ({itm.qty_on_hand} {itm.uom} on hand)</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Adjustment Type *</label>
            <select className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.move_type} onChange={(e) => setForm({ ...form, move_type: e.target.value })}>
              <option value="IN">Increase Stock (IN)</option>
              <option value="OUT">Decrease Stock (OUT)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Quantity *</label>
            <input type="number" step="0.01" className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Reference / Document No.</label>
            <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" placeholder="e.g. PO-001, Adjustment" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Notes</label>
            <textarea className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)] h-28 resize-none" placeholder="Reason for adjustment..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
      </div>
    </div>
  );
}
