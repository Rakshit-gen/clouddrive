import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getStorageUsage } from '@/api/storage';

export function useStorage() {
  return useQuery({
    queryKey: ['storage'],
    queryFn: getStorageUsage,
  });
}

export function useInvalidateStorage() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['storage'] });
}
