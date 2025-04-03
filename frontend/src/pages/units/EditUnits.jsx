// frontend/src/pages/units/EditUnit.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { getUnitById, updateUnit, getProperties } from '../../lib/api';
import useAuthStore from '../../store/authStore';

const EditUnit = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm();

  const watchPropertyId = watch('propertyId');
  const watchStatus = watch('status');

  // Check if user has permission to edit units
  const canEditUnit = ['admin', 'property_manager', 'landlord'].includes(
    user?.role
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!canEditUnit) {
          navigate('/units');
          return;
        }

        setFetchLoading(true);

        // Fetch properties
        let propertiesData = await getProperties();

        // If user is a landlord, filter properties they own
        if (user.role === 'landlord') {
          propertiesData = propertiesData.filter(
            (property) => property.landlordId === user.id
          );
        }

        setProperties(propertiesData);

        // Fetch unit
        const unit = await getUnitById(Number(id));

        // Check if landlord owns this unit's property
        if (
          user.role === 'landlord' &&
          (!unit.property || unit.property.landlordId !== user.id)
        ) {
          navigate('/units');
          return;
        }

        // Set form values from fetched unit
        reset({
          propertyId: unit.propertyId.toString(),
          unitNumber: unit.unitNumber,
          type: unit.type,
          rent: unit.rent,
          size: unit.size || '',
          status: unit.status,
        });
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load unit details. Please try again.');
      } finally {
        setFetchLoading(false);
      }
    };

    fetchData();
  }, [id, reset, canEditUnit, navigate, user.role, user.id]);

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      setError('');

      // Convert string values to appropriate types
      const unitData = {
        ...data,
        rent: Number(data.rent),
        size: data.size ? Number(data.size) : undefined,
      };

      await updateUnit(id, unitData);
      navigate(`/units/${id}`);
    } catch (error) {
      console.error('Error updating unit:', error);
      setError(
        error.response?.data?.message ||
          'Failed to update unit. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Loading unit data...</p>
      </div>
    );
  }

  if (!canEditUnit) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-lg text-destructive">
          You don't have permission to edit units
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
          onClick={() => navigate(`/units/${id}`)}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Unit
        </Button>
        <h1 className="text-3xl font-bold">Edit Unit</h1>
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
                  placeholder="e.g., Studio, 1BHK, 2BHK, etc."
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
                onClick={() => navigate(`/units/${id}`)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Unit'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditUnit;
