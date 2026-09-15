import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteFile,
  listFiles,
  listShared,
  renameFile,
  searchFiles,
  shareFile,
} from '@/api/files';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

export function useFileList(searchQuery: string) {
  const trimmed = useDebouncedValue(searchQuery.trim(), 300);
  return useQuery({
    queryKey: ['files', 'list', trimmed],
    queryFn: () => (trimmed ? searchFiles(trimmed) : listFiles()),
    placeholderData: (prev) => prev,
  });
}

export function useSharedFiles() {
  return useQuery({
    queryKey: ['files', 'shared'],
    queryFn: listShared,
  });
}

export function useRenameFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameFile(id, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['files'] }),
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['storage'] });
    },
  });
}

export function useShareFile() {
  return useMutation({
    mutationFn: ({ id, email }: { id: string; email: string }) => shareFile(id, email),
  });
}
