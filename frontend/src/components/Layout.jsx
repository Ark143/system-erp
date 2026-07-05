import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context.jsx';
import {
  LayoutDashboard, Package, ShoppingCart, Truck, Calculator,
  BookOpen, CheckSquare, Shield, Users, ChevronRight, LogOut,
} from 'lucide-react';

const SECTIONS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    to: '/',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    key: 'inventory',
    label: 'Inventory',
    icon: Package,
    children: [
      { key: 'cycle-count-items', label: 'Cycle Count Items', to: '/inventory/cycle-count-items' },
      { key: 'cycle-counts', label: 'Cycle Counts', to: '/inventory/cycle-counts' },
      { key: 'inventory-journals', label: 'Inventory Journals', to: '/inventory/journal' },
      { key: 'stock-balances', label: 'Stock Balances', to: '/inventory/stock-balances' },
      { key: 'item-categories', label: 'Item Categories', to: '/inventory/item-categories' },
      { key: 'warehouses', label: 'Warehouses', to: '/inventory/warehouses' },
    ],
  },
  {
    key: 'sales',
    label: 'Sales',
    icon: ShoppingCart,
    children: [
      { key: 'blanket-order', label: 'Blanket Order', to: '/sales/blanket-orders' },
      { key: 'quotation', label: 'Quotation', to: '/sales/quotations' },
      { key: 'sales-order', label: 'Sales Order', to: '/sales/orders' },
      { key: 'ar-invoice', label: 'AR Invoice', to: '/sales/invoices' },
      { key: 'delivery', label: 'Delivery', to: '/sales/delivery' },
    ],
  },
  {
    key: 'purchasing',
    label: 'Purchasing',
    icon: Truck,
    children: [
      { key: 'purchase-quotation', label: 'Purchase Quotation', to: '/purchasing/quotations' },
      { key: 'purchase-order', label: 'Purchase Order', to: '/purchasing/orders' },
      { key: 'ap-invoice', label: 'AP Invoice', to: '/purchasing/invoices' },
      { key: 'grn', label: 'Good Receipt PO', to: '/purchasing/grn' },
    ],
  },
  {
    key: 'accounting',
    label: 'Accounting',
    icon: Calculator,
    children: [
      { key: 'exchange-rates', label: 'Exchange Rates', to: '/accounting/exchange-rates' },
      { key: 'currencies', label: 'Currencies', to: '/accounting/currencies' },
      { key: 'gl-default-accounts', label: 'GL Default Accounts', to: '/accounting/gl-default-accounts' },
      { key: 'inventory-cost-layers', label: 'Inventory Cost Layers', to: '/accounting/inventory-cost-layers' },
      { key: 'fiscal-periods', label: 'Fiscal Periods', to: '/accounting/fiscal-periods' },
      { key: 'payment-entry', label: 'Payment Entry', to: '/accounting/payment-entries' },
      { key: 'journal-entry', label: 'Journal Entry', to: '/accounting/journal-entries' },
      { key: 'bank-recon', label: 'Bank Recon', to: '/accounting/bank-reconciliation' },
    ],
  },
  {
    key: 'reports',
    label: 'Reports',
    icon: BookOpen,
    children: [
      { key: 'general-ledger', label: 'General Ledger', to: '/reports/general-ledger' },
      { key: 'trial-balance', label: 'Trial Balance', to: '/reports/trial-balance' },
      { key: 'financial-reports', label: 'Financial Reports', to: '/reports/financial-reports' },
    ],
  },
  {
    key: 'workflow',
    label: 'Workflow',
    icon: CheckSquare,
    children: [
      { key: 'approval', label: 'Approval', to: '/workflow/approvals' },
      { key: 'workflow-document', label: 'Workflow Document', to: '/workflow/documents' },
    ],
  },
  {
    key: 'governance',
    label: 'Governance',
    icon: Shield,
    children: [
      { key: 'audit-trails', label: 'Audit Trails', to: '/governance/audit-trails' },
      { key: 'decimal-configs', label: 'Decimal Configs', to: '/governance/decimal-configs' },
      { key: 'module-period-locks', label: 'Module Period Locks', to: '/governance/module-period-locks' },
      { key: 'branches', label: 'Branches', to: '/governance/branches' },
      { key: 'company-users', label: 'Company Users', to: '/governance/company-users' },
      { key: 'companies', label: 'Companies', to: '/governance/companies' },
    ],
  },
  {
    key: 'user',
    label: 'User',
    icon: Users,
    children: [
      { key: 'permissions', label: 'Permissions', to: '/users/permissions' },
      { key: 'roles', label: 'Roles', to: '/users/roles' },
      { key: 'role-permissions', label: 'Role Permissions', to: '/users/role-permissions' },
    ],
  },
  {
    key: 'masterdata',
    label: 'Master Data',
    icon: Users,
    children: [
      { key: 'import', label: 'Data Import', to: '/masterdata/import' },
      { key: 'taxes', label: 'Taxes', to: '/masterdata/taxes' },
      { key: 'customer', label: 'Customer', to: '/masterdata/customers' },
      { key: 'supplier', label: 'Supplier', to: '/masterdata/suppliers' },
      { key: 'leads', label: 'Leads', to: '/masterdata/leads' },
      { key: 'employees', label: 'Employees', to: '/masterdata/employees' },
    ],
  },
];

const linkBase = 'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold no-underline transition hover:bg-black/5';
const active = 'bg-black/[0.04] text-[var(--color-ink)]';
const base = 'text-[var(--color-ink-secondary)]';

function SectionItem({ section, child, depth = 0 }) {
  if (child) {
    return (
      <NavLink
        to={child.to}
        end={false}
        className={({ isActive }) =>
          `${linkBase} ${isActive ? active : base} ${depth > 0 ? 'pl-9' : ''}`
        }
      >
        <ChevronRight size={16} />
        {child.label}
      </NavLink>
    );
  }

  const Icon = section?.icon;
  const isExact = section?.exact;

  return (
    <NavLink
      to={section.to}
      end={isExact}
      className={({ isActive }) => `${linkBase} ${isActive ? active : base}`}
    >
      {Icon ? <Icon size={18} /> : <LayoutDashboard size={18} />}
      {section.label}
    </NavLink>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const doLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex w-64 flex-col border-r border-[var(--color-border)] bg-white">
        <div className="px-6 py-5 text-lg font-bold tracking-tight text-[var(--color-ink)]">System erp</div>
        <nav className="flex-1 overflow-y-auto px-3 space-y-1 pb-3">
          {SECTIONS.map((section) => {
            if (section.children) {
              return (
                <div key={section.key} className="space-y-1">
                  <div className="mt-2 mb-1 px-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-secondary)]">
                    <section.icon size={14} className="mr-2 inline" />
                    {section.label}
                  </div>
                  {section.children.map((child) => (
                    <SectionItem key={child.key} child={child} depth={1} />
                  ))}
                </div>
              );
            }

            return <SectionItem key={section.key} section={section} />;
          })}
        </nav>
        <div className="p-3">
          <button
            onClick={doLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[var(--color-ink-secondary)] transition hover:bg-black/5"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-[var(--color-surface)]">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-border)] bg-white/80 px-8 py-4 backdrop-blur">
          <h1 className="text-base font-semibold uppercase tracking-widest text-[var(--color-ink-secondary)]">{user?.role || 'User'}</h1>
          <div className="text-sm font-medium text-[var(--color-ink-secondary)]">{user?.email}</div>
        </header>
        <div className="mx-auto max-w-6xl p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
