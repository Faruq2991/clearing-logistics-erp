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
  Divider,
  List,
  ListItem,
  ListItemText,
  Autocomplete,
  TextField,
  MenuItem,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useForm, useFormContext, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DatePicker } from '@mui/x-date-pickers';
import { useCreateVehicle } from '../hooks/useVehicles';
import type { VehicleCreate } from '../types';
import ErrorAlert from '../components/ErrorAlert';
import Form from '../components/form/Form';
import InputField from '../components/form/InputField';
import SelectField from '../components/form/SelectField';



// VIN must be exactly 17 characters, alphanumeric (no I, O, Q)
const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;

const vehicleSchema = z.object({
  vin: z.string()
    .length(17, { message: "VIN must be exactly 17 characters" })
    .regex(vinRegex, { message: "VIN must contain only letters (excluding I, O, Q) and numbers" }),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.coerce
    .number()
    .int()
    .min(1900, 'Invalid year')
    .max(new Date().getFullYear() + 1, 'Invalid year'),
  color: z.string().optional(),
  ship_name: z.string().optional(),
  terminal: z.string().optional(),
  arrival_date: z.date().optional().nullable(),
  status: z.string().min(1, 'Status is required'),
});

type VehicleFormInputs = z.infer<typeof vehicleSchema>;

const steps = ['Vehicle Information', 'Shipping Details', 'Review'];

// Vehicle makes with their models
const VEHICLE_MAKES = {
  'TOYOTA': ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Tacoma', 'Tundra', 'Prius', 'Sienna', 'Land Cruiser', '4Runner'],
  'HONDA': ['Accord', 'Civic', 'CR-V', 'Pilot', 'Odyssey', 'HR-V', 'Ridgeline', 'Passport'],
  'FORD': ['F-150', 'Mustang', 'Explorer', 'Escape', 'Edge', 'Expedition', 'Ranger', 'Bronco'],
  'CHEVROLET': ['Silverado', 'Equinox', 'Tahoe', 'Suburban', 'Traverse', 'Malibu', 'Colorado', 'Camaro'],
  'NISSAN': ['Altima', 'Sentra', 'Rogue', 'Pathfinder', 'Frontier', 'Titan', 'Murano', 'Kicks'],
  'MERCEDES-BENZ': ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE', 'GLS', 'A-Class', 'CLA'],
  'BMW': ['3 Series', '5 Series', '7 Series', 'X3', 'X5', 'X7', 'M3', 'M5'],
  'AUDI': ['A4', 'A6', 'A8', 'Q3', 'Q5', 'Q7', 'Q8', 'e-tron'],
  'LEXUS': ['ES', 'IS', 'LS', 'RX', 'GX', 'LX', 'NX', 'UX'],
  'HYUNDAI': ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Palisade', 'Kona', 'Venue'],
  'KIA': ['Forte', 'K5', 'Sportage', 'Sorento', 'Telluride', 'Soul', 'Seltos'],
  'VOLKSWAGEN': ['Jetta', 'Passat', 'Tiguan', 'Atlas', 'Golf', 'ID.4', 'Arteon'],
  'MAZDA': ['Mazda3', 'Mazda6', 'CX-5', 'CX-9', 'CX-30', 'CX-50', 'MX-5 Miata'],
  'SUBARU': ['Outback', 'Forester', 'Crosstrek', 'Ascent', 'Legacy', 'WRX', 'BRZ'],
  'JEEP': ['Wrangler', 'Grand Cherokee', 'Cherokee', 'Compass', 'Renegade', 'Gladiator'],
};

// Ship names (placeholders)
const SHIP_NAMES = [
  'SILVER RAY',
  'OCEAN STAR',
  'PACIFIC VOYAGER',
  'ATLANTIC PRIDE',
  'MERCURY DREAM',
  'NEPTUNE CARRIER',
  'POSEIDON EXPRESS',
  'MARINE SPIRIT',
];

