// src/pages/payments/AddPayment.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { getLeases, createPayment } from '../../lib/api';
import useAuthStore from '../../store/authStore';

const AddPayment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [leases, setLeases] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      paymentType: 'rent',
      paymentMethod: 'cash',
    },
  });

  useEffect(() => {
    const fetchLeases = async () => {
      try {
        setFetchLoading(true);
        // For tenants, only get their active leases
        const params = user.role === 'tenant' ? { status: 'active' } : {};
        const leasesData = await getLeases(params);

        setLeases(leasesData);

        // If tenant has only one active lease, auto-select it
        if (user.role === 'tenant' && leasesData.length === 1) {
          setValue('leaseId', leasesData[0].id.toString());
        }
      } catch (error) {
        console.error('Error fetching leases:', error);
        setError('Failed to load leases. Please try again.');
      } finally {
        setFetchLoading(false);
      }
    };

    fetchLeases();
  }, [setValue, user.role]);

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      setError('');

      // Convert amount to float
      data.amount = parseFloat(data.amount);

      const response = await createPayment(data);
      navigate(`/payments/${response.payment.id}`);
    } catch (error) {
      console.error('Error creating payment:', error);
      setError(
        error.response?.data?.message ||
          'Failed to record payment. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Loading lease data...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/payments')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Payments
        </Button>
        <h1 className="text-3xl font-bold">Record Payment</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-destructive/15 text-destructive p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {user.role !== 'tenant' && (
                <div className="space-y-2">
                  <Label htmlFor="leaseId">Lease</Label>
                  <Select
                    onValueChange={(value) => setValue('leaseId', value)}
                    defaultValue={watch('leaseId')}
                  >
                    <SelectTrigger
                      className={errors.leaseId ? 'border-destructive' : ''}
                    >
                      <SelectValue placeholder="Select a lease" />
                    </SelectTrigger>
                    <SelectContent>
                      {leases.map((lease) => (
                        <SelectItem key={lease.id} value={lease.id.toString()}>
                          {lease.tenant?.name} - {lease.unit?.unitNumber} (
                          {lease.unit?.property?.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.leaseId && (
                    <p className="text-destructive text-sm">
                      {errors.leaseId.message}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register('amount', {
                    required: 'Amount is required',
                    valueAsNumber: true,
                    min: {
                      value: 0.01,
                      message: 'Amount must be greater than 0',
                    },
                  })}
                  className={errors.amount ? 'border-destructive' : ''}
                />
                {errors.amount && (
                  <p className="text-destructive text-sm">
                    {errors.amount.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentType">Payment Type</Label>
                <Select
                  onValueChange={(value) => setValue('paymentType', value)}
                  defaultValue="rent"
                >
                  <SelectTrigger
                    className={errors.paymentType ? 'border-destructive' : ''}
                  >
                    <SelectValue placeholder="Select payment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rent">Rent</SelectItem>
                    <SelectItem value="deposit">Security Deposit</SelectItem>
                    <SelectItem value="maintenance">Maintenance Fee</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.paymentType && (
                  <p className="text-destructive text-sm">
                    {errors.paymentType.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  onValueChange={(value) => setValue('paymentMethod', value)}
                  defaultValue="cash"
                >
                  <SelectTrigger
                    className={errors.paymentMethod ? 'border-destructive' : ''}
                  >
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="card">Card Payment</SelectItem>
                  </SelectContent>
                </Select>
                {errors.paymentMethod && (
                  <p className="text-destructive text-sm">
                    {errors.paymentMethod.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference">Reference Number (Optional)</Label>
                <Input
                  id="reference"
                  placeholder="Transaction reference"
                  {...register('reference')}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/payments')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Processing...' : 'Record Payment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddPayment;
