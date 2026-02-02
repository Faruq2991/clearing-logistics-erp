import { useQuery } from '@tanstack/react-query';
import { estimateApi } from '../services/api';

export function useEstimate(make: string, model: string, year: number) {
  return useQuery({
    queryKey: ['estimate', make, model, year],
    queryFn: () => estimateApi.search(make, model, year).then((r) => r.data),
    enabled: !!(make && model && year),
  });
}
