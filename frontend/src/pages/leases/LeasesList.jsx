// frontend/src/pages/leases/LeasesList.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLeases } from '../../lib/api';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { FileText, Plus, User, Home, Calendar, Filter } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const LeasesList = () => {
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Determine if filters should be shown based on user role
  const showFilters =
    user?.role === 'admin' ||
    user?.role === 'landlord' ||
    user?.role === 'property_manager';

  useEffect(() => {
    const fetchLeases = async () => {
      try {
        setLoading(true);
        let filters = {};

        if (statusFilter !== 'all') {
          filters.status = statusFilter;
        }

        const data = await getLeases(filters);
        setLeases(data);
      } catch (error) {
        console.error('Error fetching leases:', error);
        setError('Failed to load leases');
      } finally {
        setLoading(false);
      }
    };

    fetchLeases();
  }, [statusFilter]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Loading leases...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-lg text-destructive">{error}</p>
        <Button className="mt-4" onClick={() => navigate('/')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Lease Agreements</h1>
        {['admin', 'property_manager', 'landlord'].includes(user?.role) && (
          <Button onClick={() => navigate('/units')}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Lease
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {user?.role === 'tenant' ? 'My Leases' : 'All Leases'}
          </CardTitle>

          {/* Status filter in card header instead of separate card */}
          {showFilters && (
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                onValueChange={(value) => setStatusFilter(value)}
                defaultValue={statusFilter}
              >
                <SelectTrigger className="w-[180px] h-8">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {leases.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Property / Unit</TableHead>
                  <TableHead>Rent (KSh)</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leases.map((lease) => (
                  <TableRow
                    key={lease.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/leases/${lease.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {lease.tenant?.name || 'Unknown Tenant'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {lease.tenant?.phone || 'No phone'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Home className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {lease.unit?.property?.name || 'Unknown Property'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Unit {lease.unit?.unitNumber || '#'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">
                        {Number(lease.rentAmount).toLocaleString()} / month
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Deposit:{' '}
                        {Number(lease.securityDeposit).toLocaleString()}
                      </p>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(lease.status)}>
                        {lease.status.charAt(0).toUpperCase() +
                          lease.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/leases/${lease.id}`);
                        }}
                      >
                        <FileText className="h-5 w-5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Leases Found</h3>
              <p className="text-muted-foreground mb-6">
                {statusFilter !== 'all' && showFilters
                  ? `There are no leases with '${statusFilter}' status.`
                  : user?.role === 'tenant'
                  ? "You don't have any active lease agreements."
                  : 'There are no lease agreements in the system yet.'}
              </p>
              {['admin', 'property_manager', 'landlord'].includes(
                user?.role
              ) && (
                <Button onClick={() => navigate('/units')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Lease
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeasesList;
