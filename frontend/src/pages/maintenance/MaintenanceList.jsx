// frontend/src/pages/maintenance/MaintenanceList.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMaintenanceRequests } from '../../lib/api';
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
import { Label } from '../../components/ui/label';
import { Filter, Plus, Settings } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const MaintenanceList = () => {
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchMaintenanceRequests = async () => {
      try {
        setLoading(true);
        let filters = {};

        if (statusFilter !== 'all') {
          filters.status = statusFilter;
        }

        const data = await getMaintenanceRequests(filters);
        setMaintenanceRequests(data);
      } catch (error) {
        console.error('Error fetching maintenance requests:', error);
        setError('Failed to load maintenance requests');
      } finally {
        setLoading(false);
      }
    };

    fetchMaintenanceRequests();
  }, [statusFilter]);

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'in-progress':
        return 'secondary';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      case 'normal':
        return <Badge variant="secondary">Normal</Badge>;
      case 'high':
        return <Badge variant="warning">High</Badge>;
      case 'emergency':
        return <Badge variant="destructive">Emergency</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Loading maintenance requests...</p>
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
        <h1 className="text-3xl font-bold">Maintenance Requests</h1>
        <Button onClick={() => navigate('/maintenance/add')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Request
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Maintenance Requests</CardTitle>
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {maintenanceRequests.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Property / Unit</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maintenanceRequests.map((request) => (
                  <TableRow
                    key={request.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/maintenance/${request.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Settings className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{request.title}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-xs">
                            {request.description.substring(0, 50)}
                            {request.description.length > 50 ? '...' : ''}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">
                        {request.unit?.property?.name || 'Unknown Property'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Unit {request.unit?.unitNumber || '#'}
                      </p>
                    </TableCell>
                    <TableCell>{getPriorityBadge(request.priority)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(request.status)}>
                        {request.status.charAt(0).toUpperCase() +
                          request.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(request.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <Settings className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                No Maintenance Requests
              </h3>
              <p className="text-muted-foreground mb-6">
                {statusFilter !== 'all'
                  ? `There are no maintenance requests with '${statusFilter}' status.`
                  : user.role === 'tenant' &&
                    'You have not submitted any maintenance requests yet.'}
              </p>
              <Button onClick={() => navigate('/maintenance/add')}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Request
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MaintenanceList;
