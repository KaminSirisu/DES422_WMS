import { Routes, Route, Navigate } from 'react-router';
import { Toaster } from 'react-hot-toast';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ItemsPage } from './pages/ItemsPage';
import { InboundPage } from './pages/InboundPage';
import { TransferPage } from './pages/TransferPage';
import { PickingPage } from './pages/PickingPage';
import { AdjustInventoryPage } from './pages/AdjustInventoryPage';
import { OrdersPage } from './pages/OrdersPage';
import { LogsPage } from './pages/LogsPage';
import { LocationsPage } from './pages/LocationsPage';
import { UsersPage } from './pages/UsersPage';
import { InventoryMonitorPage } from './pages/InventoryMonitorPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { useAuth } from './context/AuthContext';
import type { Role } from './types';

function ProtectedRoute({ children, adminOnly = false, allowedRoles }: {
  children: React.ReactNode;
  adminOnly?: boolean;
  allowedRoles?: Role[];
}) {
  const { isAuthenticated, isAdmin, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
        <Route path="/register" element={<AuthRoute><RegisterPage /></AuthRoute>} />

        {/* Protected — ใน DashboardLayout */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/picking" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><PickingPage /></ProtectedRoute>} />
          <Route path="/inbound" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><InboundPage /></ProtectedRoute>} />
          <Route path="/transfer" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><TransferPage /></ProtectedRoute>} />
          <Route path="/adjust-inventory" element={<ProtectedRoute adminOnly><AdjustInventoryPage /></ProtectedRoute>} />
          <Route path="/items" element={<ProtectedRoute adminOnly><ItemsPage /></ProtectedRoute>} />
          <Route path="/logs" element={<ProtectedRoute adminOnly><LogsPage /></ProtectedRoute>} />
          <Route path="/inventory-monitor" element={<ProtectedRoute adminOnly><InventoryMonitorPage /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute adminOnly><ReportsPage /></ProtectedRoute>} />
          <Route path="/locations" element={<ProtectedRoute adminOnly><LocationsPage /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute adminOnly><UsersPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute adminOnly><SettingsPage /></ProtectedRoute>} />
        </Route>

        {/* Default */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800">404 - Not Found</h2>
            </div>
          </div>
        } />
      </Routes>
    </>
  );
}

export default App;
