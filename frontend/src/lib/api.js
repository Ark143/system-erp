const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
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
  },
  invoices: {
    list: (params) => getList('/sales/sales-invoices/', params),
    get: (id) => getItem('/sales/sales-invoices/', id),
    create: (payload) => createItem('/sales/sales-invoices/', payload),
    update: (id, payload) => updateItem('/sales/sales-invoices/', id, payload),
    submit: (id) => action('/sales/sales-invoices/', id, 'submit'),
  },
  quotations: {
    list: (params) => getList('/sales/quotations/', params),
    create: (payload) => createItem('/sales/quotations/', payload),
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
  purchaseOrders: {
    list: (params) => getList('/purchasing/purchase-orders/', params),
    create: (payload) => createItem('/purchasing/purchase-orders/', payload),
    update: (id, payload) => updateItem('/purchasing/purchase-orders/', id, payload),
    submit: (id) => action('/purchasing/purchase-orders/', id, 'submit'),
    approve: (id) => action('/purchasing/purchase-orders/', id, 'approve'),
    reject: (id) => action('/purchasing/purchase-orders/', id, 'reject'),
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
    submit: (id) => action('/purchasing/purchase-requisitions/', id, 'submit'),
    approve: (id) => action('/purchasing/purchase-requisitions/', id, 'approve'),
    reject: (id) => action('/purchasing/purchase-requisitions/', id, 'reject'),
    update: (id, payload) => updateItem('/purchasing/purchase-requisitions/', id, payload),
  },
  pos: {
    list: (params) => getList('/purchasing/purchase-orders/', params),
    create: (payload) => createItem('/purchasing/purchase-orders/', payload),
    submit: (id) => action('/purchasing/purchase-orders/', id, 'submit'),
    approve: (id) => action('/purchasing/purchase-orders/', id, 'approve'),
    reject: (id) => action('/purchasing/purchase-orders/', id, 'reject'),
    update: (id, payload) => updateItem('/purchasing/purchase-orders/', id, payload),
  },
  grns: {
    list: (params) => getList('/purchasing/grn/', params),
  },
  prItems: {
    create: (payload) => createItem('/purchasing/purchase-requisition-items/', payload),
  },
  poItems: {
    create: (payload) => createItem('/purchasing/purchase-order-items/', payload),
  },
};
export const accounting = {
  charts: {
    list: (params) => getList('/accounting/chart-of-accounts/', params),
    create: (payload) => createItem('/accounting/chart-of-accounts/', payload),
    update: (id, payload) => updateItem('/accounting/chart-of-accounts/', id, payload),
  },
  accounts: {
    list: (params) => getList('/accounting/accounts/', params),
    create: (payload) => createItem('/accounting/accounts/', payload),
    update: (id, payload) => updateItem('/accounting/accounts/', id, payload),
  },
  journalEntries: {
    list: (params) => getList('/accounting/journal-entries/', params),
    create: (payload) => createItem('/accounting/journal-entries/', payload),
  },
  trialBalance: (params) => getList('/accounting/reports/trial-balance/', params),
  invoices: {
    list: (params) => getList('/accounting/sales-invoices/', params),
  },
  currencies: {
    list: (params) => getList('/accounting/currencies/', params),
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
    list: () => getList('/governance/configurations/', {}),
    update: (id, payload) => updateItem('/governance/configurations/', id, payload),
  },
  roles: {
    list: (params) => getList('/governance/roles/', params),
  },
  permissions: {
    list: (params) => getList('/governance/permissions/', params),
  },
  rolePermissions: {
    list: (params) => getList('/governance/role-permissions/', params),
  },
};
export const workflow = {
  list: (params) => getList('/workflow/workflows/', params),
  create: (payload) => createItem('/workflow/workflows/', payload),
  approvals: {
    list: (params) => getList('/workflow/approvals/', params),
    action: (id, payload) => action('/workflow/approvals/', id, 'action', payload),
    decide: (id, payload) => action('/workflow/approvals/', id, 'decide', payload),
  },
};
export const masterdata = {
  taxes: {
    list: (params) => getList('/masterdata/taxes/', params),
    create: (payload) => createItem('/masterdata/taxes/', payload),
  },
  customers: {
    list: (params) => getList('/masterdata/customers/', params),
    create: (payload) => createItem('/masterdata/customers/', payload),
  },
  suppliers: {
    list: (params) => getList('/masterdata/suppliers/', params),
    create: (payload) => createItem('/masterdata/suppliers/', payload),
  },
  leads: {
    list: (params) => getList('/masterdata/leads/', params),
    create: (payload) => createItem('/masterdata/leads/', payload),
  },
  employees: {
    list: (params) => getList('/masterdata/employees/', params),
    create: (payload) => createItem('/masterdata/employees/', payload),
  },
  templates: {
    list: () => getList('/masterdata/templates/', {}),
    get: (id) => getItem('/masterdata/templates/', id),
    create: (payload) => createItem('/masterdata/templates/', payload),
    update: (id, payload) => updateItem('/masterdata/templates/', id, payload),
    remove: (id) => deleteItem('/masterdata/templates/', id),
  },
};
export const auth = {
  login: (payload) => request('/auth/login/', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload) => request('/auth/register/', { method: 'POST', body: JSON.stringify(payload) }),
  profile: () => request('/auth/profile/', { method: 'GET' }),
  refresh: (payload) => request('/auth/token/refresh/', { method: 'POST', body: JSON.stringify(payload) }),
  list: () => request('/auth/users/', { method: 'GET' }),
};
export const login = (payload) => auth.login(payload);
