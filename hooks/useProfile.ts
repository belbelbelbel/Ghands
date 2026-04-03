import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileService } from '../services/api';
import { authService } from '../services/authService';
import { UpdateProfilePayload, UserProfile } from '../types';

const PROFILE_QUERY_KEY = 'profile';

/** Map `/api/user/profile` (and common wrappers) into {@link UserProfile} for forms. */
export function mapApiProfileToUserProfile(raw: unknown): UserProfile {
  if (!raw || typeof raw !== 'object') {
    return { name: '', email: '', phone: '' };
  }
  const r = raw as Record<string, unknown>;
  const d = (r.data && typeof r.data === 'object' ? r.data : r) as Record<string, unknown>;

  const firstName = String(d.firstName ?? d.first_name ?? '').trim();
  const lastName = String(d.lastName ?? d.last_name ?? '').trim();
  const nameFromParts = firstName || lastName ? `${firstName} ${lastName}`.trim() : '';
  const name = String(d.name ?? d.fullName ?? nameFromParts ?? '').trim();

  const email = String(d.email ?? d.userEmail ?? '').trim();
  const phone = String(d.phone ?? d.phoneNumber ?? d.mobile ?? d.telephone ?? '').trim();
  const profileImageUri =
    (d.profileImageUri ??
      d.profileImage ??
      d.avatarUrl ??
      d.imageUrl ??
      d.photoUrl) as string | undefined;

  return {
    name,
    email,
    phone,
    profileImageUri: typeof profileImageUri === 'string' ? profileImageUri : undefined,
  };
}

/** Logged-in user profile from `GET /api/user/profile` — avoids fake `/users/:id/profile` slowness. */
export function useCurrentUserProfile() {
  return useQuery({
    queryKey: [PROFILE_QUERY_KEY, 'current'],
    queryFn: async () => {
      const raw = await profileService.getCurrentUserProfile();
      return mapApiProfileToUserProfile(raw);
    },
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
}

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
    mutationFn: async ({
      userId,
      payload,
    }: {
      userId: string;
      payload: UpdateProfilePayload;
    }) => {
      try {
        return await profileService.updateCurrentUserProfile(payload);
      } catch {
        const id = await authService.getUserId();
        if (!id) throw new Error('Could not update profile');
        return profileService.updateProfile(String(id), payload);
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [PROFILE_QUERY_KEY, 'current'] });
      if (variables.userId && variables.userId !== 'current') {
        queryClient.invalidateQueries({
          queryKey: [PROFILE_QUERY_KEY, variables.userId],
        });
      }
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

