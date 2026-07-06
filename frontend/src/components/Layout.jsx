import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context.jsx';
import {
  LayoutDashboard, Package, ShoppingCart, Truck, Calculator,
  BookOpen, CheckSquare, Shield, Users, ChevronRight, ChevronLeft, LogOut, Menu, X
} from 'lucide-react';

const SECTIONS = [
  { key: 'dashboard', label: 'Dashboard', to: '/', icon: LayoutDashboard, exact: true },
  {
    key: 'inventory',
    label: 'Inventory',
    to: '/inventory/items',
    icon: Package,
    children: [
      { key: 'items', label: 'Items', to: '/inventory/items' },
      { key: 'inventory-journals', label: 'Inventory Journals', to: '/inventory/journal' },
      { key: 'stock-balances', label: 'Stock Balances', to: '/inventory/stock-balances' },
      { key: 'item-categories', label: 'Item Categories', to: '/inventory/item-categories' },
      { key: 'warehouses', label: 'Warehouses', to: '/inventory/warehouses' },
      { key: 'stock-moves', label: 'Stock Moves', to: '/inventory/stock-moves' },
      { key: 'inventory-settings', label: 'Settings', to: '/inventory/settings' },
    ],
  },
  {
    key: 'sales',
    label: 'Sales',
    to: '/sales/customers',
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
    to: '/purchasing/suppliers',
    icon: Truck,
    children: [
      { key: 'purchase-quotation', label: 'Quotation', to: '/purchasing/quotations' },
      { key: 'purchase-order', label: 'Purchase Order', to: '/purchasing/orders' },
      { key: 'pr', label: 'PR', to: '/purchasing/prs' },
      { key: 'grn', label: 'GRNs', to: '/purchasing/grns' },
      { key: 'ap-invoice', label: 'Invoice', to: '/purchasing/invoices' },
      { key: 'supplier', label: 'Supplier', to: '/purchasing/suppliers' },
      { key: 'settings', label: 'Settings', to: '/purchasing/settings' },
    ],
  },
  {
    key: 'accounting',
    label: 'Accounting',
    to: '/accounting/accounts',
    icon: Calculator,
    children: [
      { key: 'exchange-rates', label: 'Exchange Rates', to: '/accounting/exchange-rates' },
      { key: 'currencies', label: 'Currencies', to: '/accounting/currencies' },
      { key: 'gl-default-accounts', label: 'GL Default Accounts', to: '/accounting/gl-default-accounts' },
      { key: 'fiscal-periods', label: 'Fiscal Periods', to: '/accounting/fiscal-periods' },
      { key: 'payment-entry', label: 'Payment Entry', to: '/accounting/payment-entries' },
      { key: 'journal-entry', label: 'Journal Entry', to: '/accounting/journal-entries' },
      { key: 'bank-recon', label: 'Bank Recon', to: '/accounting/bank-reconciliation' },
    ],
  },
  {
    key: 'reports',
    label: 'Reports',
    to: '/reports/general-ledger',
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
    to: '/workflow/approvals',
    icon: CheckSquare,
    children: [
      { key: 'approval', label: 'Approval', to: '/workflow/approvals' },
      { key: 'workflow-document', label: 'Workflow Document', to: '/workflow/documents' },
    ],
  },
  {
    key: 'governance',
    label: 'Governance',
    to: '/governance/companies',
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
    key: 'users',
    label: 'Users',
    to: '/users/permissions',
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
    to: '/masterdata/import',
    icon: Users,
    children: [
      { key: 'taxes', label: 'Taxes', to: '/masterdata/taxes' },
      { key: 'customer', label: 'Customer', to: '/masterdata/customers' },
      { key: 'supplier', label: 'Supplier', to: '/masterdata/suppliers' },
      { key: 'leads', label: 'Leads', to: '/masterdata/leads' },
      { key: 'employees', label: 'Employees', to: '/masterdata/employees' },
    ],
  },
];

function renderIcon(iconProp, size, className) {
  if (!iconProp) return null;
  const Icon = iconProp;
  return <Icon size={size} className={className || ''} />;
}

const linkBase = 'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold no-underline transition hover:bg-[var(--color-muted)]';
const active = 'bg-[var(--color-muted)] text-[var(--color-foreground)]';
const base = 'text-[var(--color-muted-foreground)]';

