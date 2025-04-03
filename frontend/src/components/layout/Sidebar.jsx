// frontend/src/components/layout/Sidebar.jsx
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Building,
  Users,
  FileText,
  Settings,
  DollarSign,
  BarChart,
  LayoutDashboard,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useEffect, useState } from 'react';

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  // Check window width on mount and when resized
  useEffect(() => {
    const checkWidth = () => {
      setCollapsed(window.innerWidth < 1024);
    };

    // Initial check
    checkWidth();

    // Add event listener
    window.addEventListener('resize', checkWidth);

    // Clean up
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      roles: ['admin', 'property_manager', 'tenant', 'landlord'],
    },
    {
      title: 'Properties',
      path: '/properties',
      icon: <Building className="h-5 w-5" />,
      roles: ['admin', 'property_manager', 'landlord'],
    },
    {
      title: 'Tenants',
      path: '/tenants',
      icon: <Users className="h-5 w-5" />,
      roles: ['admin', 'property_manager', 'landlord'],
    },
    {
      title: 'Leases',
      path: '/leases',
      icon: <FileText className="h-5 w-5" />,
      roles: ['admin', 'property_manager', 'tenant', 'landlord'],
    },
    {
      title: 'Maintenance',
      path: '/maintenance',
      icon: <Settings className="h-5 w-5" />,
      roles: ['admin', 'property_manager', 'tenant', 'landlord'],
    },
    {
      title: 'Payments',
      path: '/payments',
      icon: <DollarSign className="h-5 w-5" />,
      roles: ['admin', 'property_manager', 'tenant', 'landlord'],
    },
    // {
    //   title: 'Reports',
    //   path: '/reports',
    //   icon: <BarChart className="h-5 w-5" />,
    //   roles: ['admin', 'property_manager', 'landlord'],
    // },
  ];

  return (
    <div
      className={`h-full ${
        collapsed ? 'w-16' : 'w-64'
      } bg-card border-r flex flex-col transition-width duration-300`}
    >
      <div className="p-4 border-b flex justify-center">
        <div className="flex-shrink-0">
          <Link to="/" className="flex items-center space-x-2">
            <Home className="h-6 w-6" />
            {!collapsed && (
              <span className="text-xl font-bold">Angaza Real Estate</span>
            )}
          </Link>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className={`px-2 space-y-1 ${collapsed ? 'items-center' : ''}`}>
          {navItems.map(
            (item) =>
              item.roles.includes(user?.role) && (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center ${
                    collapsed ? 'justify-center' : ''
                  } px-4 py-3 text-sm font-medium rounded-md ${
                    isActive(item.path)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                  title={collapsed ? item.title : ''}
                >
                  {item.icon}
                  {!collapsed && <span className="ml-3">{item.title}</span>}
                </Link>
              )
          )}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
