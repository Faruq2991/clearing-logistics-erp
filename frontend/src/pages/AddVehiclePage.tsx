import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
} from '@mui/material';
import { useCreateVehicle } from '../hooks/useVehicles';
import type { VehicleCreate } from '../types';

export default function AddVehiclePage() {
  const navigate = useNavigate();
  const createVehicle = useCreateVehicle();
  const [form, setForm] = useState<VehicleCreate>({
    vin: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    ship_name: '',
    terminal: '',
    status: 'In Transit',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await createVehicle.mutateAsync(form);
      navigate(`/vehicles/${res.data.id}`);
    } catch (err) {
      // Error handled by mutation
    }
  };

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Typography variant="h4" gutterBottom>
        Add Vehicle
      </Typography>

      {createVehicle.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {String(createVehicle.error)}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <TextField
            label="VIN"
            fullWidth
            required
            value={form.vin}
            onChange={(e) => setForm((f) => ({ ...f, vin: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Make"
              fullWidth
              required
              value={form.make}
              onChange={(e) => setForm((f) => ({ ...f, make: e.target.value }))}
            />
            <TextField
              label="Model"
              fullWidth
              required
              value={form.model}
              onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
            />
            <TextField
              label="Year"
              type="number"
              fullWidth
              required
              value={form.year}
              onChange={(e) => setForm((f) => ({ ...f, year: parseInt(e.target.value, 10) || f.year }))}
            />
          </Box>
          <TextField
            label="Color"
            fullWidth
            value={form.color ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, color: e.target.value || undefined }))}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Ship Name"
            fullWidth
            value={form.ship_name ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, ship_name: e.target.value || undefined }))}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Terminal"
            fullWidth
            value={form.terminal ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, terminal: e.target.value || undefined }))}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button type="submit" variant="contained" disabled={createVehicle.isPending}>
              {createVehicle.isPending ? 'Creating...' : 'Create Vehicle'}
            </Button>
            <Button component={Link} to="/vehicles" variant="outlined">
              Cancel
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
