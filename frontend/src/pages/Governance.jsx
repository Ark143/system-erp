import { useState, useEffect } from 'react';
import * as api from '../lib/api.js';
import Modal from '../components/Modal.jsx';

export default function Governance() {
  const [tab, setTab] = useState('roles');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);

  const load = async () => {
    setError('');
    try {
      if (tab === 'branches') setRows(await api.governance.branches.list());
      else if (tab === 'warehouses') setRows(await api.governance.warehouses.list());
      else if (tab === 'item-categories') setRows(await api.governance.itemCategories.list());
      else if (tab === 'roles') setRows(await api.governance.roles.list());
      else if (tab === 'permissions') setRows(await api.governance.permissions.list());
      else if (tab === 'configurations') setRows(await api.governance.configurations.list());
      else if (tab === 'module-period-locks') setRows(await api.governance.configurations.list());
      else if (tab === 'role-permissions') setRows(await api.governance.rolePermissions.list());
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'LOAD_FAILED');
    }
  };

  useEffect(() => {
    load();
  }, [tab]);

  const openCreate = () => {
    setEditId(null);
    setForm({ is_active: true });
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditId(row.id);
    setForm({ ...row, is_active: row.is_active !== false });
    setOpen(true);
  };

  const doRemove = async (id) => {
    setError('');
    try {
      if (tab === 'configurations' || tab === 'module-period-locks') await api.governance.configurations.remove(id);
      else if (tab === 'roles') await api.governance.roles.remove(id);
      else if (tab === 'permissions') await api.governance.permissions.remove(id);
      else if (tab === 'branches') await api.governance.branches.remove(id);
      else if (tab === 'warehouses') await api.governance.warehouses.remove(id);
      else if (tab === 'item-categories') await api.governance.itemCategories.remove(id);
      else if (tab === 'role-permissions') await api.governance.rolePermissions.remove(id);
      load();
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'DELETE_FAILED');
    }
  };

  const doSave = async () => {
    setError('');
    try {
      const build = (fields) => {
        const out = {};
        for (const k of fields) {
          if (k in form) out[k] = form[k];
        }
        out.is_active = form.is_active !== false;
        return out;
      };
      if (tab === 'roles') {
        if (!form.role_name || !form.description) throw new Error('Role name and description are required.');
        const payload = build(['role_name', 'description', 'company', 'module']);
        if (editId) await api.governance.roles.update(editId, payload); else await api.governance.roles.create(payload);
      } else if (tab === 'permissions') {
        if (!form.permission_name || !form.permission_code) throw new Error('Permission name/code are required.');
        const payload = build(['permission_name', 'permission_code', 'module', 'action', 'description']);
        if (editId) await api.governance.permissions.update(editId, payload); else await api.governance.permissions.create(payload);
      } else if (tab === 'branches') {
        if (!form.branch_name || !form.branch_code) throw new Error('Branch name/code are required.');
        const payload = build(['branch_name', 'branch_code', 'address', 'phone_number', 'manager_name']);
        if (editId) await api.governance.branches.update(editId, payload); else await api.governance.branches.create(payload);
      } else if (tab === 'warehouses') {
        if (!form.warehouse_name || !form.warehouse_code) throw new Error('Warehouse name/code are required.');
        const payload = build(['warehouse_name', 'warehouse_code', 'location', 'branch', 'manager_name']);
        if (editId) await api.governance.warehouses.update(editId, payload); else await api.governance.warehouses.create(payload);
      } else if (tab === 'item-categories') {
        if (!form.category_name) throw new Error('Category name is required.');
        const payload = build(['category_name', 'parent_category', 'description']);
        if (editId) await api.governance.itemCategories.update(editId, payload); else await api.governance.itemCategories.create(payload);
      } else if (tab === 'configurations' || tab === 'module-period-locks') {
        if (!form.config_key) throw new Error('Config key is required.');
        const payload = build(['config_key', 'config_value', 'description', 'data_type']);
        if (editId) await api.governance.configurations.update(editId, payload); else await api.governance.configurations.create(payload);
      } else if (tab === 'role-permissions') {
        if (!form.role || !form.permission) throw new Error('Role and Permission are required.');
        const payload = build(['role', 'permission']);
        if (editId) await api.governance.rolePermissions.update(editId, payload); else await api.governance.rolePermissions.create(payload);
      }
      setOpen(false);
      setEditId(null);
      setForm({});
      load();
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'Action failed');
    }
  };

  const header = (
    <div className="border-b border-[var(--color-border)] pb-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-ink)]">Governance Setup</h2>
          <p className="text-sm text-[var(--color-ink-secondary)]">Roles, permissions, companies, branches, warehouses, categories, and configuration.</p>
        </div>
      </div>
    </div>
  );

  const tabs = ['roles','permissions','branches','warehouses','item-categories','configurations','role-permissions','module-period-locks'];

  return (
    <div className="space-y-6">
      {header}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${tab===t?'bg-black text-white':'bg-black/5 text-[var(--color-ink-secondary)] hover:bg-black/10'}`}>{t}</button>
        ))}
        <button onClick={openCreate} className="rounded-xl bg-[var(--color-apple-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition">New {tab.replace('-', ' ')}</button>
      </div>
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-medium">{error}</div>
      )}

      <Modal open={open} title={editId ? `Edit ${tab.replace('-', ' ')}` : `New ${tab.replace('-', ' ')}`} onClose={() => { setOpen(false); setEditId(null); setForm({}); }}>
        <div className="space-y-4 pt-2">
          {(tab === 'branches' || tab === 'warehouses') && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">{tab === 'branches' ? 'Branch' : 'Warehouse'} Name *</label>
                  <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm" value={tab==='branches' ? (form.branch_name || '') : (form.warehouse_name || '')} onChange={(e) => setForm({ ...form, [tab==='branches'?'branch_name':'warehouse_name']: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Code *</label>
                  <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm" value={tab==='branches' ? (form.branch_code || '') : (form.warehouse_code || '')} onChange={(e) => setForm({ ...form, [tab==='branches'?'branch_code':'warehouse_code']: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Location</label>
                <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
            </>
          )}
          {(tab === 'roles' || tab === 'permissions' || tab === 'item-categories' || tab === 'configurations' || tab === 'module-period-locks' || tab === 'role-permissions') && (
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Name/Key *</label>
              <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm" value={
                tab === 'roles' ? (form.role_name || '') :
                tab === 'permissions' ? (form.permission_name || '') :
                tab === 'item-categories' ? (form.category_name || '') :
                tab === 'configurations' || tab === 'module-period-locks' ? (form.config_key || '') : ''
              } onChange={(e) => setForm({ ...form,
                role_name: tab==='roles' ? e.target.value : form.role_name,
                permission_name: tab==='permissions' ? e.target.value : form.permission_name,
                category_name: tab==='item-categories' ? e.target.value : form.category_name,
                config_key: (tab==='configurations' || tab==='module-period-locks') ? e.target.value : form.config_key,
              })} />
            </div>
          )}
          {(tab === 'roles' || tab === 'permissions' || tab === 'item-categories') && (
            <div>
              <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Description</label>
              <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          )}
          {(tab === 'configurations' || tab === 'module-period-locks') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Value</label>
                <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm" value={form.config_value || ''} onChange={(e) => setForm({ ...form, config_value: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--color-ink-secondary)] mb-1">Type</label>
                <input className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm" value={form.data_type || ''} onChange={(e) => setForm({ ...form, data_type: e.target.value })} />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button onClick={() => { setOpen(false); setEditId(null); setForm({}); }} className="flex-1 rounded-xl border border-[var(--color-border)] p-3 text-sm font-semibold text-[var(--color-ink-secondary)] hover:bg-black/5 transition">Cancel</button>
            <button onClick={doSave} className="flex-1 rounded-xl bg-black p-3 text-sm font-semibold text-white hover:opacity/90 transition">Confirm</button>
          </div>
        </div>
      </Modal>

      <div className="space-y-3">
        {(rows || []).slice(0, 50).map((r) => (
          <div key={r.id} className="rounded-2xl border border-[var(--color-border)] p-4 bg-[var(--color-background)]">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-ink)]">{tab==='roles' ? r.role_name : tab==='permissions' ? r.permission_name : tab==='branches' ? r.branch_name : tab==='warehouses' ? r.warehouse_name : tab==='item-categories' ? r.category_name : tab==='configurations' || tab==='module-period-locks' ? r.config_key : ''}</h3>
                <p className="text-xs text-[var(--color-ink-secondary)]">{r.description || r.code || r.config_value || r.module || r.action || '—'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(r)} className="rounded-lg bg-black/5 px-3 py-1.5 text-xs font-semibold hover:bg-black/10 transition">Edit</button>
                <button onClick={() => doRemove(r.id)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
