import { UpdateProfilePayload, UserProfile } from '../../types';
import { apiClient, extractResponseData } from './client';

export const profileService = {
  getCurrentUserProfile: async (): Promise<any> => {
    try {
      const response = await apiClient.get<any>('/api/user/profile');
      return extractResponseData<any>(response);
    } catch (error) {
      throw error;
    }
  },

  getProfile: async (userId: string): Promise<UserProfile> => {
    return apiClient.get<UserProfile>(`/users/${userId}/profile`);
  },

  updateProfile: async (userId: string, payload: UpdateProfilePayload): Promise<UserProfile> => {
    return apiClient.put<UserProfile>(`/users/${userId}/profile`, payload);
  },

  /** Prefer when backend supports updating the authenticated user without a path id. */
  updateCurrentUserProfile: async (payload: UpdateProfilePayload): Promise<any> => {
    const response = await apiClient.put<any>('/api/user/profile', payload);
    return extractResponseData<any>(response);
  },

  uploadProfileImage: async (userId: string, imageUri: string): Promise<{ imageUrl: string }> => {
    return Promise.resolve({ imageUrl: imageUri });
  },
};
