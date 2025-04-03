// frontend/src/pages/units/UnitDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUnitById } from '../../lib/api';
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
  Home,
  Building,
  Edit,
  MapPin,
  User,
  DollarSign,
  Settings,
} from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import useAuthStore from '../../store/authStore';

const UnitDetails = () => {
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Check if user has permission to edit unit
  // const canEditUnit = ['admin', 'property_manager', 'landlord'].includes(
  //   user?.role
  // );

  useEffect(() => {
    const fetchUnit = async () => {
      try {
        const data = await getUnitById(Number(id));
        setUnit(data);
      } catch (error) {
        console.error('Error fetching unit:', error);
        setError('Failed to load unit details');
      } finally {
        setLoading(false);
      }
    };

    fetchUnit();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Loading unit details...</p>
      </div>
    );
  }

  if (error || !unit) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-lg text-destructive">{error || 'Unit not found'}</p>
        <Button className="mt-4" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>
    );
  }

  // Check if the logged-in landlord owns this unit's property
  const isOwner =
    user.role === 'landlord' &&
    unit.property &&
    unit.property.landlordId === user.id;
  const canManageThisUnit =
    user.role === 'admin' || user.role === 'property_manager' || isOwner;

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Unit {unit.unitNumber}</h1>
        {canManageThisUnit && (
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() => navigate(`/units/edit/${unit.id}`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Unit
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Unit Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6 mb-6">
                <div className="h-24 w-24 rounded-md bg-primary/10 flex items-center justify-center">
                  <Home className="h-12 w-12 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-1">
                    Unit {unit.unitNumber}
                  </h2>
                  <Badge
                    variant={
                      unit.status === 'vacant'
                        ? 'success'
                        : unit.status === 'occupied'
                        ? 'secondary'
                        : 'warning'
                    }
                    className="mb-4"
                  >
                    {unit.status.charAt(0).toUpperCase() + unit.status.slice(1)}
                  </Badge>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center space-x-3">
                      <Building className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h3 className="font-medium">Property</h3>
                        <p className="text-muted-foreground">
                          {unit.property
                            ? unit.property.name
                            : 'Unknown Property'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h3 className="font-medium">Address</h3>
                        <p className="text-muted-foreground">
                          {unit.property
                            ? unit.property.address
                            : 'Unknown Address'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Home className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h3 className="font-medium">Type</h3>
                        <p className="text-muted-foreground">{unit.type}</p>
                      </div>
                    </div>
                    {unit.size && (
                      <div className="flex items-center space-x-3">
                        <div className="h-5 w-5 text-muted-foreground flex items-center justify-center">
                          <span className="text-xs">m²</span>
                        </div>
                        <div>
                          <h3 className="font-medium">Size</h3>
                          <p className="text-muted-foreground">
                            {unit.size} square meters
                          </p>
                        </div>
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
              <CardTitle>Unit Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  variant={
                    unit.status === 'vacant'
                      ? 'success'
                      : unit.status === 'occupied'
                      ? 'secondary'
                      : 'warning'
                  }
                >
                  {unit.status.charAt(0).toUpperCase() + unit.status.slice(1)}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Monthly Rent</span>
                <span className="font-medium">
                  KSh {unit.rent.toLocaleString()}
                </span>
              </div>

              {unit.leases &&
              unit.leases.some((lease) => lease.status === 'active') ? (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Current Tenant</span>
                  <span className="font-medium">
                    {unit.leases.find((lease) => lease.status === 'active')
                      ?.tenant?.name || 'Unknown'}
                  </span>
                </div>
              ) : null}

              {canManageThisUnit && unit.status === 'vacant' && (
                <div className="pt-4 mt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      navigate(`/units/${unit.id}/assign-tenant`, {
                        state: { unitId: unit.id },
                      })
                    }
                  >
                    <User className="h-4 w-4 mr-2" />
                    Assign Tenant
                  </Button>
                </div>
              )}

              {canManageThisUnit && (
                <div className="pt-4 mt-4 border-t">
                  <Button
                    variant={unit.status === 'vacant' ? 'outline' : 'default'}
                    className="w-full"
                    onClick={() =>
                      navigate(`/maintenance/add`, {
                        state: { unitId: unit.id },
                      })
                    }
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Add Maintenance
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="leases" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="leases">Lease History</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance History</TabsTrigger>
        </TabsList>

        <TabsContent value="leases">
          <Card>
            <CardHeader>
              <CardTitle>Lease History</CardTitle>
            </CardHeader>
            <CardContent>
              {unit.leases && unit.leases.length > 0 ? (
                <div className="divide-y">
                  {unit.leases.map((lease) => (
                    <div
                      key={lease.id}
                      className="py-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 px-2 rounded"
                      onClick={() => navigate(`/leases/${lease.id}`)}
                    >
                      <div className="flex items-center space-x-4">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <h3 className="font-medium">
                            {lease.tenant
                              ? lease.tenant.name
                              : `Tenant ID: ${lease.tenantId}`}
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
                  No lease history found for this unit
                </p>
              )}

              {/* {canManageThisUnit && unit.status === 'vacant' && (
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={() =>
                      navigate(`/leases/assign-tenant`, {
                        state: { unitId: unit.id },
                      })
                    }
                  >
                    <User className="h-4 w-4 mr-2" />
                    Create New Lease
                  </Button>
                </div>
              )} */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center py-4 text-muted-foreground">
                No maintenance history found for this unit
              </p>

              {canManageThisUnit && (
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={() =>
                      navigate(`/maintenance/add`, {
                        state: { unitId: unit.id },
                      })
                    }
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Create Maintenance Request
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UnitDetails;
