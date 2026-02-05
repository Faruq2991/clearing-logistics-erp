import { useQuery } from '@tanstack/react-query';
import { estimateApi } from '../services/api';
import { getErrorMessage } from '../services/errorHandler';

export function useEstimate(make: string, model: string, year: number) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['estimate', make, model, year],
    queryFn: () => estimateApi.search(make, model, year).then((r) => r.data),
    enabled: !!(make && model && year),
  });

  return { data, isLoading, error: error ? getErrorMessage(error) : null };
}
