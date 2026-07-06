import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../lib/api.js';

export default function PurchasingGrnForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id && id !== 'new';
  const [form, setForm] = useState({ received_date: new Date().toISOString().slice(0, 10) });
  const [lines, setLines] = useState([{ po: '', item: '', qty_received: 0 }]);
  const [pos, setPos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const poData = await api.purchasing.purchaseOrders.list();
        if (!cancelled) setPos(poData);
        if (isEdit && id) {
          const data = await api.purchasing.grns.get(id).then(r => r.data).catch(() => null);
          if (!cancelled && data) {
            setForm({ received_date: data.received_date || '', notes: data.notes || '' });
          }
        }
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.detail || e.message || 'LOAD_FAILED');
      }
    })();
    return () => { cancelled = true; };
  }, [id, isEdit]);

  const addLine = () => setLines([...lines, { po: '', item: '', qty_received: 0 }]);
  const removeLine = (idx) => setLines(lines.filter((_, i) => i !== idx));
  const updateLine = (idx, field, value) => {
    const updated = [...lines];
    updated[idx][field] = value;
    setLines(updated);
  };

  const doSave = async () => {
    setError('');
    if (!form.received_date) {
      setError('Received date is required.');
      return;
    }
    setSaving(true);
    try {
      let grnId;
      if (isEdit && id) {
        await api.purchasing.grns.update(id, form);
        grnId = id;
      } else {
        const res = await api.purchasing.grns.create(form);
        grnId = res.id;
      }
      navigate('/purchasing/grns');
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
          <h2 className="text-xl font-bold text-[var(--color-ink)]">{isEdit ? 'Edit GRP' : 'New Goods Receipt / GRPO'}</h2>
          <p className="text-sm text-[var(--color-ink-secondary)]">Full-screen GRN/GRPO entry form against POs.</p>
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
            <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Received Date *</label>
            <input type="date" className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.received_date || ''} onChange={(e) => setForm({ ...form, received_date: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Notes</label>
            <input className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>

        <div className="border-t border-[var(--color-border)] pt-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]">Receipt Lines</h4>
            <button onClick={addLine} className="text-xs font-semibold text-[var(--color-apple-blue)] hover:underline">+ Add Line</button>
          </div>
          <div className="space-y-2">
            {lines.map((line, idx) => (
              <div key={idx} className="flex gap-2 items-end border border-black/5 p-2 rounded-xl bg-black/[0.01]">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-[var(--color-ink-secondary)] mb-1">Reference PO</label>
                  <select className="w-full rounded-lg border border-[var(--color-border)] bg-white p-2 text-xs outline-none focus:border-[var(--color-apple-blue)]" value={line.po} onChange={(e) => updateLine(idx, 'po', e.target.value)}>
                    <option value="">Select PO</option>
                    {pos.map((po) => (<option key={po.id} value={po.id}>{po.po_no || po.id}</option>))}
                  </select>
                </div>
                <div className="w-24">
                  <label className="block text-[10px] font-bold text-[var(--color-ink-secondary)] mb-1">Qty Received</label>
                  <input type="number" className="w-full rounded-lg border border-[var(--color-border)] bg-white p-2 text-xs outline-none focus:border-[var(--color-apple-blue)]" value={line.qty_received} onChange={(e) => updateLine(idx, 'qty_received', e.target.value)} />
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
