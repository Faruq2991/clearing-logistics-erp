import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { z } from 'zod';
import { debounce } from 'lodash';
import {
  Box, Button, Typography, Paper, Stepper, Step, StepLabel, Divider, List, ListItem, ListItemText,
  Autocomplete, TextField, MenuItem, Radio, RadioGroup, FormControlLabel, FormControl,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useForm, useFormContext, Controller, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DatePicker } from '@mui/x-date-pickers';
import { useCreateVehicle } from '../hooks/useVehicles';
import type { VehicleCreate } from '../types';
import ErrorAlert from '../components/ErrorAlert';
import InputField from '../components/form/InputField';
import SelectField from '../components/form/SelectField';
import EstimateDisplay from '../components/EstimateDisplay';
import { useEstimate } from '../hooks/useEstimate';
import FullClearanceCostStep from '../components/FullClearanceCostStep';
import { api } from '../services/api';

const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;

const vehicleSchema = z.object({
  clearance_type: z.string().min(1, 'Please select a clearance type'),
  vin: z.string().length(17, { message: "VIN must be exactly 17 characters" }).regex(vinRegex, { message: "Invalid VIN format" }),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.coerce.number().int().min(1900, 'Invalid year').max(new Date().getFullYear() + 1, 'Invalid year'),
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
  estimated_total_cost: z.number().optional(),
  cpc: z.coerce.number().optional(),
  valuation: z.coerce.number().optional(),
  customs_duty: z.coerce.number().optional(),
  comet_shipping: z.coerce.number().optional(),
  terminal_charges: z.coerce.number().optional(),
});

export type VehicleFormInputs = z.infer<typeof vehicleSchema>;

const steps = ['Clearance Type', 'Vehicle Information', 'Shipping Details', 'Cost Determination', 'Review'];

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

const SHIP_NAMES = [
  'SILVER RAY', 'OCEAN STAR', 'PACIFIC VOYAGER', 'ATLANTIC PRIDE', 'MERCURY DREAM',
  'NEPTUNE CARRIER', 'POSEIDON EXPRESS', 'MARINE SPIRIT',
];

const TERMINALS = [
  { value: 'five_star_tin_can', label: 'Five Star - Tin Can' },
  { value: 'grimaldi', label: 'Grimaldi' },
  { value: 'apapa', label: 'Apapa' },
];

function ClearanceTypeStep() {
    const { control } = useFormContext<VehicleFormInputs>();
    return (
        <Controller
            name="clearance_type"
            control={control}
            render={({ field }) => (
                <FormControl component="fieldset">
                    <RadioGroup {...field}>
                        <FormControlLabel value="FULL" control={<Radio />} label="Full Vehicle Clearance" />
                        <FormControlLabel value="RELEASE_GATE" control={<Radio />} label="Release & Gate Only" />
                    </RadioGroup>
                </FormControl>
            )}
        />
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
            setValue('model', '');
          }}
          renderInput={(params) => <TextField {...params} label="Make *" error={!!error} helperText={error?.message} />}
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
  const { getValues } = useFormContext<VehicleFormInputs>();
  const values = getValues();
  
  const fullCostFields = ['cpc', 'valuation', 'customs_duty', 'comet_shipping', 'terminal_charges', 'agencies', 'examination', 'release', 'disc', 'gate', 'ciu', 'monitoring'];
  const releaseGateCostFields = ['agencies', 'examination', 'release', 'disc', 'gate', 'ciu', 'monitoring'];
  
  const costFields = values.clearance_type === 'FULL' ? fullCostFields : releaseGateCostFields;
  const totalManualCost = costFields.reduce((acc, field) => acc + (Number(values[field as keyof VehicleFormInputs]) || 0), 0);

  return (
    <Box>
        <Typography variant="h6" gutterBottom>Clearance Type</Typography>
        <ListItem><ListItemText primary="Service" secondary={values.clearance_type === 'FULL' ? 'Full Vehicle Clearance' : 'Release & Gate Only'} /></ListItem>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" gutterBottom>Vehicle Information</Typography>
        <List disablePadding>
            <ListItem><ListItemText primary="VIN" secondary={values.vin || 'Not provided'} /></ListItem>
            <ListItem><ListItemText primary="Make" secondary={values.make || 'Not provided'} /></ListItem>
            <ListItem><ListItemText primary="Model" secondary={values.model || 'Not provided'} /></ListItem>
            <ListItem><ListItemText primary="Year" secondary={values.year || 'Not provided'} /></ListItem>
            <ListItem><ListItemText primary="Color" secondary={values.color || 'N/A'} /></ListItem>
        </List>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" gutterBottom>Shipping Details</Typography>
        <List disablePadding>
            <ListItem><ListItemText primary="Ship Name" secondary={values.ship_name || 'N/A'} /></ListItem>
            <ListItem><ListItemText primary="Terminal" secondary={values.terminal ? TERMINALS.find(t => t.value === values.terminal)?.label || values.terminal : 'N/A'} /></ListItem>
            <ListItem><ListItemText primary="Arrival Date" secondary={values.arrival_date ? new Date(values.arrival_date).toLocaleDateString() : 'N/A'} /></ListItem>
        </List>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" gutterBottom>Cost Determination</Typography>
        <List disablePadding>
            {costFields.map((field) => (
                <ListItem key={field}><ListItemText primary={field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ')} secondary={values[field as keyof VehicleFormInputs] ? `₦${Number(values[field as keyof VehicleFormInputs]).toLocaleString()}` : 'N/A'} /></ListItem>
            ))}
            <ListItem><ListItemText primary="Total Manual Cost" secondary={`₦${totalManualCost.toLocaleString()}`} /></ListItem>
        </List>
    </Box>
  );
}

