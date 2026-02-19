import { useQuery } from '@tanstack/react-query';
import { estimateApi } from '../services/api';
import { getErrorMessage } from '../services/errorHandler';

export function useEstimate(make: string, model: string, year: number, terminal?: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['estimate', make, model, year, terminal],
    queryFn: () => estimateApi.search(make, model, year, terminal).then((r) => r.data),
    enabled: !!(make && model && year),
  });

  return { data, isLoading, error: error ? getErrorMessage(error) : null };
}
