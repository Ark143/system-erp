import { useState, useEffect, useRef } from 'react';
import * as api from '../lib/api.js';
import Modal from '../components/Modal.jsx';

function generateTemplate(type) {
  const headers = { taxes: ['tax_name','tax_rate','is_recoverable'], customers: ['customer_name','email','phone','address'], suppliers: ['supplier_name','email','phone','address'], leads: ['lead_name','email','phone','status','notes'], employees: ['full_name','email','phone','department','job_title','hire_date'] }[type] || [];
  const sample = { taxes: 'VAT,12.00,true', customers: 'Acme Inc,acme@example.com,+639000000000,123 Street', suppliers: 'Supplier A,a@b.com,+639000000001,456 Road', leads: 'Lead Name,lead@example.com,+639000000002,NEW,Interested', employees: 'Juan Dela Cruz,juan@example.com,+639000000003,Sales,Sales Rep,2024-01-01' }[type] || '';
  const csv = [headers.join(','), sample].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${type}_import_template.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function MasterData() {
  const [tab, setTab] = useState('customers');
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const load = async () => {
    setError('');
    try {
      if (tab === 'taxes') setRows(await api.masterdata.taxes.list());
      else if (tab === 'customers') setRows(await api.masterdata.customers.list());
      else if (tab === 'suppliers') setRows(await api.masterdata.suppliers.list());
      else if (tab === 'leads') setRows(await api.masterdata.leads.list());
      else if (tab === 'employees') setRows(await api.masterdata.employees.list());
    } catch (e) { setError(e?.response?.data?.detail || 'LOAD_FAILED'); }
  };

  useEffect(() => { load(); }, [tab]);

  const doCreate = async () => {
    try {
      if (tab === 'taxes') await api.masterdata.taxes.create(form);
      else if (tab === 'customers') await api.masterdata.customers.create(form);
      else if (tab === 'suppliers') await api.masterdata.suppliers.create(form);
      else if (tab === 'leads') await api.masterdata.leads.create(form);
      else if (tab === 'employees') await api.masterdata.employees.create(form);
      setOpen(false);
      setForm({});
      load();
    } catch (e) { setError(e?.response?.data?.detail || e.message); }
  };

  const doImport = async (file) => {
    setError('');
    try {
      const text = await file.text();
      const lines = text.split('\n').filter((l) => l.trim());
      const headers = lines[0].split(',');
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        const payload = {};
        headers.forEach((h, idx) => payload[h.trim()] = cols[idx]?.trim() || '');
        if (tab === 'taxes') await api.masterdata.taxes.create(payload);
        else if (tab === 'customers') await api.masterdata.customers.create(payload);
        else if (tab === 'suppliers') await api.masterdata.suppliers.create(payload);
        else if (tab === 'leads') await api.masterdata.leads.create(payload);
        else if (tab === 'employees') await api.masterdata.employees.create(payload);
      }
      load();
    } catch (e) { setError(e?.response?.data?.detail || 'IMPORT_FAILED'); }
  };

  const importFields = { taxes: ['tax_name','tax_rate','is_recoverable'], customers: ['customer_name','email','phone','address'], suppliers: ['supplier_name','email','phone','address'], leads: ['lead_name','email','phone','status','notes'], employees: ['full_name','email','phone','department','job_title','hire_date'] }[tab] || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-ink)]">Master Data</h2>
          <p className="text-sm text-[var(--color-ink-secondary)]">Import or manage master records.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => generateTemplate(tab)} className="rounded-xl bg-black/5 px-4 py-2 text-sm font-semibold text-[var(--color-ink-secondary)] hover:bg-black/10">Template</button>
          <button onClick={() => fileRef.current?.click()} className="rounded-xl bg-black/5 px-4 py-2 text-sm font-semibold text-[var(--color-ink-secondary)] hover:bg-black/10">Import</button>
          <button onClick={() => { setError(''); setForm({}); setOpen(true); }} className="rounded-xl bg-[var(--color-apple-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">New</button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files[0]; if (f) doImport(f); }} />
        </div>
      </div>
      <div className="flex gap-2">
        {['taxes','customers','suppliers','leads','employees','import'].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${tab===t?'bg-black text-white':'bg-black/5 text-[var(--color-ink-secondary)] hover:bg-black/10'}`}>{t}</button>
        ))}
      </div>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {tab !== 'import' ? (
      <Modal open={open} title={`New ${tab.replace('-',' ')}`} onClose={() => setOpen(false)}>
        <div className="space-y-3">
          {importFields.map((f) => (
            <input key={f} className="w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" placeholder={f} value={form[f]||''} onChange={(e) => setForm({...form,[f]:e.target.value})} />
          ))}
          <button onClick={doCreate} className="w-full rounded-xl bg-black p-3 text-sm font-semibold text-white hover:opacity-90">Create</button>
        </div>
      </Modal>
      ) : (
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 text-sm text-[var(--color-ink-secondary)]">Use Template to download a CSV, populate it, then Import. Uses tab-separated values for compatibility.</div>
      )}

      <div className="rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead><tr className="border-b border-[var(--color-border)]">
            {importFields.map((f) => <th key={f} className="px-6 py-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-secondary)]">{f}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {(rows || []).slice(0, 20).map((r) => (
              <tr key={r.id} className="hover:bg-black/[0.02]">
                {importFields.map((f) => <td key={f} className="px-6 py-3 text-[var(--color-ink)]">{String(r[f] ?? '—')}</td>)}
              </tr>
            ))}
            {!rows?.length && <tr><td colSpan={importFields.length} className="px-6 py-10 text-center text-[var(--color-ink-secondary)]">No records</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
