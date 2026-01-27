import { UpdateProfilePayload, UserProfile } from '../types';
import { AuthError } from '../utils/errors';
import { extractUserIdFromToken } from '../utils/tokenUtils';
import { authService as authServiceInstance } from './authService';

// ============================================================================
// CONFIGURATION
// ============================================================================
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://bamibuildit-backend-v1.onrender.com';

// ============================================================================
// TYPES
// ============================================================================
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
  retryDelay: 1000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

// ============================================================================
// API CLIENT - Handles all HTTP requests with automatic token management
// ============================================================================
/**
 * ApiClient - HTTP transport layer only
 * 
 * Responsibilities:
 * - Send HTTP requests
 * - Attach headers (including auth token from AuthService)
 * - Handle retries & network errors
 * - Throw AuthError for authentication failures (UI handles navigation)
 * 
 * Does NOT handle:
 * - User identity (userId, companyId) → Use AuthService
 * - Navigation → UI layer handles this
 * - Business logic → Service layer handles this
 */
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
   * Automatically adds Bearer token to all requests (unless skipAuth is true)
   * 
   * Uses AuthService to get token - ApiClient doesn't manage tokens
   */
  private setupDefaultInterceptors() {
    // Add token to all requests automatically
    this.addRequestInterceptor(async (config) => {
      if (!config.skipAuth) {
        // Get token from AuthService (not managing it ourselves)
        const token = await authServiceInstance.getAuthToken();
        
        // If no token for protected route, throw AuthError immediately
        // This prevents making the request and showing confusing errors
        if (!token) {
          throw new AuthError('Your session has expired. Please sign in again.');
        }
        
        const existingHeaders = config.headers || {};
        const headersObj: Record<string, string> = existingHeaders instanceof Headers 
          ? Object.fromEntries(existingHeaders.entries())
          : { ...(existingHeaders as Record<string, string>) };
        
        const contentType = headersObj['Content-Type'] || headersObj['content-type'] || 'application/json';
        config.headers = {
          'Content-Type': contentType,
          Authorization: `Bearer ${token}`,
        } as HeadersInit;
      }
      return config;
    });

    // Handle 401 errors (try to refresh token)
    // If refresh fails, AuthError will be thrown in retryRequest
    this.addResponseInterceptor(async (response) => {
      if (response.status === 401) {
        const refreshed = await this.refreshAuthToken();
        if (!refreshed) {
          // Token refresh failed - clear tokens via AuthService
          await authServiceInstance.clearAuthTokens();
        }
      }
      return response;
    });
  }

  addRequestInterceptor(interceptor: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>) {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: (response: Response) => Response | Promise<Response>) {
    this.responseInterceptors.push(interceptor);
  }

  addErrorInterceptor(interceptor: (error: Error) => Error | Promise<Error>) {
    this.errorInterceptors.push(interceptor);
  }

  /**
   * Checks if an error is an authentication error (401 or token-related)
   * Used to determine when to throw AuthError
   */
  private isAuthError(error: any): boolean {
    // If it's already an AuthError, it's definitely an auth error
    if (error instanceof AuthError) {
      return true;
    }
    
    const status = error?.status || error?.response?.status;
    const message = (error?.message || error?.details?.data?.error || error?.details?.error || '').toLowerCase();
    
    return (
      status === 401 ||
      status === 403 ||
      message.includes('unauthorized') ||
      message.includes('invalid token') ||
      message.includes('token expired') ||
      message.includes('not authenticated') ||
      message.includes('no authorization token') ||
      message.includes('no token') ||
      message.includes('authentication required') ||
      message.includes('session expired') ||
      message.includes('authentication required')
    );
  }

  /**
   * Refresh authentication token
   * Uses AuthService for token management
   */
  private async refreshAuthToken(): Promise<boolean> {
    try {
      const refreshToken = await authServiceInstance.getRefreshToken();
      if (!refreshToken) {
        return false;
      }

      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        await authServiceInstance.setAuthToken(data.accessToken);
        if (data.refreshToken) {
          await authServiceInstance.setRefreshToken(data.refreshToken);
        }
        return true;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
    }
    return false;
  }

  private async applyRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let processedConfig = config;
    for (const interceptor of this.requestInterceptors) {
      processedConfig = await interceptor(processedConfig);
    }
    return processedConfig;
  }

  private async applyResponseInterceptors(response: Response): Promise<Response> {
    let processedResponse = response;
    for (const interceptor of this.responseInterceptors) {
      processedResponse = await interceptor(processedResponse);
    }
    return processedResponse;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private isNetworkError(error: any): boolean {
    if (!error) return false;
    
    // Check error name first
    if (error.name === 'NetworkError' || error.name === 'TypeError') {
      return true;
    }
    
    // Check error message for network-related patterns
    const errorMessage = (error.message || error.toString() || '').toLowerCase();
    return errorMessage.includes('network request failed') ||
           errorMessage.includes('failed to fetch') ||
           errorMessage.includes('networkerror') ||
           errorMessage.includes('network error') ||
           errorMessage.includes('econnrefused') ||
           errorMessage.includes('enotfound') ||
           errorMessage.includes('timeout') ||
           errorMessage.includes('network connection') ||
           errorMessage.includes('no internet') ||
           errorMessage.includes('offline') ||
           (errorMessage.includes('typeerror') && errorMessage.includes('fetch'));
  }

  /**
   * Retry request with exponential backoff
   */
  private async retryRequest<T>(url: string, config: RequestConfig & { skipAuth?: boolean }, retries: number, retryDelay: number): Promise<T> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, config);
        
        if (!response.ok) {
          const statusCode = response.status;
          const isRetryable = DEFAULT_RETRY_OPTIONS.retryableStatusCodes?.includes(statusCode);
          const isServerError = statusCode >= 500 && statusCode < 600;
          
          if (isRetryable && !isServerError && attempt < retries) {
            const delay = retryDelay * Math.pow(2, attempt);
            await this.sleep(delay);
            continue;
          }
          
          // Extract error message from response
          let errorMessage = `Request failed with status ${statusCode}`;
          let errorDetails: any = null;
          
          try {
            const responseClone = response.clone();
            const contentType = response.headers.get('content-type') || '';
            const text = await responseClone.text();
            
            // Check if HTML error page
            if (text && (contentType.includes('text/html') || text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html'))) {
              const preMatch = text.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
              const titleMatch = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
              
              if (preMatch && preMatch[1]) {
                errorMessage = `Server error: ${preMatch[1].trim()}`;
              } else if (titleMatch && titleMatch[1]) {
                errorMessage = `Server error: ${titleMatch[1].trim()}`;
              } else {
                errorMessage = 'Server error: The server encountered an internal error. Please try again later.';
              }
              
              const error = new Error(errorMessage) as any;
              error.status = statusCode;
              error.statusText = response.statusText;
              error.details = { htmlResponse: text.substring(0, 500) };
              throw error;
            }
            
            // Try to parse as JSON
            try {
              const errorData = JSON.parse(text);
              errorDetails = errorData;
              
              if (errorData.data?.error) {
                errorMessage = errorData.data.error;
              } else if (errorData.error) {
                errorMessage = errorData.error;
              } else if (errorData.message) {
                errorMessage = errorData.message;
              }
            } catch {
              if (text && text.length < 500) {
                errorMessage = text;
              }
            }
          } catch {
            errorMessage = response.statusText || `Request failed with status ${statusCode}`;
          }
          
          const error = new Error(errorMessage) as any;
          error.status = statusCode;
          error.statusText = response.statusText;
          error.details = errorDetails;
          throw error;
        }

        const processedResponse = await this.applyResponseInterceptors(response);
        const jsonData = await processedResponse.json();
        
        // Debug logging for provider available requests endpoint
        if (__DEV__ && url.includes('/provider/requests/available')) {
          console.log('🔍 [ApiClient.retryRequest] Raw JSON response:', {
            url,
            jsonData,
            jsonDataType: typeof jsonData,
            isArray: Array.isArray(jsonData),
            hasData: !!jsonData?.data,
            dataIsArray: Array.isArray(jsonData?.data),
            keys: jsonData ? Object.keys(jsonData) : [],
          });
        }
        
        // Attach headers for login endpoint
        if (processedResponse.url?.includes('/login')) {
          const headers: any = {};
          processedResponse.headers.forEach((value, key) => {
            headers[key] = value;
          });
          (jsonData as any).__headers = headers;
        }
        
        return jsonData;
      } catch (error) {
        const isNetworkErr = this.isNetworkError(error);
        
        if (isNetworkErr && attempt < retries) {
          const delay = retryDelay * Math.pow(2, attempt);
          await this.sleep(delay);
          continue;
        }
        
        if (attempt === retries) {
          // If it's already an AuthError, just re-throw it
          if (error instanceof AuthError) {
            throw error;
          }
          
          const errorMessage = isNetworkErr 
            ? 'No internet connection. Please check your connection and reconnect to continue.'
            : (error instanceof Error ? error.message : 'Request failed');
          
          // Check if this is an authentication error
          // If so, throw AuthError instead of generic Error
          // UI layer will catch AuthError and handle navigation
          if (this.isAuthError(error)) {
            const authErrorMessage = 'Your session has expired. Please sign in again.';
            throw new AuthError(authErrorMessage);
          }
          
          // For 500 errors on protected routes, treat as potential auth issue
          // Many backends return 500 when token is expired/invalid instead of 401
          // BUT: Not all 500 errors are auth errors - some are real server errors
          // So we need to be more careful and only treat as auth error if:
          // 1. Error message contains auth-related keywords, OR
          // 2. Token is missing/invalid
          const status = (error as any)?.status;
          if (status === 500 && !config.skipAuth) {
            try {
              const token = await authServiceInstance.getAuthToken();
              if (!token) {
                // No token = definitely auth error
                throw new AuthError('Your session has expired. Please sign in again.');
              }
              
              // Token exists but 500 error on protected route
              // Check error message for auth-related keywords first
              const errorMessage = (error as any)?.message || 
                                   (error as any)?.details?.data?.error || 
                                   (error as any)?.details?.error || 
                                   (error as any)?.details?.message ||
                                   (error as any)?.response?.data?.error ||
                                   (error as any)?.response?.data?.message || '';
              const errorText = errorMessage.toLowerCase();
              
              // If error message suggests auth issue, treat as AuthError
              if (errorText.includes('token') || errorText.includes('unauthorized') || 
                  errorText.includes('authentication') || errorText.includes('session') ||
                  errorText.includes('expired') || errorText.includes('invalid') ||
                  errorText.includes('jwt') || errorText.includes('bearer') ||
                  errorText.includes('not authenticated') || errorText.includes('no token') ||
                  errorText.includes('access denied') || errorText.includes('forbidden')) {
                throw new AuthError('Your session has expired. Please sign in again.');
              }
              
              // If error message doesn't suggest auth issue, it's likely a real server error
              // Don't treat as auth error - let it be handled as a regular error
              // This prevents false auth redirects on legitimate 500 errors
            } catch (tokenError) {
              // If checking token fails or token is missing, it's definitely an auth issue
              if (tokenError instanceof AuthError) {
                throw tokenError;
              }
              // Even if tokenError is not AuthError, if we can't get token, it's auth issue
              throw new AuthError('Your session has expired. Please sign in again.');
            }
          }
          
          // For non-auth errors, throw regular error with details
          // Note: 500 errors might be expected (e.g., provider accessing client endpoint)
          // The calling code will handle fallback mechanisms
          const statusCode = (error as any)?.status || response?.status;
          const isExpected500 = statusCode === 500;
          
          const errorObj = error instanceof Error 
            ? Object.assign(new Error(errorMessage), { 
                message: errorMessage, 
                isNetworkError: isNetworkErr,
                originalError: error,
                status: statusCode,
                details: (error as any)?.details,
                isExpected500: isExpected500, // Flag to indicate this might be expected
                suppressErrorLog: isExpected500, // Suppress error logging for expected 500s
              })
            : new Error(errorMessage);
          
          throw errorObj;
        }
        
        const delay = retryDelay * Math.pow(2, attempt);
        await this.sleep(delay);
      }
    }
    
    throw new Error('Request failed after all retry attempts.');
  }

  /**
   * Main request method - handles all HTTP requests
   */
  private async request<T>(endpoint: string, options: RequestConfig = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultConfig: RequestConfig = {
      headers: { 'Content-Type': 'application/json' },
      retries: DEFAULT_RETRY_OPTIONS.maxRetries,
      retryDelay: DEFAULT_RETRY_OPTIONS.retryDelay,
      ...options,
    };

    try {
      const config = await this.applyRequestInterceptors(defaultConfig);
      const { retries = 0, retryDelay = 1000, ...fetchOptions } = config;
      const effectiveRetries = retries > 0 ? retries : DEFAULT_RETRY_OPTIONS.maxRetries || 2;
      
      return this.retryRequest<T>(url, fetchOptions as RequestInit, effectiveRetries, retryDelay);
    } catch (error) {
      // If AuthError is thrown from request interceptor (e.g., no token), re-throw it
      // This will be caught by the calling service or error boundary
      if (error instanceof AuthError) {
        throw error;
      }
      // Re-throw other errors
      throw error;
    }
  }

  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    if (__DEV__ && endpoint.includes('/provider/requests/available')) {
      console.log('🔍 [ApiClient.get] Making GET request:', {
        endpoint,
        fullUrl: `${this.baseUrl}${endpoint}`,
        config,
      });
    }
    const result = await this.request<T>(endpoint, { ...config, method: 'GET' });
    if (__DEV__ && endpoint.includes('/provider/requests/available')) {
      console.log('🔍 [ApiClient.get] Response received:', {
        result,
        resultType: typeof result,
        isArray: Array.isArray(result),
        hasData: !!(result as any)?.data,
      });
    }
    return result;
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

