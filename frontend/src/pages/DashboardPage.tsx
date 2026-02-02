import { Link } from 'react-router-dom';
import { Box, Button, Card, CardContent, Typography } from '@mui/material';

export default function DashboardPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
              <Button component={Link} to="/vehicles" variant="contained">
                View Vehicles
              </Button>
              <Button component={Link} to="/vehicles/new" variant="outlined">
                Add Vehicle
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
