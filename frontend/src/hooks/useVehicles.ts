import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehiclesApi } from '../services/api';
import type { VehicleCreate, VehicleResponse } from '../types';

export function useVehicles(skip = 0, limit = 100) {
  return useQuery({
    queryKey: ['vehicles', skip, limit],
    queryFn: () => vehiclesApi.list({ skip, limit }).then((r) => r.data),
  });
}

export function useVehicle(id: number | null) {
  return useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => vehiclesApi.get(id!).then((r) => r.data) as Promise<VehicleResponse>,
    enabled: !!id,
  });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: VehicleCreate) => vehiclesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  });
}
