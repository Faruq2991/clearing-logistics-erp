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
  InputLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useState } from 'react';
import { useVehicle, useUpdateVehicleStatus, useDeleteVehicle } from '../hooks/useVehicles';
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

  const handleStatusChange = async (newStatus: string) => {
    if (vehicle && newStatus !== vehicle.status) {
      await updateStatus(newStatus);
    }
  };

  const handleDelete = async () => {
    if (!vehicleId) return;
    try {
      await deleteVehicle(vehicleId);
      navigate('/vehicles');
    } catch (e) {
      // Error is already logged in the hook
    }
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
        <Tabs value={tab} onChange={(_, v) => setTab(v)} indicatorColor="primary" textColor="primary" centered>
          <Tab icon={<InfoIcon />} label="Details" />
          <Tab icon={<DescriptionIcon />} label="Documents" />
          {user?.role === 'admin' && <Tab icon={<AttachMoneyIcon />} label="Financials" />}
        </Tabs>
        <Divider />

        <TabPanel value={tab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Vehicle Information" />
                <CardContent>
                  <Typography><strong>Make:</strong> {vehicle.make}</Typography>
                  <Typography><strong>Model:</strong> {vehicle.model}</Typography>
                  <Typography><strong>Year:</strong> {vehicle.year}</Typography>
                  <Typography><strong>Color:</strong> {vehicle.color ?? '—'}</Typography>
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
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Shipping & Status" />
                <CardContent>
                  <Typography><strong>Ship:</strong> {vehicle.ship_name ?? '—'}</Typography>
                  <Typography><strong>Terminal:</strong> {vehicle.terminal ?? '—'}</Typography>
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
                          onChange={(e) => handleStatusChange(e.target.value)}
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