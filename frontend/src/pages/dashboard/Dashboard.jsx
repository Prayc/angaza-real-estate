// frontend/src/pages/dashboard/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, Users, Settings, HandCoins } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import {
  getProperties,
  getTenants,
  getMaintenanceRequests,
  getPayments,
} from '../../lib/api';
import useAuthStore from '../../store/authStore';

const Dashboard = () => {
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [propertiesData, maintenanceData, paymentsData] =
          await Promise.all([
            getProperties(),
            getMaintenanceRequests(),
            getPayments(),
          ]);

        setProperties(propertiesData);
        setMaintenanceRequests(maintenanceData);
        setPayments(paymentsData);

        // Only fetch tenants if user is an admin, property manager, or landlord
        if (user.role !== 'tenant') {
          const tenantsData = await getTenants();
          setTenants(tenantsData);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user.role]);

  // Filter data for tenant users
  const filteredProperties =
    user.role === 'tenant'
      ? properties.filter((property) => {
          return property.units.some((unit) => {
            return (
              unit.leases &&
              unit.leases.some((lease) => lease.tenantId === user.id)
            );
          });
        })
      : properties;

  const filteredMaintenanceRequests =
    user.role === 'tenant'
      ? maintenanceRequests.filter((request) => request.createdBy === user.id)
      : maintenanceRequests;

  const filteredPayments =
    user.role === 'tenant'
      ? payments.filter((payment) => payment.tenantId === user.id)
      : payments;

  const pendingMaintenanceCount = filteredMaintenanceRequests.filter(
    (request) =>
      request.status === 'pending' || request.status === 'in-progress'
  ).length;

  const totalPaymentAmount = filteredPayments
    .reduce(
      (total, payment) =>
        total + (payment.status === 'completed' ? payment.amount : 0),
      0
    )
    .toFixed(2);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 capitalize">Dashboard</h1>

      {/* Dashboard Cards Section */}
      <div
        className={`grid grid-cols-1 ${
          user.role === 'tenant' ? 'md:grid-cols-2' : 'md:grid-cols-4'
        } gap-6 mb-8`}
      >
        {/* Show Properties and Tenants cards only for non-tenant users */}
        {user.role !== 'tenant' && (
          <>
            <Card className="hover:shadow-md transition-shadow px-6 py-4 gap-4">
              <h4 className="text-sm font-medium text-muted-foreground">
                Properties
              </h4>
              <div className="flex items-center space-x-4">
                <Building className="h-10 w-10 text-primary" />
                <div>
                  <div className="text-2xl font-bold">
                    {filteredProperties.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total Properties
                  </p>
                </div>
              </div>
            </Card>

            <Card className="hover:shadow-md transition-shadow px-6 py-4 gap-4">
              <h4 className="text-sm font-medium text-muted-foreground">
                Tenants
              </h4>
              <div className="flex items-center space-x-4">
                <Users className="h-10 w-10 text-primary" />
                <div>
                  <div className="text-2xl font-bold">{tenants.length}</div>
                  <p className="text-xs text-muted-foreground">Total Tenants</p>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Cards shown for all users */}
        <Card className="hover:shadow-md transition-shadow px-6 py-4 gap-4">
          <h4 className="text-sm font-medium text-muted-foreground">
            Maintenance
          </h4>
          <div className="flex items-center space-x-4">
            <Settings className="h-10 w-10 text-primary" />
            <div>
              <div className="text-2xl font-bold">
                {pendingMaintenanceCount}
              </div>
              <p className="text-xs text-muted-foreground">Requests</p>
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow px-6 py-4 gap-4">
          <h4 className="text-sm font-medium text-muted-foreground">
            Payments
          </h4>
          <div className="flex items-center space-x-4">
            <HandCoins className="h-10 w-10 text-primary" />
            <div>
              <div className="text-2xl font-bold">KSh {totalPaymentAmount}</div>
              <p className="text-xs text-muted-foreground">Total Payments</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Cards Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Only show Properties card for non-tenant users */}
        {user.role !== 'tenant' && (
          <Card className="gap-4">
            <CardHeader className="border-b">
              <CardTitle>Recent Properties</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredProperties.length > 0 ? (
                <div className="space-y-4">
                  {filteredProperties.slice(0, 5).map((property) => (
                    <div
                      key={property.id}
                      className="flex items-center justify-between p-3 bg-muted/40 rounded-md cursor-pointer hover:bg-muted"
                      onClick={() => navigate(`/properties/${property.id}`)}
                    >
                      <div className="flex items-center space-x-3">
                        {property.image ? (
                          <img
                            src={property.image}
                            alt={property.name}
                            className="w-12 h-12 rounded-md object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                            <Building className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-medium">{property.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {property.address}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm">
                        {`${property.availableUnits} / ${property.totalUnits} units available`}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No properties found
                </p>
              )}
              {filteredProperties.length > 5 && (
                <div className="mt-4 text-center">
                  <button
                    className="text-primary text-sm hover:underline"
                    onClick={() => navigate('/properties')}
                  >
                    View all properties
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Maintenance card - shown to all users */}
        <Card
          className={`gap-4 ${user.role === 'tenant' ? 'lg:col-span-2' : ''}`}
        >
          <CardHeader className="border-b">
            <CardTitle>Recent Maintenance Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredMaintenanceRequests.length > 0 ? (
              <div className="space-y-4">
                {filteredMaintenanceRequests.slice(0, 5).map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 bg-muted/40 rounded-md cursor-pointer hover:bg-muted"
                    onClick={() => navigate(`/maintenance/${request.id}`)}
                  >
                    <div>
                      <h3 className="font-medium">{request.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Unit: {request.unit?.unitNumber}, Property:{' '}
                        {request.unit?.property?.name}
                      </p>
                    </div>
                    <div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          request.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : request.status === 'in-progress'
                            ? 'bg-blue-100 text-blue-800'
                            : request.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {request.status.charAt(0).toUpperCase() +
                          request.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No maintenance requests found
              </p>
            )}
            {filteredMaintenanceRequests.length > 5 && (
              <div className="mt-4 text-center">
                <button
                  className="text-primary text-sm hover:underline"
                  onClick={() => navigate('/maintenance')}
                >
                  View all maintenance requests
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