// Terminal options
const TERMINALS = [
  { value: 'five_star_tin_can', label: 'Five Star - Tin Can' },
  { value: 'grimaldi', label: 'Grimaldi' },
  { value: 'apapa', label: 'Apapa' },
];

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
          <ListItemText 
            primary="VIN" 
            secondary={values.vin || 'Not provided'} 
            slotProps={{ 
              secondary: { sx: { fontFamily: 'monospace', fontSize: '0.95rem' } }
            }}
          />
        </ListItem>
        <ListItem>
          <ListItemText primary="Make" secondary={values.make || 'Not provided'} />
        </ListItem>
        <ListItem>
          <ListItemText primary="Model" secondary={values.model || 'Not provided'} />
        </ListItem>
        <ListItem>
          <ListItemText primary="Year" secondary={values.year || 'Not provided'} />
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
          <ListItemText 
            primary="Terminal" 
            secondary={
              values.terminal 
                ? TERMINALS.find(t => t.value === values.terminal)?.label || values.terminal
                : 'N/A'
            } 
          />
        </ListItem>
        <ListItem>
          <ListItemText 
            primary="Arrival Date" 
            secondary={values.arrival_date ? new Date(values.arrival_date).toLocaleDateString() : 'N/A'} 
          />
        </ListItem>
      </List>
    </Box>
  );
}

function VehicleMakeField() {
  const { control, setValue } = useFormContext<VehicleFormInputs>();
  const makes = Object.keys(VEHICLE_MAKES).sort();

  return (
    <Controller
      name="make"
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Autocomplete
          {...field}
          options={makes}
          value={field.value || null}
          onChange={(_, newValue) => {
            field.onChange(newValue || '');
            setValue('model', ''); // Reset model when make changes
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Make *"
              error={!!error}
              helperText={error?.message}
            />
          )}
          freeSolo={false}
        />
      )}
    />
  );
}

function VehicleModelField() {
  const { control, watch } = useFormContext<VehicleFormInputs>();
  const selectedMake = watch('make');
  const models = selectedMake && VEHICLE_MAKES[selectedMake as keyof typeof VEHICLE_MAKES] 
    ? VEHICLE_MAKES[selectedMake as keyof typeof VEHICLE_MAKES].sort()
    : [];

  return (
    <Controller
      name="model"
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Autocomplete
          {...field}
          options={models}
          value={field.value || null}
          onChange={(_, newValue) => field.onChange(newValue || '')}
          disabled={!selectedMake}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Model *"
              error={!!error}
              helperText={error?.message || (!selectedMake ? 'Select a make first' : '')}
            />
          )}
          freeSolo={false}
        />
      )}
    />
  );
}

function getStepContent(step: number) {
  switch (step) {
    case 0:
      return (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <InputField
              name="vin"
              label="VIN"
              required
              inputProps={{
                style: { textTransform: 'uppercase' },
                maxLength: 17,
              }}
              helperText="17 characters, alphanumeric (excluding I, O, Q)"
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <VehicleMakeField />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <VehicleModelField />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <InputField
              name="year"
              label="Year"
              type="number"
              required
            />
          </Grid>
          
          <Grid item xs={12}>
            <InputField
              name="color"
              label="Color"
            />
          </Grid>
        </Grid>
      );
      
    case 1:
      return (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Controller
              name="ship_name"
              render={({ field }) => (
                <Autocomplete
                  {...field}
                  options={SHIP_NAMES}
                  value={field.value || null}
                  onChange={(_, newValue) => field.onChange(newValue || '')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Ship Name"
                    />
                  )}
                  freeSolo
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12}>
            <SelectField
              name="terminal"
              label="Terminal"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {TERMINALS.map((terminal) => (
                <MenuItem key={terminal.value} value={terminal.value}>
                  {terminal.label}
                </MenuItem>
              ))}
            </SelectField>
          </Grid>
          <Grid item xs={12}>
            <Controller
              name="arrival_date"
              render={({ field }) => (
                <DatePicker
                  label="Arrival Date"
                  value={field.value || null}
                  onChange={(date) => field.onChange(date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    }
                  }}
                />
              )}
            />
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

  const methods = useForm<VehicleFormInputs>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      vin: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      color: '',
      ship_name: '',
      terminal: '',
      arrival_date: null,
      status: 'IN_TRANSIT',
    },
  });

  const { trigger } = methods;

  const handleNext = async () => {
    const fields: (keyof VehicleFormInputs)[] =
      activeStep === 0
        ? ['vin', 'make', 'model', 'year']
        : ['ship_name', 'terminal', 'arrival_date'];
    const isValid = await trigger(fields);
    if (isValid) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const onSubmit = async (data: VehicleFormInputs) => {
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

        <Form<VehicleFormInputs>
          onSubmit={onSubmit}
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
              <Button
                type="submit"
                variant="contained"
                disabled={createVehicle.isPending}
              >
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
