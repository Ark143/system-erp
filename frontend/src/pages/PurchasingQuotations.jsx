import { useState, useEffect, useNavigate } from 'react';
import * as api from '../lib/api.js';

export default function PurchasingQuotations() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    setError('');
    try {
      setRows(await api.purchasing.quotations.list());
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'LOAD_FAILED');
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-ink)]">Quotations</h2>
          <p className="text-sm text-[var(--color-ink-secondary)]">Purchase quotations list.</p>
        </div>
        <button onClick={() => navigate('/purchasing/quotations/new')} className="rounded-xl bg-[var(--color-apple-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition">Create Quotation</button>
      </div>
      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-medium">{error}</div>
      )}
      <div className="mt-4 space-y-3">
        {(rows || []).slice(0, 50).map((r) => (
          <div key={r.id} className="rounded-2xl border border-[var(--color-border)] p-4 bg-[var(--color-card)]">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-ink)]">{r.quotation_number || r.id}</h3>
                <p className="text-xs text-[var(--color-ink-secondary)]">{r.vendor_name || r.supplier_name || '—'} • {r.quotation_date || ''}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigate(`/purchasing/quotations/${r.id}`)} className="rounded-lg bg-black/5 px-3 py-1.5 text-xs font-semibold hover:bg-black/10 transition">View</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
