import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMe, logout as logoutRequest } from '@/api/auth';

export function useAuth() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    staleTime: Infinity,
    retry: false,
  });

  async function logout() {
    await logoutRequest();
    queryClient.setQueryData(['me'], { user: null });
    queryClient.clear();
  }

  return { user: data?.user ?? null, isLoading, logout };
}
