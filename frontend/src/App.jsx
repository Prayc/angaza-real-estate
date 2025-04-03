// frontend/src/App.jsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAuthStore from './store/authStore';
import { Toaster } from 'react-hot-toast';

// Layouts
import Layout from './components/layout/Layout';
import AuthLayout from './components/layout/AuthLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Dashboard
import Dashboard from './pages/dashboard/Dashboard';

// Properties
import PropertiesList from './pages/properties/PropertiesList';
import PropertyDetails from './pages/properties/PropertyDetails';
import AddProperty from './pages/properties/AddProperty';
import EditProperty from './pages/properties/EditProperty';
import LandingPage from './pages/Home';

// Tenants
import TenantsList from './pages/tenants/TenantsList';
import TenantDetails from './pages/tenants/TenantDetails';
import EditTenant from './pages/tenants/EditTenant';
import AddTenant from './pages/tenants/AddTenant';

// Units
import UnitsList from './pages/units/UnitsList';
import UnitDetails from './pages/units/UnitsDetails';
import AddUnit from './pages/units/AddUnit';
import EditUnit from './pages/units/EditUnits';
import AssignTenant from './pages/units/AssignTenant';

// Leases
import LeasesList from './pages/leases/LeasesList';
import LeaseDetails from './pages/leases/LeaseDetails';

// Maintenance
import MaintenanceList from './pages/maintenance/MaintenanceList';
import AddMaintenanceRequest from './pages/maintenance/AddMaintenanceRequest';
import MaintenanceDetails from './pages/maintenance/MaintenanceDetails';

// Payments
import PaymentsList from './pages/payments/PaymentsList';
import AddPayment from './pages/payments/AddPayment';
import PaymentDetails from './pages/payments/PaymentDetails';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Role-based Route Component
const RoleRoute = ({ children, allowedRoles }) => {
  const { user } = useAuthStore();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
};

// Create Query Client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Toaster position="top-right" />

        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />

          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Protected Routes */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard */}
            <Route path="/dashboard" element={<Dashboard />} />
            {/* Properties */}
            <Route path="/properties" element={<PropertiesList />} />
            <Route path="/properties/:id" element={<PropertyDetails />} />
            <Route
              path="/properties/add"
              element={
                <RoleRoute allowedRoles={['admin', 'landlord']}>
                  <AddProperty />
                </RoleRoute>
              }
            />
            <Route
              path="/properties/edit/:id"
              element={
                <RoleRoute allowedRoles={['admin', 'landlord']}>
                  <EditProperty />
                </RoleRoute>
              }
            />
            {/* Tenants */}
            <Route
              path="/tenants"
              element={
                <RoleRoute
                  allowedRoles={['admin', 'property_manager', 'landlord']}
                >
                  <TenantsList />
                </RoleRoute>
              }
            />
            <Route
              path="/tenants/:id"
              element={
                <RoleRoute
                  allowedRoles={['admin', 'property_manager', 'landlord']}
                >
                  <TenantDetails />
                </RoleRoute>
              }
            />
            <Route
              path="/tenants/edit/:id"
              element={
                <RoleRoute
                  allowedRoles={['admin', 'property_manager', 'landlord']}
                >
                  <EditTenant />
                </RoleRoute>
              }
            />
            <Route
              path="/tenants/add"
              element={
                <RoleRoute
                  allowedRoles={['admin', 'property_manager', 'landlord']}
                >
                  <AddTenant />
                </RoleRoute>
              }
            />
            <Route path="/units/:id/assign-tenant" element={<AssignTenant />} />
            {/* Units */}
            <Route path="/units" element={<UnitsList />} />
            <Route
              path="/properties/:propertyId/units"
              element={<UnitsList />}
            />
            <Route path="/units/:id" element={<UnitDetails />} />
            <Route
              path="/units/add"
              element={
                <RoleRoute
                  allowedRoles={['admin', 'property_manager', 'landlord']}
                >
                  <AddUnit />
                </RoleRoute>
              }
            />
            <Route
              path="/properties/:propertyId/units/add"
              element={
                <RoleRoute
                  allowedRoles={['admin', 'property_manager', 'landlord']}
                >
                  <AddUnit />
                </RoleRoute>
              }
            />
            <Route
              path="/units/edit/:id"
              element={
                <RoleRoute
                  allowedRoles={['admin', 'property_manager', 'landlord']}
                >
                  <EditUnit />
                </RoleRoute>
              }
            />

            {/* Leases */}
            <Route path="/leases" element={<LeasesList />} />
            <Route path="/leases/:id" element={<LeaseDetails />} />

            {/* Maintenance */}
            <Route path="/maintenance" element={<MaintenanceList />} />
            <Route
              path="/maintenance/add"
              element={<AddMaintenanceRequest />}
            />
            <Route path="/maintenance/:id" element={<MaintenanceDetails />} />

            {/* Payments */}
            <Route path="/payments" element={<PaymentsList />} />
            <Route path="/payments/new" element={<AddPayment />} />
            <Route path="/payments/:id" element={<PaymentDetails />} />
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
