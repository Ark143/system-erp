import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../lib/api.js';

export default function InventoryItemForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id && id !== 'new';
  const [form, setForm] = useState({});
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [catData, itemData] = await Promise.all([
          api.inventory.categories.list(),
          isEdit ? api.inventory.items.get(id).then(r => r.data).catch(() => null) : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setCategories(catData);
        if (isEdit && itemData) {
          setForm({
            sku: itemData.sku || '',
            name: itemData.name || '',
            category: itemData.category ?? itemData.category_id ?? '',
            uom: itemData.uom || 'PC',
            warehouse: itemData.warehouse || itemData.default_warehouse || 'MAIN',
            qty_on_hand: itemData.qty_on_hand ?? 0,
            reorder_level: itemData.reorder_level ?? 10,
            unit_cost: itemData.unit_cost ?? 0,
            selling_price: itemData.selling_price ?? 0,
            purchase_gl_account: itemData.purchase_gl_account || '',
            sales_gl_account: itemData.sales_gl_account || '',
            default_warehouse: itemData.default_warehouse || '',
            item_tax: itemData.item_tax || '',
            withholding_tax: itemData.withholding_tax || '',
            uom_conversion_rate: itemData.uom_conversion_rate ?? 1,
            cost_center: itemData.cost_center || '',
            profit_center: itemData.profit_center || '',
            is_fixed_asset: !!itemData.is_fixed_asset,
            is_inventory_item: !!itemData.is_inventory_item,
            is_purchase_item: !!itemData.is_purchase_item,
            is_sales_item: !!itemData.is_sales_item,
            is_service: !!itemData.is_service,
            is_active: itemData.is_active !== false,
          });
        } else {
          setForm({
            uom: 'PC',
            warehouse: 'MAIN',
            qty_on_hand: 0,
            reorder_level: 10,
            unit_cost: 0,
            selling_price: 0,
            uom_conversion_rate: 1,
            is_active: true,
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
    if (!form.sku || !form.name || !form.category) {
      setError('Please fill in SKU, Name, and Category.');
      return;
    }
    setSaving(true);
    try {
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
      if (isEdit) await api.inventory.items.update(id, payload);
      else await api.inventory.items.create(payload);
      navigate('/inventory/items');
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'SAVE_FAILED');
    } finally {
      setSaving(false);
    }
  };

  const field = (label, input) => (
    <div>
      <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">{label}</label>
      {input}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--color-border)] pb-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-ink)]">{isEdit ? 'Edit Item' : 'New Item'}</h2>
          <p className="text-sm text-[var(--color-ink-secondary)]">Full item master with GL accounts, taxes, and cost centers.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(-1)} className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-ink-secondary)] hover:bg-[var(--color-muted)] transition">Back</button>
          <button onClick={doSave} disabled={saving} className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-60">{saving ? 'Saving...' : 'Save Item'}</button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-medium">{error}</div>
      )}

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-sm p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('SKU *', (
            <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" placeholder="e.g. ITEM-001" value={form.sku || ''} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          ))}
          {field('Name *', (
            <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" placeholder="Item Name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          ))}
          {field('Category *', (
            <select className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">Select Category</option>
              {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          ))}
          {field('Warehouse', (
            <select className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.warehouse || 'MAIN'} onChange={(e) => setForm({ ...form, warehouse: e.target.value })}>
              <option value="MAIN">Main Warehouse</option>
              <option value="BRANCH_A">Branch A</option>
              <option value="BRANCH_B">Branch B</option>
            </select>
          ))}
          {field('UOM', (
            <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" placeholder="e.g. PC" value={form.uom || ''} onChange={(e) => setForm({ ...form, uom: e.target.value })} />
          ))}
          {field('Qty on Hand', (
            <input type="number" className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.qty_on_hand ?? ''} onChange={(e) => setForm({ ...form, qty_on_hand: e.target.value })} />
          ))}
          {field('Reorder Lvl', (
            <input type="number" className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.reorder_level ?? ''} onChange={(e) => setForm({ ...form, reorder_level: e.target.value })} />
          ))}
          {field('Unit Cost', (
            <input type="number" className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.unit_cost ?? ''} onChange={(e) => setForm({ ...form, unit_cost: e.target.value })} />
          ))}
          {field('Selling Price', (
            <input type="number" className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.selling_price ?? ''} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} />
          ))}
          {field('Purchase GL Account', (
            <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.purchase_gl_account || ''} onChange={(e) => setForm({ ...form, purchase_gl_account: e.target.value })} />
          ))}
          {field('Sales GL Account', (
            <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.sales_gl_account || ''} onChange={(e) => setForm({ ...form, sales_gl_account: e.target.value })} />
          ))}
          {field('Default Warehouse', (
            <select className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.default_warehouse || ''} onChange={(e) => setForm({ ...form, default_warehouse: e.target.value })}>
              <option value="">Same as item</option>
              <option value="MAIN">Main Warehouse</option>
              <option value="BRANCH_A">Branch A</option>
              <option value="BRANCH_B">Branch B</option>
            </select>
          ))}
          {field('UOM Conversion Rate', (
            <input type="number" step="0.0001" className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.uom_conversion_rate ?? 1} onChange={(e) => setForm({ ...form, uom_conversion_rate: e.target.value })} />
          ))}
          {field('Item Tax', (
            <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.item_tax || ''} onChange={(e) => setForm({ ...form, item_tax: e.target.value })} />
          ))}
          {field('Withholding Tax', (
            <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.withholding_tax || ''} onChange={(e) => setForm({ ...form, withholding_tax: e.target.value })} />
          ))}
          {field('Cost Center', (
            <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.cost_center || ''} onChange={(e) => setForm({ ...form, cost_center: e.target.value })} />
          ))}
          {field('Profit Center', (
            <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm outline-none focus:border-[var(--color-apple-blue)]" value={form.profit_center || ''} onChange={(e) => setForm({ ...form, profit_center: e.target.value })} />
          ))}
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--color-ink-secondary)] mb-3">Flags</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[
              ['is_fixed_asset', 'Fixed Asset'],
              ['is_inventory_item', 'Inventory Item'],
              ['is_purchase_item', 'Purchase Item'],
              ['is_sales_item', 'Sales Item'],
              ['is_service', 'Service'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] p-3">
                <input type="checkbox" className="h-4 w-4 rounded border-[var(--color-border)]" checked={!!form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} />
                <span className="text-sm font-medium text-[var(--color-ink)]">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
