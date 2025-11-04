import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../services/api';
import { UpdateProfilePayload } from '../types';

const PROFILE_QUERY_KEY = 'profile';

/**
 * Hook to fetch user profile
 */
export function useProfile(userId: string) {
  return useQuery({
    queryKey: [PROFILE_QUERY_KEY, userId],
    queryFn: () => profileService.getProfile(userId),
    enabled: !!userId,
  });
}

/**
 * Hook to update user profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string;
      payload: UpdateProfilePayload;
    }) => profileService.updateProfile(userId, payload),
    onSuccess: (data, variables) => {
      // Invalidate and refetch profile data
      queryClient.invalidateQueries({
        queryKey: [PROFILE_QUERY_KEY, variables.userId],
      });
    },
  });
}

/**
 * Hook to upload profile image
 */
export function useUploadProfileImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      imageUri,
    }: {
      userId: string;
      imageUri: string;
    }) => profileService.uploadProfileImage(userId, imageUri),
    onSuccess: (_, variables) => {
      // Invalidate profile queries to refetch with new image
      queryClient.invalidateQueries({
        queryKey: [PROFILE_QUERY_KEY, variables.userId],
      });
    },
  });
}

