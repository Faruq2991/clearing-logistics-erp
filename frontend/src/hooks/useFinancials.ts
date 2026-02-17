import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financialsApi } from '../services/api';
import { getErrorMessage } from '../services/errorHandler';
import type { PaymentCreate, Financials, FinancialsCreate, FinancialsUpdate } from '../types';
import { AxiosError } from 'axios';

export function useFinancials(vehicleId: number | null) {
  const { data, isLoading, error, isSuccess } = useQuery<Financials | null>({
    queryKey: ['financials', vehicleId],
    queryFn: async () => {
      try {
        const response = await financialsApi.get(vehicleId!);
        return response.data;
      } catch (error) {
        if ((error as AxiosError).response?.status === 404) {
          return null; // Return null if not found, don't treat as an error
        }
        throw error; // Re-throw other errors
      }
    },
    enabled: !!vehicleId,
    retry: (failureCount, error) => {
        if ((error as AxiosError).response?.status === 404) {
            return false; // Don't retry on 404
        }
        return failureCount < 3;
    },
  });

  return { data, isLoading, error: error ? getErrorMessage(error) : null, isSuccess };
}

export function useCreateFinancials(vehicleId: number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: FinancialsCreate) => financialsApi.create(vehicleId, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['financials', vehicleId] });
        },
    });
}

export function useUpdateFinancials(vehicleId: number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: FinancialsUpdate) => financialsApi.update(vehicleId, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['financials', vehicleId] });
        },
    });
}

export function usePayments(vehicleId: number | null, financialsEnabled: boolean) {
    const { data, isLoading, error } = useQuery({
      queryKey: ['payments', vehicleId],
      queryFn: () => financialsApi.listPayments(vehicleId!).then((r) => r.data),
      enabled: !!vehicleId && financialsEnabled, // Only fetch if financials exist
    });
  
    return { data, isLoading, error: error ? getErrorMessage(error) : null };
}

export function useRecordPayment(vehicleId: number) {
  const qc = useQueryClient();
  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: (data: PaymentCreate) => financialsApi.recordPayment(vehicleId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['financials', vehicleId] });
      qc.invalidateQueries({ queryKey: ['payments', vehicleId] });
    },
    onError: (err) => {
      console.error("Error recording payment:", getErrorMessage(err));
    },
  });

  return {
    mutateAsync,
    isPending,
    error: error ? getErrorMessage(error) : null,
  };
}