export default function Layout() {
  const { user, logout, rbac } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('dark-mode') === 'true');

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', isCollapsed);
  }, [isCollapsed]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const doLogout = () => { logout(); navigate('/login'); };

  const allowedModules = Array.isArray(rbac?.visible_modules) ? rbac.visible_modules : [];

  const navContent = (collapsedMode) => (
    <div className="space-y-1">
      {SECTIONS.map((section) => {
        if (!allowedModules.includes(section.key)) return null;

        const Icon = section.icon;
        const isExact = section.exact;

        if (collapsedMode) {
          return (
            <div key={section.key} className="group relative flex justify-center py-1">
              <NavLink
                to={section.to}
                end={isExact}
                className={({ isActive }) =>
                  `flex h-10 w-10 items-center justify-center rounded-xl transition ${isActive ? active : base} hover:bg-[var(--color-muted)]`
                }
              >
                {renderIcon(Icon, 20)}
              </NavLink>
              {/* Flyout Menu */}
              <div className="absolute left-full top-0 ml-2 z-50 hidden group-hover:flex flex-col bg-[var(--color-background)] border border-[var(--color-border)] shadow-xl rounded-xl p-2 w-52 transition-all">
                <div className="px-3 py-1.5 text-xs font-semibold text-[var(--color-ink-secondary)] uppercase tracking-wider border-b border-[var(--color-border)] mb-1">
                  {section.label}
                </div>
                {section.children ? (
                  section.children.map((child) => (
                    <NavLink
                      key={child.key}
                      to={child.to}
                      className={({ isActive }) =>
                        `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold no-underline transition ${
                          isActive ? 'bg-[var(--color-muted)] text-[var(--color-ink)]' : 'text-[var(--color-ink-secondary)] hover:bg-[var(--color-muted)]'
                        }`
                      }
                    >
                      <ChevronRight size={14} />
                      {child.label}
                    </NavLink>
                  ))
                ) : (
                  <NavLink
                    to={section.to}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold no-underline transition text-[var(--color-ink-secondary)] hover:bg-[var(--color-muted)]"
                  >
                    Open {section.label}
                  </NavLink>
                )}
              </div>
            </div>
          );
        }

        // Expanded Mode
        if (section.children) {
          return (
            <div key={section.key} className="space-y-1">
              <div className="mt-4 mb-1 px-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-secondary)] flex items-center">
                {renderIcon(section.icon, 14, 'mr-2')}
                {section.label}
              </div>
              {section.children.map((child) => (
                <NavLink
                  key={child.key}
                  to={child.to}
                  className={({ isActive }) =>
                    `${linkBase} ${isActive ? active : base} pl-9`
                  }
                >
                  {child.label}
                </NavLink>
              ))}
            </div>
          );
        }

        return (
          <NavLink
            key={section.key}
            to={section.to}
            end={isExact}
            className={({ isActive }) => `${linkBase} ${isActive ? active : base}`}
          >
            {renderIcon(Icon, 18)}
            {section.label}
          </NavLink>
        );
      })}
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col border-r border-[var(--color-border)] bg-[var(--color-background)] transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="px-6 py-5 text-lg font-bold tracking-tight text-[var(--color-foreground)] border-b border-[var(--color-border)] overflow-hidden whitespace-nowrap">
          {isCollapsed ? 'SE' : 'System erp'}
        </div>
          <nav className="flex-1 overflow-y-auto px-3 space-y-1 pb-3 pt-4 text-[var(--color-foreground)]">
            {navContent(isCollapsed)}
          </nav>
          <div className="p-3 border-t border-[var(--color-border)] space-y-1">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex w-full items-center justify-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[var(--color-muted-foreground)] transition hover:bg-[var(--color-muted)]"
            >
            {isCollapsed ? <ChevronRight size={18} /> : <><ChevronLeft size={18} /> Collapse</>}
          </button>
          <button
            onClick={doLogout}
            className={`flex w-full items-center ${isCollapsed ? 'justify-center' : 'gap-3'} rounded-xl px-4 py-3 text-sm font-semibold text-[var(--color-muted-foreground)] transition hover:bg-[var(--color-muted)]`}
          >
            <LogOut size={18} />
            {!isCollapsed && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
          <aside className="relative flex w-64 flex-col bg-[var(--color-background)] h-full shadow-xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)]">
              <div className="text-lg font-bold tracking-tight text-[var(--color-foreground)]">System erp</div>
              <button onClick={() => setIsMobileOpen(false)} className="p-1 rounded-lg hover:bg-[var(--color-muted)]">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 space-y-1 pb-3 pt-4 text-[var(--color-foreground)]">
              {navContent(false)}
            </nav>
            <div className="p-3 border-t border-[var(--color-border)]">
              <button
                onClick={doLogout}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[var(--color-muted-foreground)] transition hover:bg-[var(--color-muted)]"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header bar with Burger menu for Mobile */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-background)]/80 px-6 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileOpen(true)} className="md:hidden p-1.5 rounded-lg hover:bg-[var(--color-muted)] text-[var(--color-muted-foreground)]">
              <Menu size={20} />
            </button>
            <h1 className="text-sm font-semibold uppercase tracking-widest text-[var(--color-ink-secondary)]">{user?.role || 'User'}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs font-semibold text-[var(--color-foreground)]">{user?.company?.company_name || '—'}</div>
              <div className="text-sm font-medium text-[var(--color-muted-foreground)]">{user?.email}</div>
            </div>
            <button
              onClick={() => {
                const next = !(localStorage.getItem('dark-mode') === 'true');
                localStorage.setItem('dark-mode', String(next));
                setDarkMode(next);
              }}
              className="rounded-lg border border-[var(--color-border)] p-2 text-sm font-semibold text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] transition"
              aria-label="Toggle dark mode"
            >
              {(localStorage.getItem('dark-mode') || 'false') === 'true' ? 'Light' : 'Dark'}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-[var(--color-background)]">
          <div className="mx-auto max-w-6xl p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
