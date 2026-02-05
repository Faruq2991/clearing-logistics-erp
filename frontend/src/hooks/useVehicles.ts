import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehiclesApi } from '../services/api';
import { getErrorMessage } from '../services/errorHandler';
import type { VehicleCreate, VehicleResponse } from '../types';

export function useVehicles(skip = 0, limit = 100) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['vehicles', skip, limit],
    queryFn: () => vehiclesApi.list({ skip, limit }).then((r) => r.data),
  });

  return { data, isLoading, error: error ? getErrorMessage(error) : null };
}

export function useVehicle(id: number | null) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => vehiclesApi.get(id!).then((r) => r.data) as Promise<VehicleResponse>,
    enabled: !!id,
  });

  return { data, isLoading, error: error ? getErrorMessage(error) : null };
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: (data: VehicleCreate) => vehiclesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
    onError: (err) => {
      console.error("Error creating vehicle:", getErrorMessage(err));
    },
  });

  return {
    mutateAsync,
    isPending,
    error: error ? getErrorMessage(error) : null,
  };
}
