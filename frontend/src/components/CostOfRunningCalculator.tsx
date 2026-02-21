import { useState } from 'react';
import { useForm, Controller, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  TextField,
  Typography,
  MenuItem,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { estimateApi } from '../services/api';
import ErrorAlert from './ErrorAlert';
import SelectField from './form/SelectField';

const costOfRunningSchema = z.object({
  vehicle_cost: z.coerce.number().positive('Vehicle cost must be positive'),
  shipping_fees: z.coerce.number().positive('Shipping fees must be positive'),
  customs_duty: z.coerce.number().positive('Customs duty must be positive'),
  terminal: z.string().min(1, 'Terminal is required'),
});

type CostOfRunningFormInputs = z.infer<typeof costOfRunningSchema>;

const TERMINALS = [
    { value: 'five_star_tin_can', label: 'Five Star - Tin Can' },
    { value: 'grimaldi', label: 'Grimaldi' },
    { value: 'ptml', label: 'PTML' },
    { value: 'apapa', label: 'Apapa' },
];

export default function CostOfRunningCalculator() {
  const [estimate, setEstimate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const methods = useForm<CostOfRunningFormInputs>({
    resolver: zodResolver(costOfRunningSchema),
    defaultValues: {
      vehicle_cost: 0,
      shipping_fees: 0,
      customs_duty: 0,
      terminal: '',
    },
  });
  const { control, handleSubmit } = methods;

  const onSubmit = async (data: CostOfRunningFormInputs) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await estimateApi.calculateCostOfRunning(data);
      setEstimate(result.data.total_estimate);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Cost of Running Calculator" />
      <CardContent>
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="vehicle_cost"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Vehicle Cost"
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
                  name="shipping_fees"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Shipping Fees"
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
                  name="customs_duty"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Customs Duty"
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
                <SelectField
                  name="terminal"
                  label="Terminal"
                >
                  {TERMINALS.map((terminal) => (
                    <MenuItem key={terminal.value} value={terminal.value}>
                      {terminal.label}
                    </MenuItem>
                  ))}
                </SelectField>
              </Grid>
              <Grid size={12}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isLoading}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Calculate'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </FormProvider>
        {error && <ErrorAlert error={error} sx={{ mt: 2 }} />}
        {estimate !== null && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6">
              Estimated Cost: ₦{estimate.toLocaleString()}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
