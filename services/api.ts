import AsyncStorage from '@react-native-async-storage/async-storage';
import { UpdateProfilePayload, UserProfile } from '../types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://bamibuildit-backend-v1.onrender.com';
const AUTH_TOKEN_KEY = '@ghands:auth_token';
const REFRESH_TOKEN_KEY = '@ghands:refresh_token';
const USER_ID_KEY = '@ghands:user_id';

interface RequestConfig extends RequestInit {
  retries?: number;
  retryDelay?: number;
  skipAuth?: boolean;
}

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  retryableStatusCodes?: number[];
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

class ApiClient {
  private baseUrl: string;
  private requestInterceptors: Array<(config: RequestConfig) => RequestConfig | Promise<RequestConfig>> = [];
  private responseInterceptors: Array<(response: Response) => Response | Promise<Response>> = [];
  private errorInterceptors: Array<(error: Error) => Error | Promise<Error>> = [];

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.setupDefaultInterceptors();
  }

  /**
   * Setup default interceptors for authentication and error handling
   */
  private setupDefaultInterceptors() {
    // Request interceptor: Add auth token
    this.addRequestInterceptor(async (config) => {
      if (!config.skipAuth) {
        const token = await this.getAuthToken();
        if (token) {
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${token}`,
          };
        }
      }
      return config;
    });

    // Response interceptor: Handle token refresh
    this.addResponseInterceptor(async (response) => {
      if (response.status === 401) {
        // Try to refresh token
        const refreshed = await this.refreshAuthToken();
        if (refreshed) {
          // Retry the original request
          return response;
        }
      }
      return response;
    });

    // Error interceptor: Log errors
    this.addErrorInterceptor((error) => {
      if (__DEV__) {
        console.error('API Error:', error);
      }
      return error;
    });
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(
    interceptor: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>
  ) {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(
    interceptor: (response: Response) => Response | Promise<Response>
  ) {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Add error interceptor
   */
  addErrorInterceptor(interceptor: (error: Error) => Error | Promise<Error>) {
    this.errorInterceptors.push(interceptor);
  }

  /**
   * Get auth token from storage
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Set auth token in storage
   */
  async setAuthToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Error setting auth token:', error);
    }
  }

  /**
   * Get user ID from storage
   */
  async getUserId(): Promise<number | null> {
    try {
      const userId = await AsyncStorage.getItem(USER_ID_KEY);
      return userId ? parseInt(userId, 10) : null;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  }

  /**
   * Set user ID in storage
   */
  async setUserId(userId: number): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_ID_KEY, userId.toString());
    } catch (error) {
      console.error('Error setting user ID:', error);
    }
  }

  /**
   * Clear auth tokens
   */
  async clearAuthTokens(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_ID_KEY]);
    } catch (error) {
      console.error('Error clearing auth tokens:', error);
    }
  }

  /**
   * Refresh auth token
   */
  private async refreshAuthToken(): Promise<boolean> {
    try {
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        return false;
      }

      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        await this.setAuthToken(data.accessToken);
        if (data.refreshToken) {
          await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
        }
        return true;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
    }
    return false;
  }

  /**
   * Apply request interceptors
   */
  private async applyRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let processedConfig = config;
    for (const interceptor of this.requestInterceptors) {
      processedConfig = await interceptor(processedConfig);
    }
    return processedConfig;
  }

  /**
   * Apply response interceptors
   */
  private async applyResponseInterceptors(response: Response): Promise<Response> {
    let processedResponse = response;
    for (const interceptor of this.responseInterceptors) {
      processedResponse = await interceptor(processedResponse);
    }
    return processedResponse;
  }

  /**
   * Apply error interceptors
   */
  private async applyErrorInterceptors(error: Error): Promise<Error> {
    let processedError = error;
    for (const interceptor of this.errorInterceptors) {
      processedError = await interceptor(processedError);
    }
    return processedError;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Retry request with exponential backoff
   */
  private async retryRequest<T>(
    url: string,
    config: RequestConfig,
    retries: number,
    retryDelay: number
  ): Promise<T> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, config);
        
      if (!response.ok) {
        const statusCode = response.status;
        const isRetryable = DEFAULT_RETRY_OPTIONS.retryableStatusCodes?.includes(statusCode);
        
        if (isRetryable && attempt < retries) {
          const delay = retryDelay * Math.pow(2, attempt); // Exponential backoff
          await this.sleep(delay);
          continue;
        }
        
        // Try to extract error message from response
        // API returns errors as: { "error": "Error message" }
        let errorMessage = `Request failed with status ${statusCode}`;
        let errorDetails: any = null;
        
        try {
          const errorData = await response.json();
          errorDetails = errorData;
          // API documentation shows error format: { "error": "Error message" }
          // API documentation shows error format: { "error": "Error message" }
          // Check error field first (API standard), then fallback to other formats
          errorMessage = errorData.error || errorData.message || errorData.errorMessage || errorData.data?.error || errorData.data?.message || response.statusText || errorMessage;
        } catch {
          // If JSON parsing fails, try to get text
          try {
            const text = await response.text();
            if (text && text.length < 500) { // Only use text if it's reasonable length
              errorMessage = text;
            }
          } catch {
            errorMessage = response.statusText || errorMessage;
          }
        }
        
        // Create error with status code and details
        const error = new Error(errorMessage) as any;
        error.status = statusCode;
        error.statusText = response.statusText;
        error.details = errorDetails;
        throw error;
      }

        const processedResponse = await this.applyResponseInterceptors(response);
        return processedResponse.json();
      } catch (error) {
        if (attempt === retries) {
          const processedError = await this.applyErrorInterceptors(
            error instanceof Error ? error : new Error('Network error occurred')
          );
          throw processedError;
        }
        
        const delay = retryDelay * Math.pow(2, attempt);
        await this.sleep(delay);
      }
    }
    
    throw new Error('Request failed after retries');
  }

  /**
   * Main request method with interceptors and retry logic
   */
  private async request<T>(
    endpoint: string,
    options: RequestConfig = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultConfig: RequestConfig = {
      headers: {
        'Content-Type': 'application/json',
      },
      retries: DEFAULT_RETRY_OPTIONS.maxRetries,
      retryDelay: DEFAULT_RETRY_OPTIONS.retryDelay,
      ...options,
    };

    // Apply request interceptors
    const config = await this.applyRequestInterceptors(defaultConfig);

    // Extract retry options
    const { retries = 0, retryDelay = 1000, ...fetchOptions } = config;

    // Make request with retry logic
    if (retries > 0) {
      return this.retryRequest<T>(url, fetchOptions as RequestInit, retries, retryDelay);
    }

    // Single request without retry
    try {
      const response = await fetch(url, fetchOptions as RequestInit);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: response.statusText || 'An error occurred',
        }));
        throw new Error(error.message || 'Request failed');
      }

      const processedResponse = await this.applyResponseInterceptors(response);
      return processedResponse.json();
    } catch (error) {
      const processedError = await this.applyErrorInterceptors(
        error instanceof Error ? error : new Error('Network error occurred')
      );
      throw processedError;
    }
  }

  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

export const profileService = {
  getProfile: async (userId: string): Promise<UserProfile> => {
    return apiClient.get<UserProfile>(`/users/${userId}/profile`);
  },

  updateProfile: async (
    userId: string,
    payload: UpdateProfilePayload
  ): Promise<UserProfile> => {
    return apiClient.put<UserProfile>(`/users/${userId}/profile`, payload);
  },

  uploadProfileImage: async (
    userId: string,
    imageUri: string
  ): Promise<{ imageUrl: string }> => {
    return Promise.resolve({ imageUrl: imageUri });
  },
};

// Location Service Types
export interface LocationSearchResult {
  placeId: string;
  placeName: string;
  fullAddress: string;
  address: string;
  mainText?: string;
  secondaryText?: string;
}

export interface LocationDetails {
  placeId: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  country: string;
  address: string;
}

export interface SavedLocation {
  placeId: string;
  placeName: string;
  fullAddress: string;
  address: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  country: string;
}

// Location Service
export const locationService = {
  /**
   * Search locations using autocomplete
   * GET /api/user/location/search?query=Lagos
   */
  searchLocations: async (query: string): Promise<LocationSearchResult[]> => {
    if (query.length < 2) {
      return [];
    }

    try {
      const response = await apiClient.get<{ data: LocationSearchResult[] }>(
        `/api/user/location/search?query=${encodeURIComponent(query)}`,
        { skipAuth: true }
      );
      return response.data || [];
    } catch (error: any) {
      console.error('Error searching locations:', error);
      
      // Check if it's a Google Maps API key error (backend configuration issue)
      const errorMessage = error.details?.data?.error || error.details?.error || error.message || '';
      const isGoogleApiKeyError = errorMessage.includes('API key') || errorMessage.includes('REQUEST_DENIED');
      
      if (isGoogleApiKeyError && __DEV__) {
        console.warn(
          '⚠️ Backend Google Maps API Key Missing:\n' +
          'The backend API needs to configure a Google Maps API key.\n' +
          'Location search will be disabled until backend is configured.\n' +
          'Users can still enter locations manually.'
        );
      }
      
      // Return empty array on error instead of throwing to allow graceful degradation
      // The UI can still work with manual entry
      if (__DEV__) {
        console.warn('Location search failed, returning empty results:', {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          details: error.details,
          query: query,
          isGoogleApiKeyError,
        });
      }
      return [];
    }
  },

  /**
   * Get full location details from placeId
   * GET /api/user/location/details?placeId=ChIJ...
   */
  getLocationDetails: async (placeId: string): Promise<LocationDetails> => {
    try {
      const response = await apiClient.get<{ data: LocationDetails }>(
        `/api/user/location/details?placeId=${encodeURIComponent(placeId)}`,
        { skipAuth: true }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting location details:', error);
      throw error;
    }
  },

  /**
   * Convert GPS coordinates to address (Reverse Geocoding)
   * GET /api/user/location/current?latitude=6.5244&longitude=3.3792
   */
  getCurrentLocation: async (
    latitude: number,
    longitude: number
  ): Promise<LocationDetails> => {
    try {
      const response = await apiClient.get<{ data: LocationDetails }>(
        `/api/user/location/current?latitude=${latitude}&longitude=${longitude}`,
        { skipAuth: true }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error getting current location:', error);
      // Create a fallback location details object if API fails
      // This allows the app to continue working even if reverse geocoding fails
      const fallback: LocationDetails = {
        placeId: `lat_${latitude}_lng_${longitude}`,
        formattedAddress: `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
        latitude,
        longitude,
        city: 'Unknown',
        state: 'Unknown',
        country: 'Unknown',
        address: `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
      };
      
      if (__DEV__) {
        console.warn('Reverse geocoding failed, using fallback:', {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
        });
      }
      
      return fallback;
    }
  },

  /**
   * Save or update user's location
   * POST /api/user/update-location
   */
  saveUserLocation: async (
    userId: number,
    options: { placeId?: string; latitude?: number; longitude?: number }
  ): Promise<SavedLocation> => {
    try {
      const body: { userId: number; placeId?: string; latitude?: number; longitude?: number } = {
        userId,
      };

      if (options.placeId) {
        body.placeId = options.placeId;
      } else if (options.latitude !== undefined && options.longitude !== undefined) {
        body.latitude = options.latitude;
        body.longitude = options.longitude;
      } else {
        throw new Error('Either placeId or latitude/longitude must be provided');
      }

      const response = await apiClient.post<{ data: { location: SavedLocation } }>(
        '/api/user/update-location',
        body
      );
      return response.data.location;
    } catch (error) {
      console.error('Error saving user location:', error);
      throw error;
    }
  },

  /**
   * Get user's saved location
   * GET /api/user/location?userId=1
   */
  getUserLocation: async (userId: number): Promise<SavedLocation | null> => {
    try {
      const response = await apiClient.get<{ data: SavedLocation }>(
        `/api/user/location?userId=${userId}`
      );
      return response.data;
    } catch (error: any) {
      // If location not set, API returns error
      if (error.message?.includes('not set') || error.message?.includes('404')) {
        return null;
      }
      console.error('Error getting user location:', error);
      throw error;
    }
  },
};

// Export auth methods
export const authService = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post<{ accessToken: string; refreshToken: string }>(
      '/auth/login',
      { email, password },
      { skipAuth: true }
    );
    await apiClient.setAuthToken(response.accessToken);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    return response;
  },
  logout: async () => {
    await apiClient.clearAuthTokens();
  },
  setAuthToken: (token: string) => apiClient.setAuthToken(token),
  clearAuthTokens: () => apiClient.clearAuthTokens(),
  getUserId: () => apiClient.getUserId(),
  setUserId: (userId: number) => apiClient.setUserId(userId),
};