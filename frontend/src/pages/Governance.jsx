import { useState, useEffect } from 'react';
import { governance } from '../lib/api.js';
import Modal from '../components/Modal.jsx';

const TABS = [
  { key: 'companies', label: 'Companies' },
  { key: 'branches', label: 'Branches' },
  { key: 'warehouses', label: 'Warehouses' },
  { key: 'item-categories', label: 'Item Categories' },
  { key: 'decimal-configs', label: 'Decimal Configs' },
  { key: 'gl-default-accounts', label: 'GL Default Accounts' },
  { key: 'currencies', label: 'Currencies' },
  { key: 'exchange-rates', label: 'Exchange Rates' },
  { key: 'fiscal-periods', label: 'Fiscal Periods' },
  { key: 'module-period-locks', label: 'Module Period Locks' },
  { key: 'stock-balances', label: 'Stock Balances' },
  { key: 'inventory-journals', label: 'Inventory Journals' },
  { key: 'cycle-counts', label: 'Cycle Counts' },
  { key: 'cycle-count-items', label: 'Cycle Count Items' },
  { key: 'audit-trails', label: 'Audit Trails' },
  { key: 'roles', label: 'Roles' },
  { key: 'company-users', label: 'Company Users' },
  { key: 'permissions', label: 'Permissions' },
  { key: 'role-permissions', label: 'Role Permissions' },
  { key: 'inventory-cost-layers', label: 'Inventory Cost Layers' },
];

export default function Governance() {
  const [tab, setTab] = useState('companies');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await governance[tab].list({});
      setRecords(Array.isArray(res) ? res : []);
    } catch (e) {
      setRecords([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [tab]);

  const titleMap = {
    companies: 'company_name',
    branches: 'branch_name',
    warehouses: 'warehouse_name',
    'item-categories': 'category_name',
    'decimal-configs': 'config_id',
    'gl-default-accounts': 'config_id',
    currencies: 'currency_id',
    'exchange-rates': 'rate_id',
    'fiscal-periods': 'period_name',
    'module-period-locks': 'lock_id',
    'stock-balances': 'balance_id',
    'inventory-journals': 'inv_journal_id',
    'cycle-counts': 'cycle_count_id',
    'cycle-count-items': 'count_item_id',
    'audit-trails': 'audit_id',
    roles: 'role_name',
    'company-users': 'assignment_id',
    permissions: 'permission_id',
    'role-permissions': 'role_permission_id',
    'inventory-cost-layers': 'layer_id',
  };

  const titleField = titleMap[tab] || 'name';

  const idKeysByTab = {
    companies: 'company_id',
    branches: 'branch_id',
    warehouses: 'warehouse_id',
    'item-categories': 'category_id',
    'decimal-configs': 'config_id',
    'gl-default-accounts': 'config_id',
    currencies: 'currency_id',
    'exchange-rates': null,
    'fiscal-periods': 'period_id',
    'module-period-locks': null,
    'stock-balances': null,
    'inventory-journals': null,
    'cycle-counts': null,
    'cycle-count-items': null,
    'audit-trails': null,
    roles: null,
    'company-users': null,
    permissions: 'permission_id',
    'role-permissions': null,
    'inventory-cost-layers': null,
  };

  const idField = idKeysByTab[tab];

  const openCreate = () => {
    setEditId(null);
    setForm({});
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditId(row.id ?? row.pk);
    setForm(row);
    setOpen(true);
  };

  const remove = async (row) => {
    const id = row.id ?? row.pk;
    await governance[tab].remove(id);
    load();
  };

  const save = async () => {
    const payload = { ...form };
    if (!idField) delete payload[idField];
    if (editId) await governance[tab].update(editId, payload);
    else await governance[tab].create(payload);
    setOpen(false);
    load();
  };

  const formFields =
    tab === 'companies'
      ? [
          { key: 'company_id', label: 'Company ID', required: true },
          { key: 'company_name', label: 'Company Name', required: true },
          { key: 'tax_registration_number', label: 'Tax Registration No.' },
          { key: 'base_currency', label: 'Base Currency ID' },
          { key: 'default_valuation_method', label: 'Default Valuation Method' },
          { key: 'is_active', label: 'Active', type: 'checkbox' },
        ]
      : tab === 'branches'
        ? [
            { key: 'branch_id', label: 'Branch ID', required: true },
            { key: 'company', label: 'Company', required: true },
            { key: 'branch_name', label: 'Branch Name', required: true },
            { key: 'branch_timezone', label: 'Timezone' },
          ]
        : tab === 'warehouses'
          ? [
              { key: 'warehouse_id', label: 'Warehouse ID', required: true },
              { key: 'branch', label: 'Branch', required: true },
              { key: 'warehouse_name', label: 'Warehouse Name', required: true },
              { key: 'is_virtual', label: 'Virtual', type: 'checkbox' },
            ]
          : tab === 'item-categories'
            ? [
                { key: 'category_name', label: 'Category Name', required: true },
                { key: 'valuation_method', label: 'Valuation Method' },
                { key: 'is_active', label: 'Active', type: 'checkbox' },
              ]
            : null;

  const showForm = formFields !== null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[var(--color-ink)]">Governance</h2>
        <button
          onClick={openCreate}
          className="rounded-lg bg-[var(--color-apple-blue)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--color-apple-blue-hover)]"
        >
          New Record
        </button>
      </div>
      <div className="flex flex-wrap gap-2 border-b border-[var(--color-border)]">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 pb-3 text-sm font-semibold transition ${
              tab === t.key
                ? 'border-b-2 border-[var(--color-apple-blue)] text-[var(--color-ink)]'
                : 'text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="p-6 text-sm text-[var(--color-ink-secondary)]">Loading...</div>
      ) : records.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] p-10 text-center text-sm text-[var(--color-ink-secondary)]">No records found</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-black/[0.02] text-[var(--color-ink-secondary)]">
              <tr>
                <th className="px-4 py-3 font-medium">{titleField.toUpperCase()}</th>
                <th className="px-4 py-3 font-medium">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {records.map((row) => (
                <tr key={row.id ?? row.pk}>
                  <td className="px-4 py-3 font-medium text-[var(--color-ink)]">{row[titleField]}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button
                        onClick={() => openEdit(row)}
                        className="font-semibold text-[var(--color-apple-blue)] hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove(row)}
                        className="font-semibold text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title={editId ? 'Edit' : 'Create'}>
        {showForm ? (
          <div className="space-y-3">
            {(formFields || []).map((field) => (
              <div key={field.key}>
                <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{field.label}</label>
                <input
                  className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                  value={form[field.key] ?? ''}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                />
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-ink-secondary)] hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                onClick={save}
                className="rounded-lg bg-[var(--color-apple-blue)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-apple-blue-hover)]"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <pre className="rounded-lg border border-[var(--color-border)] bg-black/5 p-3 text-xs">{JSON.stringify(form, null, 2)}</pre>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-ink-secondary)] hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                onClick={save}
                className="rounded-lg bg-[var(--color-apple-blue)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-apple-blue-hover)]"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
