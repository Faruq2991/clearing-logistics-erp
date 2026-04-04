import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Chip,
  Select,
  MenuItem,
  FormControl,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { Grid } from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Description as DescriptionIcon,
  AttachMoney as AttachMoneyIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import ErrorAlert from '../components/ErrorAlert';
import { useAuth } from '../contexts/AuthContext';
import DocumentsTab from '../components/DocumentsTab';
import FinancialsTab from '../components/FinancialsTab';
import type { VehicleResponse } from '../types';
import { useState, useEffect } from 'react';
import { useVehicle, useUpdateVehicleStatus, useDeleteVehicle } from '../hooks/useVehicles';
import { api } from '../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`vehicle-tabpanel-${index}`}
      aria-labelledby={`vehicle-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const getStatusChipColor = (status: string) => {
    switch (status) {
      case 'In Transit':
        return 'info';
      case 'Clearing':
        return 'warning';
      case 'Done':
        return 'success';
      default:
        return 'default';
    }
  };

function CostBreakdown({ vehicle }: { vehicle: VehicleResponse }) {
  const costFields = [
    { label: 'CPC', value: vehicle.cpc },
    { label: 'Valuation', value: vehicle.valuation },
    { label: 'Customs Duty', value: vehicle.customs_duty },
    { label: 'Comet Shipping', value: vehicle.comet_shipping },
    { label: 'Terminal Charges', value: vehicle.terminal_charges },
    { label: 'Agencies', value: vehicle.agencies },
    { label: 'Examination', value: vehicle.examination },
    { label: 'Release', value: vehicle.release },
    { label: 'Disc', value: vehicle.disc },
    { label: 'Gate', value: vehicle.gate },
    { label: 'CIU', value: vehicle.ciu },
    { label: 'Monitoring', value: vehicle.monitoring },
  ];

  const totalCost = costFields.reduce((acc, field) => acc + (Number(field.value) || 0), 0);

  return (
    <Card>
      <CardHeader title="Cost Breakdown" />
      <CardContent>
        <Grid container spacing={3}>
          {costFields.map((item, index) => (
            <Grid key={index} size={{ xs: 6, sm: 4, md: 3 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                {item.label}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(item.value || 0)}
              </Typography>
            </Grid>
          ))}

          <Grid size={{ xs: 12 }} sx={{ mt: 2, pt: 2, borderTop: '1px dashed #ccc' }}>
            <Typography variant="h6" color="primary">
              Total Cost: {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(totalCost)}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const vehicleId = id ? parseInt(id, 10) : null;
  const navigate = useNavigate();
  const { data: vehicle, isLoading, error } = useVehicle(vehicleId);
  const [tab, setTab] = useState(0);
  const { user } = useAuth();
  const { mutateAsync: updateStatus, isPending: isUpdatingStatus } = useUpdateVehicleStatus(vehicleId!);
  const { mutateAsync: deleteVehicle, isPending: isDeleting } = useDeleteVehicle();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [terminalName, setTerminalName] = useState('');
  const [shipName, setShipName] = useState('');

  useEffect(() => {
    if (vehicle) {
      if (vehicle.terminal_id) {
        api.get(`/terminals/${vehicle.terminal_id}`)
          .then(response => setTerminalName(response.data.name))
          .catch(err => console.error('Failed to fetch terminal name', err));
      }
      if (vehicle.ship_id) {
        api.get(`/ships/${vehicle.ship_id}`)
          .then(response => setShipName(response.data.name))
          .catch(err => console.error('Failed to fetch ship name', err));
      }
    }
  }, [vehicle]);

  const handleStatusChange = async (newStatus: string) => {
    if (vehicle && newStatus !== vehicle.status) {
      await updateStatus(newStatus);
    }
  };

  const handleDelete = async () => {
    if (!vehicleId) return;
    await deleteVehicle(vehicleId);
    navigate('/vehicles');
  };

  if (!vehicleId || isNaN(vehicleId)) {
    return (
      <Box sx={{ p: 3 }}>
        <ErrorAlert error="Invalid vehicle ID" />
        <Button component={RouterLink} to="/vehicles" sx={{ mt: 2 }} startIcon={<ArrowBackIcon />}>
          Back to Vehicles
        </Button>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <ErrorAlert error={error} />
        <Button component={RouterLink} to="/vehicles" sx={{ mt: 2 }} startIcon={<ArrowBackIcon />}>
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
        <Box>
          <Typography variant="h4" gutterBottom>
            {vehicle.make} {vehicle.model} ({vehicle.year})
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            VIN: {vehicle.vin}
          </Typography>
        </Box>
        <Button component={RouterLink} to="/vehicles" variant="outlined" startIcon={<ArrowBackIcon />}>
          Back to List
        </Button>
      </Box>

      <Paper>
        <Tabs value={tab} onChange={(_, v: number) => setTab(v)} indicatorColor="primary" textColor="primary" centered>
          <Tab icon={<InfoIcon />} label="Details" />
          <Tab icon={<DescriptionIcon />} label="Documents" />
          {user?.role === 'admin' && <Tab icon={<AttachMoneyIcon />} label="Financials" />}
        </Tabs>
        <Divider />

        <TabPanel value={tab} index={0}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardHeader title="Vehicle Information" />
                <CardContent>
                  <Typography><strong>Make:</strong> {vehicle.make}</Typography>
                  <Typography><strong>Model:</strong> {vehicle.model}</Typography>
                  <Typography><strong>Year:</strong> {vehicle.year}</Typography>
                  <Typography><strong>Color:</strong> {vehicle.color ?? '—'}</Typography>
                  <Typography>
                    <strong>Service Type:</strong>{' '}
                    {vehicle.clearance_type === 'FULL'
                      ? 'Full Vehicle Clearance'
                      : vehicle.clearance_type === 'RELEASE_GATE'
                      ? 'Release & Gate Only'
                      : '—'}
                  </Typography>
                  {user?.role === 'admin' && (
                    <Box mt={2}>
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => setDeleteConfirmOpen(true)}
                        disabled={isDeleting}
                      >
                        Delete Vehicle
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardHeader title="Shipping & Status" />
                <CardContent>
                  <Typography><strong>Ship:</strong> {shipName || '—'}</Typography>
                  <Typography><strong>Terminal:</strong> {terminalName || '—'}</Typography>
                   <Typography>
                    <strong>Arrival Date:</strong>{' '}
                    {vehicle.arrival_date ? new Date(vehicle.arrival_date).toLocaleDateString() : '—'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Typography><strong>Status:</strong></Typography>
                    {user?.role && ['admin', 'staff'].includes(user.role) ? (
                      <FormControl sx={{ ml: 1, minWidth: 120 }} size="small">
                        <Select
                          value={vehicle.status}
                          onChange={(e: { target: { value: string } }) => handleStatusChange(e.target.value)}
                          disabled={isUpdatingStatus}
                        >
                          <MenuItem value="In Transit">In Transit</MenuItem>
                          <MenuItem value="Clearing">Clearing</MenuItem>
                          <MenuItem value="Done">Done</MenuItem>
                        </Select>
                      </FormControl>
                    ) : (
                      <Chip label={vehicle.status} color={getStatusChipColor(vehicle.status || 'UNKNOWN')} sx={{ ml: 1 }} />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={12}>
              <CostBreakdown vehicle={vehicle} />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tab} index={1}>
          {vehicleId && <DocumentsTab vehicleId={vehicleId} />}
        </TabPanel>

        {user?.role === 'admin' && (
          <TabPanel value={tab} index={2}>
            {vehicleId && <FinancialsTab vehicleId={vehicleId} />}
          </TabPanel>
        )}
      </Paper>

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete this vehicle? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}