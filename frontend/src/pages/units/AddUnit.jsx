// frontend/src/pages/units/AddUnit.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
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
import { createUnit, getProperties } from '../../lib/api';
import useAuthStore from '../../store/authStore';

const AddUnit = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [properties, setProperties] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const [propertyLocked, setPropertyLocked] = useState(false);

  // Check if user has permission to add units
  const canAddUnit = ['admin', 'property_manager', 'landlord'].includes(
    user?.role
  );

  // Get query params
  const queryParams = new URLSearchParams(location.search);
  const preSelectedPropertyId = queryParams.get('propertyId');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      propertyId: preSelectedPropertyId || '',
      status: 'vacant',
    },
  });

  const watchPropertyId = watch('propertyId');
  const watchStatus = watch('status');

  // Update in AddUnit.jsx
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        // Extract propertyId from URL if present
        const params = new URLSearchParams(location.search);
        const propertyIdParam = params.get('propertyId');

        let propertiesData = await getProperties();

        // If user is a landlord, filter properties they own
        if (user.role === 'landlord') {
          propertiesData = propertiesData.filter(
            (property) => property.landlordId === user.id
          );
        }

        setProperties(propertiesData);

        // If propertyId is provided in URL, pre-select it
        if (propertyIdParam) {
          // Verify that this property exists and user has access to it
          const validProperty = propertiesData.find(
            (p) => p.id.toString() === propertyIdParam
          );
          if (validProperty) {
            setValue('propertyId', propertyIdParam);
            // Optionally disable changing the property
            setPropertyLocked(true);
          }
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
        setError('Failed to load properties. Please try again.');
      }
    };

    fetchProperties();
  }, [location.search, user.role, user.id, setValue]);

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      setError('');

      // Convert string values to appropriate types
      const unitData = {
        ...data,
        propertyId: Number(data.propertyId),
        rent: Number(data.rent),
        size: data.size ? Number(data.size) : undefined,
      };

      const response = await createUnit(unitData);
      navigate(`/units/${response.unit.id}`);
    } catch (error) {
      console.error('Error creating unit:', error);
      setError(
        error.response?.data?.message ||
          'Failed to create unit. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!canAddUnit) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-lg text-destructive">
          You don't have permission to add units
        </p>
        <Button className="mt-4" onClick={() => navigate(-1)}>
          Back
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
          onClick={() => navigate('/properties/all/units')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Units
        </Button>
        <h1 className="text-3xl font-bold">Add New Unit</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Unit Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-destructive/15 text-destructive p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="propertyId">Property *</Label>
                <Select
                  onValueChange={(value) => setValue('propertyId', value)}
                  defaultValue={watchPropertyId}
                  disabled={propertyLocked}
                >
                  <SelectTrigger
                    className={errors.propertyId ? 'border-destructive' : ''}
                  >
                    <SelectValue placeholder="Select property" />
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
                <Label htmlFor="unitNumber">Unit Number *</Label>
                <Input
                  id="unitNumber"
                  placeholder="e.g., A1, 101, etc."
                  {...register('unitNumber', {
                    required: 'Unit number is required',
                  })}
                  className={errors.unitNumber ? 'border-destructive' : ''}
                />
                {errors.unitNumber && (
                  <p className="text-destructive text-sm">
                    {errors.unitNumber.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Unit Type *</Label>
                <Input
                  id="type"
                  placeholder="e.g., Studio, 1 bedroom, 2 bedroom, shop etc."
                  {...register('type', { required: 'Unit type is required' })}
                  className={errors.type ? 'border-destructive' : ''}
                />
                {errors.type && (
                  <p className="text-destructive text-sm">
                    {errors.type.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rent">Monthly Rent (KSh) *</Label>
                <Input
                  id="rent"
                  type="number"
                  min="0"
                  placeholder="e.g., 15000"
                  {...register('rent', {
                    required: 'Rent amount is required',
                    min: {
                      value: 0,
                      message: 'Rent cannot be negative',
                    },
                    valueAsNumber: true,
                  })}
                  className={errors.rent ? 'border-destructive' : ''}
                />
                {errors.rent && (
                  <p className="text-destructive text-sm">
                    {errors.rent.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">Size (sq. meters)</Label>
                <Input
                  id="size"
                  type="number"
                  min="0"
                  placeholder="e.g., 50"
                  {...register('size', {
                    min: {
                      value: 0,
                      message: 'Size cannot be negative',
                    },
                    valueAsNumber: true,
                  })}
                  className={errors.size ? 'border-destructive' : ''}
                />
                {errors.size && (
                  <p className="text-destructive text-sm">
                    {errors.size.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  onValueChange={(value) => setValue('status', value)}
                  defaultValue={watchStatus}
                >
                  <SelectTrigger
                    className={errors.status ? 'border-destructive' : ''}
                  >
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vacant">Vacant</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-destructive text-sm">
                    {errors.status.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/units')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Unit'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddUnit;
