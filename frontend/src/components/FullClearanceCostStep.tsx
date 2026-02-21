import Grid from '@mui/material/Grid';
import { useFormContext } from 'react-hook-form';
import InputField from './form/InputField';
import type { VehicleFormInputs } from '../pages/AddVehiclePage';

export default function FullClearanceCostStep() {
    const { watch } = useFormContext<VehicleFormInputs>();
    const vehicleYear = watch('year');

    return (
        <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}><InputField name="cpc" label="CPC" type="number" /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><InputField name="valuation" label="Valuation" type="number" /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><InputField name="customs_duty" label="Customs Duty" type="number" /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><InputField name="comet_shipping" label="Comet/Shipping" type="number" /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><InputField name="terminal_charges" label="Terminal Charges" type="number" /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><InputField name="agencies" label="Agencies" type="number" /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><InputField name="examination" label="Examination" type="number" /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><InputField name="release" label="Release" type="number" /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><InputField name="disc" label="Disc" type="number" /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><InputField name="gate" label="Gate" type="number" /></Grid>
            {vehicleYear && vehicleYear >= 2017 && (
                <>
                    <Grid size={{ xs: 12, sm: 6 }}><InputField name="ciu" label="CIU" type="number" /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><InputField name="monitoring" label="Monitoring" type="number" /></Grid>
                </>
            )}
        </Grid>
    );
}
