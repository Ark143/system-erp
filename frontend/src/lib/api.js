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
  exchangeRates: {
    list: (params) => getList('/accounting/extra/exchange-rates/', params),
    create: (payload) => createItem('/accounting/extra/exchange-rates/', payload),
    update: (id, payload) => updateItem('/accounting/extra/exchange-rates/', id, payload),
    remove: (id) => deleteItem('/accounting/extra/exchange-rates/', id),
  },
  currencies: {
    list: (params) => getList('/accounting/extra/currencies/', params),
    create: (payload) => createItem('/accounting/extra/currencies/', payload),
    update: (id, payload) => updateItem('/accounting/extra/currencies/', id, payload),
    remove: (id) => deleteItem('/accounting/extra/currencies/', id),
  },
  glDefaultAccounts: {
    list: (params) => getList('/accounting/extra/gl-default-accounts/', params),
    create: (payload) => createItem('/accounting/extra/gl-default-accounts/', payload),
    update: (id, payload) => updateItem('/accounting/extra/gl-default-accounts/', id, payload),
    remove: (id) => deleteItem('/accounting/extra/gl-default-accounts/', id),
  },
  paymentEntries: {
    list: (params) => getList('/accounting/extra/payment-entries/', params),
    create: (payload) => createItem('/accounting/extra/payment-entries/', payload),
    update: (id, payload) => updateItem('/accounting/extra/payment-entries/', id, payload),
  },
  bankReconciliations: {
    list: (params) => getList('/accounting/extra/bank-reconciliation/', params),
    create: (payload) => createItem('/accounting/extra/bank-reconciliation/', payload),
    update: (id, payload) => updateItem('/accounting/extra/bank-reconciliation/', id, payload),
  },
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

export const reports = {
  generalLedger: () => axiosClient.get('/reports/general-ledger/').then(r => r.data),
  trialBalance: () => axiosClient.get('/reports/trial-balance/').then(r => r.data),
  financialReports: () => axiosClient.get('/reports/financial-reports/').then(r => r.data),
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

export const governance = {
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
  decimalConfigs: {
    list: (params) => getList('/governance/decimal-configs/', params),
    create: (payload) => createItem('/governance/decimal-configs/', payload),
    update: (id, payload) => updateItem('/governance/decimal-configs/', id, payload),
    remove: (id) => deleteItem('/governance/decimal-configs/', id),
  },
  glDefaultAccounts: {
    list: (params) => getList('/governance/gl-default-accounts/', params),
    create: (payload) => createItem('/governance/gl-default-accounts/', payload),
    update: (id, payload) => updateItem('/governance/gl-default-accounts/', id, payload),
    remove: (id) => deleteItem('/governance/gl-default-accounts/', id),
  },
  currencies: {
    list: (params) => getList('/governance/currencies/', params),
    create: (payload) => createItem('/governance/currencies/', payload),
    update: (id, payload) => updateItem('/governance/currencies/', id, payload),
    remove: (id) => deleteItem('/governance/currencies/', id),
  },
  exchangeRates: {
    list: (params) => getList('/governance/exchange-rates/', params),
    create: (payload) => createItem('/governance/exchange-rates/', payload),
    update: (id, payload) => updateItem('/governance/exchange-rates/', id, payload),
    remove: (id) => deleteItem('/governance/exchange-rates/', id),
  },
  fiscalPeriods: {
    list: (params) => getList('/governance/fiscal-periods/', params),
    create: (payload) => createItem('/governance/fiscal-periods/', payload),
    update: (id, payload) => updateItem('/governance/fiscal-periods/', id, payload),
    remove: (id) => deleteItem('/governance/fiscal-periods/', id),
  },
  modulePeriodLocks: {
    list: (params) => getList('/governance/module-period-locks/', params),
    create: (payload) => createItem('/governance/module-period-locks/', payload),
    update: (id, payload) => updateItem('/governance/module-period-locks/', id, payload),
    remove: (id) => deleteItem('/governance/module-period-locks/', id),
  },
  stockBalances: {
    list: (params) => getList('/governance/stock-balances/', params),
    create: (payload) => createItem('/governance/stock-balances/', payload),
    update: (id, payload) => updateItem('/governance/stock-balances/', id, payload),
    remove: (id) => deleteItem('/governance/stock-balances/', id),
  },
  inventoryJournals: {
    list: (params) => getList('/governance/inventory-journals/', params),
    create: (payload) => createItem('/governance/inventory-journals/', payload),
    update: (id, payload) => updateItem('/governance/inventory-journals/', id, payload),
    remove: (id) => deleteItem('/governance/inventory-journals/', id),
  },
  cycleCounts: {
    list: (params) => getList('/governance/cycle-counts/', params),
    create: (payload) => createItem('/governance/cycle-counts/', payload),
    update: (id, payload) => updateItem('/governance/cycle-counts/', id, payload),
    remove: (id) => deleteItem('/governance/cycle-counts/', id),
  },
  cycleCountItems: {
    list: (params) => getList('/governance/cycle-count-items/', params),
    create: (payload) => createItem('/governance/cycle-count-items/', payload),
    update: (id, payload) => updateItem('/governance/cycle-count-items/', id, payload),
    remove: (id) => deleteItem('/governance/cycle-count-items/', id),
  },
  auditTrails: {
    list: (params) => getList('/governance/audit-trails/', params),
    create: (payload) => createItem('/governance/audit-trails/', payload),
    update: (id, payload) => updateItem('/governance/audit-trails/', id, payload),
    remove: (id) => deleteItem('/governance/audit-trails/', id),
  },
  roles: {
    list: (params) => getList('/governance/roles/', params),
    create: (payload) => createItem('/governance/roles/', payload),
    update: (id, payload) => updateItem('/governance/roles/', id, payload),
    remove: (id) => deleteItem('/governance/roles/', id),
  },
  companyUsers: {
    list: (params) => getList('/governance/company-users/', params),
    create: (payload) => createItem('/governance/company-users/', payload),
    update: (id, payload) => updateItem('/governance/company-users/', id, payload),
    remove: (id) => deleteItem('/governance/company-users/', id),
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
  inventoryCostLayers: {
    list: (params) => getList('/governance/inventory-cost-layers/', params),
    create: (payload) => createItem('/governance/inventory-cost-layers/', payload),
    update: (id, payload) => updateItem('/governance/inventory-cost-layers/', id, payload),
    remove: (id) => deleteItem('/governance/inventory-cost-layers/', id),
  },
};
