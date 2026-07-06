const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function request(path, options = {}) {
  const token = localStorage.getItem('access');
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = 'Bearer ' + token;
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) {
    const err = new Error(typeof data === 'string' ? data : data?.detail || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function getList(path, params) {
  const query = params ? `?${new URLSearchParams(params).toString()}` : '';
  return request(path + query, { method: 'GET' });
}
export async function getItem(path, id) {
  return request(`${path}${id}/`, { method: 'GET' });
}
export async function createItem(path, payload) {
  return request(path, { method: 'POST', body: JSON.stringify(payload) });
}
export async function updateItem(path, id, payload) {
  return request(`${path}${id}/`, { method: 'PATCH', body: JSON.stringify(payload) });
}
export async function deleteItem(path, id) {
  return request(`${path}${id}/`, { method: 'DELETE' });
}
export async function action(path, id, actionName, payload) {
  return request(`${path}${id}/${actionName}/`, { method: 'POST', body: JSON.stringify(payload || {}) });
}

export async function duplicateItem(path, id) {
  return getItem(path, id);
}

export const inventory = {
  categories: {
    list: (params) => getList('/inventory/categories/', params),
    create: (payload) => createItem('/inventory/categories/', payload),
    update: (id, payload) => updateItem('/inventory/categories/', id, payload),
    remove: (id) => deleteItem('/inventory/categories/', id),
  },
  items: {
    list: (params) => getList('/inventory/items/', params),
    get: (id) => getItem('/inventory/items/', id),
    create: (payload) => createItem('/inventory/items/', payload),
    update: (id, payload) => updateItem('/inventory/items/', id, payload),
    remove: (id) => deleteItem('/inventory/items/', id),
    adjust: (id, payload) => action('/inventory/items/', id, 'adjust', payload),
  },
  stockMoves: {
    list: (params) => getList('/inventory/stock-moves/', params),
    get: (id) => getItem('/inventory/stock-moves/', id),
    create: (payload) => createItem('/inventory/stock-moves/', payload),
    update: (id, payload) => updateItem('/inventory/stock-moves/', id, payload),
    remove: (id) => deleteItem('/inventory/stock-moves/', id),
  },
  warehouses: {
    list: (params) => getList('/inventory/warehouses/', params),
    create: (payload) => createItem('/inventory/warehouses/', payload),
    update: (id, payload) => updateItem('/inventory/warehouses/', id, payload),
    remove: (id) => deleteItem('/inventory/warehouses/', id),
  },
  stockBalances: {
    list: (params) => getList('/inventory/stock-balances/', params),
  },
  journal: {
    list: (params) => getList('/inventory/journal/', params),
  },
  settings: {
    list: (params) => getList('/inventory/settings/', params),
    get: (params) => getList('/inventory/settings/', params),
    create: (payload) => createItem('/inventory/settings/', payload),
    update: (id, payload) => updateItem('/inventory/settings/', id, payload),
  },
};
export const sales = {
  customers: {
    list: (params) => getList('/sales/customers/', params),
    create: (payload) => createItem('/sales/customers/', payload),
    update: (id, payload) => updateItem('/sales/customers/', id, payload),
    remove: (id) => deleteItem('/sales/customers/', id),
  },
  orders: {
    list: (params) => getList('/sales/sales-orders/', params),
    create: (payload) => createItem('/sales/sales-orders/', payload),
    update: (id, payload) => updateItem('/sales/sales-orders/', id, payload),
    submit: (id) => action('/sales/sales-orders/', id, 'submit'),
    approve: (id) => action('/sales/sales-orders/', id, 'approve'),
    reject: (id) => action('/sales/sales-orders/', id, 'reject'),
    remove: (id) => deleteItem('/sales/sales-orders/', id),
  },
  invoices: {
    list: (params) => getList('/sales/sales-invoices/', params),
    get: (id) => getItem('/sales/sales-invoices/', id),
    create: (payload) => createItem('/sales/sales-invoices/', payload),
    update: (id, payload) => updateItem('/sales/sales-invoices/', id, payload),
    submit: (id) => action('/sales/sales-invoices/', id, 'submit'),
    remove: (id) => deleteItem('/sales/sales-invoices/', id),
  },
  quotations: {
    list: (params) => getList('/sales/quotations/', params),
    create: (payload) => createItem('/sales/quotations/', payload),
    update: (id, payload) => updateItem('/sales/quotations/', id, payload),
    submit: (id) => action('/sales/quotations/', id, 'submit'),
  },
  deliveries: {
    list: (params) => getList('/sales/deliveries/', params),
  },
  orderItems: {
    create: (payload) => createItem('/sales/sales-order-items/', payload),
  },
};
export const purchasing = {
  vendors: {
    list: (params) => getList('/purchasing/suppliers/', params),
    create: (payload) => createItem('/purchasing/suppliers/', payload),
    update: (id, payload) => updateItem('/purchasing/suppliers/', id, payload),
    remove: (id) => deleteItem('/purchasing/suppliers/', id),
  },
  suppliers: {
    list: (params) => getList('/purchasing/suppliers/', params),
    create: (payload) => createItem('/purchasing/suppliers/', payload),
    update: (id, payload) => updateItem('/purchasing/suppliers/', id, payload),
    remove: (id) => deleteItem('/purchasing/suppliers/', id),
  },
  prs: {
    list: (params) => getList('/purchasing/purchase-requisitions/', params),
    create: (payload) => createItem('/purchasing/purchase-requisitions/', payload),
    update: (id, payload) => updateItem('/purchasing/purchase-requisitions/', id, payload),
    submit: (id) => action('/purchasing/purchase-requisitions/', id, 'submit'),
    approve: (id) => action('/purchasing/purchase-requisitions/', id, 'approve'),
    reject: (id) => action('/purchasing/purchase-requisitions/', id, 'reject'),
    remove: (id) => deleteItem('/purchasing/purchase-requisitions/', id),
  },
  purchaseOrders: {
    list: (params) => getList('/purchasing/purchase-orders/', params),
    create: (payload) => createItem('/purchasing/purchase-orders/', payload),
    update: (id, payload) => updateItem('/purchasing/purchase-orders/', id, payload),
    submit: (id) => action('/purchasing/purchase-orders/', id, 'submit'),
    approve: (id) => action('/purchasing/purchase-orders/', id, 'approve'),
    reject: (id) => action('/purchasing/purchase-orders/', id, 'reject'),
    remove: (id) => deleteItem('/purchasing/purchase-orders/', id),
  },
  quotations: {
    list: (params) => getList('/purchasing/quotations/', params),
    create: (payload) => createItem('/purchasing/quotations/', payload),
    update: (id, payload) => updateItem('/purchasing/quotations/', id, payload),
    submit: (id) => action('/purchasing/quotations/', id, 'submit'),
    approve: (id) => action('/purchasing/quotations/', id, 'approve'),
    reject: (id) => action('/purchasing/quotations/', id, 'reject'),
    remove: (id) => deleteItem('/purchasing/quotations/', id),
    items: {
      list: (params) => getList('/purchasing/quotation-items/', params),
      create: (payload) => createItem('/purchasing/quotation-items/', payload),
    },
  },
  grns: {
    list: (params) => getList('/purchasing/grn/', params),
    create: (payload) => createItem('/purchasing/grn/', payload),
    update: (id, payload) => updateItem('/purchasing/grn/', id, payload),
    remove: (id) => deleteItem('/purchasing/grn/', id),
  },
  invoices: {
    list: (params) => getList('/purchasing/supplier-invoices/', params),
    create: (payload) => createItem('/purchasing/supplier-invoices/', payload),
    update: (id, payload) => updateItem('/purchasing/supplier-invoices/', id, payload),
    submit: (id) => action('/purchasing/supplier-invoices/', id, 'submit'),
    approve: (id) => action('/purchasing/supplier-invoices/', id, 'approve'),
    reject: (id) => action('/purchasing/supplier-invoices/', id, 'reject'),
    mark_paid: (id) => action('/purchasing/supplier-invoices/', id, 'mark_paid'),
    remove: (id) => deleteItem('/purchasing/supplier-invoices/', id),
  },
  prItems: {
    create: (payload) => createItem('/purchasing/purchase-requisition-items/', payload),
  },
  poItems: {
    create: (payload) => createItem('/purchasing/purchase-order-items/', payload),
  },
  quotationItems: {
    create: (payload) => createItem('/purchasing/quotation-items/', payload),
  },
};
export const settings = {
  skuSeries: {
    list: (params) => getList('/settings/sku-series/', params),
    create: (payload) => createItem('/settings/sku-series/', payload),
    update: (id, payload) => updateItem('/settings/sku-series/', id, payload),
    remove: (id) => deleteItem('/settings/sku-series/', id),
    increment: (id) => action('/settings/sku-series/', id, 'increment'),
  },
  skuSelection: {
    list: (params) => getList('/settings/sku-selection/', params),
    create: (payload) => createItem('/settings/sku-selection/', payload),
    update: (id, payload) => updateItem('/settings/sku-selection/', id, payload),
    remove: (id) => deleteItem('/settings/sku-selection/', id),
  },
};
export const accounting = {
  charts: {
    list: (params) => getList('/accounting/accounts/', params),
    create: (payload) => createItem('/accounting/accounts/', payload),
    update: (id, payload) => updateItem('/accounting/accounts/', id, payload),
    remove: (id) => deleteItem('/accounting/accounts/', id),
  },
  accounts: {
    list: (params) => getList('/accounting/accounts/', params),
    create: (payload) => createItem('/accounting/accounts/', payload),
    update: (id, payload) => updateItem('/accounting/accounts/', id, payload),
    remove: (id) => deleteItem('/accounting/accounts/', id),
  },
  journalEntries: {
    list: (params) => getList('/accounting/journal-entries/', params),
    create: (payload) => createItem('/accounting/journal-entries/', payload),
    update: (id, payload) => updateItem('/accounting/journal-entries/', id, payload),
    remove: (id) => deleteItem('/accounting/journal-entries/', id),
  },
  trialBalance: (params) => getList('/accounting/reports/trial-balance/', params),
  invoices: {
    list: (params) => getList('/accounting/sales-invoices/', params),
  },
  currencies: {
    list: (params) => getList('/accounting/currencies/', params),
    setBase: (id) => action('/accounting/currencies/', id, 'set_base'),
  },
  exchangeRates: {
    list: (params) => getList('/accounting/exchange-rates/', params),
  },
};
export const reports = {
  generalLedger: async (params) => {
    const data = await getList('/reports/general-ledger/', params);
    return Array.isArray(data?.results) ? data.results : [];
  },
  trialBalance: async (params) => {
    const data = await getList('/reports/trial-balance/', params);
    return Array.isArray(data?.results) ? data.results : [];
  },
  financialReports: async (params) => {
    const data = await getList('/reports/financial-reports/', params);
    return Array.isArray(data?.results) ? data.results : [];
  },
  saved: {
    list: (params) => getList('/reports/saved/', params),
    get: (id) => getItem('/reports/saved/', id),
    create: (payload) => createItem('/reports/saved/', payload),
  },
  run: (reportName, filters) =>
    request(`/reports/run/${encodeURIComponent(reportName)}/`, {
      method: 'POST',
      body: JSON.stringify(filters || {}),
    }),
};
export const governance = {
  configurations: {
    list: (params) => getList('/governance/module-period-locks/', params),
    create: (payload) => createItem('/governance/module-period-locks/', payload),
    update: (id, payload) => updateItem('/governance/module-period-locks/', id, payload),
    remove: (id) => deleteItem('/governance/module-period-locks/', id),
  },
  roles: {
    list: (params) => getList('/governance/roles/', params),
    create: (payload) => createItem('/governance/roles/', payload),
    update: (id, payload) => updateItem('/governance/roles/', id, payload),
    remove: (id) => deleteItem('/governance/roles/', id),
  },
  permissions: {
    list: (params) => getList('/governance/permissions/', params),
    create: (payload) => createItem('/governance/permissions/', payload),
    update: (id, payload) => updateItem('/governance/permissions/', id, payload),
    remove: (id) => deleteItem('/governance/permissions/', id),
  },
  rolePermissions: {
    list: (params) => getList('/governance/role-permissions/', params),
    create: (payload) => createItem('/governance/role-permissions/', payload),
    update: (id, payload) => updateItem('/governance/role-permissions/', id, payload),
    remove: (id) => deleteItem('/governance/role-permissions/', id),
  },
  companies: {
    list: (params) => getList('/governance/companies/', params),
    create: (payload) => createItem('/governance/companies/', payload),
    update: (id, payload) => updateItem('/governance/companies/', id, payload),
    remove: (id) => deleteItem('/governance/companies/', id),
  },
  branches: {
    list: (params) => getList('/governance/branches/', params),
    create: (payload) => createItem('/governance/branches/', payload),
    update: (id, payload) => updateItem('/governance/branches/', id, payload),
    remove: (id) => deleteItem('/governance/branches/', id),
  },
  warehouses: {
    list: (params) => getList('/governance/warehouses/', params),
    create: (payload) => createItem('/governance/warehouses/', payload),
    update: (id, payload) => updateItem('/governance/warehouses/', id, payload),
    remove: (id) => deleteItem('/governance/warehouses/', id),
  },
  itemCategories: {
    list: (params) => getList('/governance/item-categories/', params),
    create: (payload) => createItem('/governance/item-categories/', payload),
    update: (id, payload) => updateItem('/governance/item-categories/', id, payload),
    remove: (id) => deleteItem('/governance/item-categories/', id),
  },
  auditTrails: {
    list: (params) => getList('/governance/audit-trails/', params),
  },
};
export const workflow = {
  list: (params) => getList('/workflow/workflows/', params),
  create: (payload) => createItem('/workflow/workflows/', payload),
  update: (id, payload) => updateItem('/workflow/workflows/', id, payload),
  remove: (id) => deleteItem('/workflow/workflows/', id),
  approvals: {
    list: (params) => getList('/workflow/approvals/', params),
    decide: (id, payload) => action('/workflow/approvals/', id, 'decide', payload),
  },
};
export const masterdata = {
  taxes: {
    list: (params) => getList('/masterdata/taxes/', params),
    create: (payload) => createItem('/masterdata/taxes/', payload),
    update: (id, payload) => updateItem('/masterdata/taxes/', id, payload),
    remove: (id) => deleteItem('/masterdata/taxes/', id),
  },
  customers: {
    list: (params) => getList('/masterdata/customers/', params),
    create: (payload) => createItem('/masterdata/customers/', payload),
    update: (id, payload) => updateItem('/masterdata/customers/', id, payload),
    remove: (id) => deleteItem('/masterdata/customers/', id),
  },
  suppliers: {
    list: (params) => getList('/masterdata/suppliers/', params),
    create: (payload) => createItem('/masterdata/suppliers/', payload),
    update: (id, payload) => updateItem('/masterdata/suppliers/', id, payload),
    remove: (id) => deleteItem('/masterdata/suppliers/', id),
  },
  leads: {
    list: (params) => getList('/masterdata/leads/', params),
    create: (payload) => createItem('/masterdata/leads/', payload),
    update: (id, payload) => updateItem('/masterdata/leads/', id, payload),
    remove: (id) => deleteItem('/masterdata/leads/', id),
  },
  employees: {
    list: (params) => getList('/masterdata/employees/', params),
    create: (payload) => createItem('/masterdata/employees/', payload),
    update: (id, payload) => updateItem('/masterdata/employees/', id, payload),
    remove: (id) => deleteItem('/masterdata/employees/', id),
  },
};
export const auth = {
  login: (payload) => request('/auth/login/', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload) => request('/auth/register/', { method: 'POST', body: JSON.stringify(payload) }),
  profile: () => request('/auth/profile/', { method: 'GET' }),
  refresh: (payload) => request('/auth/token/refresh/', { method: 'POST', body: JSON.stringify(payload) }),
  list: () => request('/auth/users/', { method: 'GET' }),
  create: (payload) => request('/auth/users/', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, payload) => request(`/auth/users/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) }),
  remove: (id) => request(`/auth/users/${id}/`, { method: 'DELETE' }),
};
export const login = (payload) => auth.login(payload);
