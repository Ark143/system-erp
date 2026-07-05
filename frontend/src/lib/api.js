import axiosClient from './auth-context.jsx';

export async function getList(path, params = {}) {
  const { data } = await axiosClient.get(path, { params });
  return Array.isArray(data) ? data : data?.results || [];
}

export async function getItem(path, id) {
  const { data } = await axiosClient.get(`${path}${id}/`);
  return data;
}

export async function createItem(path, payload) {
  const { data } = await axiosClient.post(path, payload);
  return data;
}

export async function updateItem(path, id, payload) {
  const { data } = await axiosClient.patch(`${path}${id}/`, payload);
  return data;
}

export async function deleteItem(path, id) {
  await axiosClient.delete(`${path}${id}/`);
}

export async function action(path, id, actionName, payload = {}) {
  const { data } = await axiosClient.post(`${path}${id}/${actionName}/`, payload);
  return data;
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
  },
};

export const purchasing = {
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
  },
  pos: {
    list: (params) => getList('/purchasing/purchase-orders/', params),
    create: (payload) => createItem('/purchasing/purchase-orders/', payload),
    update: (id, payload) => updateItem('/purchasing/purchase-orders/', id, payload),
    submit: (id) => action('/purchasing/purchase-orders/', id, 'submit'),
    approve: (id) => action('/purchasing/purchase-orders/', id, 'approve'),
    reject: (id) => action('/purchasing/purchase-orders/', id, 'reject'),
  },
};

export const accounting = {
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
    post: (id) => action('/accounting/journal-entries/', id, 'post_entry'),
    cancel: (id) => action('/accounting/journal-entries/', id, 'cancel'),
  },
  trialBalance: () => axiosClient.get('/accounting/reports/trial-balance/').then(r => r.data),
};

export const workflow = {
  list: (params) => getList('/workflow/workflows/', params),
  create: (payload) => createItem('/workflow/workflows/', payload),
  update: (id, payload) => updateItem('/workflow/workflows/', id, payload),
  remove: (id) => deleteItem('/workflow/workflows/', id),
  approvals: {
    list: (params) => getList('/workflow/approvals/', params),
    decide: (id, payload) => action('/workflow/approvals/', id, 'partial_update', payload).catch(e => action('/workflow/approvals/', id, 'update', payload)),
  },
};
