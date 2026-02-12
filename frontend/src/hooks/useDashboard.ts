import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { DashboardStats } from '../types';

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/stats');
      return data;
    },
  });
}
