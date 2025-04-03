// frontend/src/pages/maintenance/AddMaintenanceRequest.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { ArrowLeft } from 'lucide-react';
import {
  getProperties,
  createMaintenanceRequest,
  getLeases,
} from '../../lib/api';
import useAuthStore from '../../store/authStore';

const AddMaintenanceRequest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [units, setUnits] = useState([]);
  const [tenantLeases, setTenantLeases] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  // Get propertyId and unitId from location state if present
  const presetPropertyId = location.state?.propertyId;
  const presetUnitId = location.state?.unitId;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      priority: 'normal',
    },
  });

  const watchPropertyId = watch('propertyId');

  useEffect(() => {
    // Make sure priority is set to 'normal' if not already set
    if (!watch('priority')) {
      setValue('priority', 'normal');
    }
  }, [setValue, watch]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetchLoading(true);
        const propertiesData = await getProperties();

        // For tenants, we'll also get their active leases
        if (user.role === 'tenant') {
          try {
            // Fetch tenant's leases
            const leasesData = await getLeases({ status: 'active' });
            setTenantLeases(leasesData);

            // If tenant has only one active lease, auto-select it
            if (leasesData.length === 1 && !presetUnitId && !presetPropertyId) {
              const lease = leasesData[0];
              const propertyId = lease.unit?.property?.id;
              const unitId = lease.unitId;

              if (propertyId && unitId) {
                setValue('propertyId', propertyId.toString());
                setValue('unitId', unitId.toString());

                // Find the property in properties data
                const selectedProp = propertiesData.find(
                  (p) => p.id === propertyId
                );
                if (selectedProp) {
                  setSelectedProperty(selectedProp);
                  setUnits(
                    selectedProp.units.filter((unit) =>
                      unit.leases?.some(
                        (l) => l.tenantId === user.id && l.status === 'active'
                      )
                    )
                  );
                }
              }
            }
            // If tenant has multiple leases, filter properties to only those they have leases in
            else {
              // Filter properties to only those the tenant has active leases in
              const filteredProperties = propertiesData.filter((property) =>
                property.units.some((unit) =>
                  unit.leases?.some(
                    (lease) =>
                      lease.tenantId === user.id && lease.status === 'active'
                  )
                )
              );
              setProperties(filteredProperties);
            }
          } catch (err) {
            console.error('Error fetching tenant leases:', err);
            // Fall back to property filtering
            const filteredProperties = propertiesData.filter((property) =>
              property.units.some((unit) =>
                unit.leases?.some(
                  (lease) =>
                    lease.tenantId === user.id && lease.status === 'active'
                )
              )
            );
            setProperties(filteredProperties);
          }
        } else {
          // For admins/landlords, show all properties
          setProperties(propertiesData);
        }

        // Set initial property and unit if provided in state
        if (presetPropertyId) {
          setValue('propertyId', presetPropertyId.toString());

          const selectedProp = propertiesData.find(
            (p) => p.id === presetPropertyId
          );
          if (selectedProp) {
            setSelectedProperty(selectedProp);

            let availableUnits = [];
            if (user.role === 'tenant') {
              // For tenants, only show units they're renting
              availableUnits = selectedProp.units.filter((unit) =>
                unit.leases?.some(
                  (lease) =>
                    lease.tenantId === user.id && lease.status === 'active'
                )
              );
            } else {
              // For landlords/admins, show all units
              availableUnits = selectedProp.units;
            }

            setUnits(availableUnits);

            if (presetUnitId) {
              setValue('unitId', presetUnitId.toString());
            }
          }
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
        setError('Failed to load properties. Please try again.');
      } finally {
        setFetchLoading(false);
      }
    };

    fetchData();
  }, [presetPropertyId, presetUnitId, setValue, user.role, user.id]);

  // Update units when property changes
  useEffect(() => {
    if (watchPropertyId) {
      const selectedProp = properties.find(
        (p) => p.id === parseInt(watchPropertyId)
      );
      setSelectedProperty(selectedProp);

      if (selectedProp) {
        let availableUnits = [];
        if (user.role === 'tenant') {
          // For tenants, only show units they're renting
          availableUnits = selectedProp.units.filter((unit) =>
            unit.leases?.some(
              (lease) => lease.tenantId === user.id && lease.status === 'active'
            )
          );

          // If tenant has only one unit in this property, auto-select it
          if (availableUnits.length === 1 && !presetUnitId) {
            setValue('unitId', availableUnits[0].id.toString());
          }
        } else {
          // For landlords/admins, show all units
          availableUnits = selectedProp.units;
        }

        setUnits(availableUnits);

        // Reset unitId when property changes if not preset
        if (!presetUnitId && availableUnits.length !== 1) {
          setValue('unitId', '');
        }
      }
    }
  }, [watchPropertyId, properties, user.role, user.id, setValue, presetUnitId]);

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      setError('');

      const response = await createMaintenanceRequest(data);
      navigate(`/maintenance/${response.maintenanceRequest.id}`);
    } catch (error) {
      console.error('Error creating maintenance request:', error);
      setError(
        error.response?.data?.message ||
          'Failed to create maintenance request. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Loading properties data...</p>
      </div>
    );
  }

  // For tenants with only one property and one unit, simplified view
  const singlePropertySingleUnit =
    user.role === 'tenant' && properties.length === 1 && units.length === 1;

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
        <h1 className="text-3xl font-bold">Submit Maintenance Request</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance Request Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-destructive/15 text-destructive p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* For tenants with one property and one unit, show readonly info instead of dropdowns */}
              {singlePropertySingleUnit ? (
                <div className="space-y-2 md:col-span-2">
                  <Label>Your Unit</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="font-medium">{properties[0]?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Unit {units[0]?.unitNumber} - {units[0]?.type}
                    </p>
                    <input type="hidden" {...register('propertyId')} />
                    <input type="hidden" {...register('unitId')} />
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="propertyId">Property</Label>
                    <Select
                      onValueChange={(value) => setValue('propertyId', value)}
                      defaultValue={watchPropertyId}
                      disabled={!!presetPropertyId}
                    >
                      <SelectTrigger
                        className={
                          errors.propertyId ? 'border-destructive' : ''
                        }
                      >
                        <SelectValue placeholder="Select a property" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map((property) => (
                          <SelectItem
                            key={property.id}
                            value={property.id.toString()}
                          >
                            {property.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.propertyId && (
                      <p className="text-destructive text-sm">
                        {errors.propertyId.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unitId">Unit</Label>
                    <Select
                      onValueChange={(value) => setValue('unitId', value)}
                      defaultValue={watch('unitId')}
                      disabled={
                        !watchPropertyId || !!presetUnitId || units.length === 0
                      }
                    >
                      <SelectTrigger
                        className={errors.unitId ? 'border-destructive' : ''}
                      >
                        <SelectValue
                          placeholder={
                            units.length === 0
                              ? 'Select a property first'
                              : 'Select a unit'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id.toString()}>
                            Unit {unit.unitNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.unitId && (
                      <p className="text-destructive text-sm">
                        {errors.unitId.message}
                      </p>
                    )}
                  </div>
                </>
              )}

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Request Title</Label>
                <Input
                  id="title"
                  placeholder="Enter a brief title for your request"
                  {...register('title', { required: 'Title is required' })}
                  className={errors.title ? 'border-destructive' : ''}
                />
                {errors.title && (
                  <p className="text-destructive text-sm">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the issue in detail"
                  rows={4}
                  {...register('description', {
                    required: 'Description is required',
                  })}
                  className={errors.description ? 'border-destructive' : ''}
                />
                {errors.description && (
                  <p className="text-destructive text-sm">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  onValueChange={(value) => setValue('priority', value)}
                  value={watch('priority')}
                  defaultValue="normal"
                >
                  <SelectTrigger
                    className={errors.priority ? 'border-destructive' : ''}
                  >
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
                {errors.priority && (
                  <p className="text-destructive text-sm">
                    {errors.priority.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/maintenance')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddMaintenanceRequest;
