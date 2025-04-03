// frontend/src/pages/tenants/TenantDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTenantById } from '../../lib/api';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Edit,
  Home,
  FileText,
  DollarSign,
} from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import useAuthStore from '../../store/authStore';

const TenantDetails = () => {
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Check if user has permission to edit tenant
  const canEditTenant = ['admin', 'property_manager'].includes(user?.role);

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const data = await getTenantById(Number(id));
        setTenant(data);
      } catch (error) {
        console.error('Error fetching tenant:', error);
        setError('Failed to load tenant details');
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Loading tenant details...</p>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-lg text-destructive">
          {error || 'Tenant not found'}
        </p>
        <Button className="mt-4" onClick={() => navigate('/tenants')}>
          Back to Tenants
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/tenants')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">{tenant.name}</h1>
        {canEditTenant && (
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() => navigate(`/tenants/edit/${tenant.id}`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Tenant
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Tenant Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6 mb-6">
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-12 w-12 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-1">{tenant.name}</h2>
                  <Badge
                    variant={tenant.isActive ? 'success' : 'secondary'}
                    className="mb-4"
                  >
                    {tenant.isActive ? 'Active' : 'Inactive'}
                  </Badge>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <span>{tenant.email}</span>
                    </div>
                    {tenant.phone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <span>{tenant.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Tenant Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={tenant.isActive ? 'success' : 'secondary'}>
                  {tenant.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Active Leases</span>
                <span className="font-medium">
                  {tenant.leases
                    ? tenant.leases.filter((lease) => lease.status === 'active')
                        .length
                    : 0}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Payments</span>
                <span className="font-medium">
                  KSh{' '}
                  {tenant.payments
                    ? tenant.payments
                        .reduce(
                          (sum, payment) =>
                            payment.status === 'completed'
                              ? sum + payment.amount
                              : sum,
                          0
                        )
                        .toLocaleString()
                    : 0}
                </span>
              </div>

              {canEditTenant && (
                <div className="pt-4 mt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      navigate(`/leases/add`, {
                        state: { tenantId: tenant.id },
                      })
                    }
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Create New Lease
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="leases" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="leases">Leases</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="leases">
          <Card>
            <CardHeader>
              <CardTitle>Tenant Leases</CardTitle>
            </CardHeader>
            <CardContent>
              {tenant.leases && tenant.leases.length > 0 ? (
                <div className="divide-y">
                  {tenant.leases.map((lease) => (
                    <div
                      key={lease.id}
                      className="py-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 px-2 rounded"
                      onClick={() => navigate(`/leases/${lease.id}`)}
                    >
                      <div className="flex items-center space-x-4">
                        <Home className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <h3 className="font-medium">
                            {lease.unit && lease.unit.property
                              ? `${lease.unit.property.name} - Unit ${lease.unit.unitNumber}`
                              : `Unit ID: ${lease.unitId}`}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(lease.startDate).toLocaleDateString()} to{' '}
                            {new Date(lease.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Badge
                          variant={
                            lease.status === 'active'
                              ? 'success'
                              : lease.status === 'expired'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {lease.status.charAt(0).toUpperCase() +
                            lease.status.slice(1)}
                        </Badge>
                        <span className="ml-4 font-medium">
                          KSh {lease.rentAmount.toLocaleString()}/month
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 text-muted-foreground">
                  No leases found for this tenant
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {tenant.payments && tenant.payments.length > 0 ? (
                <div className="divide-y">
                  {tenant.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="py-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 px-2 rounded"
                      onClick={() => navigate(`/payments/${payment.id}`)}
                    >
                      <div>
                        <h3 className="font-medium">
                          {payment.paymentType.charAt(0).toUpperCase() +
                            payment.paymentType.slice(1)}{' '}
                          Payment
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(payment.paymentDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <Badge
                          variant={
                            payment.status === 'completed'
                              ? 'success'
                              : payment.status === 'pending'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {payment.status.charAt(0).toUpperCase() +
                            payment.status.slice(1)}
                        </Badge>
                        <span className="ml-4 font-medium">
                          KSh {payment.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 text-muted-foreground">
                  No payment history found
                </p>
              )}

              {canEditTenant && (
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={() =>
                      navigate('/payments/add', {
                        state: { tenantId: tenant.id },
                      })
                    }
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Record Payment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center py-4 text-muted-foreground">
                No maintenance requests found
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TenantDetails;
