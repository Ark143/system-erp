import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../lib/api.js';

export default function PurchasingPoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id && id !== 'new';
  const [form, setForm] = useState({ po_date: new Date().toISOString().slice(0, 10), uom: 'EA', status: 'DRAFT' });
  const [lines, setLines] = useState([{ item: '', qty: 1, unit_cost: 0 }]);
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [itemData, suppData] = await Promise.all([
          api.inventory.items.list(),
          api.purchasing.suppliers.list()
        ]);
        if (!cancelled) {
          setItems(itemData);
          setSuppliers(suppData);
        }
        if (isEdit && id) {
          const data = await api.purchasing.purchaseOrders.get(id).then(r => r.data).catch(() => null);
          if (!cancelled && data) {
            setForm({
              po_no: data.po_no || '',
              supplier: String(data.supplier || ''),
              po_date: data.po_date || '',
              status: data.status || 'DRAFT',
              delivery_address: data.delivery_address || '',
              notes: data.notes || ''
            });
            const nested = await api.getList('/purchasing/purchase-order-items/', { purchase_order: id });
            if (nested && nested.length) {
              setLines(nested.map(n => ({ item: String(n.item), qty: parseFloat(n.qty), unit_cost: parseFloat(n.unit_cost) })));
            } else {
              setLines([{ item: '', qty: 1, unit_cost: 0 }]);
            }
          }
        }
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.detail || e.message || 'LOAD_FAILED');
      }
    })();
    return () => { cancelled = true; };
  }, [id, isEdit]);

  const addLine = () => setLines([...lines, { item: '', qty: 1, unit_cost: 0 }]);
  const removeLine = (idx) => setLines(lines.filter((_, i) => i !== idx));
  const updateLine = (idx, field, value) => {
    const updated = [...lines];
    updated[idx][field] = value;
    if (field === 'item') {
      const selectedItem = items.find((it) => it.id === parseInt(value));
      if (selectedItem) updated[idx].unit_cost = parseFloat(selectedItem.unit_cost || 0);
    }
    setLines(updated);
  };

  const doSave = async () => {
    setError('');
    if (!form.po_no || !form.supplier || !form.po_date) {
      setError('Please enter PO No., Supplier, and PO Date.');
      return;
    }
    const filteredLines = lines.filter((l) => l.item && l.qty > 0);
    if (filteredLines.length === 0) {
      setError('Please add at least one valid item line.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        po_no: form.po_no,
        supplier: parseInt(form.supplier),
        po_date: form.po_date,
        status: form.status || 'DRAFT',
        delivery_address: form.delivery_address || '',
        notes: form.notes || ''
      };
      let poId;
      if (isEdit && id) {
        await api.purchasing.purchaseOrders.update(id, payload);
        poId = id;
      } else {
        const res = await api.purchasing.purchaseOrders.create(payload);
        poId = res.id;
      }
      const existing = await api.getList('/purchasing/purchase-order-items/', { purchase_order: poId }).catch(() => []);
      for (const existingItem of existing) {
        await api.request(`/purchasing/purchase-order-items/${existingItem.id}/`, { method: 'DELETE' });
      }
      for (const line of filteredLines) {
        await api.purchasing.poItems.create({
          purchase_order: poId,
          item: parseInt(line.item),
          qty: parseFloat(line.qty),
          unit_cost: parseFloat(line.unit_cost),
          line_total: parseFloat(line.qty) * parseFloat(line.unit_cost)
        });
      }
      navigate('/purchasing');
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
          <h2 className="text-xl font-bold text-[var(--color-ink)]">{isEdit ? 'Edit PO' : 'New Purchase Order'}</h2>
          <p className="text-sm text-[var(--color-ink-secondary)]">Full-screen PO with supplier, dates, and line items.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(-1)} className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-ink-secondary)] hover:bg-black/5 transition">Back</button>
          <button onClick={doSave} disabled={saving} className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-medium">{error}</div>}

      <div className="rounded-2xl border border-[var(--color-border)] bg-white shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">PO No *</label>
            <input className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.po_no || ''} onChange={(e) => setForm({ ...form, po_no: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">PO Date *</label>
            <input type="date" className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.po_date || ''} onChange={(e) => setForm({ ...form, po_date: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Supplier *</label>
            <select className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.supplier || ''} onChange={(e) => setForm({ ...form, supplier: e.target.value })}>
              <option value="">Select Supplier</option>
              {suppliers.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">UOM</label>
            <input className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.uom || 'EA'} onChange={(e) => setForm({ ...form, uom: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Delivery / PO Notes</label>
          <textarea className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)] h-20 resize-none" value={form.delivery_address || form.notes || ''} onChange={(e) => setForm({ ...form, delivery_address: e.target.value, notes: e.target.value })} />
        </div>

        <div className="border-t border-[var(--color-border)] pt-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]">PO Items</h4>
            <button onClick={addLine} className="text-xs font-semibold text-[var(--color-apple-blue)] hover:underline">+ Add Line</button>
          </div>
          <div className="space-y-2 max-h-60 overflow-auto">
            {lines.map((line, idx) => (
              <div key={idx} className="flex gap-2 items-end border border-black/5 p-2 rounded-xl bg-black/[0.01]">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-[var(--color-ink-secondary)] mb-1">Item</label>
                  <select className="w-full rounded-lg border border-[var(--color-border)] bg-white p-2 text-xs outline-none focus:border-[var(--color-apple-blue)]" value={line.item} onChange={(e) => updateLine(idx, 'item', e.target.value)}>
                    <option value="">Select Item</option>
                    {items.map((it) => (<option key={it.id} value={it.id}>{it.sku} - {it.name}</option>))}
                  </select>
                </div>
                <div className="w-16">
                  <label className="block text-[10px] font-bold text-[var(--color-ink-secondary)] mb-1">Qty</label>
                  <input type="number" className="w-full rounded-lg border border-[var(--color-border)] bg-white p-2 text-xs outline-none focus:border-[var(--color-apple-blue)]" value={line.qty} onChange={(e) => updateLine(idx, 'qty', e.target.value)} />
                </div>
                <div className="w-24">
                  <label className="block text-[10px] font-bold text-[var(--color-ink-secondary)] mb-1">Cost</label>
                  <input type="number" step="0.01" className="w-full rounded-lg border border-[var(--color-border)] bg-white p-2 text-xs outline-none focus:border-[var(--color-apple-blue)]" value={line.unit_cost} onChange={(e) => updateLine(idx, 'unit_cost', e.target.value)} />
                </div>
                <button onClick={() => removeLine(idx)} className="text-xs text-red-600 font-semibold p-2 hover:bg-red-50 rounded-lg">Delete</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
