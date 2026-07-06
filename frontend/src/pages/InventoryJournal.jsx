import { useState, useEffect } from 'react';
import * as api from '../lib/api.js';

export default function InventoryJournal() {
  const [rows, setRows] = useState([]);
  const [itemOptions, setItemOptions] = useState([]);
  const [itemSummaries, setItemSummaries] = useState([]);
  const [summary, setSummary] = useState({ transaction_count: 0, total_in: 0, total_out: 0, net_qty: 0, item_count: 0 });
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ item: '', move_type: '', reference: '', start_date: '', end_date: '' });

  const load = async () => {
    setError('');
    try {
      const data = await api.inventory.journal.list(filters);
      const payload = data || {};
      setRows(Array.isArray(payload.rows) ? payload.rows : []);
      setItemSummaries(Array.isArray(payload.items) ? payload.items : []);
      setSummary(payload.summary || { transaction_count: 0, total_in: 0, total_out: 0, net_qty: 0, item_count: 0 });
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'LOAD_FAILED');
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const list = await api.inventory.items.list({ page_size: 100 });
        const mapped = Array.isArray(list) ? list : (list && Array.isArray(list.results) ? list.results : []);
        setItemOptions(mapped);
      } catch (e) {
        console.error('Failed to load items for journal', e);
      }
    })();
  }, []);

  useEffect(() => {
    load();
  }, []);

  const onChange = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  const fmt = (n) => `${parseFloat(n || 0).toFixed(2)} ${Number.isInteger(Number(n)) ? '' : ''}`;
  const fmtNum = (n) => `${parseFloat(n || 0).toFixed(2)}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--color-border)] pb-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-ink)]">Inventory Journal</h2>
          <p className="text-sm text-[var(--color-ink-secondary)]">Transactional inventory ledger with subtotal and summary.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            className="w-40 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-2.5 text-sm"
            value={filters.item}
            onChange={(e) => onChange('item', e.target.value)}
          >
            <option value="">All Items</option>
            {(itemOptions || []).map((it) => (
              <option key={it.id} value={it.id}>{it.sku} - {it.name}</option>
            ))}
          </select>
          <select
            className="w-32 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-2.5 text-sm"
            value={filters.move_type}
            onChange={(e) => onChange('move_type', e.target.value)}
          >
            <option value="">All Types</option>
            <option value="IN">In</option>
            <option value="OUT">Out</option>
          </select>
          <input
            className="w-44 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-2.5 text-sm"
            placeholder="Reference"
            value={filters.reference}
            onChange={(e) => onChange('reference', e.target.value)}
          />
          <input
            type="date"
            className="w-36 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-2.5 text-sm"
            value={filters.start_date}
            onChange={(e) => onChange('start_date', e.target.value)}
          />
          <input
            type="date"
            className="w-36 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-2.5 text-sm"
            value={filters.end_date}
            onChange={(e) => onChange('end_date', e.target.value)}
          />
          <button
            onClick={load}
            className="rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition"
          >
            Apply
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-medium">{error}</div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-secondary)]">Transactions</div>
          <div className="text-2xl font-bold text-[var(--color-ink)]">{summary.transaction_count}</div>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-secondary)]">Total In</div>
          <div className="text-2xl font-bold text-emerald-700">{fmtNum(summary.total_in)}</div>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-secondary)]">Total Out</div>
          <div className="text-2xl font-bold text-red-700">{fmtNum(summary.total_out)}</div>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-secondary)]">Net Qty</div>
          <div className="text-2xl font-bold text-[var(--color-ink)]">{fmtNum(summary.net_qty)}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-sm overflow-x-auto">
        <div className="px-6 py-4 border-b border-[var(--color-border)]">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Item Summary</h3>
        </div>
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-black/[0.01]">
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Item</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Opening</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">In</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Out</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Closing</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {(itemSummaries || []).map((it) => (
              <tr key={it.item_id} className="hover:bg-black/[0.01]">
                <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{it.sku} - {it.item_name}</td>
                <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{fmtNum(it.opening)}</td>
                <td className="px-6 py-4 text-emerald-700 font-semibold">{fmtNum(it.in_qty)}</td>
                <td className="px-6 py-4 text-red-700 font-semibold">{fmtNum(it.out_qty)}</td>
                <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{fmtNum(it.closing)}</td>
              </tr>
            ))}
            {!itemSummaries?.length && (
              <tr>
                <td colSpan="10" className="px-6 py-10 text-center text-[var(--color-ink-secondary)] font-medium">No summary records</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-sm overflow-x-auto">
        <div className="px-6 py-4 border-b border-[var(--color-border)]">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Ledger Transactions</h3>
        </div>
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-black/[0.01]">
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Date</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Item</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Warehouse</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Type</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Qty</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Balance</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Reference</th>
              <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {(rows || []).slice(0, 500).map((r) => (
              <tr key={r.id} className="hover:bg-black/[0.01]">
                <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{String(r.created_at || '').slice(0, 16).replace('T', ' ')}</td>
                <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{r.sku} - {r.item_name}</td>
                <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.warehouse}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${r.move_type === 'IN' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'}`}>{r.move_type}</span>
                </td>
                <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{fmtNum(r.qty)}</td>
                <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{fmtNum(r.balance_after)}</td>
                <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.reference || '—'}</td>
                <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.notes || '—'}</td>
              </tr>
            ))}
            {!rows?.length && (
              <tr>
                <td colSpan="10" className="px-6 py-12 text-center text-[var(--color-ink-secondary)] font-medium">No transactions found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
