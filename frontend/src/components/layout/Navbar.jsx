// frontend/src/components/layout/Navbar.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Home } from 'lucide-react';
import { Button } from '../ui/button';
import useAuthStore from '../../store/authStore';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="md:hidden flex flex-col items-start">
              <Link to="/" className="flex items-center space-x-2">
                <Home className="h-6 w-6" />
                <span className="text-xl font-bold">Angaza Real Estate</span>
              </Link>
              <span className="text-xs font-medium capitalize">
                Welcome {user?.name}
              </span>
            </div>

            <div className="hidden md:block">
              <h1 className="capitalize">Welcome {user?.name}</h1>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              <div className="ml-3 relative">
                <div className="flex items-center space-x-3">
                  <div>
                    <h3 className="capitalize">{user.role}</h3>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="text-primary"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="bg-primary-foreground/10 p-2 rounded-md text-primary-foreground"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/dashboard"
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-primary-foreground hover:text-primary"
              onClick={() => setIsOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              to="/properties"
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-primary-foreground hover:text-primary"
              onClick={() => setIsOpen(false)}
            >
              Properties
            </Link>
            {(user?.role === 'admin' ||
              user?.role === 'property_manager' ||
              user?.role === 'landlord') && (
              <Link
                to="/tenants"
                className="block px-3 py-2 rounded-md text-base font-medium hover:bg-primary-foreground hover:text-primary"
                onClick={() => setIsOpen(false)}
              >
                Tenants
              </Link>
            )}
            <Link
              to="/leases"
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-primary-foreground hover:text-primary"
              onClick={() => setIsOpen(false)}
            >
              Leases
            </Link>
            <Link
              to="/maintenance"
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-primary-foreground hover:text-primary"
              onClick={() => setIsOpen(false)}
            >
              Maintenance
            </Link>
            <Link
              to="/payments"
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-primary-foreground hover:text-primary"
              onClick={() => setIsOpen(false)}
            >
              Payments
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handleLogout();
                setIsOpen(false);
              }}
              className="w-full mt-4"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
