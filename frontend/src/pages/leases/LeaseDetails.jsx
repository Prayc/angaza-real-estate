// frontend/src/pages/leases/LeaseDetails.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getLeaseById } from '../../lib/api';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  ArrowLeft,
  User,
  Home,
  Calendar,
  FileText,
  DollarSign,
  Edit,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';

const LeaseDetails = () => {
  const [lease, setLease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchLease = async () => {
      try {
        setLoading(true);
        const data = await getLeaseById(Number(id));
        setLease(data);
      } catch (error) {
        console.error('Error fetching lease:', error);
        setError('Failed to load lease details');
      } finally {
        setLoading(false);
      }
    };

    fetchLease();
  }, [id]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'expired':
        return 'secondary';
      case 'terminated':
        return 'destructive';
      default:
        return 'default';
    }
  };

  // Check if user can edit this lease
  const canEditLease =
    ['admin', 'property_manager'].includes(user?.role) ||
    (user?.role === 'landlord' &&
      lease?.unit?.property?.landlordId === user.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Loading lease details...</p>
      </div>
    );
  }

  if (error || !lease) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-lg text-destructive">{error || 'Lease not found'}</p>
        <Button className="mt-4" onClick={() => navigate('/leases')}>
          Back to Leases
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
          onClick={() => navigate('/leases')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Leases
        </Button>
        <h1 className="text-3xl font-bold">Lease Agreement</h1>
        <Badge variant={getStatusBadgeVariant(lease.status)} className="ml-4">
          {lease.status.charAt(0).toUpperCase() + lease.status.slice(1)}
        </Badge>

        {canEditLease && (
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() => navigate(`/leases/edit/${lease.id}`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Lease
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Lease Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Lease Period
                  </h3>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {formatDate(lease.startDate)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        to {formatDate(lease.endDate)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Financial Details
                  </h3>
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        KSh {Number(lease.rentAmount).toLocaleString()} monthly
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Security Deposit: KSh{' '}
                        {Number(lease.securityDeposit).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {lease.notes && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Notes
                  </h3>
                  <p>{lease.notes}</p>
                </div>
              )}

              {lease.leaseDocument && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Lease Document
                  </h3>
                  <Button
                    variant="outline"
                    onClick={() =>
                      window.open(
                        `${import.meta.env.VITE_API_URL || ''}${
                          lease.leaseDocument
                        }`,
                        '_blank'
                      )
                    }
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Document
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tenant Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">
                    {lease.tenant?.name || 'Unknown Tenant'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {lease.tenant?.email || 'No email'}
                  </p>
                </div>
              </div>

              {lease.tenant?.phone && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Phone</span>
                  <span>{lease.tenant.phone}</span>
                </div>
              )}

              {/* <Button
                variant="outline"
                size="sm"
                className="w-full mt-4"
                onClick={() => navigate(`/tenants/${lease.tenant?.id}`)}
              >
                View Tenant Details
              </Button> */}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Property Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Home className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">
                    {lease.unit?.property?.name || 'Unknown Property'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Unit {lease.unit?.unitNumber || '#'}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Address</span>
                <span>{lease.unit?.property?.address || 'Unknown'}</span>
              </div>

              <div className="flex justify-between items-center text-sm mt-2">
                <span className="text-muted-foreground">Unit Type</span>
                <span>{lease.unit?.type || 'Unknown'}</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4"
                onClick={() => navigate(`/units/${lease.unitId}`)}
              >
                View Unit Details
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LeaseDetails;
