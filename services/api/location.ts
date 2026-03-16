import { AuthError } from '../../utils/errors';
import { authService as authServiceInstance } from '../authService';
import { apiClient, extractResponseData } from './client';
import type { LocationSearchResult, LocationDetails, SavedLocation, UpdateLocationPayload } from './types';

export type { LocationSearchResult, LocationDetails, SavedLocation, UpdateLocationPayload };

export const locationService = {
  searchLocations: async (query: string): Promise<LocationSearchResult[]> => {
    if (query.length < 2) return [];
    try {
      const response = await apiClient.get<any>(
        `/api/user/location/search?query=${encodeURIComponent(query)}`,
        { skipAuth: true }
      );
      return extractResponseData<LocationSearchResult[]>(response) || [];
    } catch (error: any) {
      throw error;
    }
  },

  getLocationDetails: async (placeId: string): Promise<LocationDetails> => {
    try {
      const response = await apiClient.get<any>(
        `/api/user/location/details?placeId=${encodeURIComponent(placeId)}`,
        { skipAuth: true }
      );
      const locationData = extractResponseData<LocationDetails>(response);
      if (!locationData) throw new Error('Invalid location details response from API');
      if (!locationData.placeId) locationData.placeId = placeId;
      return locationData;
    } catch (error) {
      throw error;
    }
  },

  getCurrentLocation: async (latitude: number, longitude: number): Promise<LocationDetails> => {
    try {
      const response = await apiClient.get<any>(
        `/api/user/location/current?latitude=${latitude}&longitude=${longitude}`,
        { skipAuth: true }
      );
      const locationData = extractResponseData<any>(response);
      const address = locationData?.formattedAddress || locationData?.fullAddress || locationData?.address ||
        locationData?.placeName || locationData?.location?.formattedAddress || locationData?.location?.fullAddress ||
        locationData?.location?.address || locationData?.data?.formattedAddress || locationData?.data?.fullAddress ||
        locationData?.data?.address || null;
      const city = locationData?.city || locationData?.location?.city || locationData?.data?.city || '';
      const state = locationData?.state || locationData?.location?.state || locationData?.data?.state || '';
      const country = locationData?.country || locationData?.location?.country || locationData?.data?.country || '';
      let formattedAddress = address;
      if (!formattedAddress && (city || state || country)) {
        formattedAddress = [city, state, country].filter(Boolean).join(', ');
      }
      if (!formattedAddress) {
        try {
          const { Location } = await import('expo-location');
          const reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (reverseGeocode?.length) {
            const g = reverseGeocode[0];
            formattedAddress = [g.streetNumber, g.street, g.city, g.region, g.country].filter(Boolean).join(', ');
            return {
              placeId: `lat_${latitude}_${longitude}`,
              formattedAddress,
              latitude,
              longitude,
              city: city || g.city || '',
              state: state || g.region || '',
              country: country || g.country || '',
              address: formattedAddress,
            };
          }
        } catch { /* fallback below */ }
        formattedAddress = `Location at ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      }
      return {
        placeId: locationData?.placeId || locationData?.location?.placeId || locationData?.data?.placeId || `lat_${latitude}_${longitude}`,
        formattedAddress,
        latitude: locationData?.latitude || locationData?.location?.latitude || locationData?.data?.latitude || latitude,
        longitude: locationData?.longitude || locationData?.location?.longitude || locationData?.data?.longitude || longitude,
        city,
        state,
        country,
        address: formattedAddress,
      };
    } catch (error: any) {
      try {
        const { Location } = await import('expo-location');
        const reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (reverseGeocode?.length) {
          const g = reverseGeocode[0];
          const formattedAddress = [g.streetNumber, g.street, g.city, g.region, g.country].filter(Boolean).join(', ');
          return {
            placeId: `lat_${latitude}_${longitude}`,
            formattedAddress,
            latitude,
            longitude,
            city: g.city || '',
            state: g.region || '',
            country: g.country || '',
            address: formattedAddress,
          };
        }
      } catch { /* ignore */ }
      throw error;
    }
  },

  saveUserLocation: async (
    userId: number,
    payload: UpdateLocationPayload
  ): Promise<SavedLocation> => {
    try {
      const token = await authServiceInstance.getAuthToken();
      if (!token) throw new AuthError('Authentication required. Please sign in again.');
      const hasPlaceId = !!payload.placeId;
      const hasCoords = payload.latitude != null && payload.longitude != null;
      if (!hasPlaceId && !hasCoords) {
        throw new Error('Either placeId or latitude/longitude must be provided');
      }
      const body: Record<string, string | number> = {};
      if (payload.placeId) body.placeId = payload.placeId;
      if (payload.address != null) body.address = payload.address;
      if (payload.formattedAddress != null) body.formattedAddress = payload.formattedAddress;
      if (payload.latitude != null) body.latitude = payload.latitude;
      if (payload.longitude != null) body.longitude = payload.longitude;
      if (payload.city != null) body.city = payload.city;
      if (payload.state != null) body.state = payload.state;
      if (payload.country != null) body.country = payload.country;
      const response = await apiClient.post<any>('/api/user/update-location', body);
      const location = response?.data?.location || response?.data?.data?.location || response?.location;
      if (!location) throw new Error('Invalid response from server: location data not found');
      return location;
    } catch (error: any) {
      if (error instanceof AuthError) throw error;
      const status = error?.status || 500;
      if (status === 401) throw new AuthError('Your session has expired. Please sign in again.');
      let errorMessage = error.message || 'Failed to save location';
      const extractedError = error?.details?.data?.error || error?.details?.error || error?.details?.message || error.message;
      if (extractedError && typeof extractedError === 'string') {
        if (extractedError.toLowerCase().includes('app client') || extractedError.toLowerCase().includes('appclient')) {
          errorMessage = 'Your account needs to be set up properly. Please contact support or try signing out and back in.';
        } else if (extractedError.toLowerCase().includes('property') && extractedError.toLowerCase().includes('does not exist')) {
          errorMessage = 'Account setup incomplete. Please complete your profile setup first.';
        }
      }
      if (status === 500 && !errorMessage.includes('Account setup') && !errorMessage.includes('contact support')) {
        errorMessage = extractedError && typeof extractedError === 'string' && extractedError !== 'Request failed with status 500'
          ? `Server error: ${extractedError}` : 'Server error: The server encountered an internal error. Please try again later.';
      } else if (status === 400 && !errorMessage.includes('Account setup') && !errorMessage.includes('contact support')) {
        errorMessage = extractedError || 'Invalid request. Please check your location data.';
      }
      const enhancedError = new Error(errorMessage) as any;
      enhancedError.status = status;
      enhancedError.statusText = error?.statusText || 'Internal Server Error';
      enhancedError.details = error?.details;
      throw enhancedError;
    }
  },

  getUserLocation: async (userId: number): Promise<SavedLocation | null> => {
    try {
      const response = await apiClient.get<any>('/api/user/location');
      let locationData: any = null;
      if (response?.data?.data) locationData = response.data.data;
      else if (response?.data) locationData = response.data;
      else if (response?.location) locationData = response.location;
      if (!locationData) return null;
      const parsedLocation: SavedLocation = {
        placeId: locationData.placeId || '',
        placeName: locationData.placeName || locationData.city || '',
        fullAddress: locationData.fullAddress || locationData.address || '',
        address: locationData.address || locationData.fullAddress?.split(',')[0] || '',
        city: locationData.city || '',
        state: locationData.state || '',
        country: locationData.country || '',
        latitude: typeof locationData.latitude === 'string' ? parseFloat(locationData.latitude) : (locationData.latitude || 0),
        longitude: typeof locationData.longitude === 'string' ? parseFloat(locationData.longitude) : (locationData.longitude || 0),
      };
      if (!parsedLocation.latitude || !parsedLocation.longitude || isNaN(parsedLocation.latitude) || isNaN(parsedLocation.longitude)) {
        return null;
      }
      return parsedLocation;
    } catch (error: any) {
      if (error instanceof AuthError) throw error;
      if (error?.status === 401) throw new AuthError('Your session has expired. Please sign in again.');
      if (error.message?.includes('not set') || error.message?.includes('404')) return null;
      throw error;
    }
  },
};
