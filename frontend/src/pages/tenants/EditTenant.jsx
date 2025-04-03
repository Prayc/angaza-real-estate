// frontend/src/pages/tenants/EditTenant.jsx
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
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { getTenantById, updateTenant } from '../../lib/api';
import useAuthStore from '../../store/authStore';

const EditTenant = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();

  // Check if user has permission to edit tenants
  const canEditTenant = ['admin', 'property_manager'].includes(user?.role);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm();

  const watchIsActive = watch('isActive');

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        if (!canEditTenant) {
          navigate('/');
          return;
        }

        setFetchLoading(true);
        const tenant = await getTenantById(Number(id));

        // Set form values from fetched tenant
        reset({
          name: tenant.name,
          email: tenant.email,
          phone: tenant.phone || '',
          isActive: tenant.isActive,
        });
      } catch (error) {
        console.error('Error fetching tenant:', error);
        setError('Failed to load tenant details. Please try again.');
      } finally {
        setFetchLoading(false);
      }
    };

    fetchTenant();
  }, [id, reset, canEditTenant, navigate]);

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      setError('');

      await updateTenant(id, data);
      navigate(`/tenants/${id}`);
    } catch (error) {
      console.error('Error updating tenant:', error);
      setError(
        error.response?.data?.message ||
          'Failed to update tenant. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Loading tenant data...</p>
      </div>
    );
  }

  if (!canEditTenant) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-lg text-destructive">
          You don't have permission to edit tenants
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
          onClick={() => navigate(`/tenants/${id}`)}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tenant
        </Button>
        <h1 className="text-3xl font-bold">Edit Tenant</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tenant Information</CardTitle>
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
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter tenant's full name"
                  {...register('name', { required: 'Name is required' })}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-destructive text-sm">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-destructive text-sm">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="Enter phone number"
                  {...register('phone')}
                  className={errors.phone ? 'border-destructive' : ''}
                />
                {errors.phone && (
                  <p className="text-destructive text-sm">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive">Account Status</Label>
                  <Switch
                    id="isActive"
                    checked={watchIsActive}
                    onCheckedChange={(checked) => setValue('isActive', checked)}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {watchIsActive
                    ? 'Tenant account is active'
                    : 'Tenant account is inactive'}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/tenants/${id}`)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Tenant'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditTenant;
