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
import EstimateDisplay from '../components/EstimateDisplay';



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
  agencies: z.coerce.number().optional(),
  examination: z.coerce.number().optional(),
  release: z.coerce.number().optional(),
  disc: z.coerce.number().optional(),
  gate: z.coerce.number().optional(),
  ciu: z.coerce.number().optional(),
  monitoring: z.coerce.number().optional(),
});

type VehicleFormInputs = z.infer<typeof vehicleSchema>;

const steps = ['Vehicle Information', 'Shipping Details', 'Cost of Running', 'Review'];

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

function Review() {
  const { getValues } = useFormContext();
  const values = getValues();
  const costFields = ['agencies', 'examination', 'release', 'disc', 'gate', 'ciu', 'monitoring'];
  const totalCost = costFields.reduce((acc, field) => acc + (Number(values[field]) || 0), 0);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Vehicle Information
      </Typography>
      <List disablePadding>
        <ListItem>
          <ListItemText primary="VIN" secondary={values.vin || 'Not provided'} />
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
      <Divider sx={{ my: 2 }} />
      <Typography variant="h6" gutterBottom>
        Cost of Running
      </Typography>
      <List disablePadding>
        {costFields.map((field) => (
          <ListItem key={field}>
            <ListItemText primary={field.charAt(0).toUpperCase() + field.slice(1)} secondary={values[field] ? `₦${Number(values[field]).toLocaleString()}` : 'N/A'} />
          </ListItem>
        ))}
        <ListItem>
            <ListItemText primary="Total" secondary={`₦${totalCost.toLocaleString()}`} />
        </ListItem>
      </List>
    </Box>
  );
}

function CostOfRunningStep() {
    const { watch, getValues } = useFormContext<VehicleFormInputs>();
    const vehicleYear = watch('year');
    const [total, setTotal] = useState(0);

    const handleCalculate = () => {
        const values = getValues();
        const costFields = ['agencies', 'examination', 'release', 'disc', 'gate', 'ciu', 'monitoring'];
        const totalCost = costFields.reduce((acc, field) => acc + (Number(values[field as keyof VehicleFormInputs]) || 0), 0);
        setTotal(totalCost);
    }

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
                <InputField name="agencies" label="Agencies" type="number" />
            </Grid>
            <Grid item xs={12} sm={6}>
                <InputField name="examination" label="Examination" type="number" />
            </Grid>
            <Grid item xs={12} sm={6}>
                <InputField name="release" label="Release" type="number" />
            </Grid>
            <Grid item xs={12} sm={6}>
                <InputField name="disc" label="Disc" type="number" />
            </Grid>
            <Grid item xs={12} sm={6}>
                <InputField name="gate" label="Gate" type="number" />
            </Grid>
            {vehicleYear && vehicleYear >= 2017 && (
                <>
                    <Grid item xs={12} sm={6}>
                        <InputField name="ciu" label="CIU" type="number" />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <InputField name="monitoring" label="Monitoring" type="number" />
                    </Grid>
                </>
            )}
            <Grid item xs={12}>
                <Button variant="contained" onClick={handleCalculate}>Calculate Total</Button>
            </Grid>
            {total > 0 && (
                <Grid item xs={12}>
                    <Typography variant="h6">Total: ₦{total.toLocaleString()}</Typography>
                </Grid>
            )}
        </Grid>
    );
}

function getStepContent(step: number) {
  switch (step) {
    case 0:
      return (
        <>
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
          <EstimateDisplay />
        </>
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
        return <CostOfRunningStep />;
      
    case 3:
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
      agencies: 0,
      examination: 0,
      release: 0,
      disc: 0,
      gate: 0,
      ciu: 0,
      monitoring: 0,
    },
  });

  const { trigger } = methods;

  const handleNext = async () => {
    let fields: (keyof VehicleFormInputs)[] = [];
    switch(activeStep) {
        case 0:
            fields = ['vin', 'make', 'model', 'year'];
            break;
        case 1:
            fields = ['ship_name', 'terminal', 'arrival_date'];
            break;
        case 2:
            // No validation for cost of running for now
            break;
    }
    const isValid = fields.length > 0 ? await trigger(fields) : true;
    if (isValid) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const onSubmit = async (data: VehicleFormInputs) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of today for accurate comparison

      let status = data.status; // Default to the current status in the form
      if (data.arrival_date) {
        const arrivalDate = new Date(data.arrival_date);
        arrivalDate.setHours(0, 0, 0, 0); // Normalize arrival date
        status = arrivalDate > today ? 'In Transit' : 'Clearing';
      }

      const dataToSend: VehicleCreate = {
        ...data,
        status,
        arrival_date: data.arrival_date ? data.arrival_date.toISOString() : undefined,
      };
      const res = await createVehicle.mutateAsync(dataToSend);
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
                variant="contained"
                onClick={methods.handleSubmit(onSubmit)}
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
