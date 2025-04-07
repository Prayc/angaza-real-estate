// frontend/src/pages/properties/PropertyDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPropertyById } from '../../lib/api';
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
  Building,
  Edit,
  Home,
  MapPin,
  Users,
  Plus,
  Settings,
  User,
  Mail,
  Phone,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';

const PropertyDetails = () => {
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const canEditProperty =
    ['admin', 'landlord'].includes(user?.role) &&
    (user.role === 'admin' || (property && property.landlordId === user.id));

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const data = await getPropertyById(Number(id));
        setProperty(data);
      } catch (error) {
        console.error('Error fetching property:', error);
        setError('Failed to load property details');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Loading property details...</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-lg text-destructive">
          {error || 'Property not found'}
        </p>
        <Button className="mt-4" onClick={() => navigate('/properties')}>
          Back to Properties
        </Button>
      </div>
    );
  }

  console.log('PROPERTY', property);
  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/properties')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">{property.name}</h1>
        {canEditProperty && (
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={() => navigate(`/properties/edit/${property.id}`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Property
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <div className="rounded-lg overflow-hidden h-64 mb-6">
            {property.image ? (
              <img
                src={`${property.image}`}
                alt={property.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Building className="h-16 w-16 text-muted-foreground/50" />
              </div>
            )}
          </div>

          <Card className="gap-4">
            <div className="px-6 pb-4 border-b">
              <CardTitle>Property Details</CardTitle>
            </div>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h3 className="font-medium">Address</h3>
                    <p className="text-muted-foreground">{property.address}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h3 className="font-medium">Property Type</h3>
                    <p className="text-muted-foreground">
                      {property.type.charAt(0).toUpperCase() +
                        property.type.slice(1)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Home className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h3 className="font-medium">Units</h3>
                    <p className="text-muted-foreground">
                      {property.availableUnits} available out of{' '}
                      {property.totalUnits} total units
                    </p>
                  </div>
                </div>
                {user.role !== 'tenant' && (
                  <div className="flex items-start space-x-3">
                    <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h3 className="font-medium">Occupancy Rate</h3>
                      <p className="text-muted-foreground">
                        {(
                          ((property.totalUnits - property.availableUnits) /
                            property.totalUnits) *
                          100
                        ).toFixed(0)}
                        % ({property.totalUnits - property.availableUnits}{' '}
                        occupied)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {property.description && (
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Description</h3>
                  <p className="text-muted-foreground">
                    {property.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          {/* Landlord Card - Only visible to admin */}
          {isAdmin && property.landlord && (
            <Card className="mb-3 gap-4">
              <div className="px-6 pb-4 border-b">
                <CardTitle>Landlord Information</CardTitle>
              </div>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h3 className="font-medium">Name</h3>
                      <p className="text-muted-foreground">
                        {property.landlord.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h3 className="font-medium">Email</h3>
                      <p className="text-muted-foreground">
                        {property.landlord.email}
                      </p>
                    </div>
                  </div>

                  {property.landlord.phone && (
                    <div className="flex items-start space-x-3">
                      <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <h3 className="font-medium">Phone</h3>
                        <p className="text-muted-foreground">
                          {property.landlord.phone}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="mb-3 gap-4">
            <div className="px-6 pb-4 border-b">
              <CardTitle>Units Overview</CardTitle>
            </div>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total Units</span>
                  <span className="font-medium">{property.totalUnits}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Available Units</span>
                  <span className="font-medium">{property.availableUnits}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Occupied Units</span>
                  <span className="font-medium">
                    {property.totalUnits - property.availableUnits}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {canEditProperty && (
            <Card className="gap-4">
              <div className="px-6 pb-4 border-b">
                <CardTitle>Property Management</CardTitle>
              </div>
              <CardContent className="w-full flex flex-col lg:flex-row items-center justify-between gap-2">
                <Button
                  variant="outline"
                  className="w-full lg:flex-1"
                  onClick={() =>
                    navigate(`/properties/${property.id}/units/add`)
                  }
                >
                  <Plus className="h-4 w-4" />
                  Add New Unit
                </Button>
                <Button
                  variant="outline"
                  className="w-full lg:flex-1"
                  onClick={() =>
                    navigate(`/maintenance/property/${property.id}`)
                  }
                >
                  <Settings className="h-4 w-4" />
                  View Maintenance
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Tabs defaultValue="units" className="mt-4">
        <TabsList className="mb-2 w-[350px] grid grid-cols-3 gap-2 p-1">
          <TabsTrigger value="units">Units</TabsTrigger>
          {user.role !== 'tenant' && (
            <TabsTrigger value="tenants">Tenants</TabsTrigger>
          )}
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="units">
          <Card>
            <CardHeader>
              <CardTitle>Property Units</CardTitle>
            </CardHeader>
            <CardContent>
              {property.units && property.units.length > 0 ? (
                <div className="divide-y">
                  {property.units.map((unit) => (
                    <div
                      key={unit.id}
                      className="py-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 px-2 rounded"
                      onClick={() => navigate(`/units/${unit.id}`)}
                    >
                      <div>
                        <h3 className="font-medium">Unit {unit.unitNumber}</h3>
                        <p className="text-sm text-muted-foreground">
                          {unit.type} • KSh {unit.rent.toLocaleString()} per
                          month
                        </p>
                      </div>
                      <div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            unit.status === 'vacant'
                              ? 'bg-green-100 text-green-800'
                              : unit.status === 'occupied'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {unit.status.charAt(0).toUpperCase() +
                            unit.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 text-muted-foreground">
                  No units available for this property
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {user.role !== 'tenant' && (
          <TabsContent value="tenants">
            <Card>
              <CardHeader>
                <CardTitle>Property Tenants</CardTitle>
              </CardHeader>
              <CardContent>
                {property.units &&
                property.units.some(
                  (unit) =>
                    unit.leases &&
                    unit.leases.some((lease) => lease.status === 'active')
                ) ? (
                  <div className="divide-y">
                    {property.units
                      .filter(
                        (unit) =>
                          unit.leases &&
                          unit.leases.some((lease) => lease.status === 'active')
                      )
                      .map((unit) =>
                        unit.leases
                          .filter((lease) => lease.status === 'active')
                          .map((lease) => (
                            <div
                              key={lease.id}
                              className="py-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 px-2 rounded"
                              onClick={() =>
                                navigate(`/tenants/${lease.tenant.id}`)
                              }
                            >
                              <div className="flex items-center space-x-4">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <h3 className="font-medium">
                                    {lease.tenant.name}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    Unit {unit.unitNumber}
                                  </p>
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Lease ends:{' '}
                                {new Date(lease.endDate).toLocaleDateString()}
                              </div>
                            </div>
                          ))
                      )}
                  </div>
                ) : (
                  <p className="text-center py-4 text-muted-foreground">
                    No active tenants for this property
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="maintenance">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Maintenance Requests</CardTitle>
              <Button
                size="sm"
                onClick={() =>
                  navigate('/maintenance/add', {
                    state: { propertyId: property.id },
                  })
                }
              >
                New Request
              </Button>
            </CardHeader>
            <CardContent>
              {/* Maintenance requests would be displayed here */}
              <p className="text-center py-4 text-muted-foreground">
                No maintenance requests for this property
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PropertyDetails;
