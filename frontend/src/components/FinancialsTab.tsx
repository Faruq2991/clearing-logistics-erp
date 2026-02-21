import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Typography,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Edit as EditIcon, Save as SaveIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFinancials, usePayments, useRecordPayment, useCreateFinancials, useUpdateFinancials } from '../hooks/useFinancials';
import ErrorAlert from './ErrorAlert';
import { DatePicker } from '@mui/x-date-pickers';
import type { PaymentCreate, FinancialsCreate } from '../types';

const paymentSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  payment_date: z.date(),
  reference: z.string().optional(),
});

type PaymentFormInputs = z.infer<typeof paymentSchema>;

interface FinancialsTabProps {
  vehicleId: number;
}

export default function FinancialsTab({ vehicleId }: FinancialsTabProps) {
  const { data: financials, isLoading: isLoadingFinancials, error: financialsError, isSuccess } = useFinancials(vehicleId);
  const { data: payments, isLoading: isLoadingPayments, error: paymentsError } = usePayments(vehicleId, isSuccess && !!financials);

  const createFinancials = useCreateFinancials(vehicleId);
  const updateFinancials = useUpdateFinancials(vehicleId);
  const recordPayment = useRecordPayment(vehicleId);

  const [totalCost, setTotalCost] = useState(0);
  const [isEditingCost, setIsEditingCost] = useState(false);

  const { control, handleSubmit, reset } = useForm<PaymentFormInputs>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      payment_date: new Date(),
      reference: '',
    },
  });

  useEffect(() => {
    if (financials) {
      setTotalCost(financials.total_cost);
    }
  }, [financials]);

  const handleCreateFinancials = async () => {
    const initialData: FinancialsCreate = { total_cost: totalCost, exchange_rate_at_clearing: 0 };
    await createFinancials.mutateAsync(initialData);
  };

  const handleUpdateTotalCost = async () => {
    await updateFinancials.mutateAsync({ total_cost: totalCost });
    setIsEditingCost(false);
  }

  const onPaymentSubmit = async (data: PaymentFormInputs) => {
    const dataToSend: PaymentCreate = {
      ...data,
      payment_date: data.payment_date.toISOString().split('T')[0],
    };
    await recordPayment.mutateAsync(dataToSend);
    reset();
  };

  if (isLoadingFinancials) {
    return <CircularProgress />;
  }

  const anyError = financialsError || paymentsError || recordPayment.error || createFinancials.error || updateFinancials.error;

  if (!financials && !createFinancials.isPending && isSuccess) {
    return (
        <Card>
            <CardHeader title="Setup Financial Record" />
            <CardContent>
                <Typography sx={{ mb: 2 }}>
                    No financial record exists for this vehicle. Create one to begin tracking payments.
                </Typography>
                <TextField
                    label="Initial Total Cost"
                    type="number"
                    value={totalCost}
                    onChange={(e) => setTotalCost(Number(e.target.value))}
                    sx={{ mb: 2 }}
                />
                <Button
                    variant="contained"
                    onClick={handleCreateFinancials}
                    disabled={createFinancials.isPending}
                >
                    {createFinancials.isPending ? 'Creating...' : 'Create Financial Record'}
                </Button>
                {createFinancials.error && <ErrorAlert error={getErrorMessage(createFinancials.error)} sx={{ mt: 2 }} />}
            </CardContent>
        </Card>
    );
  }


  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardHeader title="Financial Summary" />
          <CardContent>
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {isEditingCost ? (
                        <TextField
                            label="Total Cost"
                            type="number"
                            value={totalCost}
                            onChange={(e) => setTotalCost(Number(e.target.value))}
                            size="small"
                        />
                    ) : (
                        <Typography variant="h6">
                            Total Cost: ₦{financials?.total_cost.toLocaleString()}
                        </Typography>
                    )}
                    <IconButton onClick={() => isEditingCost ? handleUpdateTotalCost() : setIsEditingCost(true)} size="small" sx={{ ml: 1 }}>
                        {isEditingCost ? <SaveIcon /> : <EditIcon />}
                    </IconButton>
                </Box>

                <Typography variant="h6" color="success.main">
                  Amount Paid: ₦{financials?.amount_paid.toLocaleString()}
                </Typography>
                <Typography variant="h6" color={financials && financials.balance > 0 ? 'error.main' : 'primary.main'}>
                  Balance: ₦{financials?.balance.toLocaleString()}
                </Typography>
              </>
          </CardContent>
        </Card>
        <Card sx={{ mt: 3 }}>
          <CardHeader title="Record a New Payment" />
          <CardContent>
            <form onSubmit={handleSubmit(onPaymentSubmit)}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="amount"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        label="Amount"
                        type="number"
                        fullWidth
                        required
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="payment_date"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        label="Payment Date"
                        value={field.value}
                        onChange={(date) => field.onChange(date)}
                        slotProps={{ textField: { fullWidth: true, required: true } }}
                      />
                    )}
                  />
                </Grid>
                <Grid size={12}>
                  <Controller
                    name="reference"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Reference (Optional)"
                        fullWidth
                      />
                    )}
                  />
                </Grid>
                <Grid size={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={recordPayment.isPending}
                  >
                    {recordPayment.isPending ? 'Recording...' : 'Record Payment'}
                  </Button>
                </Grid>
              </Grid>
            </form>
            {anyError && <ErrorAlert error={getErrorMessage(anyError)} sx={{ mt: 2 }} />}
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardHeader title="Payment History" />
          <CardContent>
            {isLoadingPayments ? <CircularProgress /> : (
              payments && payments.length > 0 ? (
                <List>
                  {payments.map((payment: any) => (
                    <ListItem key={payment.id} divider>
                      <ListItemText
                        primary={`₦${payment.amount.toLocaleString()}`}
                        secondary={
                          <>
                            {new Date(payment.payment_date).toLocaleDateString()}
                            {payment.reference && ` - ${payment.reference}`}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography>No payments recorded yet.</Typography>
              )
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

function getErrorMessage(error: any): string {
    if (!error) return 'An unknown error occurred.';
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    return 'An unknown error occurred.';
}
