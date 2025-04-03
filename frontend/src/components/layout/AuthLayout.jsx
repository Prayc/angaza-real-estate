// frontend/src/components/layout/AuthLayout.jsx
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const AuthLayout = () => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  // Only redirect if trying to access login/register pages when already authenticated
  if (
    isAuthenticated &&
    (location.pathname === '/login' || location.pathname === '/register')
  ) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  );
};

export default AuthLayout;
