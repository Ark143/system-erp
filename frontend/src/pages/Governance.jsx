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

const META = {
  companies: {
    titleField: 'company_name',
    idField: 'company_id',
    fields: [
      { key: 'company_id', label: 'Company ID', required: true },
      { key: 'company_name', label: 'Company Name', required: true },
      { key: 'tax_registration_number', label: 'Tax Registration No.' },
      { key: 'base_currency', label: 'Base Currency ID' },
      { key: 'default_valuation_method', label: 'Default Valuation Method' },
      { key: 'unrealized_profit_loss_account', label: 'Unrealized P/L Account' },
      { key: 'is_active', label: 'Active', type: 'checkbox' },
    ],
  },
  branches: {
    titleField: 'branch_name',
    idField: 'branch_id',
    fields: [
      { key: 'branch_id', label: 'Branch ID', required: true },
      { key: 'company', label: 'Company ID', required: true },
      { key: 'branch_name', label: 'Branch Name', required: true },
      { key: 'branch_timezone', label: 'Timezone' },
    ],
  },
  warehouses: {
    titleField: 'warehouse_name',
    idField: 'warehouse_id',
    fields: [
      { key: 'warehouse_id', label: 'Warehouse ID', required: true },
      { key: 'branch', label: 'Branch ID', required: true },
      { key: 'warehouse_name', label: 'Warehouse Name', required: true },
      { key: 'is_virtual', label: 'Virtual', type: 'checkbox' },
    ],
  },
  'item-categories': {
    titleField: 'category_name',
    idField: null,
    fields: [
      { key: 'company', label: 'Company ID' },
      { key: 'category_name', label: 'Category Name', required: true },
      { key: 'valuation_method', label: 'Valuation Method' },
      { key: 'is_active', label: 'Active', type: 'checkbox' },
    ],
  },
  'decimal-configs': {
    titleField: 'config_id',
    idField: 'config_id',
    fields: [
      { key: 'config_id', label: 'Config ID', required: true },
      { key: 'company', label: 'Company ID' },
      { key: 'currency_decimals', label: 'Currency Decimals', type: 'number' },
      { key: 'quantity_decimals', label: 'Quantity Decimals', type: 'number' },
      { key: 'price_decimals', label: 'Price Decimals', type: 'number' },
    ],
  },
  'gl-default-accounts': {
    titleField: 'config_id',
    idField: 'config_id',
    fields: [
      { key: 'config_id', label: 'Config ID', required: true },
      { key: 'company', label: 'Company ID', required: true },
      { key: 'ar_default_account', label: 'AR Default Account' },
      { key: 'ap_default_account', label: 'AP Default Account' },
      { key: 'revenue_default_account', label: 'Revenue Default Account' },
      { key: 'cogs_default_account', label: 'COGS Default Account' },
      { key: 'inventory_asset_account', label: 'Inventory Asset Account' },
      { key: 'tax_payable_account', label: 'Tax Payable Account' },
      { key: 'tax_receivable_account', label: 'Tax Receivable Account' },
      { key: 'fx_gain_loss_account', label: 'FX Gain/Loss Account' },
      { key: 'inventory_adjustment_account', label: 'Inventory Adjustment Account' },
    ],
  },
  currencies: {
    titleField: 'currency_id',
    idField: 'currency_id',
    fields: [
      { key: 'currency_id', label: 'Currency ID', required: true },
      { key: 'currency_symbol', label: 'Symbol' },
    ],
  },
  'exchange-rates': {
    titleField: 'rate_id',
    idField: null,
    fields: [
      { key: 'from_currency', label: 'From Currency', required: true },
      { key: 'to_currency', label: 'To Currency', required: true },
      { key: 'rate_date', label: 'Rate Date', required: true },
      { key: 'exchange_rate', label: 'Exchange Rate', type: 'number', required: true },
    ],
  },
  'fiscal-periods': {
    titleField: 'period_name',
    idField: 'period_id',
    fields: [
      { key: 'period_id', label: 'Period ID', required: true },
      { key: 'company', label: 'Company ID', required: true },
      { key: 'period_name', label: 'Period Name', required: true },
      { key: 'start_date', label: 'Start Date', required: true },
      { key: 'end_date', label: 'End Date', required: true },
      { key: 'is_globally_locked', label: 'Globally Locked', type: 'checkbox' },
    ],
  },
  'module-period-locks': {
    titleField: 'lock_id',
    idField: null,
    fields: [
      { key: 'period', label: 'Period ID', required: true },
      { key: 'module_name', label: 'Module Name', required: true },
      { key: 'is_locked', label: 'Locked', type: 'checkbox' },
    ],
  },
  'stock-balances': {
    titleField: 'balance_id',
    idField: null,
    fields: [
      { key: 'item', label: 'Item ID' },
      { key: 'warehouse', label: 'Warehouse ID' },
      { key: 'quantity_on_hand', label: 'On Hand', type: 'number' },
      { key: 'quantity_reserved', label: 'Reserved', type: 'number' },
      { key: 'quantity_available', label: 'Available', type: 'number' },
      { key: 'average_unit_cost', label: 'Average Unit Cost', type: 'number' },
    ],
  },
  'inventory-journals': {
    titleField: 'inv_journal_id',
    idField: null,
    fields: [
      { key: 'item', label: 'Item ID' },
      { key: 'warehouse', label: 'Warehouse ID' },
      { key: 'cost_layer', label: 'Cost Layer ID' },
      { key: 'source_document_type', label: 'Document Type' },
      { key: 'source_document_id', label: 'Document ID' },
      { key: 'quantity_delta', label: 'Quantity Delta', type: 'number' },
      { key: 'unit_cost', label: 'Unit Cost', type: 'number' },
      { key: 'total_valuation_delta', label: 'Valuation Delta', type: 'number' },
    ],
  },
  'cycle-counts': {
    titleField: 'cycle_count_id',
    idField: null,
    fields: [
      { key: 'warehouse', label: 'Warehouse ID' },
      { key: 'status', label: 'Status' },
      { key: 'scheduled_date', label: 'Scheduled Date' },
    ],
  },
  'cycle-count-items': {
    titleField: 'count_item_id',
    idField: null,
    fields: [
      { key: 'cycle_count', label: 'Cycle Count ID' },
      { key: 'item', label: 'Item ID' },
      { key: 'system_quantity', label: 'System Quantity', type: 'number' },
      { key: 'counted_quantity', label: 'Counted Quantity', type: 'number' },
      { key: 'variance_quantity', label: 'Variance Quantity', type: 'number' },
      { key: 'adjustment_journal_entry_id', label: 'Journal Entry ID' },
    ],
  },
  'audit-trails': {
    titleField: 'audit_id',
    idField: null,
    fields: [
      { key: 'company', label: 'Company ID' },
      { key: 'user', label: 'User ID' },
      { key: 'table_name', label: 'Table Name' },
      { key: 'record_id', label: 'Record ID' },
    ],
  },
  roles: {
    titleField: 'role_name',
    idField: null,
    fields: [
      { key: 'role_name', label: 'Role Name', required: true },
    ],
  },
  'company-users': {
    titleField: 'assignment_id',
    idField: null,
    fields: [
      { key: 'user', label: 'User ID', required: true },
      { key: 'company', label: 'Company ID', required: true },
      { key: 'branch', label: 'Branch ID' },
    ],
  },
  permissions: {
    titleField: 'permission_id',
    idField: 'permission_id',
    fields: [
      { key: 'permission_id', label: 'Permission ID', required: true },
      { key: 'module_name', label: 'Module Name', required: true },
    ],
  },
  'role-permissions': {
    titleField: 'role_permission_id',
    idField: null,
    fields: [
      { key: 'role', label: 'Role ID', required: true },
      { key: 'permission', label: 'Permission ID', required: true },
    ],
  },
  'inventory-cost-layers': {
    titleField: 'layer_id',
    idField: null,
    fields: [
      { key: 'company', label: 'Company ID' },
      { key: 'warehouse', label: 'Warehouse ID' },
      { key: 'item', label: 'Item ID' },
      { key: 'source_receipt_id', label: 'Receipt ID' },
      { key: 'layer_date', label: 'Layer Date' },
      { key: 'received_quantity', label: 'Received Qty', type: 'number' },
      { key: 'remaining_quantity', label: 'Remaining Qty', type: 'number' },
      { key: 'unit_cost', label: 'Unit Cost', type: 'number' },
      { key: 'is_fully_consumed', label: 'Fully Consumed', type: 'checkbox' },
    ],
  },
};

