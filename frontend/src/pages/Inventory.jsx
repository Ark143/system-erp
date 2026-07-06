import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../lib/api.js';
import Modal from '../components/Modal.jsx';

export default function Inventory() {
  const [tab, setTab] = useState('items');
  const [rows, setRows] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [filterOpen, setFilterOpen] = useState(false);
  const [customFilters, setCustomFilters] = useState([]);
  const [selectedField, setSelectedField] = useState('sku');
  const [selectedValue, setSelectedValue] = useState('');
  const [catFilter, setCatFilter] = useState('');

  const [settingsData, setSettingsData] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [roles, setRoles] = useState([]);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const FIELDS = [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'sku', label: 'SKU', type: 'text' },
    { key: 'category_name', label: 'Category', type: 'text' },
    { key: 'warehouse', label: 'Warehouse', type: 'text' },
    { key: 'uom', label: 'UOM', type: 'text' },
    { key: 'qty_on_hand', label: 'Qty On Hand', type: 'number' },
    { key: 'unit_cost', label: 'Unit Cost', type: 'number' },
    { key: 'selling_price', label: 'Selling Price', type: 'number' },
  ];

  const fieldDefinition = (key) => FIELDS.find((item) => item.key === key) || { key, label: key, type: 'text' };

  const applyCustomFilters = (items) => {
    if (!Array.isArray(items)) return items;
    return items.filter((r) => {
      return customFilters.every((f) => {
        const def = fieldDefinition(f.field);
        const raw = f.value ?? '';
        const q = String(raw).trim();
        if (q === '') return true;
        let target = '';
        if (f.field === 'category_name') target = String(r.category_name || r.category || '');
        else if (f.field === 'name') target = String(r.name || '');
        else if (f.field === 'uom') target = String(r.uom || '');
        else target = String(r[f.field] ?? '');

        const qn = String(q).toLowerCase();
        const base = def.type === 'number' ? Number(target) : target.toLowerCase();
        const qNum = Number(raw);
        switch (f.mode) {
          case 'eq': return def.type === 'number' ? Number(base) === qNum : base === qn;
          case 'starts': return def.type === 'number' ? false : String(base).toLowerCase().startsWith(qn);
          case 'gt': return def.type === 'number' ? Number(base) > qNum : String(base).toLowerCase().includes(qn);
          case 'lt': return def.type === 'number' ? Number(base) < qNum : String(base).toLowerCase().includes(qn);
          case 'gte': return def.type === 'number' ? Number(base) >= qNum : String(base).toLowerCase().includes(qn);
          case 'lte': return def.type === 'number' ? Number(base) <= qNum : String(base).toLowerCase().includes(qn);
          default: return def.type === 'number' ? String(Number(base)).includes(qn) : String(base).includes(qn);
        }
      });
    });
  };

  const load = async () => {
    setError('');
    try {
      if (tab === 'items') {
        const data = await api.inventory.items.list({ page_size: 100 });
        let items = Array.isArray(data) ? data : [];
        items = applyCustomFilters(items);
        if (catFilter) {
          const q = String(catFilter).toLowerCase();
          items = items.filter((it) => String(it.category_name || it.category || '').toLowerCase().includes(q));
        }
        setRows(items);
      } else if (tab === 'categories') {
        setRows(await api.inventory.categories.list());
      } else if (tab === 'inventory-settings') {
        setRows([]);
      } else {
        setRows(await api.inventory.stockMoves.list({ page_size: 100 }).catch(() => []));
      }
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'LOAD_FAILED');
      setRows([]);
    }
  };

  const loadSettings = async () => {
    setSettingsError('');
    try {
      const [settingRows, companyRows, whRows, categoryRows] = await Promise.all([
        api.inventory.settings.list(),
        api.governance.companies.list(),
        api.inventory.warehouses.list(),
        api.inventory.categories.list(),
      ]);
      const settingsValues = Array.isArray(settingRows) ? settingRows : [];
      setSettingsData(settingsValues[0] || null);
      setCompanies(Array.isArray(companyRows) ? companyRows : []);
      setWarehouses(Array.isArray(whRows) ? whRows : []);
      setCategoryOptions(Array.isArray(categoryRows) ? categoryRows : []);
      setSettingsLoaded(true);
    } catch (e) {
      setSettingsError(e?.response?.data?.detail || e.message || 'SETTINGS_LOAD_FAILED');
      setSettingsLoaded(true);
    }
  };

  const handleSaveSettings = async (payload) => {
    setSettingsSaving(true);
    setSettingsError('');
    try {
      const updated = settingsData?.id ? await api.inventory.settings.update(settingsData.id, payload) : await api.inventory.settings.create(payload);
      setSettingsData(updated || { ...(settingsData || {}), ...payload });
    } catch (e) {
      setSettingsError(e?.response?.data?.detail || e.message || 'SETTINGS_SAVE_FAILED');
    } finally {
      setSettingsSaving(false);
    }
  };

  const syncToggle = (key) => {
    const next = Boolean(!(settingsData && settingsData[key]));
    handleSaveSettings({ ...(settingsData || {}), [key]: next });
  };

  const syncSelect = (key, value) => {
    const cleaned = value === '' ? null : value;
    handleSaveSettings({ ...(settingsData || {}), [key]: cleaned });
  };

  const syncText = (key, value) => {
    handleSaveSettings({ ...(settingsData || {}), [key]: value });
  };

  const loadDeps = async () => {
    try {
      const [catData, itemData] = await Promise.all([
        api.inventory.categories.list(),
        api.inventory.items.list(),
      ]);
      setCategoryOptions(catData);
      setItemsList(itemData);
    } catch (e) {
      console.error('Failed to load dependencies', e);
    }
  };

  useEffect(() => {
    load();
    if (tab === 'inventory-settings') {
      loadSettings();
    } else {
      loadDeps();
    }
  }, [tab, customFilters, catFilter]);

  const openCreate = () => {
    setEditId(null);
    setForm(
      tab === 'items'
        ? { uom: 'PC', warehouse: 'MAIN', qty_on_hand: 0, reorder_level: 10, unit_cost: 0, selling_price: 0 }
        : tab === 'stock-moves'
        ? { move_type: 'IN' }
        : {}
    );
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditId(row.id);
    setForm({ ...row });
    setOpen(true);
  };

  const doSave = async () => {
    setError('');
    try {
      if (tab === 'items') {
        if (!form.sku || !form.name || !form.category) {
          throw new Error('Please fill in SKU, Name, and Category.');
        }
        const payload = {
          sku: form.sku,
          name: form.name,
          category: parseInt(form.category),
          uom: form.uom || 'PC',
          warehouse: form.warehouse || 'MAIN',
          qty_on_hand: parseFloat(form.qty_on_hand || 0),
          reorder_level: parseFloat(form.reorder_level || 10),
          unit_cost: parseFloat(form.unit_cost || 0),
          selling_price: parseFloat(form.selling_price || 0),
          purchase_gl_account: form.purchase_gl_account || '',
          sales_gl_account: form.sales_gl_account || '',
          default_warehouse: form.default_warehouse || '',
          item_tax: form.item_tax || '',
          withholding_tax: form.withholding_tax || '',
          uom_conversion_rate: parseFloat(form.uom_conversion_rate || 1),
          cost_center: form.cost_center || '',
          profit_center: form.profit_center || '',
          is_fixed_asset: !!form.is_fixed_asset,
          is_inventory_item: !!form.is_inventory_item,
          is_purchase_item: !!form.is_purchase_item,
          is_sales_item: !!form.is_sales_item,
          is_service: !!form.is_service,
          is_active: form.is_active !== false,
        };
        if (editId) await api.inventory.items.update(editId, payload);
        else await api.inventory.items.create(payload);
      } else if (tab === 'categories') {
        if (!form.name) {
          throw new Error('Category name is required.');
        }
        if (editId) await api.inventory.categories.update(editId, { name: form.name, description: form.description || '' });
        else await api.inventory.categories.create({ name: form.name, description: form.description || '' });
      } else if (tab === 'stock-moves') {
        if (!form.item || !form.move_type || !form.qty) {
          throw new Error('Please select an Item, Move Type, and Qty.');
        }
        await api.inventory.items.adjust(parseInt(form.item), {
          move_type: form.move_type,
          qty: parseFloat(form.qty),
          reference: form.reference || '',
          notes: form.notes || '',
        });
      }
      setOpen(false);
      setEditId(null);
      setForm({});
      load();
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'Action failed');
    }
  };

  const doRemove = async (id) => {
    setError('');
    try {
      if (tab === 'items') await api.inventory.items.remove(id);
      else if (tab === 'categories') await api.inventory.categories.remove(id);
      load();
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'DELETE_FAILED');
    }
  };

  const addFilter = () => {
    const value = String(selectedValue || '').trim();
    if (!value) return;
    setCustomFilters((s) => [...s, { field: selectedField, value, mode: fieldDefinition(selectedField).type === 'number' ? 'gte' : 'contains', id: crypto.randomUUID() }]);
    setSelectedValue('');
  };

  const removeFilter = (id) => setCustomFilters((s) => s.filter((f) => f.id !== id));

  const header = (
    <div
      className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--color-border)] pb-4"
    >
      <div>
        <h2 className="text-xl font-bold text-[var(--color-ink)]">Inventory Management</h2>
        <p className="text-sm text-[var(--color-ink-secondary)]">Catalog items, categories, and stock movement adjustments.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {['items', 'categories', 'stock-moves', 'inventory-settings'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === t ? 'bg-black text-white' : 'bg-black/5 text-[var(--color-ink-secondary)] hover:bg-black/10'
            }`}
          >
            {t === 'inventory-settings' ? 'Settings' : t.replace('-', ' ')}
          </button>
        ))}
        <button
          onClick={() => setFilterOpen((v) => !v)}
          className={`rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold transition ${
            filterOpen ? 'bg-[var(--color-muted)]' : 'hover:bg-[var(--color-muted)]'
          }`}
        >
          Filter
        </button>
        <button
          onClick={() => navigate(tab === 'inventory-settings' ? '/inventory/settings' : '/inventory/items/new')}
          className="rounded-xl bg-[var(--color-apple-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition"
        >
          {tab === 'stock-moves' ? 'Adjust Stock' : tab === 'items' ? 'New Item' : tab === 'inventory-settings' ? 'Manage Settings' : `New ${tab.slice(0, -1)}`}
        </button>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--color-ink)]">Inventory Settings</h3>
        <span className="text-xs text-[var(--color-ink-secondary)]">
          {settingsLoaded ? (settingsData ? 'Record loaded' : 'No settings yet — creating on save') : 'Loading settings...'}
        </span>
      </div>

      {settingsError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-medium">
          {settingsError}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
          <h4 className="text-sm font-semibold uppercase text-[var(--color-ink-secondary)]">1. Item Settings & Defaults</h4>

          <div className="grid gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Item Naming Method</label>
              <select
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                value={settingsData?.item_naming_method || ''}
                onChange={(e) => syncSelect('item_naming_method', e.target.value)}
              >
                <option value="">Select method</option>
                <option value="AUTO">Automatic Naming Series</option>
                <option value="MANUAL">Direct Item Code</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Default Item Group</label>
              <select
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                value={settingsData?.default_item_group || ''}
                onChange={(e) => syncSelect('default_item_group', e.target.value)}
              >
                <option value="">Select default item group</option>
                {(categoryOptions || []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Default Valuation Method</label>
              <select
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                value={settingsData?.default_valuation_method || ''}
                onChange={(e) => syncSelect('default_valuation_method', e.target.value)}
              >
                <option value="">Select valuation method</option>
                <option value="FIFO">FIFO</option>
                <option value="MOVING_AVERAGE">Moving Average</option>
                <option value="STANDARD">Standard Cost</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Default UOM</label>
              <input
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                value={settingsData?.default_uom || ''}
                onChange={(e) => syncText('default_uom', e.target.value)}
                placeholder="e.g. PC"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Default Warehouse</label>
              <select
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                value={settingsData?.default_warehouse || ''}
                onChange={(e) => syncSelect('default_warehouse', e.target.value)}
              >
                <option value="">Select warehouse</option>
                {(warehouses || []).map((w) => (
                  <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Sample Retention Warehouse</label>
              <select
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                value={settingsData?.sample_retention_warehouse || ''}
                onChange={(e) => syncSelect('sample_retention_warehouse', e.target.value)}
              >
                <option value="">Select warehouse</option>
                {(warehouses || []).map((w) => (
                  <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
          <h4 className="text-sm font-semibold uppercase text-[var(--color-ink-secondary)]">2. Transaction & Validation Settings</h4>
          <div className="grid gap-3">
            <label className="flex items-center justify-between rounded-xl border border-[var(--color-border)] p-3">
              <span className="text-sm font-medium text-[var(--color-ink)]">Allow Negative Stock</span>
              <input type="checkbox" checked={!!settingsData?.allow_negative_stock} onChange={() => syncToggle('allow_negative_stock')} />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-[var(--color-border)] p-3">
              <span className="text-sm font-medium text-[var(--color-ink)]">Allow Negative Stock Per Batch</span>
              <input type="checkbox" checked={!!settingsData?.allow_negative_stock_per_batch} onChange={() => syncToggle('allow_negative_stock_per_batch')} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Over-Delivery %</label>
                <input
                  type="number"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                  value={settingsData?.over_delivery_percentage ?? ''}
                  onChange={(e) => syncText('over_delivery_percentage', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Over-Transfer %</label>
                <input
                  type="number"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                  value={settingsData?.over_transfer_percentage ?? ''}
                  onChange={(e) => syncText('over_transfer_percentage', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Role Allowed to Over-Deliver/Over-Transfer</label>
              <select
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                value={settingsData?.role_allowed_to_over_deliver || ''}
                onChange={(e) => syncSelect('role_allowed_to_over_deliver', e.target.value)}
              >
                <option value="">Select role</option>
                {(roles || []).map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center justify-between rounded-xl border border-[var(--color-border)] p-3">
              <span className="text-sm font-medium text-[var(--color-ink)]">Allow Edit Rate/Quantity in Stock Transactions</span>
              <input type="checkbox" checked={!!settingsData?.allow_edit_rate_quantity_in_stock_transactions} onChange={() => syncToggle('allow_edit_rate_quantity_in_stock_transactions')} />
            </label>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
          <h4 className="text-sm font-semibold uppercase text-[var(--color-ink-secondary)]">3. Stock Planning & Automation</h4>
          <div className="grid gap-3">
            <label className="flex items-center justify-between rounded-xl border border-[var(--color-border)] p-3">
              <div>
                <div className="text-sm font-medium text-[var(--color-ink)]">Auto Insert Item Price</div>
                <div className="text-xs text-[var(--color-ink-secondary)]">Add a price record when a new rate is introduced.</div>
              </div>
              <input type="checkbox" checked={!!settingsData?.auto_insert_item_price} onChange={() => syncToggle('auto_insert_item_price')} />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-[var(--color-border)] p-3">
              <div>
                <div className="text-sm font-medium text-[var(--color-ink)]">Auto Re-Order</div>
                <div className="text-xs text-[var(--color-ink-secondary)]">Create Material Requests automatically when stock is low.</div>
              </div>
              <input type="checkbox" checked={!!settingsData?.auto_re_order} onChange={() => syncToggle('auto_re_order')} />
            </label>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
          <h4 className="text-sm font-semibold uppercase text-[var(--color-ink-secondary)]">4. Core Enhancements: Stock Reservation</h4>
          <div className="grid gap-3">
            <label className="flex items-center justify-between rounded-xl border border-[var(--color-border)] p-3">
              <div>
                <div className="text-sm font-medium text-[var(--color-ink)]">Enable Stock Reservation</div>
                <div className="text-xs text-[var(--color-ink-secondary)]">Allow allocations for sales orders or production.</div>
              </div>
              <input type="checkbox" checked={!!settingsData?.enable_stock_reservation} onChange={() => syncToggle('enable_stock_reservation')} />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-[var(--color-border)] p-3">
              <div>
                <div className="text-sm font-medium text-[var(--color-ink)]">Auto Reserve Stock</div>
                <div className="text-xs text-[var(--color-ink-secondary)]">Allocate stock automatically on submit.</div>
              </div>
              <input type="checkbox" checked={!!settingsData?.auto_reserve_stock} onChange={() => syncToggle('auto_reserve_stock')} />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-[var(--color-border)] p-3">
              <div>
                <div className="text-sm font-medium text-[var(--color-ink)]">Use Reservation Agent for Validation</div>
                <div className="text-xs text-[var(--color-ink-secondary)]">Background resolver for allocation boundaries and timeouts.</div>
              </div>
              <input type="checkbox" checked={!!settingsData?.use_reservation_agent_for_validation} onChange={() => syncToggle('use_reservation_agent_for_validation')} />
            </label>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Company Override Level</label>
              <select
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]"
                value={settingsData?.company_id || ''}
                onChange={(e) => syncSelect('company_id', e.target.value)}
              >
                <option value="">Global default</option>
                {(companies || []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name || c.legal_name || c.code || c.id}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-[var(--color-ink-secondary)]">Leave blank to use global defaults; select a company to override at the Company Master level.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMain = () => {
    if (tab === 'inventory-settings') return renderSettings();
    return (
      <>
        <Modal open={open} title={editId ? `Edit ${tab.slice(0, -1).replace('-',' ')}` : tab === 'stock-moves' ? 'Adjust Stock Level' : `Create New ${tab.slice(0, -1).replace('-',' ')}`} onClose={() => { setOpen(false); setEditId(null); }}>
          <div className="space-y-4 pt-2">
            {tab === 'items' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">SKU *</label>
                    <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" placeholder="e.g. ITEM-001" value={form.sku || ''} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Name *</label>
                    <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" placeholder="Item Name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Category *</label>
                    <select className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                      <option value="">Select Category</option>
                      {(categoryOptions || []).map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Warehouse</label>
                    <select className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.warehouse || 'MAIN'} onChange={(e) => setForm({ ...form, warehouse: e.target.value })}>
                      {(warehouses || []).map((w) => (
                        <option key={w.id} value={w.code}>{(w.name || w.code).replace('Main Warehouse', 'MAIN').replace('Branch A', 'BRANCH_A').replace('Branch B', 'BRANCH_B')}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">UOM</label>
                    <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" placeholder="e.g. PC" value={form.uom || ''} onChange={(e) => setForm({ ...form, uom: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Qty on Hand</label>
                    <input type="number" className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.qty_on_hand ?? ''} onChange={(e) => setForm({ ...form, qty_on_hand: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Reorder Lvl</label>
                    <input type="number" className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.reorder_level ?? ''} onChange={(e) => setForm({ ...form, reorder_level: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Unit Cost</label>
                    <input type="number" step="0.01" className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.unit_cost ?? ''} onChange={(e) => setForm({ ...form, unit_cost: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Selling Price</label>
                    <input type="number" step="0.01" className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.selling_price ?? ''} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Purchase GL Account</label>
                    <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.purchase_gl_account || ''} onChange={(e) => setForm({ ...form, purchase_gl_account: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Sales GL Account</label>
                    <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.sales_gl_account || ''} onChange={(e) => setForm({ ...form, sales_gl_account: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Default Warehouse</label>
                    <select className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.default_warehouse || ''} onChange={(e) => setForm({ ...form, default_warehouse: e.target.value })}>
                      <option value="">Same as item</option>
                      <option value="MAIN">Main Warehouse</option>
                      <option value="BRANCH_A">Branch A</option>
                      <option value="BRANCH_B">Branch B</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">UOM Conversion Rate</label>
                    <input type="number" step="0.01" className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.uom_conversion_rate ?? ''} onChange={(e) => setForm({ ...form, uom_conversion_rate: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Cost Center</label>
                    <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.cost_center || ''} onChange={(e) => setForm({ ...form, cost_center: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Profit Center</label>
                    <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.profit_center || ''} onChange={(e) => setForm({ ...form, profit_center: e.target.value })} />
                  </div>
                </div>
              </>
            )}
            {tab === 'categories' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Name *</label>
                  <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Description</label>
                  <textarea className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>
            )}
            {tab === 'stock-moves' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Item *</label>
                  <select className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.item || ''} onChange={(e) => setForm({ ...form, item: e.target.value })}>
                    <option value="">Select item</option>
                    {(itemsList || []).map((it) => (
                      <option key={it.id} value={it.id}>{it.sku} - {it.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Move Type *</label>
                    <select className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.move_type || ''} onChange={(e) => setForm({ ...form, move_type: e.target.value })}>
                      <option value="">Select</option>
                      <option value="IN">IN</option>
                      <option value="OUT">OUT</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Qty *</label>
                    <input type="number" className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.qty ?? ''} onChange={(e) => setForm({ ...form, qty: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Reference</label>
                  <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.reference || ''} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Notes</label>
                  <textarea className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
            )}
            <button onClick={doSave} className="w-full rounded-xl bg-black py-3 text-sm font-semibold text-white hover:opacity-90 transition">Save</button>
          </div>
        </Modal>

        <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)]">
          <table className="min-w-full divide-y divide-[var(--color-border)] text-sm">
            <thead className="bg-[var(--color-muted)]">
              <tr>
                {tab === 'items' && <>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--color-ink-secondary)]">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--color-ink-secondary)]">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--color-ink-secondary)]">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--color-ink-secondary)]">UOM</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--color-ink-secondary)]">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--color-ink-secondary)]">Unit Cost</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--color-ink-secondary)]">Actions</th>
                </>}
                {tab === 'categories' && <>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--color-ink-secondary)]">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--color-ink-secondary)]">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--color-ink-secondary)]">Actions</th>
                </>}
                {tab === 'stock-moves' && <>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--color-ink-secondary)]">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--color-ink-secondary)]">Move Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--color-ink-secondary)]">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--color-ink-secondary)]">Reference</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--color-ink-secondary)]">Actions</th>
                </>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {(rows || []).map((r) => (
                <tr key={r.id}>
                  {tab === 'items' && <>
                    <td className="px-4 py-3">{r.sku}</td>
                    <td className="px-4 py-3">{r.name}</td>
                    <td className="px-4 py-3">{r.category_name || r.category || ''}</td>
                    <td className="px-4 py-3">{r.uom || ''}</td>
                    <td className="px-4 py-3">{r.qty_on_hand}</td>
                    <td className="px-4 py-3">{r.unit_cost}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => openEdit(r)} className="text-xs font-semibold underline mr-2">Edit</button>
                      <button onClick={() => doRemove(r.id)} className="text-xs font-semibold text-red-700 underline">Delete</button>
                    </td>
                  </>}
                  {tab === 'categories' && <>
                    <td className="px-4 py-3">{r.name}</td>
                    <td className="px-4 py-3">{r.description || ''}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => openEdit(r)} className="text-xs font-semibold underline mr-2">Edit</button>
                      <button onClick={() => doRemove(r.id)} className="text-xs font-semibold text-red-700 underline">Delete</button>
                    </td>
                  </>}
                  {tab === 'stock-moves' && <>
                    <td className="px-4 py-3">{r.item_name || r.item}</td>
                    <td className="px-4 py-3">{r.move_type}</td>
                    <td className="px-4 py-3">{r.qty}</td>
                    <td className="px-4 py-3">{r.reference || ''}</td>
                    <td className="px-4 py-3" />
                  </>}
                </tr>
              ))}
              {Array.isArray(rows) && rows.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-[var(--color-ink-secondary)]" colSpan="5">No records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  const tabsForFilter = ['items', 'categories', 'stock-moves'].includes(tab);

  return (
    <div className="space-y-6">
      {header}
      {error && tabsForFilter && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-medium">
          {error}
        </div>
      )}

      {tabsForFilter && filterOpen && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-sm p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Field</label>
              <select className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={selectedField} onChange={(e) => setSelectedField(e.target.value)}>
                {FIELDS.map((item) => (
                  <option key={item.key} value={item.key}>{item.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Value</label>
              <input value={selectedValue} onChange={(e) => setSelectedValue(e.target.value)} type={fieldDefinition(selectedField).type === 'number' ? 'number' : 'text'} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" placeholder="Enter filter value" />
            </div>
            <div className="flex items-end gap-2">
              <button onClick={addFilter} className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--color-muted)] transition">Add</button>
              <button onClick={() => { setCustomFilters([]); setCatFilter(''); }} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 transition">Clear</button>
            </div>
          </div>

          {(customFilters || []).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {customFilters.map((f) => (
                <span key={f.id} className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink-secondary)]">
                  <span className="font-semibold">{fieldDefinition(f.field).label}</span>
                  <span>:</span>
                  <span>{f.value}</span>
                  <button onClick={() => removeFilter(f.id)} className="font-bold text-red-700 hover:underline">remove</button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {renderMain()}
    </div>
  );
}
