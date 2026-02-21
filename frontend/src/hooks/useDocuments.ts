import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '../services/api';
import type { DocumentResponse } from '../types';

// Hook to fetch the list of documents for a vehicle
export function useDocuments(vehicleId: number) {
  return useQuery<DocumentResponse[]>({
    queryKey: ['documents', vehicleId],
    queryFn: async () => {
      const { data } = await documentsApi.list(vehicleId);
      return data;
    },
    enabled: !!vehicleId, // Only run the query if vehicleId is available
  });
}

// Hook to upload a new document
export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vehicleId, formData }: { vehicleId: number; formData: FormData }) =>
      documentsApi.upload(vehicleId, formData),
    onSuccess: (_data, variables) => {
      // Invalidate and refetch the documents list for the specific vehicle
      queryClient.invalidateQueries({ queryKey: ['documents', variables.vehicleId] });
    },
  });
}

// Hook to delete a document
export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: number) => documentsApi.delete(documentId),
    onSuccess: (_data, _documentId) => {
      // This is tricky because we don't know the vehicleId from the documentId here.
      // A global invalidation is simpler but less efficient.
      // For a better UX, the onSuccess callback in the component could invalidate.
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useDocumentVersions(documentId: number) {
  return useQuery<DocumentResponse[]>({
    queryKey: ['documentVersions', documentId],
    queryFn: async () => {
      const { data } = await documentsApi.getVersions(documentId);
      return data;
    },
    enabled: !!documentId,
  });
}

