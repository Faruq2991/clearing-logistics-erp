import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Card, CardContent, Typography, Grid, Paper } from '@mui/material';
import {
  Add as AddIcon,
  QueryStats as QueryStatsIcon,
  AccountBalanceWallet as WalletIcon,
} from '@mui/icons-material';

const summaryData = [
  { title: 'Vehicles In Progress', value: '12', icon: <QueryStatsIcon fontSize="large" color="primary" /> },
  { title: 'Total Cleared', value: '150', icon: <WalletIcon fontSize="large" color="secondary" /> },
  { title: 'Pending Documents', value: '3', icon: <AddIcon fontSize="large" color="error" /> },
];

export default function DashboardPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {summaryData.map((item) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.title} component="div">
            <Paper
              elevation={3}
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography color="text.secondary" gutterBottom>
                  {item.title}
                </Typography>
                <Typography variant="h5">{item.value}</Typography>
              </Box>
              {item.icon}
            </Paper>
          </Grid>
        ))}

        <Grid size={{ xs: 12 }} component="div">
          <Card>
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
                >
                  Add New Vehicle
                </Button>
                <Button
                  component={RouterLink}
                  to="/vehicles"
                  variant="outlined"
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