// ============================================================================
// HELPER FUNCTION - Extracts data from various backend response formats
// ============================================================================
function extractResponseData<T>(response: any): T {
  if (Array.isArray(response)) return response as T;
  if (Array.isArray(response?.data)) return response.data as T;
  if (Array.isArray(response?.data?.data)) return response.data.data as T;
  if (response?.data !== undefined) return response.data as T;
  return response as T;
}

// ============================================================================
// PROFILE SERVICE
// ============================================================================
export const profileService = {
  /**
   * Get current user's profile (userId extracted from token automatically)
   */
  getCurrentUserProfile: async (): Promise<any> => {
    try {
      const response = await apiClient.get<any>('/api/user/profile');
      return extractResponseData<any>(response);
    } catch (error) {
      if (__DEV__) {
        console.error('Error getting user profile:', error);
      }
      throw error;
    }
  },

  getProfile: async (userId: string): Promise<UserProfile> => {
    return apiClient.get<UserProfile>(`/users/${userId}/profile`);
  },

  updateProfile: async (userId: string, payload: UpdateProfilePayload): Promise<UserProfile> => {
    return apiClient.put<UserProfile>(`/users/${userId}/profile`, payload);
  },

  uploadProfileImage: async (userId: string, imageUri: string): Promise<{ imageUrl: string }> => {
    return Promise.resolve({ imageUrl: imageUri });
  },
};

// ============================================================================
// LOCATION SERVICE
// ============================================================================
export interface LocationSearchResult {
  placeId: string;
  placeName: string;
  fullAddress: string;
  address: string;
  mainText?: string;
  secondaryText?: string;
}

