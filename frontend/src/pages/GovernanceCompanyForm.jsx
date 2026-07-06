import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as api from '../lib/api.js';

export default function GovernanceCompanyForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const blank = {
    company_name: '',
    abbreviation: '',
    parent_company: '',
    is_group: false,
    default_currency: '',
    country: '',
    tax_id: '',
    date_of_incorporation: '',
    default_bank_account: '',
    default_cash_account: '',
    default_receivable_account: '',
    default_payable_account: '',
    default_valuation_method: '',
    default_stock_warehouse: '',
    default_manufacturing_warehouse: '',
  };

  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [parents, setParents] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [currencies, setCurrencies] = useState([]);

  const loadDeps = async () => {
    try {
      const [parentList, whList, currList] = await Promise.all([
        api.governance.companies.list().catch(() => []),
        api.governance.warehouses.list().catch(() => []),
        api.governance.currencies.list().catch(() => []),
      ]);
      setParents(Array.isArray(parentList) ? parentList : []);
      setWarehouses(Array.isArray(whList) ? whList : []);
      setCurrencies(Array.isArray(currList) ? currList : []);
    } catch (e) {
      // soft fail
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadDeps();
      if (cancelled || !isEdit) return;
      try {
        const data = await api.governance.companies.get(id);
        if (!cancelled) {
          setForm({
            company_name: data.company_name || data.name || '',
            abbreviation: data.abbreviation || '',
            parent_company: data.parent_company || data.parent_company_id || '',
            is_group: !!data.is_group,
            default_currency: data.default_currency || data.base_currency || '',
            country: data.country || '',
            tax_id: data.tax_id || data.tax_registration_number || '',
            date_of_incorporation: data.date_of_incorporation ? String(data.date_of_incorporation).slice(0, 10) : '',
            default_bank_account: data.default_bank_account || '',
            default_cash_account: data.default_cash_account || '',
            default_receivable_account: data.default_receivable_account || '',
            default_payable_account: data.default_payable_account || '',
            default_valuation_method: data.default_valuation_method || '',
            default_stock_warehouse: data.default_stock_warehouse || '',
            default_manufacturing_warehouse: data.default_manufacturing_warehouse || '',
          });
        }
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.detail || e.message || 'LOAD_FAILED');
      }
    })();
    return () => { cancelled = true; };
  }, [id, isEdit]);

  const doSave = async () => {
    setError('');
    if (!form.company_name.trim()) {
      setError('Company Name is required.');
      return;
    }
    if (!isEdit && !form.abbreviation.trim()) {
      setError('Abbreviation is required.');
      return;
    }
    if (form.abbreviation && !/^[A-Z0-9]{2,5}$/i.test(form.abbreviation.trim())) {
      setError('Abbreviation must be 2 to 5 characters.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        company_name: form.company_name,
        abbreviation: form.abbreviation || undefined,
        parent_company: form.parent_company || undefined,
        is_group: form.is_group,
        default_currency: form.default_currency || undefined,
        country: form.country || undefined,
        tax_id: form.tax_id || undefined,
        date_of_incorporation: form.date_of_incorporation || undefined,
        default_bank_account: form.default_bank_account || undefined,
        default_cash_account: form.default_cash_account || undefined,
        default_receivable_account: form.default_receivable_account || undefined,
        default_payable_account: form.default_payable_account || undefined,
        default_valuation_method: form.default_valuation_method || undefined,
        default_stock_warehouse: form.default_stock_warehouse || undefined,
        default_manufacturing_warehouse: form.default_manufacturing_warehouse || undefined,
      };
      if (isEdit) {
        await api.governance.companies.update(id, payload);
        navigate('/governance/companies');
      } else {
        const created = await api.governance.companies.create(payload);
        navigate(`/governance/companies/${created.id}`);
      }
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
          <h2 className="text-xl font-bold text-[var(--color-ink)]">{isEdit ? 'Edit Company' : 'New Company'}</h2>
          <p className="text-sm text-[var(--color-ink-secondary)]">Company defaults and bookkeeping configuration.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(-1)} className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-ink-secondary)] hover:bg-[var(--color-muted)] transition">Back</button>
          <button onClick={doSave} disabled={saving} className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-60">{saving ? 'Saving...' : 'Confirm'}</button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-medium">{error}</div>}

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-sm p-6">
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-ink-secondary)]">Identity & Structure</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Company Name *</label>
              <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Abbreviation *</label>
              <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" placeholder="2-5 chars" value={form.abbreviation} onChange={(e) => setForm({ ...form, abbreviation: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Parent Company</label>
              <select className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.parent_company} onChange={(e) => setForm({ ...form, parent_company: e.target.value })}>
                <option value="">None</option>
                {(parents || []).map((p) => (
                  <option key={p.id} value={p.id}>{p.company_name || p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] p-3">
              <input id="is_group" type="checkbox" className="h-4 w-4 rounded border-[var(--color-border)]" checked={!!form.is_group} onChange={(e) => setForm({ ...form, is_group: e.target.checked })} />
              <label htmlFor="is_group" className="text-sm font-medium text-[var(--color-ink)]">Is Group</label>
            </div>
          </div>

          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-ink-secondary)] pt-4">Defaults & Localization</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Default Currency</label>
              <select className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.default_currency} onChange={(e) => setForm({ ...form, default_currency: e.target.value })}>
                <option value="">Select Currency</option>
                {(currencies || []).map((c) => (
                  <option key={c.id} value={c.currency_id || c.id}>{c.currency_id || c.id}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Country</label>
              <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Tax ID / EIN</label>
              <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.tax_id} onChange={(e) => setForm({ ...form, tax_id: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Date of Incorporation</label>
              <input type="date" className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.date_of_incorporation} onChange={(e) => setForm({ ...form, date_of_incorporation: e.target.value })} />
            </div>
          </div>

          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-ink-secondary)] pt-4">Default Accounts</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Default Bank Account</label>
              <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.default_bank_account} onChange={(e) => setForm({ ...form, default_bank_account: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Default Cash Account</label>
              <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.default_cash_account} onChange={(e) => setForm({ ...form, default_cash_account: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Default Receivable Account</label>
              <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.default_receivable_account} onChange={(e) => setForm({ ...form, default_receivable_account: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Default Payable Account</label>
              <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.default_payable_account} onChange={(e) => setForm({ ...form, default_payable_account: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Stock Valuation Method</label>
              <select className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.default_valuation_method} onChange={(e) => setForm({ ...form, default_valuation_method: e.target.value })}>
                <option value="">Select Method</option>
                <option value="FIFO">FIFO</option>
                <option value="AVCO">Moving Average (AVCO)</option>
                <option value="LIFO">LIFO</option>
                <option value="STANDARD">Standard</option>
              </select>
            </div>
          </div>

          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-ink-secondary)] pt-4">Warehouses & Manufacturing</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Default Stock Warehouse</label>
              <select className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.default_stock_warehouse} onChange={(e) => setForm({ ...form, default_stock_warehouse: e.target.value })}>
                <option value="">Select Warehouse</option>
                {(warehouses || []).map((w) => (
                  <option key={w.id} value={w.id}>{w.warehouse_name || w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Default Manufacturing Warehouse</label>
              <select className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.default_manufacturing_warehouse} onChange={(e) => setForm({ ...form, default_manufacturing_warehouse: e.target.value })}>
                <option value="">Select Warehouse</option>
                {(warehouses || []).map((w) => (
                  <option key={w.id} value={w.id}>{w.warehouse_name || w.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
