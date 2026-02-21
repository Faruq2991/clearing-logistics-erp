import { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Chip, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import Grid from '@mui/material/Grid';
import { DataGrid, type GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Add as AddIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { useVehicles } from '../hooks/useVehicles';
import type { VehicleResponse } from '../types';
import ErrorAlert from '../components/ErrorAlert';

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

const columns: GridColDef[] = [
  { field: 'vin', headerName: 'VIN', flex: 1.5 },
  { field: 'make', headerName: 'Make', flex: 1 },
  { field: 'model', headerName: 'Model', flex: 1 },
  { field: 'year', headerName: 'Year', width: 100 },
  {
    field: 'status',
    headerName: 'Status',
    flex: 1,
    renderCell: (params) => (
      <Chip
        label={params.value}
        color={getStatusChipColor(params.value)}
        size="small"
      />
    ),
  },
  {
    field: 'actions',
    type: 'actions',
    headerName: 'Actions',
    width: 100,
    getActions: (params) => [
      <RouterLink to={`/vehicles/${params.id}`} style={{ textDecoration: 'none' }}>
        <GridActionsCellItem
          icon={<ViewIcon />}
          label="View"
        />
      </RouterLink>
    ],
  },
];

export default function VehiclesPage() {
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState('ALL');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);

  const { data, isLoading, error } = useVehicles(
    paginationModel.page * paginationModel.pageSize,
    paginationModel.pageSize,
    debouncedSearchTerm,
    status
  );

  const vehicles = (data as VehicleResponse[] | undefined) ?? [];
  const navigate = useNavigate();

  const handleRowClick = (params: { id: any; }) => {
    navigate(`/vehicles/${params.id}`);
  };

  const handleClear = () => {
    setSearchTerm('');
    setStatus('ALL');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Vehicles</Typography>
        <Button
          component={RouterLink}
          to="/vehicles/new"
          variant="contained"
          startIcon={<AddIcon />}
        >
          Add Vehicle
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 5 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by VIN or Make..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 5 }}>
          <FormControl fullWidth>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              id="status-filter"
              value={status}
              label="Status"
              onChange={(e) => setStatus(e.target.value)}
            >
              <MenuItem value="ALL">All</MenuItem>
              <MenuItem value="In Transit">In Transit</MenuItem>
              <MenuItem value="Clearing">Clearing</MenuItem>
              <MenuItem value="Done">Done</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 2 }}>
          <Button
            variant="outlined"
            onClick={handleClear}
            fullWidth
            sx={{ height: '56px' }}
          >
            CLEAR
          </Button>
        </Grid>
      </Grid>

      <ErrorAlert error={error} />

      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={vehicles}
          columns={columns}
          loading={isLoading}
          pagination
          paginationMode="server"
          rowCount={-1}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[5, 10, 20]}
          onRowClick={handleRowClick}
          sx={{
            '& .MuiDataGrid-cell:hover': {
              cursor: 'pointer',
            },
          }}
        />
      </Box>
    </Box>
  );
}
