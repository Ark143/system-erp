import { useState, useEffect } from 'react';
import * as api from '../lib/api.js';
import { useExport } from '../lib/reportExport.js';

const TABS = [
  { key: 'general-ledger', label: 'General Ledger', filename: 'general-ledger' },
  { key: 'trial-balance', label: 'Trial Balance', filename: 'trial-balance' },
  { key: 'financial-reports', label: 'Financial Reports', filename: 'financial-reports' },
];

export default function Reports() {
  const [tab, setTab] = useState('general-ledger');
  const [data, setData] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      if (tab === 'general-ledger') setData(await api.reports.generalLedger());
      else if (tab === 'trial-balance') setData(await api.reports.trialBalance());
      else setData(await api.reports.financialReports());
    } catch (e) { setError('LOAD_FAILED'); }
  };

  useEffect(() => { load(); }, [tab]);

  const columns = guessColumns(data);
  const label = TABS.find((t) => t.key === tab)?.label || tab;
  const prefix = TABS.find((t) => t.key === tab)?.filename || 'report';
  const { exportCsv, exportPdf } = useExport(label, columns, Array.isArray(data) ? data : [], prefix);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-ink)]">Reports</h2>
          <p className="text-sm text-[var(--color-ink-secondary)]">Ledger, trial balance, and financial summaries.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-semibold hover:bg-black/5 transition">CSV</button>
          <button onClick={exportPdf} className="rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-semibold hover:bg-black/5 transition">PDF</button>
        </div>
      </div>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${tab===t.key?'bg-black text-white':'bg-black/5 text-[var(--color-ink-secondary)] hover:bg-black/10'}`}>{t.label}</button>
        ))}
      </div>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="overflow-auto rounded-2xl border border-[var(--color-border)] bg-white p-4">
        {Array.isArray(data) && data.length ? (
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-black/[0.01]">
                {columns.map((col) => (
                  <th key={col.key} className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-secondary)]">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-black/[0.01]">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-[var(--color-ink-secondary)]">{String(row[col.key] ?? '')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <pre className="text-xs text-[var(--color-ink-secondary)]">{JSON.stringify(data, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}

function guessColumns(data) {
  if (!Array.isArray(data) || !data.length) return [{ key: 'value', label: 'Value' }];
  const first = data[0];
  if (Array.isArray(first)) return [{ key: 'value', label: 'Value' }];
  return Object.keys(first).map((key) => ({ key, label: String(key).replace(/_/g, ' ').trim() }));
}
