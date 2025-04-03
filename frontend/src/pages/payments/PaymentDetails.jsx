// src/pages/payments/PaymentDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { ArrowLeft, Printer } from 'lucide-react';
import { getPaymentById } from '../../lib/api';
// import useAuthStore from '../../store/authStore';
import { formatCurrency, formatDate } from '../../lib/helperFuntions';

const PaymentDetails = () => {
  const [payment, setPayment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();
  // const { user } = useAuthStore();

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        setIsLoading(true);
        const data = await getPaymentById(id);
        setPayment(data);
      } catch (error) {
        console.error('Error fetching payment:', error);
        setError('Failed to load payment details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayment();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status) => {
    const variants = {
      completed: 'success',
      pending: 'warning',
      failed: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPaymentTypeLabel = (type) => {
    const labels = {
      rent: 'Rent Payment',
      deposit: 'Security Deposit',
      maintenance: 'Maintenance Fee',
      other: 'Other Payment',
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Loading payment details...</p>
      </div>
    );
  }

  if (!payment) {
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
          <h1 className="text-3xl font-bold">Payment Not Found</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <p>The requested payment could not be found.</p>
          </CardContent>
        </Card>
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
          className="mr-4 print:hidden"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Payments
        </Button>
        <h1 className="text-3xl font-bold">Payment Receipt</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="ml-auto print:hidden"
        >
          <Printer className="h-4 w-4 mr-2" />
          Print Receipt
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive p-3 rounded-md mb-6 print:hidden">
          {error}
        </div>
      )}

      <Card className="print:shadow-none print:border-none">
        <CardHeader>
          <CardTitle>Receipt #{payment.id}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="font-medium text-muted-foreground">Property</h3>
              <p>{payment.lease?.unit?.property?.name || 'N/A'}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-muted-foreground">Unit</h3>
              <p>Unit {payment.lease?.unit?.unitNumber || 'N/A'}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-muted-foreground">Tenant</h3>
              <p>{payment.tenant?.name || 'N/A'}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-muted-foreground">
                Payment Date
              </h3>
              <p>{formatDate(payment.paymentDate)}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-muted-foreground">
                Payment Type
              </h3>
              <p>{getPaymentTypeLabel(payment.paymentType)}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-muted-foreground">
                Payment Method
              </h3>
              <p>{payment.paymentMethod.replace('_', ' ')}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-muted-foreground">Reference</h3>
              <p>{payment.reference || 'N/A'}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-muted-foreground">Status</h3>
              <div>{getStatusBadge(payment.status)}</div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <h3 className="font-medium text-muted-foreground">Amount</h3>
              <p className="text-2xl font-bold">
                {formatCurrency(payment.amount)}
              </p>
            </div>
          </div>

          <div className="mt-8 border-t pt-6 print:mt-16">
            <p className="text-sm text-muted-foreground">
              This is an electronically generated receipt and does not require a
              signature.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentDetails;