function CostOfRunningStep() {
    const { watch } = useFormContext<VehicleFormInputs>();
    const vehicleYear = watch('year');
    return (
        <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><InputField name="agencies" label="Agencies" type="number" /></Grid>
            <Grid item xs={12} sm={6}><InputField name="examination" label="Examination" type="number" /></Grid>
            <Grid item xs={12} sm={6}><InputField name="release" label="Release" type="number" /></Grid>
            <Grid item xs={12} sm={6}><InputField name="disc" label="Disc" type="number" /></Grid>
            <Grid item xs={12} sm={6}><InputField name="gate" label="Gate" type="number" /></Grid>
            {vehicleYear && vehicleYear >= 2017 && (
                <>
                    <Grid item xs={12} sm={6}><InputField name="ciu" label="CIU" type="number" /></Grid>
                    <Grid item xs={12} sm={6}><InputField name="monitoring" label="Monitoring" type="number" /></Grid>
                </>
            )}
        </Grid>
    );
}

function StepContent({ step, vin, setVin, vinAvailable }: { step: number, vin: string, setVin: (vin: string) => void, vinAvailable: boolean | null }) {
  const { watch, setValue } = useFormContext<VehicleFormInputs>();
  const clearanceType = watch('clearance_type');
  const make = watch('make');
  const model = watch('model');
  const year = watch('year');
  const terminal = watch('terminal');
  const { data: estimateData } = useEstimate(make, model, year, terminal);

  if (estimateData?.average_clearing_cost) {
      setValue('estimated_total_cost', estimateData.average_clearing_cost);
  }

  switch (step) {
    case 0: return <ClearanceTypeStep />;
    case 1: return (
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <InputField 
                    name="vin" 
                    label="VIN" 
                    required 
                    inputProps={{ 
                        style: { textTransform: 'uppercase' }, 
                        maxLength: 17,
                        onChange: (e) => setVin(e.target.value)
                    }} 
                    helperText={vinAvailable === false ? "VIN already registered" : "17 characters"}
                    error={vinAvailable === false}
                />
            </Grid>
            <Grid item xs={12} sm={4}><VehicleMakeField /></Grid>
            <Grid item xs={12} sm={4}><VehicleModelField /></Grid>
            <Grid item xs={12} sm={4}><InputField name="year" label="Year" type="number" required /></Grid>
            <Grid item xs={12}><InputField name="color" label="Color" /></Grid>
        </Grid>
    );
    case 2: return (
        <Grid container spacing={2}>
            <Grid item xs={12}><Controller name="ship_name" render={({ field }) => ( <Autocomplete {...field} options={SHIP_NAMES} value={field.value || null} onChange={(_, newValue) => field.onChange(newValue || '')} renderInput={(params) => ( <TextField {...params} label="Ship Name" /> )} freeSolo /> )}/></Grid>
            <Grid item xs={12}><SelectField name="terminal" label="Terminal"><MenuItem value=""><em>None</em></MenuItem>{TERMINALS.map((t) => ( <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem> ))}</SelectField></Grid>
            <Grid item xs={12}><Controller name="arrival_date" render={({ field }) => ( <DatePicker label="Arrival Date" value={field.value || null} onChange={(date) => field.onChange(date)} slotProps={{ textField: { fullWidth: true } }} /> )}/></Grid>
        </Grid>
    );
    case 3: return (
        <>
            <EstimateDisplay />
            <Divider sx={{ my: 3 }}><Typography variant="overline">Manual Cost Entry</Typography></Divider>
            {clearanceType === 'FULL' ? <FullClearanceCostStep /> : <CostOfRunningStep />}
        </>
    );
    case 4: return <Review />;
    default: return 'Unknown step';
  }
}

