import { useParams, Link } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useState } from 'react';
import { useVehicle } from '../hooks/useVehicles';

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const vehicleId = id ? parseInt(id, 10) : null;
  const { data: vehicle, isLoading, error } = useVehicle(vehicleId);
  const [tab, setTab] = useState(0);

  if (!vehicleId || isNaN(vehicleId)) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Invalid vehicle ID</Alert>
        <Button component={Link} to="/vehicles" sx={{ mt: 2 }}>
          Back to Vehicles
        </Button>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{String(error)}</Alert>
        <Button component={Link} to="/vehicles" sx={{ mt: 2 }}>
          Back to Vehicles
        </Button>
      </Box>
    );
  }

  if (isLoading || !vehicle) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          {vehicle.make} {vehicle.model} ({vehicle.year})
        </Typography>
        <Button component={Link} to="/vehicles" variant="outlined">
          Back to Vehicles
        </Button>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Details" />
        <Tab label="Documents" />
        <Tab label="Financials" />
      </Tabs>

      {tab === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="body1"><strong>VIN:</strong> {vehicle.vin}</Typography>
          <Typography variant="body1"><strong>Color:</strong> {vehicle.color ?? '—'}</Typography>
          <Typography variant="body1"><strong>Ship:</strong> {vehicle.ship_name ?? '—'}</Typography>
          <Typography variant="body1"><strong>Terminal:</strong> {vehicle.terminal ?? '—'}</Typography>
          <Typography variant="body1"><strong>Status:</strong> {vehicle.status}</Typography>
        </Paper>
      )}

      {tab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography color="text.secondary">Document upload and list placeholder.</Typography>
        </Paper>
      )}

      {tab === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography color="text.secondary">Financials and payments placeholder.</Typography>
        </Paper>
      )}
    </Box>
  );
}
