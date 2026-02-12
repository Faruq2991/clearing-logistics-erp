import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Activity } from '../types';

export function useActivities(limit: number = 20) {
  return useQuery<Activity[]>({
    queryKey: ['activities', limit],
    queryFn: async () => {
      const { data } = await api.get('/activities', { params: { limit } });
      return data;
    },
  });
}
