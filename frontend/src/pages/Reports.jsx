import { useState, useEffect } from 'react';
import * as api from '../lib/api.js';

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

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-ink)]">Reports</h2>
        <p className="text-sm text-[var(--color-ink-secondary)]">Ledger, trial balance, and financial summaries.</p>
      </div>
      <div className="flex gap-2">
        {['general-ledger', 'trial-balance', 'financial-reports'].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${tab===t?'bg-black text-white':'bg-black/5 text-[var(--color-ink-secondary)] hover:bg-black/10'}`}>{t}</button>
        ))}
      </div>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="overflow-auto rounded-2xl border border-[var(--color-border)] bg-white p-4">
        <pre className="text-xs text-[var(--color-ink-secondary)]">{JSON.stringify(data, null, 2)}</pre>
      </div>
    </div>
  );
}
