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
        <Route path="inventory/*" element={<Inventory />} />
        <Route path="sales/*" element={<Sales />} />
        <Route path="purchasing/*" element={<Purchasing />} />
        <Route path="accounting/*" element={<Accounting />} />
        <Route path="reports/*" element={<Reports />} />
        <Route path="workflow/*" element={<Workflow />} />
        <Route path="governance/*" element={<Governance />} />
        <Route path="users/*" element={<Users />} />
        <Route path="masterdata/*" element={<MasterData />} />
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
