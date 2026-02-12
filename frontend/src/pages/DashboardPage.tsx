import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Card, CardContent, Typography, Grid, Paper, CircularProgress } from '@mui/material';
import {
  Add as AddIcon,
  QueryStats as QueryStatsIcon,
  AccountBalanceWallet as WalletIcon,
} from '@mui/icons-material';
import { useDashboardStats } from '../hooks/useDashboard';
import ErrorAlert from '../components/ErrorAlert';
import PieChartComponent from '../components/charts/PieChartComponent'; // Import PieChartComponent
import BarChartComponent from '../components/charts/BarChartComponent'; // Import BarChartComponent
import TrendIndicator from '../components/TrendIndicator'; // Import TrendIndicator
import RecentActivity from '../components/RecentActivity'; // Import RecentActivity

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboardStats();

  const summaryData = [
    { title: 'Vehicles In Progress', value: data?.vehicles_in_progress ?? '...', trend: data?.vehicles_in_progress_trend ?? 0, icon: <QueryStatsIcon sx={{ color: 'primary.main' }} /> },
    { title: 'Total Cleared', value: data?.total_cleared_vehicles ?? '...', trend: data?.total_cleared_vehicles_trend ?? 0, icon: <WalletIcon sx={{ color: 'success.main' }} /> },
    { title: 'Pending Documents', value: data?.pending_documents ?? '...', trend: data?.pending_documents_trend ?? 0, icon: <AddIcon sx={{ color: 'error.main' }} /> },
    { title: 'Total Outstanding Debt', value: data?.total_outstanding_debt !== undefined ? `$${data.total_outstanding_debt.toFixed(2)}` : '...', trend: data?.total_outstanding_debt_trend ?? 0, icon: <WalletIcon sx={{ color: 'warning.main' }} /> },
  ];

  // Transform data for charts
  const vehicleStatusChartData = data?.vehicle_status_distribution
    ? Object.entries(data.vehicle_status_distribution).map(([name, value]) => ({ name, value }))
    : [];

  const activeVesselChartData = data?.active_vessel_counts
    ? Object.entries(data.active_vessel_counts).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {error && <ErrorAlert error={error} />}

      <Grid container spacing={3}>
        {summaryData.map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item.title}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 4px 20px 0 rgba(0,0,0,0.12)',
                },
              }}
            >
              <Box>
                <Typography color="text.secondary" gutterBottom sx={{ fontWeight: 'medium' }}>
                  {item.title}
                </Typography>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                  {isLoading ? <CircularProgress size={28} /> : item.value}
                </Typography>
                {!isLoading && <TrendIndicator trend={item.trend} />}
              </Box>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: (theme) => `${theme.palette[item.icon.props.sx.color.split('.')[0]].light}30`,
                }}
              >
                {item.icon}
              </Box>
            </Paper>
          </Grid>
        ))}

        <Grid item xs={12} md={6}>
          {isLoading ? (
            <CircularProgress />
          ) : (
            <PieChartComponent title="Vehicle Status Distribution" data={vehicleStatusChartData} />
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          {isLoading ? (
            <CircularProgress />
          ) : (
            <BarChartComponent
              title="Active Vessel Counts"
              data={activeVesselChartData}
              xLabel="Vessel"
              yLabel="Number of Vehicles"
            />
          )}
        </Grid>

        <Grid item xs={12}>
          <RecentActivity />
        </Grid>

        <Grid item xs={12}>
          <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  component={RouterLink}
                  to="/vehicles/new"
                  variant="contained"
                  startIcon={<AddIcon />}
                  size="large"
                >
                  Add New Vehicle
                </Button>
                <Button
                  component={RouterLink}
                  to="/vehicles"
                  variant="outlined"
                  size="large"
                >
                  View All Vehicles
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
