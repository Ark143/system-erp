import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth-context.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Inventory from './pages/Inventory.jsx';
import Sales from './pages/Sales.jsx';
import Purchasing from './pages/Purchasing.jsx';
import Accounting from './pages/Accounting.jsx';
import Workflow from './pages/Workflow.jsx';
import Governance from './pages/Governance.jsx';
import Reports from './pages/Reports.jsx';
import Users from './pages/Users.jsx';
import MasterData from './pages/MasterData.jsx';

function PrivateRoute({ children, moduleKey }) {
  const { user, rbac } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const visible = Array.isArray(rbac?.visible_modules) ? rbac.visible_modules : [];
  if (moduleKey && !visible.includes(moduleKey)) return <Navigate to="/" replace />;
  return children;
}

function RoutesWithAuth() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<PrivateRoute moduleKey="dashboard"><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="inventory" element={<PrivateRoute moduleKey="inventory"><Inventory /></PrivateRoute>} />
        <Route path="sales/*" element={<PrivateRoute moduleKey="sales"><Sales /></PrivateRoute>} />
        <Route path="purchasing/*" element={<PrivateRoute moduleKey="purchasing"><Purchasing /></PrivateRoute>} />
        <Route path="accounting" element={<PrivateRoute moduleKey="accounting"><Accounting /></PrivateRoute>} />
        <Route path="reports" element={<PrivateRoute moduleKey="reports"><Reports /></PrivateRoute>} />
        <Route path="workflow" element={<PrivateRoute moduleKey="workflow"><Workflow /></PrivateRoute>} />
        <Route path="governance" element={<PrivateRoute moduleKey="governance"><Governance /></PrivateRoute>} />
        <Route path="users" element={<PrivateRoute moduleKey="users"><Users /></PrivateRoute>} />
        <Route path="masterdata/*" element={<PrivateRoute moduleKey="masterdata"><MasterData /></PrivateRoute>} />
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
