import { useState } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import Grid from '@mui/material/Grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { endOfDay, startOfDay } from 'date-fns';
import FinancialReport from '../components/reports/FinancialReport';
import { useFinancialReport } from '../hooks/useFinancials';

export default function FinancialReportsPage() {
  const [startDate, setStartDate] = useState<Date | null>(startOfDay(new Date()));
  const [endDate, setEndDate] = useState<Date | null>(endOfDay(new Date()));

  const { data: report, isLoading, error, refetch } = useFinancialReport(startDate!, endDate!);

  const handleGenerateReport = () => {
    refetch();
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Financial Reports</Typography>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">Report Filters</Typography>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={2} alignItems="center" sx={{ mt: 1 }}>
            <Grid size="auto">
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={setStartDate}
              />
            </Grid>
            <Grid size="auto">
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={setEndDate}
              />
            </Grid>
            <Grid size="auto">
              <Button
                variant="contained"
                onClick={handleGenerateReport}
                disabled={isLoading}
              >
                {isLoading ? 'Generating...' : 'Generate Report'}
              </Button>
            </Grid>
          </Grid>
        </LocalizationProvider>
      </Paper>

      {isLoading && <p>Loading report...</p>}
      {error && <p>Error loading report.</p>}
      {report && <FinancialReport report={report} />}
    </Box>
  );
}