export default function AddVehiclePage() {
  const navigate = useNavigate();
  const createVehicle = useCreateVehicle();
  const [activeStep, setActiveStep] = useState(0);
  const [vin, setVin] = useState('');
  const [vinAvailable, setVinAvailable] = useState<boolean | null>(null);

  const checkVinAvailability = useCallback(debounce(async (vin: string) => {
    if (vin.length === 17) {
      try {
        const response = await api.get(`/vehicles/check-vin/${vin}`);
        setVinAvailable(!response.data);
      } catch (error) {
        console.error("Error checking VIN:", error);
      }
    } else {
      setVinAvailable(null);
    }
  }, 500), []);

  useEffect(() => {
    checkVinAvailability(vin);
  }, [vin, checkVinAvailability]);
  
  const methods = useForm<VehicleFormInputs>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      clearance_type: 'FULL',
      vin: '', make: '', model: '', year: new Date().getFullYear(), color: '',
      ship_name: '', terminal: '', arrival_date: null, status: 'In Transit',
      agencies: 0, examination: 0, release: 0, disc: 0, gate: 0, ciu: 0, monitoring: 0,
      cpc: 0, valuation: 0, customs_duty: 0, comet_shipping: 0, terminal_charges: 0,
    },
  });

  const { trigger, handleSubmit } = methods;

  const handleNext = async () => {
    let fields: (keyof VehicleFormInputs)[] = [];
    switch(activeStep) {
        case 0: fields = ['clearance_type']; break;
        case 1: fields = ['vin', 'make', 'model', 'year']; break;
        case 2: fields = ['ship_name', 'terminal', 'arrival_date']; break;
        case 3: break;
    }
    const isValid = fields.length > 0 ? await trigger(fields) : true;
    if (isValid) setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const onSubmit = async (data: VehicleFormInputs) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
    
      let status = data.status;
      if (data.arrival_date) {
        const arrivalDate = new Date(data.arrival_date);
        arrivalDate.setHours(0, 0, 0, 0);
        status = arrivalDate > today ? 'In Transit' : 'Clearing';
      }

      const dataToSend: Partial<VehicleCreate> = { ...data, status, arrival_date: data.arrival_date ? data.arrival_date.toISOString() : undefined };
      
      const res = await createVehicle.mutateAsync(dataToSend as VehicleCreate);
      navigate(`/vehicles/${res.data.id}`);
    } catch (err) {
      // Error is handled by the mutation hook
    }
  };

  return (
    <Box sx={{ maxWidth: 800, margin: 'auto' }}>
      <Typography variant="h4" gutterBottom>Add a New Vehicle</Typography>
      <Paper sx={{ p: 3, mt: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label) => (<Step key={label}><StepLabel>{label}</StepLabel></Step>))}
        </Stepper>
        <ErrorAlert error={createVehicle.error} />
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ minHeight: 200, p: 2 }}><StepContent step={activeStep} vin={vin} setVin={setVin} vinAvailable={vinAvailable} /></Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button disabled={activeStep === 0} onClick={handleBack} sx={{ mr: 1 }}>Back</Button>
                {activeStep === steps.length - 1 ? (
                    <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={createVehicle.isPending || vinAvailable === false}>
                        {createVehicle.isPending ? 'Submitting...' : 'Submit Vehicle'}
                    </Button>
                ) : (
                    <Button variant="contained" onClick={handleNext} disabled={vinAvailable === false}>Next</Button>
                )}
                <Button component={RouterLink} to="/vehicles" sx={{ ml: 1 }}>Cancel</Button>
            </Box>
          </form>
        </FormProvider>
      </Paper>
    </Box>
  );
}