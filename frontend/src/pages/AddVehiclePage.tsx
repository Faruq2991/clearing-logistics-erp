import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { z } from 'zod';
import {
  Box,
  Button,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Grid, // Revert to standard Grid
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { useFormContext, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateVehicle } from '../hooks/useVehicles';
import type { VehicleCreate } from '../types';
import ErrorAlert from '../components/ErrorAlert';
import Form from '../components/form/Form';
import InputField from '../components/form/InputField';

const vehicleSchema = z.object({
  vin: z.string().min(1, 'VIN is required'),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().int().min(1900, 'Invalid year').max(new Date().getFullYear() + 1, 'Invalid year'),
  color: z.string().optional(),
  ship_name: z.string().optional(),
  terminal: z.string().optional(),
  status: z.string().default('IN_TRANSIT'),
});

const steps = ['Vehicle Information', 'Shipping Details', 'Review'];

function Review() {
  const { getValues } = useFormContext();
  const values = getValues();

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Vehicle Information
      </Typography>
      <List disablePadding>
        <ListItem>
          <ListItemText primary="VIN" secondary={values.vin} />
        </ListItem>
        <ListItem>
          <ListItemText primary="Make" secondary={values.make} />
        </ListItem>
        <ListItem>
          <ListItemText primary="Model" secondary={values.model} />
        </ListItem>
        <ListItem>
          <ListItemText primary="Year" secondary={values.year} />
        </ListItem>
        <ListItem>
          <ListItemText primary="Color" secondary={values.color || 'N/A'} />
        </ListItem>
      </List>
      <Divider sx={{ my: 2 }} />
      <Typography variant="h6" gutterBottom>
        Shipping Details
      </Typography>
      <List disablePadding>
        <ListItem>
          <ListItemText primary="Ship Name" secondary={values.ship_name || 'N/A'} />
        </ListItem>
        <ListItem>
          <ListItemText primary="Terminal" secondary={values.terminal || 'N/A'} />
        </ListItem>
      </List>
    </Box>
  );
}

function getStepContent(step: number) {
  switch (step) {
    case 0:
      return (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }} component="div">
            <Box>
              <InputField
                name="vin"
                label="VIN"
                required
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }} component="div">
            <Box>
              <InputField
                name="make"
                label="Make"
                required
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }} component="div">
            <Box>
              <InputField
                name="model"
                label="Model"
                required
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }} component="div">
            <Box>
              <InputField
                name="year"
                label="Year"
                type="number"
                required
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 12 }} component="div">
            <Box>
              <InputField
                name="color"
                label="Color"
              />
            </Box>
          </Grid>
        </Grid>
      );
    case 1:
      return (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }} component="div">
            <Box>
              <InputField
                name="ship_name"
                label="Ship Name"
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 12 }} component="div">
            <Box>
              <InputField
                name="terminal"
                label="Terminal"
              />
            </Box>
          </Grid>
        </Grid>
      );
    case 2:
      return <Review />;
    default:
      return 'Unknown step';
  }
}

export default function AddVehiclePage() {
  const navigate = useNavigate();
  const createVehicle = useCreateVehicle();
  const [activeStep, setActiveStep] = useState(0);

  const methods = useForm<z.infer<typeof vehicleSchema>>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      vin: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      color: '',
      ship_name: '',
      terminal: '',
      status: 'IN_TRANSIT',
    },
  });

  const { trigger, handleSubmit } = methods;

  const handleNext = async () => {
    const fields: (keyof z.infer<typeof vehicleSchema>)[] = activeStep === 0 
      ? ['vin', 'make', 'model', 'year'] 
      : ['ship_name', 'terminal'];
    const isValid = await trigger(fields);
    if (isValid) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const onSubmit = async (data: z.infer<typeof vehicleSchema>) => {
    try {
      const res = await createVehicle.mutateAsync(data as VehicleCreate);
      navigate(`/vehicles/${res.data.id}`);
    } catch (err) {
      // Error handled by mutation hook
    }
  };

  return (
    <Box sx={{ maxWidth: 800, margin: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Add a New Vehicle
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <ErrorAlert error={createVehicle.error} />

        <Form<z.infer<typeof vehicleSchema>>
          onSubmit={handleSubmit(onSubmit)}
          schema={vehicleSchema}
          methods={methods}
        >
          <Box sx={{ minHeight: 200, p: 2 }}>
            {getStepContent(activeStep)}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{ mr: 1 }}
            >
              Back
            </Button>
            {activeStep === steps.length - 1 ? (
              <Button type="submit" variant="contained" disabled={createVehicle.isPending}>
                {createVehicle.isPending ? 'Submitting...' : 'Submit Vehicle'}
              </Button>
            ) : (
              <Button variant="contained" onClick={handleNext}>
                Next
              </Button>
            )}
             <Button component={RouterLink} to="/vehicles" sx={{ ml: 1 }}>
              Cancel
            </Button>
          </Box>
        </Form>
      </Paper>
    </Box>
  );
}
