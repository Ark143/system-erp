import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth-context.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Inventory from './pages/Inventory.jsx';
import InventoryItemForm from './pages/InventoryItemForm.jsx';
import InventoryStockBalances from './pages/InventoryStockBalances.jsx';
import InventoryJournal from './pages/InventoryJournal.jsx';
import InventoryStockMoves from './pages/InventoryStockMoves.jsx';
import InventoryStockMoveForm from './pages/InventoryStockMoveForm.jsx';
import InventoryItemCategories from './pages/InventoryItemCategories.jsx';
import InventoryWarehouses from './pages/InventoryWarehouses.jsx';
import Sales from './pages/Sales.jsx';
import Purchasing from './pages/Purchasing.jsx';
import PurchasingPrForm from './pages/PurchasingPrForm.jsx';
import PurchasingPoForm from './pages/PurchasingPoForm.jsx';
import PurchasingQuotationForm from './pages/PurchasingQuotationForm.jsx';
import PurchasingInvoiceForm from './pages/PurchasingInvoiceForm.jsx';
import PurchasingGrnForm from './pages/PurchasingGrnForm.jsx';
import PurchasingQuotations from './pages/PurchasingQuotations.jsx';
import PurchasingPurchaseOrders from './pages/PurchasingPurchaseOrders.jsx';
import PurchasingPrList from './pages/PurchasingPrList.jsx';
import PurchasingGrns from './pages/PurchasingGrns.jsx';
import PurchasingInvoices from './pages/PurchasingInvoices.jsx';
import PurchasingSuppliers from './pages/PurchasingSuppliers.jsx';
import PurchasingSettings from './pages/PurchasingSettings.jsx';
import Accounting from './pages/Accounting.jsx';
import AccountingCurrencies from './pages/AccountingCurrencies.jsx';
import AccountingChartOfAccounts from './pages/AccountingChartOfAccounts.jsx';
import Workflow from './pages/Workflow.jsx';
import Governance from './pages/Governance.jsx';
import GovernanceCompanies from './pages/GovernanceCompanies.jsx';
import GovernanceCompanyForm from './pages/GovernanceCompanyForm.jsx';
import Reports from './pages/Reports.jsx';
import Users from './pages/Users.jsx';
import MasterData from './pages/MasterData.jsx';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RoutesWithAuth() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="inventory/journal" element={<InventoryJournal />} />
        <Route path="inventory/stock-balances" element={<InventoryStockBalances />} />
        <Route path="inventory/stock-moves" element={<InventoryStockMoves />} />
        <Route path="inventory/stock-moves/new" element={<InventoryStockMoveForm />} />
        <Route path="inventory/item-categories" element={<InventoryItemCategories />} />
        <Route path="inventory/warehouses" element={<InventoryWarehouses />} />
        <Route path="inventory/settings" element={<Inventory />} />
        <Route path="inventory/items/new" element={<InventoryItemForm />} />
        <Route path="inventory/items/:id" element={<InventoryItemForm />} />
        <Route path="inventory/*" element={<Inventory />} />
        <Route path="purchasing/prs/new" element={<PurchasingPrForm />} />
        <Route path="purchasing/prs/:id" element={<PurchasingPrForm />} />
        <Route path="purchasing/pos/new" element={<PurchasingPoForm />} />
        <Route path="purchasing/pos/:id" element={<PurchasingPoForm />} />
        <Route path="purchasing/quotations/new" element={<PurchasingQuotationForm />} />
        <Route path="purchasing/quotations/:id" element={<PurchasingQuotationForm />} />
        <Route path="purchasing/invoices/new" element={<PurchasingInvoiceForm />} />
        <Route path="purchasing/invoices/:id" element={<PurchasingInvoiceForm />} />
        <Route path="purchasing/grns/new" element={<PurchasingGrnForm />} />
        <Route path="purchasing/grns/:id" element={<PurchasingGrnForm />} />
        <Route path="purchasing/quotations" element={<PurchasingQuotations />} />
        <Route path="purchasing/orders" element={<PurchasingPurchaseOrders />} />
        <Route path="purchasing/prs" element={<PurchasingPrList />} />
        <Route path="purchasing/grns" element={<PurchasingGrns />} />
        <Route path="purchasing/invoices" element={<PurchasingInvoices />} />
        <Route path="purchasing/suppliers" element={<PurchasingSuppliers />} />
        <Route path="purchasing/settings" element={<PurchasingSettings />} />
        <Route path="sales/*" element={<Sales />} />
        <Route path="accounting/currencies" element={<AccountingCurrencies />} />
        <Route path="accounting/gl-default-accounts" element={<AccountingChartOfAccounts />} />
        <Route path="accounting/*" element={<Accounting />} />
        <Route path="reports/*" element={<Reports />} />
        <Route path="workflow/*" element={<Workflow />} />
        <Route path="governance/companies" element={<GovernanceCompanies />} />
        <Route path="governance/companies/new" element={<GovernanceCompanyForm />} />
        <Route path="governance/companies/:id" element={<GovernanceCompanyForm />} />
        <Route path="governance/companies/:id/edit" element={<GovernanceCompanyForm />} />
        <Route path="governance/*" element={<Governance />} />
        <Route path="users/*" element={<Users />} />
        <Route path="masterdata/*" element={<MasterData />} />
        <Route path="purchasing/*" element={<Purchasing />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <RoutesWithAuth />
      </BrowserRouter>
    </AuthProvider>
  );
}