export interface LocationDetails {
  placeId?: string;
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

export const locationService = {
  /**
   * Search for locations using autocomplete
   * 
   * STEP 1: Validate query (must be at least 2 characters)
   * STEP 2: Call API with search query
   * STEP 3: Return results or empty array
   */
  searchLocations: async (query: string): Promise<LocationSearchResult[]> => {
    // STEP 1: Validate query
    if (query.length < 2) return [];
    
    try {
      // STEP 2: Call API
      const response = await apiClient.get<any>(
        `/api/user/location/search?query=${encodeURIComponent(query)}`,
        { skipAuth: true }
      );
      
      // STEP 3: Extract and return results
      return extractResponseData<LocationSearchResult[]>(response) || [];
    } catch (error: any) {
      console.error('Error searching locations:', error.message || error);
      throw error;
    }
  },

  /**
   * Get location details from placeId
   * 
   * STEP 1: Call API with placeId
   * STEP 2: Extract location data
   * STEP 3: Validate and return
   */
  getLocationDetails: async (placeId: string): Promise<LocationDetails> => {
    try {
      // STEP 1: Call API
      const response = await apiClient.get<any>(
        `/api/user/location/details?placeId=${encodeURIComponent(placeId)}`,
        { skipAuth: true }
      );
      
      // STEP 2: Extract data
      const locationData = extractResponseData<LocationDetails>(response);
      
      // STEP 3: Validate response
      if (!locationData) {
        throw new Error('Invalid location details response from API');
      }
      
      // If placeId is missing, use the one we passed in
      if (!locationData.placeId) {
        locationData.placeId = placeId;
      }
      
      return locationData;
    } catch (error) {
      console.error('Error getting location details:', error);
      throw error;
    }
  },

  /**
   * Convert GPS coordinates to address (Reverse Geocoding)
   * 
   * STEP 1: Call API with coordinates
   * STEP 2: Extract address from response (try multiple formats)
   * STEP 3: Use React Native geocoding as fallback if API fails
   * STEP 4: Return normalized location details
   */
  getCurrentLocation: async (latitude: number, longitude: number): Promise<LocationDetails> => {
    try {
      // STEP 1: Call API
      const response = await apiClient.get<any>(
        `/api/user/location/current?latitude=${latitude}&longitude=${longitude}`,
        { skipAuth: true }
      );
      
      // STEP 2: Extract data from response (handle different response formats)
      const locationData = extractResponseData<any>(response);
      
      // Log what we received (for debugging)
      
      // STEP 3: Build address from available fields
      // Try multiple possible field names and nested structures
      const address = 
        locationData?.formattedAddress || 
        locationData?.fullAddress || 
        locationData?.address ||
        locationData?.placeName ||
        locationData?.location?.formattedAddress ||
        locationData?.location?.fullAddress ||
        locationData?.location?.address ||
        locationData?.data?.formattedAddress ||
        locationData?.data?.fullAddress ||
        locationData?.data?.address ||
        null;
      
      // Extract city, state, country from various possible locations
      const city = 
        locationData?.city || 
        locationData?.location?.city || 
        locationData?.data?.city ||
        '';
      const state = 
        locationData?.state || 
        locationData?.location?.state || 
        locationData?.data?.state ||
        '';
      const country = 
        locationData?.country || 
        locationData?.location?.country || 
        locationData?.data?.country ||
        '';
      
      // If no address found, try to build from city/state/country
      let formattedAddress = address;
      if (!formattedAddress) {
        if (city || state || country) {
          formattedAddress = [city, state, country].filter(Boolean).join(', ');
        }
      }
      
      // STEP 4: If still no address, try React Native geocoding as fallback
      if (!formattedAddress) {
        try {
          const { Location } = await import('expo-location');
          const reverseGeocode = await Location.reverseGeocodeAsync({
            latitude,
            longitude,
          });
          
          if (reverseGeocode && reverseGeocode.length > 0) {
            const geoResult = reverseGeocode[0];
            const parts = [
              geoResult.streetNumber,
              geoResult.street,
              geoResult.city,
              geoResult.region,
              geoResult.country,
            ].filter(Boolean);
            
            formattedAddress = parts.join(', ');
            
            // Update city/state/country from geocoding result
            const fallbackCity = city || geoResult.city || '';
            const fallbackState = state || geoResult.region || '';
            const fallbackCountry = country || geoResult.country || '';
            
            
            return {
              placeId: `lat_${latitude}_${longitude}`,
              formattedAddress: formattedAddress,
              latitude: latitude,
              longitude: longitude,
              city: fallbackCity,
              state: fallbackState,
              country: fallbackCountry,
              address: formattedAddress,
            };
          }
        } catch (geoError) {
        }
        
        // Last resort: Use coordinates as address (but format nicely)
        formattedAddress = `Location at ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        
      }
      
      // STEP 5: Build normalized response
      const normalizedDetails: LocationDetails = {
        placeId: locationData?.placeId || locationData?.location?.placeId || locationData?.data?.placeId || `lat_${latitude}_${longitude}`,
        formattedAddress: formattedAddress,
        latitude: locationData?.latitude || locationData?.location?.latitude || locationData?.data?.latitude || latitude,
        longitude: locationData?.longitude || locationData?.location?.longitude || locationData?.data?.longitude || longitude,
        city: city,
        state: state,
        country: country,
        address: formattedAddress,
      };
      
      return normalizedDetails;
    } catch (error: any) {
      console.error('Error getting current location:', error.message || error);
      
      // Try React Native geocoding as final fallback
      try {
        const { Location } = await import('expo-location');
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        
        if (reverseGeocode && reverseGeocode.length > 0) {
          const geoResult = reverseGeocode[0];
          const parts = [
            geoResult.streetNumber,
            geoResult.street,
            geoResult.city,
            geoResult.region,
            geoResult.country,
          ].filter(Boolean);
          
          const formattedAddress = parts.join(', ');
          
          return {
            placeId: `lat_${latitude}_${longitude}`,
            formattedAddress: formattedAddress,
            latitude: latitude,
            longitude: longitude,
            city: geoResult.city || '',
            state: geoResult.region || '',
            country: geoResult.country || '',
            address: formattedAddress,
          };
        }
      } catch (geoError) {
      }
      
      throw error;
    }
  },

  /**
   * Save user location (userId extracted from token automatically)
   */
  saveUserLocation: async (
    userId: number,
    options: { placeId?: string; latitude?: number; longitude?: number }
  ): Promise<SavedLocation> => {
    try {
      const token = await authServiceInstance.getAuthToken();
      if (!token) {
        throw new AuthError('Authentication required. Please sign in again.');
      }

      const body: { placeId?: string; latitude?: number; longitude?: number } = {};

      if (options.placeId) {
        body.placeId = options.placeId;
        if (__DEV__) {
          console.log('🔍 [saveUserLocation] Saving location using placeId:', options.placeId);
        }
      } else if (options.latitude !== undefined && options.longitude !== undefined) {
        body.latitude = options.latitude;
        body.longitude = options.longitude;
        if (__DEV__) {
          console.log('🔍 [saveUserLocation] Saving location using coordinates:', {
            latitude: options.latitude,
            longitude: options.longitude,
          });
        }
      } else {
        throw new Error('Either placeId or latitude/longitude must be provided');
      }

      const response = await apiClient.post<any>('/api/user/update-location', body);
      const location = response?.data?.location || response?.data?.data?.location || response?.location;

      if (!location) {
        throw new Error('Invalid response from server: location data not found');
      }

      if (__DEV__) {
        console.log('🔍 [saveUserLocation] Location saved successfully:', {
          hasLocation: !!location,
          hasCoordinates: !!(location?.latitude && location?.longitude),
          coordinates: location?.latitude && location?.longitude 
            ? { lat: location.latitude, lng: location.longitude }
            : null,
          address: location?.fullAddress || location?.formattedAddress || location?.address,
        });
      }

      return location;
    } catch (error: any) {
      // If it's already an AuthError, re-throw it
      if (error instanceof AuthError) {
        throw error;
      }

      let status = error?.status || 500;
      
      // For 401 errors, throw AuthError to trigger automatic logout
      if (status === 401) {
        throw new AuthError('Your session has expired. Please sign in again.');
      }
      
      let errorMessage = error.message || 'Failed to save location';
      const extractedError = error?.details?.data?.error || error?.details?.error || error?.details?.message || error.message;
      
      // Handle specific backend validation errors
      if (extractedError && typeof extractedError === 'string') {
        if (extractedError.toLowerCase().includes('app client') || extractedError.toLowerCase().includes('appclient')) {
          errorMessage = 'Your account needs to be set up properly. Please contact support or try signing out and back in.';
        } else if (extractedError.toLowerCase().includes('property') && extractedError.toLowerCase().includes('does not exist')) {
          errorMessage = 'Account setup incomplete. Please complete your profile setup first.';
        }
      }
      
      if (status === 500) {
        if (!errorMessage.includes('Account setup') && !errorMessage.includes('contact support')) {
          errorMessage = extractedError && typeof extractedError === 'string' && extractedError !== 'Request failed with status 500'
            ? `Server error: ${extractedError}`
            : 'Server error: The server encountered an internal error. Please try again later.';
        }
      } else if (status === 400) {
        if (!errorMessage.includes('Account setup') && !errorMessage.includes('contact support')) {
          errorMessage = extractedError || 'Invalid request. Please check your location data.';
        }
      }
      
      const enhancedError = new Error(errorMessage) as any;
      enhancedError.status = status;
      enhancedError.statusText = error?.statusText || 'Internal Server Error';
      enhancedError.details = error?.details;
      
      throw enhancedError;
    }
  },

  /**
   * Get user's saved location
   */
  getUserLocation: async (userId: number): Promise<SavedLocation | null> => {
    try {
      const response = await apiClient.get<any>('/api/user/location');
      
      // Handle different response structures
      let locationData: any = null;
      if (response?.data?.data) {
        // Nested structure: { data: { data: SavedLocation } }
        locationData = response.data.data;
      } else if (response?.data) {
        // Direct structure: { data: SavedLocation }
        locationData = response.data;
      } else if (response?.location) {
        // Alternative structure: { location: SavedLocation }
        locationData = response.location;
      }
      
      if (!locationData) {
        return null;
      }
      
      // Parse coordinates from strings to numbers if needed
      const parsedLocation: SavedLocation = {
        placeId: locationData.placeId || '',
        placeName: locationData.placeName || locationData.city || '',
        fullAddress: locationData.fullAddress || locationData.address || '',
        address: locationData.address || locationData.fullAddress?.split(',')[0] || '',
        city: locationData.city || '',
        state: locationData.state || '',
        country: locationData.country || '',
        latitude: typeof locationData.latitude === 'string' 
          ? parseFloat(locationData.latitude) 
          : (locationData.latitude || 0),
        longitude: typeof locationData.longitude === 'string' 
          ? parseFloat(locationData.longitude) 
          : (locationData.longitude || 0),
      };
      
      // Validate coordinates
      if (!parsedLocation.latitude || !parsedLocation.longitude || 
          isNaN(parsedLocation.latitude) || isNaN(parsedLocation.longitude)) {
        if (__DEV__) {
          console.log('⚠️ [getUserLocation] Invalid coordinates in response:', {
            latitude: locationData.latitude,
            longitude: locationData.longitude,
          });
        }
        return null;
      }
      
      return parsedLocation;
    } catch (error: any) {
      // If it's already an AuthError, re-throw it
      if (error instanceof AuthError) {
        throw error;
      }

      // For 401 errors, throw AuthError to trigger automatic logout
      const status = error?.status || 500;
      if (status === 401) {
        throw new AuthError('Your session has expired. Please sign in again.');
      }

      if (error.message?.includes('not set') || error.message?.includes('404')) {
        return null;
      }
      // Don't log AuthError - it will be handled by global error handler
      if (!(error instanceof AuthError)) {
        console.error('Error getting user location:', error);
      }
      throw error;
    }
  },
};

// ============================================================================
// AUTHENTICATION SERVICE
// ============================================================================
export interface UserSignupPayload {
  email: string;
  password: string;
  phoneNumber?: string;
}

export interface UserSignupResponse {
  firstName: string;
  lastName: string;
  email: string;
  token: string;
  id?: number;
}

export interface UserLoginPayload {
  email: string;
  password: string;
}

export interface UserLoginResponse {
  id?: number;
  firstName?: string;
  lastName?: string;
  email: string;
  token: string;
  message?: string;
}

export interface CompanySignupPayload {
  email: string;
  phoneNumber: string;
  password: string;
}

export interface CompanySignupResponse {
  id: number;
  companyName: string;
  companyPhoneNumber: string;
  companyEmail: string;
  token: string;
}

export const authService = {

  userSignup: async (payload: UserSignupPayload): Promise<UserSignupResponse> => {
    try {
      const response = await apiClient.post<any>('/api/user/signup', payload, { skipAuth: true });
      
      const responseAny = response as any;
      const token = response.data?.data?.token || responseAny.data?.token || responseAny.token;
      const email = response.data?.data?.email || responseAny.data?.email || responseAny.email || payload.email;
      const phoneNumber = response.data?.data?.phoneNumber || responseAny.data?.phoneNumber || responseAny.phoneNumber || payload.phoneNumber;
      const userId = (response.data?.data as any)?.id || (response.data?.data as any)?.userId || (response.data as any)?.id || (response as any)?.id;
      
      if (userId) {
        await authServiceInstance.setUserId(userId);
      }
      
      if (!token) {
        if (userId && email) {
          return { email, token: '', id: userId, firstName: '', lastName: '' };
        }
        throw new Error('Signup failed: No user data or token received from server.');
      }
      
      await authServiceInstance.setAuthToken(token);
      
      if (!userId) {
        const isJWT = token.split('.').length === 3;
        if (isJWT) {
          const extractedUserId = extractUserIdFromToken(token);
          if (extractedUserId) {
            await authServiceInstance.setUserId(extractedUserId);
          }
        }
      }
      
      return {
        email: email || payload.email,
        token: token,
        id: userId,
        firstName: '',
        lastName: '',
      };
    } catch (error: any) {
      console.error('Error during user signup:', error);
      throw error;
    }
  },

  /**
   * Company Signup (uses provider endpoint)
   */
  companySignup: async (payload: CompanySignupPayload): Promise<CompanySignupResponse> => {
    try {
      const signupPayload = {
        email: payload.email.trim().toLowerCase(),
        phoneNumber: payload.phoneNumber.trim(),
        password: payload.password,
      };

      const response = await apiClient.post<any>('/api/provider/signup', signupPayload, { skipAuth: true });

      const token = response?.data?.data?.token || response?.data?.token || response?.token;
      const companyData = response?.data?.data || response?.data || response;
      const companyId = companyData?.id || companyData?.companyId || (response as any)?.id;

      if (!token) {
        throw new Error('Signup failed: No token received from server.');
      }

      await authServiceInstance.setAuthToken(token);

      let finalCompanyId: number | undefined = undefined;
      
      if (companyId) {
        finalCompanyId = typeof companyId === 'number' ? companyId : parseInt(companyId.toString(), 10);
        await authServiceInstance.setCompanyId(finalCompanyId);
      } else if (token) {
        const extractedUserId = extractUserIdFromToken(token);
        if (extractedUserId) {
          finalCompanyId = extractedUserId;
          await authServiceInstance.setCompanyId(finalCompanyId);
        }
      }
      
      if (finalCompanyId) {
        await authServiceInstance.setUserId(finalCompanyId);
      }

      return {
        id: finalCompanyId || companyId || 0,
        companyName: companyData?.companyName || companyData?.name || payload.email.split('@')[0] || 'Company',
        companyEmail: companyData?.companyEmail || companyData?.email || payload.email,
        companyPhoneNumber: companyData?.companyPhoneNumber || companyData?.phoneNumber || payload.phoneNumber,
        token: token,
      };
    } catch (error: any) {
      console.error('Error during company signup:', error);
      throw error;
    }
  },

  /**
   * User (Consumer) Login
   */
  userLogin: async (payload: UserLoginPayload): Promise<UserLoginResponse> => {
    try {
      const response = await apiClient.post<any>('/api/user/login', payload, { skipAuth: true });
      
      const responseHeaders = (response as any)?.__headers || {};
      const tokenFromHeader = responseHeaders?.['authorization'] || responseHeaders?.['Authorization'] || responseHeaders?.['x-auth-token'];
      
      const token = response?.data?.data?.token || response?.data?.token || response?.token || 
                   (tokenFromHeader?.startsWith('Bearer ') ? tokenFromHeader.substring(7) : tokenFromHeader);
      
      const email = response?.data?.data?.email || response?.data?.email || response?.user?.email || (response as any)?.email || payload.email;
      const id = response?.data?.data?.id || response?.data?.data?.userId || response?.data?.id || response?.user?.id || (response as any)?.id;
      const firstName = response?.data?.data?.firstName || response?.data?.firstName || response?.user?.firstName;
      const lastName = response?.data?.data?.lastName || response?.data?.lastName || response?.user?.lastName;
      
      if (id) {
        await authServiceInstance.setUserId(id);
      }
      
      if (!token) {
        if (id && email) {
          return { email, token: '', id, firstName, lastName };
        }
        throw new Error('Login failed: No user data or token received from server.');
      }
      
      await authServiceInstance.setAuthToken(token);
      
      if (!id) {
        const extractedUserId = extractUserIdFromToken(token);
        if (extractedUserId) {
          await authServiceInstance.setUserId(extractedUserId);
        }
      }
      
      // Set role to client for regular user login
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem('@ghands:user_role', 'client');
      
      return { email, token, id, firstName, lastName };
    } catch (error: any) {
      console.error('Error during user login:', error);
      throw error;
    }
  },

  login: async (email: string, password: string) => {
    return authService.userLogin({ email, password });
  },

  logout: async () => {
    await authServiceInstance.clearAuthTokens();
  },

  // Delegate to AuthService for token and user management
  setAuthToken: (token: string): Promise<void> => authServiceInstance.setAuthToken(token),
  clearAuthTokens: (): Promise<void> => authServiceInstance.clearAuthTokens(),
  getUserId: (): Promise<number | null> => authServiceInstance.getUserId(),
  setUserId: (userId: number): Promise<void> => authServiceInstance.setUserId(userId),
  getCompanyId: (): Promise<number | null> => authServiceInstance.getCompanyId(),
  setCompanyId: (companyId: number): Promise<void> => authServiceInstance.setCompanyId(companyId),
  getAuthToken: (): Promise<string | null> => authServiceInstance.getAuthToken(),
};

// ============================================================================
// SERVICE REQUEST / BOOKING SERVICE
// ============================================================================
export interface ServiceCategory {
  name: string;
  displayName: string;
  description: string;
  providerCount: number;
  icon?: string;
}

export interface CreateServiceRequestPayload {
  userId: number;
  categoryName: string;
  jobTitle?: string;
  description?: string;
  comment?: string;
}

export interface CreateServiceRequestResponse {
  requestId: number;
  categoryName: string;
  status: string;
  message: string;
}

export interface LocationData {
  placeId?: string;
  address?: string;
  formattedAddress?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  country?: string;
}

export interface UpdateJobDetailsPayload {
  jobTitle: string;
  description: string;
  comment?: string;
  location?: LocationData;
}

export interface NearbyProvider {
  id: number;
  name: string;
  verified: boolean;
  age: number;
  phoneNumber: string;
  location: {
    address: string;
    city: string;
    state: string;
  };
  distanceKm: number;
  minutesAway: number;
}

export interface UpdateJobDetailsResponse {
  requestId: number;
  jobTitle: string;
  description: string;
  location: string;
  locationVerifiedAt: string;
  nearbyProviders?: NearbyProvider[];
  message: string;
}

export interface UpdateDateTimePayload {
  scheduledDate: string;
  scheduledTime: string;
}

export interface UpdateDateTimeResponse {
  requestId: number;
  scheduledDate: string;
  scheduledTime: string;
  message: string;
}

export interface ServiceRequest {
  id: number;
  categoryName: string;
  jobTitle: string;
  description: string;
  comment?: string;
  location?: {
    formattedAddress: string;
    address: string;
    city: string;
    state: string;
    country: string;
    latitude: number;
    longitude: number;
    locationVerifiedAt?: string;
  };
  scheduledDate?: string;
  scheduledTime?: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  nearbyProviders?: NearbyProvider[];
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  
  // Backend selection flow fields
  selectedProvider?: {
    id: number;
    name: string;
    phoneNumber: string;
    email: string;
  };
  selectedAt?: string;  // Timestamp when provider was selected
  selectionTimeoutAt?: string;  // When selection expires (selectedAt + 5 minutes)
}

export const serviceRequestService = {
  getCategories: async (): Promise<ServiceCategory[]> => {
    try {
      const response = await apiClient.get<{ data?: ServiceCategory[] | { data: ServiceCategory[] }; success?: boolean }>(
        '/api/request-service/categories',
        { skipAuth: true }
      );
      
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && typeof response.data === 'object' && 'data' in response.data) {
        const nestedData = (response.data as any).data;
        return Array.isArray(nestedData) ? nestedData : [];
      }
      
      return [];
    } catch (error: any) {
      console.error('Error getting categories:', error);
      throw error;
    }
  },

  searchCategories: async (query: string): Promise<ServiceCategory[]> => {
    if (query.length < 2) return [];
    
    try {
      const response = await apiClient.get<{ data?: ServiceCategory[] | { data: ServiceCategory[] }; success?: boolean }>(
        `/api/request-service/categories/search?query=${encodeURIComponent(query)}`,
        { skipAuth: true }
      );
      
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && typeof response.data === 'object' && 'data' in response.data) {
        const nestedData = (response.data as any).data;
        return Array.isArray(nestedData) ? nestedData : [];
      }
      
      return [];
    } catch (error: any) {
      console.error('Error searching categories:', error);
      throw error;
    }
  },

  createRequest: async (payload: CreateServiceRequestPayload): Promise<CreateServiceRequestResponse> => {
    try {
      const requestPayload: any = { categoryName: payload.categoryName };
      
      if (payload.jobTitle?.trim()) {
        requestPayload.jobTitle = payload.jobTitle.trim();
      }
      if (payload.description?.trim()) {
        requestPayload.description = payload.description.trim();
      }
      if (payload.comment?.trim()) {
        requestPayload.comment = payload.comment.trim();
      }
      
      const response = await apiClient.post<any>('/api/request-service/requests', requestPayload);
      const responseData = response.data?.data || response.data || response;
      const requestId = responseData.requestId || responseData.id || responseData.data?.requestId;
      
      if (!requestId) {
        throw new Error('Invalid response from API: requestId not found');
      }
      
      return {
        requestId: typeof requestId === 'number' ? requestId : parseInt(requestId, 10),
        categoryName: responseData.categoryName || payload.categoryName,
        status: responseData.status || 'pending',
        message: responseData.message || 'Service request created successfully',
      };
    } catch (error) {
      // Don't log AuthError - it will be handled by global error handler
      if (!(error instanceof AuthError)) {
        console.error('Error creating service request:', error);
      }
      throw error;
    }
  },

  updateJobDetails: async (requestId: number, payload: UpdateJobDetailsPayload): Promise<UpdateJobDetailsResponse> => {
    try {
      if (__DEV__) {
        console.log('📤 Updating job details:', {
          requestId,
          jobTitle: payload.jobTitle,
          descriptionLength: payload.description?.length,
          hasLocation: !!payload.location,
        });
      }
      
      const response = await apiClient.put<any>(`/api/request-service/requests/${requestId}/details`, payload);
      const responseData = response.data?.data || response.data || response;
      
      if (__DEV__) {
        const providerCount = responseData.nearbyProviders?.length || 0;
        const hasProviders = providerCount > 0;
        console.log('✅ Job details updated successfully:', {
          requestId: responseData.requestId,
          hasNearbyProviders: hasProviders,
          providerCount: providerCount,
          note: hasProviders 
            ? `${providerCount} provider(s) found nearby` 
            : 'No providers found within 50km radius',
        });
      }
      
      if (responseData.nearbyProviders && !Array.isArray(responseData.nearbyProviders)) {
        responseData.nearbyProviders = [];
      }
      
      return responseData;
    } catch (error) {
      // Don't log AuthError - it will be handled by global error handler
      if (!(error instanceof AuthError)) {
        if (__DEV__) {
          console.error('❌ Error updating job details:', {
            requestId,
            error: error instanceof Error ? error.message : error,
            status: (error as any)?.status,
          });
        }
      }
      throw error;
    }
  },

  updateDateTime: async (requestId: number, payload: UpdateDateTimePayload): Promise<UpdateDateTimeResponse> => {
    try {
      const response = await apiClient.put<any>(`/api/request-service/requests/${requestId}/date-time`, payload);
      return extractResponseData<UpdateDateTimeResponse>(response);
    } catch (error) {
      // Don't log AuthError - it will be handled by global error handler
      if (!(error instanceof AuthError)) {
        console.error('Error updating date/time:', error);
      }
      throw error;
    }
  },

  getRequestDetails: async (requestId: number): Promise<ServiceRequest> => {
    try {
      const response = await apiClient.get<any>(`/api/request-service/requests/${requestId}`);
      const requestData = extractResponseData<ServiceRequest>(response);
      
      if (requestData && requestData.nearbyProviders && !Array.isArray(requestData.nearbyProviders)) {
        requestData.nearbyProviders = [];
      }
      
      return requestData;
    } catch (error) {
      // Don't log AuthError - it will be handled by global error handler
      // Also don't log 500 errors - they're often expected when providers access client endpoints
      // The calling code (ProviderJobDetailsScreen) will handle fallback mechanisms
      // and suppress error messages when fallback succeeds
      if (!(error instanceof AuthError)) {
        const status = (error as any)?.status || (error as any)?.response?.status;
        const suppressErrorLog = (error as any)?.suppressErrorLog;
        
        // Only log if it's not a 500 (which might be expected for provider access)
        // and not marked to suppress logging
        if (status !== 500 && !suppressErrorLog) {
          console.error('Error getting request details:', error);
        }
        // For 500 errors, don't log - they're expected and will be handled by fallback
        // This prevents error spam in console when providers access client endpoints
      }
      throw error;
    }
  },

  getUserRequests: async (status?: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'): Promise<ServiceRequest[]> => {
    try {
      const url = status ? `/api/request-service/requests?status=${status}` : `/api/request-service/requests`;
      const response = await apiClient.get<any>(url);
      
      let requests: ServiceRequest[] = [];
      
      if (Array.isArray(response)) {
        requests = response;
      } else if (response?.data) {
        if (Array.isArray(response.data)) {
          requests = response.data;
        } else if (Array.isArray(response.data.data)) {
          requests = response.data.data;
        }
      }
      
      return requests.map((request: any) => ({
        ...request,
        nearbyProviders: Array.isArray(request.nearbyProviders) ? request.nearbyProviders : [],
      }));
    } catch (error) {
      // Don't log AuthError - it will be handled by global error handler
      if (!(error instanceof AuthError)) {
        console.error('Error getting user requests:', error);
      }
      throw error;
    }
  },

  cancelRequest: async (requestId: number): Promise<{ requestId: number; status: string; message: string }> => {
    try {
      const response = await apiClient.delete<{ data: { requestId: number; status: string; message: string } }>(
        `/api/request-service/requests/${requestId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error cancelling request:', error);
      throw error;
    }
  },

  getAcceptedProviders: async (requestId: number): Promise<Array<{
    provider: { id: number; name: string; verified: boolean; age: number; phoneNumber: string; email: string; location: { address: string; city: string; state: string; }; };
    acceptance: { id: number; acceptedAt: string; };
    distanceKm: number;
    minutesAway: number;
  }>> => {
    try {
      const response = await apiClient.get<any>(`/api/request-service/requests/${requestId}/accepted-providers`);
      
      let providers: any[] = [];
      if (Array.isArray(response)) {
        providers = response;
      } else if (response?.data) {
        if (Array.isArray(response.data)) {
          providers = response.data;
        } else if (Array.isArray(response.data.data)) {
          providers = response.data.data;
        }
      }
      
      return Array.isArray(providers) ? providers : [];
    } catch (error) {
      console.error('Error getting accepted providers:', error);
      throw error;
    }
  },

  selectProvider: async (requestId: number, providerId: number): Promise<{
    requestId: number;
    status: string;
    provider: { id: number; name: string; phoneNumber: string; email: string; };
    message: string;
  }> => {
    try {
      const response = await apiClient.post<any>(`/api/request-service/requests/${requestId}/select-provider`, { providerId });
      const responseData = extractResponseData<any>(response);
      
      return {
        requestId: responseData.requestId || requestId,
        status: responseData.status || 'accepted',
        provider: responseData.provider || {},
        message: responseData.message || 'Provider selected successfully',
      };
    } catch (error) {
      console.error('Error selecting provider:', error);
      throw error;
    }
  },

  /**
   * Get all quotations for a service request (user views all quotations received)
   * Endpoint 6.3: GET /api/request-service/requests/:requestId/quotations
   */
  getQuotations: async (requestId: number): Promise<QuotationWithProvider[]> => {
    try {
      const response = await apiClient.get<{
        data: QuotationWithProvider[];
      }>(`/api/request-service/requests/${requestId}/quotations`);
      
      return extractResponseData<QuotationWithProvider[]>(response) || [];
    } catch (error) {
      console.error('Error getting quotations:', error);
      throw error;
    }
  },

  /**
   * Accept a quotation (user accepts a quotation - sets provider and price)
   * Endpoint 6.4: POST /api/request-service/quotations/:quotationId/accept
   * 
   * WHAT HAPPENS:
   * - Quotation status changes to "accepted"
   * - Service request status changes to "accepted"
   * - Service request providerId is set to quotation provider
   * - Service request price is set to quotation total
   * - All other pending quotations for this request are automatically rejected
   */
  acceptQuotation: async (quotationId: number): Promise<{
    quotationId: number;
    requestId: number;
    total: number;
    status: 'accepted';
    message: string;
  }> => {
    try {
      const response = await apiClient.post<{
        data: {
          quotationId: number;
          requestId: number;
          total: number;
          status: 'accepted';
          message: string;
        };
      }>(`/api/request-service/quotations/${quotationId}/accept`);
      
      return response.data;
    } catch (error) {
      console.error('Error accepting quotation:', error);
      throw error;
    }
  },

  /**
   * Reject a quotation (user rejects a quotation)
   * Endpoint 6.5: POST /api/request-service/quotations/:quotationId/reject
   * 
   * WHAT HAPPENS:
   * - Quotation status changes to "rejected"
   * - Provider can see their quotation was rejected
   * - User can still accept other quotations for the same request
   */
  rejectQuotation: async (quotationId: number): Promise<{
    quotationId: number;
    status: 'rejected';
    message: string;
  }> => {
    try {
      const response = await apiClient.post<{
        data: {
          quotationId: number;
          status: 'rejected';
          message: string;
        };
      }>(`/api/request-service/quotations/${quotationId}/reject`);
      
      return response.data;
    } catch (error) {
      console.error('Error rejecting quotation:', error);
      throw error;
    }
  },

  /**
   * Complete a service request (user marks job as completed)
   * Endpoint 5.16: PUT /api/request-service/requests/:requestId/complete
   * 
   * WHAT HAPPENS:
   * - Service request status changes to "completed"
   * - Provider automatically receives payment in their wallet
   * - Earnings are transferred from escrow to provider's wallet
   * - Provider can then withdraw earnings to their bank account
   */
  completeServiceRequest: async (requestId: number): Promise<{
    id: number;
    status: 'completed';
    message: string;
  }> => {
    try {
      const response = await apiClient.put<{
        data: {
          id: number;
          status: 'completed';
          message: string;
        };
      }>(`/api/request-service/requests/${requestId}/complete`);
      
      return response.data;
    } catch (error) {
      console.error('Error completing service request:', error);
      throw error;
    }
  },
};

// ============================================================================
// WALLET SERVICE
// ============================================================================

export interface PayForServicePayload {
  requestId: number;
  amount: number;
  pin: string;
}

export interface PayForServiceResponse {
  reference: string;
  status: 'completed' | 'pending' | 'failed';
  amount: number;
  balance: number;
  requestId: number;
}

export const walletService = {
  /**
   * Pay for a service request using wallet balance
   * Endpoint 5.8: POST /api/wallet/pay
   * 
   * WHAT HAPPENS:
   * - Deducts amount from user's wallet balance
   * - Updates service request status after payment
   * - Provider will receive earnings when service is completed
   * - Requires wallet PIN verification
   */
  payForService: async (payload: PayForServicePayload): Promise<PayForServiceResponse> => {
    try {
      const response = await apiClient.post<{
        data: PayForServiceResponse;
      }>(`/api/wallet/pay`, payload);
      
      return response.data;
    } catch (error) {
      console.error('Error paying for service:', error);
      throw error;
    }
  },
};

// ============================================================================
// PROVIDER SERVICE
// ============================================================================
export interface ProviderSignupPayload {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
  age: number;
  verified?: boolean;
  location?: LocationData;
  categories?: string[];
}

export interface ProviderSignupResponse {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
  verified: boolean;
  age: number;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
  token: string;
  message: string;
}

export interface ProviderLoginPayload {
  email: string;
  password: string;
}

export interface ProviderLoginResponse {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
  verified: boolean;
  age: number;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
  token: string;
  message: string;
}

export interface Provider {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
  verified: boolean;
  age: number;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  isActive: boolean;
  categories: string[];
}

export interface ProviderLocationPayload {
  address?: string;
  placeId?: string;
  latitude?: number;
  longitude?: number;
}

export interface AvailableRequest extends ServiceRequest {
  distanceKm: number;
  minutesAway: number;
}

// ============================================================================
// QUOTATION TYPES
// ============================================================================

export interface QuotationMaterial {
  name: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
}

export interface SendQuotationPayload {
  laborCost: number;                    // Required
  logisticsCost: number;                 // Required
  materials?: QuotationMaterial[];       // Optional
  findingsAndWorkRequired: string;       // Required, min 10 chars
  serviceCharge?: number;                // Optional
  tax?: number;                          // Optional
}

export interface Quotation {
  id: number;
  requestId: number;
  laborCost: number;
  logisticsCost: number;
  materials: QuotationMaterial[];
  findingsAndWorkRequired: string;
  serviceCharge: number;
  tax: number;
  total: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  sentAt: string;
  acceptedAt?: string | null;
  rejectedAt?: string | null;
  message?: string;
}

export interface SendQuotationResponse {
  id: number;
  requestId: number;
  laborCost: number;
  logisticsCost: number;
  materials: QuotationMaterial[];
  findingsAndWorkRequired: string;
  serviceCharge: number;
  tax: number;
  total: number;
  status: 'pending';
  sentAt: string;
  message: string;
}

// User-facing quotation (includes provider info)
export interface QuotationWithProvider {
  id: number;
  provider: {
    id: number;
    name: string;
    verified: boolean;
    phoneNumber: string;
  };
  laborCost: number;
  logisticsCost: number;
  materials: QuotationMaterial[];
  findingsAndWorkRequired: string;
  serviceCharge: number;
  tax: number;
  total: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  sentAt: string;
}

// Provider's quotation list item (includes request and user info)
export interface ProviderQuotationListItem {
  id: number;
  requestId: number;
  request: {
    id: number;
    jobTitle: string;
    description: string;
    status: string;
  };
  user: {
    id: number;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
  laborCost: number;
  logisticsCost: number;
  materials: QuotationMaterial[];
  total: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  sentAt: string;
  acceptedAt?: string | null;
  rejectedAt?: string | null;
}

export const providerService = {
  /**
   * Provider Signup
   */
  signup: async (payload: ProviderSignupPayload): Promise<ProviderSignupResponse> => {
    try {
      const response = await apiClient.post<any>('/api/provider/signup', payload, { skipAuth: true });

      const token = response?.data?.data?.token || response?.data?.token || response?.token;
      const providerData = response?.data?.data || response?.data || response;
      const providerId = providerData?.id || (response as any)?.id || response?.data?.id;

      if (token) {
        await authServiceInstance.setAuthToken(token);
      }

      if (providerId) {
        await authServiceInstance.setUserId(providerId);
      } else if (token) {
        const extractedId = extractUserIdFromToken(token);
        if (extractedId) {
          await authServiceInstance.setUserId(extractedId);
        }
      }

      return {
        id: providerId || (token ? extractUserIdFromToken(token) : undefined) || 0,
        name: providerData?.name || payload.name,
        email: providerData?.email || payload.email,
        phoneNumber: providerData?.phoneNumber || payload.phoneNumber,
        verified: providerData?.verified || false,
        age: providerData?.age || payload.age,
        token: token || '',
        message: providerData?.message || 'Provider registered successfully',
      };
    } catch (error: any) {
      console.error('Error during provider signup:', error);
      throw error;
    }
  },

  login: async (payload: ProviderLoginPayload): Promise<ProviderLoginResponse> => {
    try {
      const response = await apiClient.post<any>(
        '/api/provider/login',
        { email: payload.email.trim().toLowerCase(), password: payload.password },
        { skipAuth: true }
      );

      const token = response?.data?.data?.token || response?.data?.token || response?.token;
      const providerData = response?.data?.data || response?.data || response;
      const providerId = providerData?.id || providerData?.companyId || (response as any)?.id || response?.data?.id;

      if (!token) {
        throw new Error('Login failed: No token received from server.');
      }

      await authServiceInstance.setAuthToken(token);

      let finalProviderId: number | undefined = undefined;
      
      if (providerId) {
        finalProviderId = typeof providerId === 'number' ? providerId : parseInt(providerId.toString(), 10);
        await authServiceInstance.setCompanyId(finalProviderId);
      } else if (token) {
        const extractedUserId = extractUserIdFromToken(token);
        if (extractedUserId) {
          finalProviderId = extractedUserId;
          await authServiceInstance.setCompanyId(finalProviderId);
        }
      }
      
      if (finalProviderId) {
        await authServiceInstance.setUserId(finalProviderId);
      }

      return {
        id: finalProviderId || providerId || 0,
        name: providerData?.name || providerData?.companyName || '',
        email: providerData?.email || providerData?.companyEmail || payload.email,
        phoneNumber: providerData?.phoneNumber || providerData?.companyPhoneNumber,
        verified: providerData?.verified || false,
        age: providerData?.age || 0,
        latitude: providerData?.latitude,
        longitude: providerData?.longitude,
        formattedAddress: providerData?.formattedAddress,
        token: token,
        message: providerData?.message || 'Login successful',
      };
    } catch (error: any) {
      console.error('Error during provider login:', error);
      throw error;
    }
  },

  /**
   * Get authenticated provider's own profile information
   * Provider ID is automatically extracted from token
   * Endpoint 4.3: GET /api/provider
   */
  getProvider: async (providerId?: number): Promise<Provider> => {
    try {
      // New API: providerId is extracted from token automatically
      // providerId parameter is kept for backward compatibility but not used in URL
      const response = await apiClient.get<any>(`/api/provider`);
      const providerData = extractResponseData<Provider>(response);
      
      if (providerData && providerData.categories && !Array.isArray(providerData.categories)) {
        providerData.categories = [];
      }
      
      return providerData;
    } catch (error) {
      console.error('Error getting provider:', error);
      throw error;
    }
  },

  /**
   * Update provider location (providerId extracted from token automatically)
   * 
   * IMPORTANT: This REPLACES the provider's existing location with the new one.
   * The old location is automatically removed and replaced by the new location.
   * Only one location is stored per provider at any time.
   * 
   * Uses PUT method which ensures the location is fully replaced, not added.
   */
  updateLocation: async (payload: ProviderLocationPayload): Promise<{ providerId: number; location: SavedLocation; message: string }> => {
    try {
      const token = await authServiceInstance.getAuthToken();
      if (!token) {
        throw new AuthError('Authentication required. Please sign in again.');
      }
      
      // Build request body - prioritize placeId, then coordinates, then address
      // This will REPLACE the existing location completely
      const requestBody: any = {};
      
      if (payload.placeId && typeof payload.placeId === 'string' && payload.placeId.trim().length > 0) {
        // Option 1: Use placeId (most accurate - recommended)
        requestBody.placeId = payload.placeId.trim();
        if (__DEV__) {
          console.log('🔍 [updateLocation] Saving provider location using placeId:', {
            placeId: requestBody.placeId,
            endpoint: '/api/provider/location',
          });
        }
      } else if (payload.latitude !== undefined && payload.longitude !== undefined && 
                 !isNaN(payload.latitude) && !isNaN(payload.longitude)) {
        // Option 2: Use coordinates
        requestBody.latitude = payload.latitude;
        requestBody.longitude = payload.longitude;
        if (__DEV__) {
          console.log('🔍 [updateLocation] Saving provider location using coordinates:', {
            latitude: requestBody.latitude,
            longitude: requestBody.longitude,
            endpoint: '/api/provider/location',
          });
        }
      } else if (payload.address && typeof payload.address === 'string') {
        // Option 3: Use address (fallback)
        const cleanAddress = payload.address.trim().replace(/[\n\r\t]+/g, ' ').replace(/\s+/g, ' ').trim();
        
        if (!cleanAddress || cleanAddress.length === 0) {
          throw new Error('Address is required and cannot be empty');
        }
        
        requestBody.address = cleanAddress;
        if (__DEV__) {
          console.log('🔍 [updateLocation] Saving provider location using address:', {
            address: cleanAddress,
            addressLength: cleanAddress.length,
            endpoint: '/api/provider/location',
          });
        }
      } else {
        throw new Error('Either placeId, coordinates (latitude/longitude), or address must be provided');
      }
      
      // PUT method ensures the location is REPLACED, not added
      // The backend will remove the old location and save the new one
      const response = await apiClient.put<{ data: { providerId: number; location: SavedLocation; message: string } }>(
        `/api/provider/location`,
        requestBody
      );
      
      if (__DEV__) {
        console.log('✅ [updateLocation] Provider location REPLACED successfully:', {
          providerId: response.data?.providerId,
          location: response.data?.location,
          hasCoordinates: !!(response.data?.location?.latitude && response.data?.location?.longitude),
          coordinates: response.data?.location?.latitude && response.data?.location?.longitude 
            ? { lat: response.data.location.latitude, lng: response.data.location.longitude }
            : null,
          address: response.data?.location?.formattedAddress || response.data?.location?.address,
          note: 'Old location has been replaced with this new location',
        });
      }
      
      return response.data;
    } catch (error: any) {
      // If it's already an AuthError, re-throw it
      if (error instanceof AuthError) {
        throw error;
      }

      // For 401 errors, throw AuthError to trigger automatic logout
      const status = error?.status || 500;
      if (status === 401) {
        throw new AuthError('Your session has expired. Please sign in again.');
      }

      console.error('Error updating provider location:', error);
      throw error;
    }
  },

  /**
   * Add service categories (providerId extracted from token automatically)
   */
  addCategories: async (categories: string[]): Promise<{ providerId: number; categories: string[]; message: string }> => {
    try {
      const response = await apiClient.post<{ data: { providerId: number; categories: string[]; message: string } }>(
        `/api/provider/categories`,
        { categories }
      );
      return response.data;
    } catch (error) {
      console.error('Error adding categories:', error);
      throw error;
    }
  },

  /**
   * Get all service categories a provider offers
   * Categories are included in the provider response from /api/provider
   * This method extracts categories from provider data and formats them
   */
  getServices: async (providerId?: number): Promise<{ id: number; categoryName: string }[]> => {
    try {
      // Get provider data which includes categories
      const provider = await providerService.getProvider(providerId);
      
      // Extract categories from provider response
      // Provider response has categories as array of strings: ["plumbing", "electrical"]
      // We need to convert to array of objects: [{ id: number, categoryName: string }]
      if (provider.categories && Array.isArray(provider.categories)) {
        return provider.categories.map((categoryName: string, index: number) => ({
          id: index + 1, // Use index as ID since we don't have actual IDs
          categoryName: categoryName,
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error getting provider services:', error);
      throw error;
    }
  },

  /**
   * Get nearby providers (Public endpoint)
   */
  getNearbyProviders: async (
    categoryName: string,
    latitude: number,
    longitude: number,
    maxDistanceKm: number = 50
  ): Promise<NearbyProvider[]> => {
    try {
      if (__DEV__) {
        console.log('🔍 [getNearbyProviders] Making API call:', {
          endpoint: `/api/provider/nearby?categoryName=${encodeURIComponent(categoryName)}&latitude=${latitude}&longitude=${longitude}&maxDistanceKm=${maxDistanceKm}`,
          categoryName,
          latitude,
          longitude,
          maxDistanceKm,
        });
      }
      
      const response = await apiClient.get<any>(
        `/api/provider/nearby?categoryName=${encodeURIComponent(categoryName)}&latitude=${latitude}&longitude=${longitude}&maxDistanceKm=${maxDistanceKm}`,
        { skipAuth: true }
      );

      if (__DEV__) {
        console.log('🔍 [getNearbyProviders] Raw API response:', {
          response,
          responseType: typeof response,
          isArray: Array.isArray(response),
          hasData: !!response?.data,
          dataIsArray: Array.isArray(response?.data),
          dataDataIsArray: Array.isArray(response?.data?.data),
          responseKeys: response ? Object.keys(response) : [],
        });
      }

      const extracted = extractResponseData<NearbyProvider[]>(response) || [];
      
      if (__DEV__) {
        console.log('🔍 [getNearbyProviders] Extracted data:', {
          extracted,
          extractedType: typeof extracted,
          isArray: Array.isArray(extracted),
          length: Array.isArray(extracted) ? extracted.length : 'not an array',
          firstItem: Array.isArray(extracted) && extracted.length > 0 ? extracted[0] : null,
        });
      }

      return extracted;
    } catch (error: any) {
      if (__DEV__) {
        console.log('🔍 [getNearbyProviders] Error caught:', {
          error,
          errorType: typeof error,
          errorName: error?.name,
          errorMessage: error?.message,
          errorStatus: error?.status,
          errorDetails: error?.details,
        });
      }
      console.error('Error getting nearby providers:', error);
      return [];
    }
  },

  /**
   * Get available requests (providerId extracted from token automatically)
   */
  getAvailableRequests: async (maxDistanceKm: number = 50): Promise<AvailableRequest[]> => {
    try {
      if (__DEV__) {
        console.log('🔍 [getAvailableRequests] Making API call:', {
          endpoint: `/api/provider/requests/available?maxDistanceKm=${maxDistanceKm}`,
          maxDistanceKm,
        });
      }
      
      const response = await apiClient.get<any>(
        `/api/provider/requests/available?maxDistanceKm=${maxDistanceKm}`
      );
      
      if (__DEV__) {
        console.log('🔍 [getAvailableRequests] Raw API response:', {
          response,
          responseType: typeof response,
          isArray: Array.isArray(response),
          hasData: !!response?.data,
          dataIsArray: Array.isArray(response?.data),
          dataDataIsArray: Array.isArray(response?.data?.data),
          responseKeys: response ? Object.keys(response) : [],
          responseDataKeys: response?.data ? Object.keys(response.data) : [],
        });
      }
      
      // Handle nested response structure: response.data.data
      // The API returns: { data: { data: [...] } }
      let extracted: AvailableRequest[] = [];
      
      // Try multiple extraction strategies
      if (Array.isArray(response)) {
        extracted = response;
      } else if (Array.isArray(response?.data?.data)) {
        // Nested structure: { data: { data: [...] } }
        extracted = response.data.data;
      } else if (Array.isArray(response?.data)) {
        // Direct structure: { data: [...] }
        extracted = response.data;
      }
      
      // Ensure we have an array
      if (!Array.isArray(extracted)) {
        extracted = [];
      }
      
      if (__DEV__) {
        console.log('🔍 [getAvailableRequests] Extracted data:', {
          extracted,
          extractedType: typeof extracted,
          isArray: Array.isArray(extracted),
          length: Array.isArray(extracted) ? extracted.length : 'not an array',
          firstItem: Array.isArray(extracted) && extracted.length > 0 ? extracted[0] : null,
          responseStructure: {
            isResponseArray: Array.isArray(response),
            hasData: !!response?.data,
            isDataArray: Array.isArray(response?.data),
            hasDataData: !!response?.data?.data,
            isDataDataArray: Array.isArray(response?.data?.data),
            dataDataLength: Array.isArray(response?.data?.data) ? response.data.data.length : 'not array',
            dataDataFirstItem: Array.isArray(response?.data?.data) && response.data.data.length > 0 ? response.data.data[0] : null,
          },
        });
      }
      
      return extracted;
    } catch (error: any) {
      if (__DEV__) {
        console.log('🔍 [getAvailableRequests] Error caught:', {
          error,
          errorType: typeof error,
          errorName: error?.name,
          errorMessage: error?.message,
          errorStatus: error?.status,
          errorDetails: error?.details,
          isAuthError: error instanceof AuthError,
        });
      }
      
      // If it's already an AuthError, re-throw it silently (no logging)
      if (error instanceof AuthError) {
        throw error;
      }
      // Don't log errors - let the UI layer handle them
      throw error;
    }
  },

  /**
   * Accept a service request (providerId extracted from token automatically)
   */
  acceptRequest: async (requestId: number): Promise<{
    requestId: number;
    status: string;
    provider: { id: number; name: string; phoneNumber: string };
    user: { id: number; firstName: string; lastName: string; phoneNumber: string; email: string };
    message: string;
  }> => {
    try {
      const response = await apiClient.post<{
        data: {
          requestId: number;
          status: string;
          provider: { id: number; name: string; phoneNumber: string };
          user: { id: number; firstName: string; lastName: string; phoneNumber: string; email: string };
          message: string;
        };
      }>(`/api/provider/requests/${requestId}/accept`);
      return response.data;
    } catch (error) {
      console.error('Error accepting request:', error);
      throw error;
    }
  },

  /**
   * Get accepted requests (providerId extracted from token automatically)
   */
  getAcceptedRequests: async (): Promise<ServiceRequest[]> => {
    try {
      const response = await apiClient.get<any>(`/api/provider/requests/accepted`);
      return extractResponseData<ServiceRequest[]>(response) || [];
    } catch (error: any) {
      // If it's an AuthError, re-throw it (don't return empty array)
      if (error instanceof AuthError) {
        throw error;
      }
      // For other errors, return empty array (don't log)
      return [];
    }
  },

  /**
   * Reject a service request (providerId extracted from token automatically)
   */
  rejectRequest: async (requestId: number): Promise<{
    requestId: number;
    acceptanceId: number;
    status: string;
    message: string;
  }> => {
    try {
      const response = await apiClient.post<{
        data: {
          requestId: number;
          acceptanceId: number;
          status: string;
          message: string;
        };
      }>(`/api/provider/requests/${requestId}/reject`);
      return response.data;
    } catch (error) {
      console.error('Error rejecting request:', error);
      throw error;
    }
  },

  /**
   * Send quotation for a service request (providerId extracted from token automatically)
   * 
   * IMPORTANT: Provider must accept the request first before sending quotation
   * 
   * @param requestId - The service request ID (from client's request)
   * @param payload - Quotation details (labor, logistics, materials, etc.)
   * @returns Quotation response with calculated total
   */
  sendQuotation: async (
    requestId: number,
    payload: SendQuotationPayload
  ): Promise<SendQuotationResponse> => {
    try {
      const response = await apiClient.post<{
        data: SendQuotationResponse;
      }>(`/api/request-service/requests/${requestId}/quotation`, payload);
      
      return response.data;
    } catch (error) {
      console.error('Error sending quotation:', error);
      throw error;
    }
  },

  /**
   * Get provider's own quotation for a request (providerId extracted from token automatically)
   * Endpoint 6.2: GET /api/request-service/requests/:requestId/quotation
   */
  getQuotation: async (requestId: number): Promise<Quotation> => {
    try {
      const response = await apiClient.get<{
        data: Quotation;
      }>(`/api/request-service/requests/${requestId}/quotation`);
      
      return response.data;
    } catch (error) {
      console.error('Error getting quotation:', error);
      throw error;
    }
  },

  /**
   * Get all quotations provider has sent (providerId extracted from token automatically)
   * Endpoint 6.6: GET /api/provider/quotations
   */
  getProviderQuotations: async (): Promise<ProviderQuotationListItem[]> => {
    try {
      const response = await apiClient.get<{
        data: ProviderQuotationListItem[];
      }>(`/api/provider/quotations`);
      
      return extractResponseData<ProviderQuotationListItem[]>(response) || [];
    } catch (error) {
      console.error('Error getting provider quotations:', error);
      throw error;
    }
  },
};
