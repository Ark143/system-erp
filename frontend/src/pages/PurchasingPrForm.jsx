import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../lib/api.js';

export default function PurchasingPrForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id && id !== 'new';
  const [form, setForm] = useState({ required_date: new Date().toISOString().slice(0, 10) });
  const [lines, setLines] = useState([{ item: '', qty: 1, unit_cost: 0 }]);
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const itemData = await api.inventory.items.list();
        if (!cancelled) setItems(itemData);
        if (isEdit && id) {
          const data = await api.purchasing.prs.get(id).then(r => r.data).catch(() => null);
          if (!cancelled && data) {
            setForm({
              pr_no: data.pr_no || '',
              department: data.department || '',
              required_date: data.required_date || '',
              notes: data.notes || '',
              status: data.status || 'DRAFT'
            });
            const nested = await api.getList('/purchasing/purchase-requisition-items/', { pr: id });
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
    if (!form.pr_no || !form.department || !form.required_date) {
      setError('Please enter PR No., Department, and Required Date.');
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
        pr_no: form.pr_no,
        department: form.department,
        required_date: form.required_date,
        notes: form.notes || '',
        status: form.status || 'DRAFT'
      };
      let prId;
      if (isEdit && id) {
        const res = await api.purchasing.prs.update(id, payload);
        prId = id;
      } else {
        const res = await api.purchasing.prs.create(payload);
        prId = res.id;
      }
      const existing = await api.getList('/purchasing/purchase-requisition-items/', { pr: prId }).catch(() => []);
      for (const existingItem of existing) {
        await api.request(`/purchasing/purchase-requisition-items/${existingItem.id}/`, { method: 'DELETE' });
      }
      for (const line of filteredLines) {
        await api.purchasing.prItems.create({
          pr: prId,
          item: parseInt(line.item),
          qty: parseFloat(line.qty),
          unit_cost: parseFloat(line.unit_cost),
          line_total: parseFloat(line.qty) * parseFloat(line.unit_cost)
        });
      }
      navigate('/purchasing/prs');
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'SAVE_FAILED');
    } finally {
      setSaving(false);
    }
  };

  const field = (label, input) => (
    <div>
      <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">{label}</label>
      {input}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--color-border)] pb-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-ink)]">{isEdit ? 'Edit PR' : 'New Purchase Requisition'}</h2>
          <p className="text-sm text-[var(--color-ink-secondary)]">Full-screen form with request details and item lines.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(-1)} className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-ink-secondary)] hover:bg-black/5 transition">Back</button>
          <button onClick={doSave} disabled={saving} className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-medium">{error}</div>}

      <div className="rounded-2xl border border-[var(--color-border)] bg-white shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('PR No *', (
            <input className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" placeholder="PR-0001" value={form.pr_no || ''} onChange={(e) => setForm({ ...form, pr_no: e.target.value })} />
          ))}
          {field('Requesting Department *', (
            <input className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" placeholder="IT, Finance, Ops" value={form.department || ''} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          ))}
          {field('Required Date *', (
            <input type="date" className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.required_date || ''} onChange={(e) => setForm({ ...form, required_date: e.target.value })} />
          ))}
          {field('Status', (
            <select className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.status || 'DRAFT'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="DRAFT">DRAFT</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          ))}
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Notes / Description</label>
          <textarea className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)] h-20 resize-none" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>

        <div className="border-t border-[var(--color-border)] pt-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]">Items to Procure</h4>
            <button onClick={addLine} className="text-xs font-semibold text-[var(--color-apple-blue)] hover:underline">+ Add Line</button>
          </div>
          <div className="space-y-2">
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
                  <label className="block text-[10px] font-bold text-[var(--color-ink-secondary)] mb-1">Est. Cost</label>
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
