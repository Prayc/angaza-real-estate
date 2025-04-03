// frontend/src/pages/units/AssignTenant.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft, Plus } from 'lucide-react';
import { getTenants, getUnitById, createLease } from '../../lib/api';
import useAuthStore from '../../store/authStore';

const AssignTenant = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [tenants, setTenants] = useState([]);
  const [unit, setUnit] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const unitId = location.state?.unitId;
  const tenantId = location.state?.tenantId; // New tenant ID if coming from Add Tenant page

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    // watch,
  } = useForm({
    defaultValues: {
      unitId: unitId,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        .toISOString()
        .split('T')[0],
    },
  });

  // Check if user has permission
  const canAssignTenant = ['admin', 'property_manager', 'landlord'].includes(
    user?.role
  );

  // frontend/src/pages/units/AssignTenant.jsx - Update the fetchTenants function
  // Function to fetch tenants that can be reused
  const fetchTenants = async () => {
    try {
      // If user is a landlord, fetch only tenants they created
      let tenantsData;
      if (user.role === 'landlord') {
        tenantsData = await getTenants({ createdBy: 'own' });
      } else {
        tenantsData = await getTenants();
      }

      setTenants(tenantsData);

      // If a tenantId was passed in the location state, select that tenant
      if (tenantId) {
        setValue('tenantId', tenantId.toString());
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
      setError('Failed to load tenant data. Please try again.');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetchLoading(true);

        // Fetch unit details
        if (unitId) {
          const unitData = await getUnitById(unitId);
          setUnit(unitData);

          // Set rent amount from unit
          setValue('rentAmount', unitData.rent);
          // Set default security deposit to one month's rent
          setValue('securityDeposit', unitData.rent);
        } else {
          throw new Error('Unit ID is required');
        }

        // Fetch available tenants
        await fetchTenants();
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load required data. Please try again.');
      } finally {
        setFetchLoading(false);
      }
    };

    if (unitId) {
      fetchData();
    } else {
      setError('No unit specified');
      setFetchLoading(false);
    }
  }, [unitId, setValue]);

  // Listen for changes to tenantId in location state
  useEffect(() => {
    if (tenantId && !fetchLoading) {
      // If we just received a new tenant ID, refresh the tenant list
      fetchTenants();
    }
  }, [tenantId, fetchLoading]);

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      setError('');

      // Format dates
      data.startDate = new Date(data.startDate).toISOString();
      data.endDate = new Date(data.endDate).toISOString();

      await createLease(data);
      navigate(`/units/${unitId}`);
    } catch (error) {
      console.error('Error assigning tenant:', error);
      setError(
        error.response?.data?.message ||
          'Failed to assign tenant. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Loading data...</p>
      </div>
    );
  }

  if (!canAssignTenant) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-lg text-destructive">
          You don't have permission to assign tenants
        </p>
        <Button className="mt-4" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>
    );
  }

  if (!unitId || !unit) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-lg text-destructive">
          {error || 'Invalid unit selected'}
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
          onClick={() => navigate(`/units/${unitId}`)}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Unit
        </Button>
        <h1 className="text-3xl font-bold">
          Assign Tenant to Unit {unit.unitNumber}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Lease Agreement</CardTitle>
          <CardDescription>
            Assign a tenant to Unit {unit.unitNumber} in{' '}
            {unit.property?.name || 'the property'}
          </CardDescription>
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
                <Label htmlFor="tenantId">Select Tenant</Label>
                <div className="flex space-x-2">
                  <Select
                    onValueChange={(value) => setValue('tenantId', value)}
                    defaultValue={tenantId ? tenantId.toString() : undefined}
                    required
                  >
                    <SelectTrigger
                      className={errors.tenantId ? 'border-destructive' : ''}
                    >
                      <SelectValue placeholder="Select a tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.length > 0 ? (
                        tenants.map((tenant) => (
                          <SelectItem
                            key={tenant.id}
                            value={tenant.id.toString()}
                          >
                            {tenant.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No tenants available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      navigate('/tenants/add', {
                        state: { returnTo: location.pathname, unitId },
                      })
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {errors.tenantId && (
                  <p className="text-destructive text-sm">
                    {errors.tenantId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rentAmount">Monthly Rent (KSh)</Label>
                <Input
                  id="rentAmount"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="Enter monthly rent"
                  {...register('rentAmount', {
                    required: 'Rent amount is required',
                    min: {
                      value: 0,
                      message: 'Rent amount must be positive',
                    },
                    valueAsNumber: true,
                  })}
                  className={errors.rentAmount ? 'border-destructive' : ''}
                />
                {errors.rentAmount && (
                  <p className="text-destructive text-sm">
                    {errors.rentAmount.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="securityDeposit">Security Deposit (KSh)</Label>
                <Input
                  id="securityDeposit"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="Enter security deposit amount"
                  {...register('securityDeposit', {
                    required: 'Security deposit is required',
                    min: {
                      value: 0,
                      message: 'Security deposit must be positive',
                    },
                    valueAsNumber: true,
                  })}
                  className={errors.securityDeposit ? 'border-destructive' : ''}
                />
                {errors.securityDeposit && (
                  <p className="text-destructive text-sm">
                    {errors.securityDeposit.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register('startDate', {
                    required: 'Start date is required',
                  })}
                  className={errors.startDate ? 'border-destructive' : ''}
                />
                {errors.startDate && (
                  <p className="text-destructive text-sm">
                    {errors.startDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  {...register('endDate', {
                    required: 'End date is required',
                  })}
                  className={errors.endDate ? 'border-destructive' : ''}
                />
                {errors.endDate && (
                  <p className="text-destructive text-sm">
                    {errors.endDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  placeholder="Enter any additional notes about the lease"
                  {...register('notes')}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/units/${unitId}`)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating Lease...' : 'Create Lease'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssignTenant;