export default function Governance() {
  const [tab, setTab] = useState('companies');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);

  const meta = META[tab];

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

  const openCreate = () => {
    setEditId(null);
    setForm({});
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditId(row.id ?? row.pk);
    setForm({ ...row });
    setOpen(true);
  };

  const remove = async (row) => {
    const id = row.id ?? row.pk;
    await governance[tab].remove(id);
    load();
  };

  const save = async () => {
    const payload = { ...form };
    const idField = meta.idField;
    if (idField && !payload[idField]) delete payload[idField];
    if (editId) await governance[tab].update(editId, payload);
    else await governance[tab].create(payload);
    setOpen(false);
    load();
  };

  const rowKey = (row) => row.id ?? row.pk;

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
                <th className="px-4 py-3 font-medium">{meta.titleField.toUpperCase()}</th>
                <th className="px-4 py-3 font-medium">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {records.map((row) => (
                <tr key={rowKey(row)}>
                  <td className="px-4 py-3 font-medium text-[var(--color-ink)]">{row[meta.titleField]}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => openEdit(row)} className="font-semibold text-[var(--color-apple-blue)] hover:underline">Edit</button>
                      <button onClick={() => remove(row)} className="font-semibold text-red-600 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title={editId ? 'Edit' : 'Create'}>
        {(meta.fields || []).map((field) => (
          <div key={field.key}>
            <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-secondary)]">{field.label}</label>
            <input
              className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-apple-blue)]"
              value={
                field.type === 'checkbox'
                  ? ''
                  : form[field.key] ?? ''
              }
              onChange={(e) => {
                const next = { ...form, [field.key]: e.target.value };
                setForm(next);
              }}
              type={field.type === 'checkbox' ? 'checkbox' : field.type || 'text'}
              placeholder={field.type === 'checkbox' ? ' ' : undefined}
              checked={
                field.type === 'checkbox'
                  ? !!form[field.key]
                  : undefined
              }
              onCheckedChange={
                field.type === 'checkbox'
                  ? (val) => setForm({ ...form, [field.key]: val })
                  : undefined
              }
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
      </Modal>
    </div>
  );
}
