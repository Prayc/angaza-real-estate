// frontend/src/pages/maintenance/MaintenanceDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getMaintenanceRequestById,
  updateMaintenanceRequest,
} from '../../lib/api';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '../../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Label } from '../../components/ui/label';
import {
  ArrowLeft,
  Building,
  Home,
  User,
  CalendarClock,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';

const MaintenanceDetails = () => {
  const [maintenance, setMaintenance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchMaintenanceRequest = async () => {
      try {
        setLoading(true);
        const data = await getMaintenanceRequestById(Number(id));
        setMaintenance(data);
        setNotes(data.notes || '');
        setStatus(data.status);
      } catch (error) {
        console.error('Error fetching maintenance request:', error);
        setError('Failed to load maintenance request details');
      } finally {
        setLoading(false);
      }
    };

    fetchMaintenanceRequest();
  }, [id]);

  const handleUpdateStatus = async () => {
    try {
      setIsUpdating(true);
      setUpdateError(null);

      await updateMaintenanceRequest(id, { status });

      // Refresh data
      const updatedData = await getMaintenanceRequestById(Number(id));
      setMaintenance(updatedData);
    } catch (error) {
      console.error('Error updating status:', error);
      setUpdateError(
        error.response?.data?.message || 'Failed to update status'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddNotes = async () => {
    try {
      setIsUpdating(true);
      setUpdateError(null);

      await updateMaintenanceRequest(id, { notes });

      // Refresh data
      const updatedData = await getMaintenanceRequestById(Number(id));
      setMaintenance(updatedData);
    } catch (error) {
      console.error('Error adding notes:', error);
      setUpdateError(error.response?.data?.message || 'Failed to add notes');
    } finally {
      setIsUpdating(false);
    }
  };

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

  // Check if the user is the landlord of this property or admin
  const canUpdateStatus =
    user.role === 'admin' ||
    user.role === 'property_manager' ||
    (user.role === 'landlord' &&
      maintenance?.unit?.property?.landlordId === user.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Loading maintenance request details...</p>
      </div>
    );
  }

  if (error || !maintenance) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-lg text-destructive">
          {error || 'Maintenance request not found'}
        </p>
        <Button className="mt-4" onClick={() => navigate('/maintenance')}>
          Back to Maintenance
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
          onClick={() => navigate('/maintenance')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Maintenance
        </Button>
        <h1 className="text-2xl font-bold">{maintenance.title}</h1>
        <Badge
          variant={getStatusBadgeVariant(maintenance.status)}
          className="ml-4"
        >
          {maintenance.status.charAt(0).toUpperCase() +
            maintenance.status.slice(1)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {maintenance.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <CalendarClock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h3 className="font-medium">Submitted</h3>
                    <p className="text-muted-foreground">
                      {new Date(maintenance.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h3 className="font-medium">Priority</h3>
                    <div>{getPriorityBadge(maintenance.priority)}</div>
                  </div>
                </div>
              </div>

              {maintenance.notes && (
                <div>
                  <h3 className="font-medium mb-2">Additional Notes</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {maintenance.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes and Status update section */}
          <Card>
            <CardHeader>
              <CardTitle>Updates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {updateError && (
                <div className="bg-destructive/15 text-destructive p-3 rounded-md mb-4">
                  {updateError}
                </div>
              )}

              {/* Notes section - for all users */}
              <div className="space-y-2">
                <Label htmlFor="notes">Add Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional information or updates..."
                  rows={4}
                />
                <Button
                  onClick={handleAddNotes}
                  disabled={isUpdating || notes === maintenance.notes}
                  className="mt-2"
                >
                  {isUpdating ? 'Saving...' : 'Save Notes'}
                </Button>
              </div>

              {/* Status update section - only for landlords and admins */}
              {canUpdateStatus && (
                <div className="space-y-2 pt-4 border-t">
                  <Label htmlFor="status">Update Status</Label>
                  <div className="flex space-x-2">
                    <Select
                      id="status"
                      value={status}
                      onValueChange={setStatus}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleUpdateStatus}
                      disabled={isUpdating || status === maintenance.status}
                    >
                      {isUpdating ? 'Updating...' : 'Update Status'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Property information */}
          <Card>
            <CardHeader>
              <CardTitle>Property Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <h3 className="font-medium">Property</h3>
                  <p className="text-muted-foreground">
                    {maintenance.unit?.property?.name || 'Unknown Property'}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Home className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <h3 className="font-medium">Unit</h3>
                  <p className="text-muted-foreground">
                    Unit {maintenance.unit?.unitNumber || '#'}
                  </p>
                </div>
              </div>

              {user.role !== 'tenant' && (
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() =>
                    navigate(`/properties/${maintenance.unit?.property?.id}`)
                  }
                >
                  View Property
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Contact information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {maintenance.requester && (
                <div>
                  <h3 className="font-medium mb-2">Requester</h3>
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p>{maintenance.requester.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {maintenance.requester.email}
                      </p>
                      {maintenance.requester.phone && (
                        <p className="text-sm text-muted-foreground">
                          {maintenance.requester.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {user.role !== 'landlord' &&
                maintenance.unit?.property?.landlord && (
                  <div className="pt-3 border-t">
                    <h3 className="font-medium mb-2">Property Manager</h3>
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p>{maintenance.unit.property.landlord.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {maintenance.unit.property.landlord.email}
                        </p>
                        {maintenance.unit.property.landlord.phone && (
                          <p className="text-sm text-muted-foreground">
                            {maintenance.unit.property.landlord.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceDetails;
