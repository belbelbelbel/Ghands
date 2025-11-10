import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../services/api';
import { UpdateProfilePayload } from '../types';

const PROFILE_QUERY_KEY = 'profile';

export function useProfile(userId: string) {
  return useQuery({
    queryKey: [PROFILE_QUERY_KEY, userId],
    queryFn: () => profileService.getProfile(userId),
    enabled: !!userId,
  });
}

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
      queryClient.invalidateQueries({
        queryKey: [PROFILE_QUERY_KEY, variables.userId],
      });
    },
  });
}



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
      queryClient.invalidateQueries({
        queryKey: [PROFILE_QUERY_KEY, variables.userId],
      });
    },
  });
}

