import { useState, useEffect } from 'react';
import * as api from '../lib/api.js';
import { useExport } from '../lib/reportExport.js';

const COLUMNS = [
  { key: 'created_at', label: 'Date' },
  { key: 'sku', label: 'SKU' },
  { key: 'item_name', label: 'Item' },
  { key: 'uom', label: 'UOM' },
  { key: 'warehouse', label: 'Warehouse' },
  { key: 'move_type', label: 'Type' },
  { key: 'qty', label: 'Qty' },
  { key: 'balance_after', label: 'Balance' },
  { key: 'reference', label: 'Reference' },
  { key: 'created_by', label: 'User' },
];

const SUMMARY_COLUMNS = [
  { key: 'sku', label: 'SKU' },
  { key: 'item_name', label: 'Item' },
  { key: 'uom', label: 'UOM' },
  { key: 'warehouse', label: 'Warehouse' },
  { key: 'opening', label: 'Opening' },
  { key: 'in_qty', label: 'In' },
  { key: 'out_qty', label: 'Out' },
  { key: 'closing', label: 'Closing' },
];

export default function InventoryStockBalances() {
  const [summary, setSummary] = useState({});
  const [items, setItems] = useState([]);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [includeHistory, setIncludeHistory] = useState(false);
  const [view, setView] = useState('summary');
  const [filters, setFilters] = useState({ item: '', warehouse: '' });
  const [itemOptions, setItemOptions] = useState([]);

  const exportLabel = 'Inventory Stock Balances';
  const summaryExport = useExport('Stock Balance Summary', SUMMARY_COLUMNS, items, 'stock-balance-summary');
  const historyExport = useExport('Stock Movement History', COLUMNS, rows, 'stock-balance-history');

  const load = async () => {
    setError('');
    try {
      const data = await api.inventory.stockBalances.list({ ...filters, include_history: includeHistory ? '1' : '0' });
      const payload = data || {};
      setSummary(payload.summary || {});
      setItems(Array.isArray(payload.items) ? payload.items : []);
      setRows(Array.isArray(payload.rows) ? payload.rows : []);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'LOAD_FAILED');
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const list = await api.inventory.items.list({ page_size: 100 });
        const items = Array.isArray(list) ? list : (list && Array.isArray(list.results) ? list.results : []);
        setItemOptions(items);
      } catch (e) {
        console.error('failed to load items', e);
      }
    })();
  }, []);

  useEffect(() => {
    load();
  }, []);

  const onChange = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  const fmt = (n) => `${parseFloat(n || 0).toFixed(2)}`;
  const fmtNum = (n) => `${parseFloat(n || 0).toFixed(2)}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--color-border)] pb-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-ink)]">Stock Balances</h2>
          <p className="text-sm text-[var(--color-ink-secondary)]">Item movement history with balances.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="w-52 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-2.5 text-sm"
            value={filters.item}
            onChange={(e) => onChange('item', e.target.value)}
          >
            <option value="">All Items</option>
            {(itemOptions || []).map((it) => (
              <option key={it.id} value={it.id}>{it.sku} - {it.name}</option>
            ))}
          </select>
          <input
            className="w-36 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-2.5 text-sm"
            placeholder="Warehouse"
            value={filters.warehouse}
            onChange={(e) => onChange('warehouse', e.target.value)}
          />
          <label className="inline-flex items-center gap-2 text-sm text-[var(--color-ink-secondary)]">
            <input type="checkbox" checked={includeHistory} onChange={(e) => setIncludeHistory(e.target.checked)} />
            History
          </label>
          <button onClick={load} className="rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition">Apply</button>
          <button onClick={summaryExport.exportCsv} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm font-semibold hover:bg-black/5 transition">CSV</button>
          <button onClick={summaryExport.exportPdf} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm font-semibold hover:bg-black/5 transition">PDF</button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-medium">{error}</div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-secondary)]">Transactions</div>
          <div className="text-2xl font-bold text-[var(--color-ink)]">{summary.transaction_count || 0}</div>
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

      <div className="flex gap-2">
        <button
          onClick={() => setView('summary')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${view === 'summary' ? 'bg-black text-white' : 'bg-black/5 text-[var(--color-ink-secondary)] hover:bg-black/10'}`}
        >
          Summary
        </button>
        <button
          onClick={() => setView('history')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${view === 'history' ? 'bg-black text-white' : 'bg-black/5 text-[var(--color-ink-secondary)] hover:bg-black/10'}`}
        >
          History
        </button>
      </div>

      {view === 'summary' ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-sm overflow-x-auto">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-black/[0.01]">
                {SUMMARY_COLUMNS.map((col) => (
                  <th key={col.key} className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {(items || []).map((it) => (
                <tr key={it.item_id} className="hover:bg-black/[0.01]">
                  <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{it.sku}</td>
                  <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{it.item_name}</td>
                  <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{it.uom}</td>
                  <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{it.warehouse}</td>
                  <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{fmt(it.opening)}</td>
                  <td className="px-6 py-4 text-emerald-700 font-semibold">{fmt(it.in_qty)}</td>
                  <td className="px-6 py-4 text-red-700 font-semibold">{fmt(it.out_qty)}</td>
                  <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{fmt(it.closing)}</td>
                </tr>
              ))}
              {!items?.length && (
                <tr>
                  <td colSpan="10" className="px-6 py-10 text-center text-[var(--color-ink-secondary)] font-medium">No stock balance records</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-sm overflow-x-auto">
          <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">History</h3>
            <button onClick={historyExport.exportCsv} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm font-semibold hover:bg-black/5 transition">CSV</button>
            <button onClick={historyExport.exportPdf} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm font-semibold hover:bg-black/5 transition">PDF</button>
          </div>
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-black/[0.01]">
                {COLUMNS.map((col) => (
                  <th key={col.key} className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {(rows || []).slice(0, 800).map((r) => (
                <tr key={r.id} className="hover:bg-black/[0.01]">
                  <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{typeof r.created_at === 'string' ? r.created_at.slice(0,16) : new Date(r.created_at).toISOString().slice(0,16)}</td>
                  <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{r.sku}</td>
                  <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.item_name}</td>
                  <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.uom}</td>
                  <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.warehouse}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${r.move_type === 'IN' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'}`}>{r.move_type}</span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{fmt(r.qty)}</td>
                  <td className="px-6 py-4 font-semibold text-[var(--color-ink)]">{fmt(r.balance_after)}</td>
                  <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.reference || '—'}</td>
                  <td className="px-6 py-4 text-[var(--color-ink-secondary)]">{r.created_by || '—'}</td>
                </tr>
              ))}
              {!rows?.length && (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center text-[var(--color-ink-secondary)] font-medium">No history records</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
