import AsyncStorage from '@react-native-async-storage/async-storage';
import { UpdateProfilePayload, UserProfile } from '../types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://bamibuildit-backend-v1.onrender.com';
const AUTH_TOKEN_KEY = '@ghands:auth_token';
const REFRESH_TOKEN_KEY = '@ghands:refresh_token';
const USER_ID_KEY = '@ghands:user_id';

// Import token utility
import { extractUserIdFromToken } from '../utils/tokenUtils';

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
        if (token && this.isValidToken(token)) {
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${token}`,
          };
        } else if (token && !this.isValidToken(token)) {
          // Token is corrupted, clear it
          if (__DEV__) {
            console.warn('⚠️ Corrupted token detected in request interceptor, clearing...');
          }
          await this.clearAuthTokens();
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
   * Validate token format
   * Accepts both JWT tokens (3 parts separated by dots) and UUID tokens
   */
  private isValidToken(token: string | null | undefined): boolean {
    // Strict type checking - handle null, undefined, and non-string values
    if (token === null || token === undefined) return false;
    if (typeof token !== 'string') return false;
    
    // Safe trim with additional check
    const trimmed = String(token).trim();
    if (!trimmed || trimmed.length < 10) return false; // Minimum token length
    
    // Check if it's a JWT token (3 parts separated by dots)
    const parts = trimmed.split('.');
    if (parts.length === 3) {
      // JWT format - each part should have content
      return parts.every(part => part.length > 0);
    }
    
    // Check if it's a UUID format (e.g., "3484fd98-b271-4824-ba57-af0ab2c8858a")
    // UUIDs have format: 8-4-4-4-12 characters separated by hyphens
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidPattern.test(trimmed)) {
      return true;
    }
    
    // Accept any token that's at least 10 characters (fallback for other formats)
    return trimmed.length >= 10;
  }

  /**
   * Get auth token from storage
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      
      // Handle null, undefined, or empty string
      if (!token || token === 'null' || token === 'undefined' || (typeof token === 'string' && token.trim() === '')) {
        return null;
      }
      
      // Validate token format
      if (!this.isValidToken(token)) {
        if (__DEV__) {
          console.warn('⚠️ Invalid token format detected, clearing corrupted token');
        }
        // Clear corrupted token
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
        await AsyncStorage.removeItem(USER_ID_KEY);
        return null;
      }
      
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Public method to get auth token (for use in services)
   */
  async getAuthTokenPublic(): Promise<string | null> {
    return this.getAuthToken();
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
  /**
   * Get user ID from storage
   * This method prioritizes stored user ID over token extraction
   * because the backend might not return tokens but we still have the user ID
   */
  async getUserId(): Promise<number | null> {
    try {
      // First, check if we have user ID in storage (most reliable)
      const userId = await AsyncStorage.getItem(USER_ID_KEY);
      if (userId) {
        const parsed = parseInt(userId, 10);
        if (!isNaN(parsed)) {
          if (__DEV__) {
            console.log('✅ User ID retrieved from storage:', parsed);
          }
          return parsed;
        }
      }
      
      // If not found in storage, try to extract from token (fallback)
      const token = await this.getAuthToken();
      if (token && this.isValidToken(token)) {
        const extractedUserId = extractUserIdFromToken(token);
        if (extractedUserId) {
          // Save it for future use
          await this.setUserId(extractedUserId);
          if (__DEV__) {
            console.log('✅ User ID extracted from token and saved:', extractedUserId);
          }
          return extractedUserId;
        }
      }
      
      if (__DEV__) {
        console.warn('⚠️ No user ID found in storage or token');
      }
      
      return null;
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
   * Check if error is a network error (should be retried)
   */
  private isNetworkError(error: any): boolean {
    if (!error) return false;
    
    // Check for common network error patterns
    const errorMessage = error.message || error.toString() || '';
    const isNetworkFailure = 
      errorMessage.includes('Network request failed') ||
      errorMessage.includes('Failed to fetch') ||
      errorMessage.includes('NetworkError') ||
      errorMessage.includes('TypeError') ||
      error.name === 'TypeError' ||
      error.name === 'NetworkError';
    
    return isNetworkFailure;
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
        // Log fetch attempt for location endpoints
        if (__DEV__ && (url.includes('/location/search') || url.includes('/location/current'))) {
          console.log(`🌐 Fetch attempt ${attempt + 1}/${retries + 1}:`, url);
        }
        
        const response = await fetch(url, config);
        
        // Log response for location endpoints
        if (__DEV__ && (url.includes('/location/search') || url.includes('/location/current'))) {
          console.log('📥 ========== FETCH RESPONSE ==========');
          console.log('📥 URL:', url);
          console.log('📥 Status:', response.status);
          console.log('📥 Status Text:', response.statusText);
          console.log('📥 OK:', response.ok);
          console.log('📥 Headers:', Object.fromEntries(response.headers.entries()));
          console.log('📥 ====================================');
        }
        
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
          // Clone response to read it without consuming the stream
          const responseClone = response.clone();
          const errorData = await responseClone.json();
          errorDetails = errorData;
          
          // API documentation shows error format: { "error": "Error message" }
          // But actual format seems to be: { "data": { "error": "..." }, "success": false }
          // Check nested data.error first, then top-level error
          if (errorData.data?.error) {
            errorMessage = errorData.data.error;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.errorMessage) {
            errorMessage = errorData.errorMessage;
          } else if (errorData.data?.message) {
            errorMessage = errorData.data.message;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else if (response.statusText && response.statusText !== 'OK') {
            errorMessage = response.statusText;
          }
          
          // Log for debugging
          if (__DEV__) {
            console.log('🔴 API Error Response (retry):', {
              status: statusCode,
              statusText: response.statusText,
              fullErrorData: JSON.stringify(errorData, null, 2),
              extractedMessage: errorMessage,
            });
          }
        } catch (parseError) {
          // If JSON parsing fails, try to get text
          try {
            const responseClone = response.clone();
            const text = await responseClone.text();
            
            // Check if response is HTML (server error page)
            if (text && (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html') || text.trim().startsWith('<HTML'))) {
              // Extract error message from HTML if possible
              const errorMatch = text.match(/<pre[^>]*>(.*?)<\/pre>/i) || 
                                   text.match(/<title[^>]*>(.*?)<\/title>/i) ||
                                   text.match(/Internal Server Error/i);
              
              if (errorMatch && errorMatch[1]) {
                errorMessage = `Server error: ${errorMatch[1].trim()}`;
              } else if (text.includes('Internal Server Error')) {
                errorMessage = 'Server error: The server encountered an internal error. Please try again later or contact support.';
              } else {
                errorMessage = 'Server error: The server returned an unexpected response. Please try again later.';
              }
              
              if (__DEV__) {
                console.log('🔴 Server returned HTML error page (500 error)');
                console.log('🔴 HTML Response (first 500 chars):', text.substring(0, 500));
              }
            } else if (text && text.length < 500) { // Only use text if it's reasonable length
              // Try to parse as JSON if it looks like JSON
              try {
                const parsed = JSON.parse(text);
                errorMessage = parsed.error || parsed.message || text;
              } catch {
                errorMessage = text;
              }
            } else {
              errorMessage = response.statusText || `Request failed with status ${statusCode}`;
            }
          } catch (textError) {
            errorMessage = response.statusText || `Request failed with status ${statusCode}`;
          }
          
          if (__DEV__) {
            console.log('Error parsing response:', parseError);
          }
        }
        
        // Create error with status code and details
        const error = new Error(errorMessage) as any;
        error.status = statusCode;
        error.statusText = response.statusText;
        error.details = errorDetails;
        error.originalError = errorDetails;
        throw error;
      }

        const processedResponse = await this.applyResponseInterceptors(response);
        const jsonData = await processedResponse.json();
        
        // Attach headers to response data for login endpoint (to check for token in headers)
        if (__DEV__ && processedResponse.url?.includes('/login')) {
          const headers: any = {};
          processedResponse.headers.forEach((value, key) => {
            headers[key] = value;
          });
          (jsonData as any).__headers = headers;
        }
        
        return jsonData;
      } catch (error) {
        const isNetworkErr = this.isNetworkError(error);
        
        // Retry network errors
        if (isNetworkErr && attempt < retries) {
          const delay = retryDelay * Math.pow(2, attempt);
          if (__DEV__) {
            console.log(`🔄 Network error, retrying (${attempt + 1}/${retries}) after ${delay}ms...`);
          }
          await this.sleep(delay);
          continue;
        }
        
        // If it's the last attempt or not a network error, throw
        if (attempt === retries) {
          // Create user-friendly error message
          let errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
          
          if (isNetworkErr) {
            errorMessage = 'Network connection failed. Please check your internet connection and try again.';
          } else if (error instanceof Error) {
            errorMessage = error.message || errorMessage;
          }
          
          const errorObj = error instanceof Error 
            ? Object.assign(new Error(errorMessage), { 
                message: errorMessage, 
                isNetworkError: isNetworkErr,
                originalError: error 
              })
            : new Error(errorMessage);
          
          const processedError = await this.applyErrorInterceptors(errorObj);
          throw processedError;
        }
        
        // For non-network errors on non-final attempts, still retry
        const delay = retryDelay * Math.pow(2, attempt);
        await this.sleep(delay);
      }
    }
    
    throw new Error('Request failed after all retry attempts. Please check your internet connection.');
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

    // Log request details for location endpoints (for debugging)
    if (__DEV__ && (endpoint.includes('/location/search') || endpoint.includes('/location/current'))) {
      console.log('🌐 ========== FETCH REQUEST ==========');
      console.log('🌐 URL:', url);
      console.log('🌐 Method:', fetchOptions.method || 'GET');
      console.log('🌐 Headers:', JSON.stringify(fetchOptions.headers, null, 2));
      console.log('🌐 Skip Auth:', options.skipAuth);
      console.log('🌐 ===================================');
    }

    // Make request with retry logic
    // Always use retry for network resilience
    const effectiveRetries = retries > 0 ? retries : DEFAULT_RETRY_OPTIONS.maxRetries || 2;
    return this.retryRequest<T>(url, fetchOptions as RequestInit, effectiveRetries, retryDelay);

  }

  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    // Log POST requests for debugging
    if (__DEV__ && endpoint.includes('/signup')) {
      console.log('📡 POST Request:', {
        endpoint,
        url: `${this.baseUrl}${endpoint}`,
        data: data ? JSON.stringify(data, null, 2) : 'no data',
        timestamp: new Date().toISOString(),
      });
    }
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
  placeId?: string; // Optional for reverse geocoding (current location)
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

    const fullUrl = `${API_BASE_URL}/api/user/location/search?query=${encodeURIComponent(query)}`;
    
    if (__DEV__) {
      console.log('🔍 ========== LOCATION SEARCH REQUEST ==========');
      console.log('🔍 Query:', query);
      console.log('🔍 Encoded Query:', encodeURIComponent(query));
      console.log('🔍 Full URL:', fullUrl);
      console.log('🔍 Base URL:', API_BASE_URL);
      console.log('🔍 =============================================');
    }

    try {
      const response = await apiClient.get<any>(
        `/api/user/location/search?query=${encodeURIComponent(query)}`,
        { skipAuth: true }
      );
      
      // Backend returns: { success: true, message: "Success", data: { data: [...] } }
      // Extract the nested data array
      const locations = (response.data?.data || response.data || []) as LocationSearchResult[];
      
      if (__DEV__) {
        console.log('✅ Location Search Response:', {
          hasData: !!locations,
          dataLength: locations.length,
          firstResult: locations[0] || null,
          responseStructure: {
            hasSuccess: !!response.success,
            hasData: !!response.data,
            hasNestedData: !!response.data?.data,
          },
        });
      }
      
      return locations;
    } catch (error: any) {
      console.error('❌ Error searching locations:', error);
      
      // Detailed error logging for backend team
      if (__DEV__) {
        console.error('❌ ========== LOCATION SEARCH ERROR DETAILS ==========');
        console.error('❌ Request URL:', fullUrl);
        console.error('❌ Query:', query);
        console.error('❌ Error Message:', error.message);
        console.error('❌ Error Status:', error.status);
        console.error('❌ Error StatusText:', error.statusText);
        console.error('❌ Error Details:', JSON.stringify(error.details, null, 2));
        console.error('❌ Full Error:', JSON.stringify(error, null, 2));
        console.error('❌ =================================================');
      }
      
      // Check if it's a Google Maps API key error (backend configuration issue)
      const errorMessage = error.details?.data?.error || error.details?.error || error.message || '';
      const isGoogleApiKeyError = errorMessage.includes('API key') || 
                                   errorMessage.includes('REQUEST_DENIED') ||
                                   errorMessage.includes('Google Maps');
      const isNetworkError = errorMessage.includes('Network') || 
                            errorMessage.includes('Failed to fetch');
      
      if (isGoogleApiKeyError && __DEV__) {
        console.warn(
          '⚠️ Backend Google Maps API Key Missing:\n' +
          'The backend API needs to configure a Google Maps API key.\n' +
          'Location search will be disabled until backend is configured.\n' +
          'Users can still enter locations manually.'
        );
      }
      
      if (isNetworkError && __DEV__) {
        console.error('⚠️ Network Error - Backend might be unreachable or CORS issue');
        console.error('⚠️ Check if backend allows requests from mobile app');
        console.error('⚠️ Check if backend server is running and accessible');
      }
      
      // Throw error so UI can catch and display appropriate message
      throw error;
    }
  },

  /**
   * Get full location details from placeId
   * GET /api/user/location/details?placeId=ChIJ...
   */
  getLocationDetails: async (placeId: string): Promise<LocationDetails> => {
    try {
      const response = await apiClient.get<any>(
        `/api/user/location/details?placeId=${encodeURIComponent(placeId)}`,
        { skipAuth: true }
      );
      
      // Backend returns: { success: true, message: "Success", data: { data: {...} } }
      // Extract the nested data object
      const locationDetails = (response.data?.data || response.data) as LocationDetails;
      
      if (!locationDetails || !locationDetails.placeId) {
        throw new Error('Invalid location details response from API');
      }
      
      return locationDetails;
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
    const fullUrl = `${API_BASE_URL}/api/user/location/current?latitude=${latitude}&longitude=${longitude}`;
    
    if (__DEV__) {
      console.log('🔍 ========== REVERSE GEOCODING REQUEST ==========');
      console.log('🔍 Latitude:', latitude);
      console.log('🔍 Longitude:', longitude);
      console.log('🔍 Full URL:', fullUrl);
      console.log('🔍 Base URL:', API_BASE_URL);
      console.log('🔍 =============================================');
    }

    try {
      const response = await apiClient.get<any>(
        `/api/user/location/current?latitude=${latitude}&longitude=${longitude}`,
        { skipAuth: true }
      );
      
      // Backend returns: { success: true, message: "Success", data: { data: {...} } }
      // Extract the nested data object
      const locationDetails = (response.data?.data || response.data) as any;
      
      if (__DEV__) {
        console.log('✅ Reverse Geocoding Response:', {
          hasData: !!locationDetails,
          formattedAddress: locationDetails?.formattedAddress,
          fullAddress: locationDetails?.fullAddress,
          city: locationDetails?.city,
          placeId: locationDetails?.placeId,
          fullLocationDetails: JSON.stringify(locationDetails, null, 2),
          responseStructure: {
            hasSuccess: !!response.success,
            hasData: !!response.data,
            hasNestedData: !!response.data?.data,
          },
        });
      }
      
      // Validate response data - formattedAddress or fullAddress is required
      if (!locationDetails) {
        throw new Error('Invalid response from location API - no data received');
      }
      
      // Backend returns 'fullAddress' instead of 'formattedAddress' for reverse geocoding
      // Map fullAddress to formattedAddress if needed
      const formattedAddress = locationDetails.formattedAddress || locationDetails.fullAddress;
      
      if (!formattedAddress) {
        // Log the actual response to help debug
        if (__DEV__) {
          console.error('❌ Reverse Geocoding - Missing formattedAddress/fullAddress:', {
            locationDetails,
            fullResponse: JSON.stringify(response, null, 2),
          });
        }
        throw new Error('Invalid response from location API - missing formattedAddress or fullAddress');
      }
      
      // Normalize the response to match LocationDetails interface
      const normalizedDetails: LocationDetails = {
        placeId: locationDetails.placeId,
        formattedAddress: formattedAddress,
        latitude: locationDetails.latitude,
        longitude: locationDetails.longitude,
        city: locationDetails.city || '',
        state: locationDetails.state || '',
        country: locationDetails.country || '',
        address: locationDetails.address || locationDetails.fullAddress || formattedAddress,
      };
      
      // For reverse geocoding, placeId might not be available
      // Generate a temporary placeId from coordinates if missing
      if (!normalizedDetails.placeId && normalizedDetails.latitude && normalizedDetails.longitude) {
        normalizedDetails.placeId = `lat_${normalizedDetails.latitude}_${normalizedDetails.longitude}`;
        if (__DEV__) {
          console.log('⚠️ Generated temporary placeId for reverse geocoding:', normalizedDetails.placeId);
        }
      }
      
      return normalizedDetails;
    } catch (error: any) {
      console.error('❌ Error getting current location:', error);
      
      // Detailed error logging for backend team
      if (__DEV__) {
        console.error('❌ ========== REVERSE GEOCODING ERROR DETAILS ==========');
        console.error('❌ Request URL:', fullUrl);
        console.error('❌ Latitude:', latitude);
        console.error('❌ Longitude:', longitude);
        console.error('❌ Error Message:', error.message);
        console.error('❌ Error Status:', error.status);
        console.error('❌ Error StatusText:', error.statusText);
        console.error('❌ Error Details:', JSON.stringify(error.details, null, 2));
        console.error('❌ Full Error:', JSON.stringify(error, null, 2));
        console.error('❌ ====================================================');
      }
      
      // Don't return fallback - throw error so UI can handle it properly
      throw error;
    }
  },

  /**
   * Save or update user's location
   * POST /api/user/update-location
   */
  saveUserLocation: async (
    userId: number, // Kept for internal validation, but not sent to API
    options: { placeId?: string; latitude?: number; longitude?: number }
  ): Promise<SavedLocation> => {
    try {
      // userId is automatically extracted from token, don't send it
      // Build body object explicitly without userId
      const body: { placeId?: string; latitude?: number; longitude?: number } = {};

      if (options.placeId) {
        body.placeId = options.placeId;
      } else if (options.latitude !== undefined && options.longitude !== undefined) {
        body.latitude = options.latitude;
        body.longitude = options.longitude;
      } else {
        throw new Error('Either placeId or latitude/longitude must be provided');
      }

      // Explicitly ensure userId is NOT in the body
      if ('userId' in body) {
        delete (body as any).userId;
      }

      if (__DEV__) {
        console.log('📤 Saving user location with payload:', JSON.stringify(body, null, 2));
        console.log('📤 Payload keys:', Object.keys(body));
        console.log('📤 Note: userId is extracted from token automatically (NOT in payload)');
        // Verify userId is not in body
        if ((body as any).userId !== undefined) {
          console.error('❌ ERROR: userId found in body! This should not happen.');
        }
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
   * GET /api/user/location
   * Note: userId is automatically extracted from token, don't pass it
   */
  getUserLocation: async (userId: number): Promise<SavedLocation | null> => {
    try {
      // userId is automatically extracted from token, don't pass it as query parameter
      const response = await apiClient.get<{ data: SavedLocation }>(
        '/api/user/location'
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

// ============================================================================
// AUTHENTICATION SERVICE
// ============================================================================

export interface UserSignupPayload {
  email: string;
  password: string; // Minimum 6 characters
  phoneNumber?: string; // Optional, exactly 11 characters
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
  companyName: string;
  companyPhoneNumber: string; // Exactly 11 characters
  companyEmail: string;
  companyPassword: string; // Minimum 6 characters
}

export interface CompanySignupResponse {
  id: number;
  companyName: string;
  companyPhoneNumber: string;
  companyEmail: string;
  token: string;
}

export const authService = {
  /**
   * User Signup
   * POST /api/user/signup
   */
  userSignup: async (payload: UserSignupPayload): Promise<UserSignupResponse> => {
    try {
      // Log the exact payload being sent for debugging
      if (__DEV__) {
        console.log('🔵 Signup Request Payload:', JSON.stringify(payload, null, 2));
        console.log('🔵 Signup Endpoint: /api/user/signup');
        console.log('🔵 Full URL:', `${API_BASE_URL}/api/user/signup`);
      }
      
      // API returns: { success: true, message: "Success", data: { data: { token, email, phoneNumber } } }
      const response = await apiClient.post<{ 
        success: boolean;
        message: string;
        data: { 
          data: {
            token: string;
            email: string;
            phoneNumber: string | null;
          }
        }
      }>(
        '/api/user/signup',
        payload,
        { skipAuth: true }
      );
      
      if (__DEV__) {
        console.log('✅ Signup Response:', JSON.stringify(response, null, 2));
      }
      
      // Handle multiple possible response structures (same as login)
      // Extract token from various locations
      const responseAny = response as any;
      const token = 
        response.data?.data?.token || 
        responseAny.data?.token || 
        responseAny.token ||
        responseAny.data?.token;
      
      const email = 
        response.data?.data?.email || 
        responseAny.data?.email ||
        responseAny.email ||
        payload.email;
      
      const phoneNumber = 
        response.data?.data?.phoneNumber || 
        responseAny.data?.phoneNumber ||
        responseAny.phoneNumber ||
        payload.phoneNumber;
      
      // Check for user ID in all possible locations
      const userId = 
        (response.data?.data as any)?.id || 
        (response.data?.data as any)?.userId || 
        (response.data as any)?.id || 
        (response.data as any)?.userId ||
        (response as any).user?.id ||
        (response as any).user?.userId ||
        (response as any)?.id ||
        (response as any)?.userId;
      
      // Save user ID FIRST (we need this even if token is missing)
      if (userId) {
        await apiClient.setUserId(userId);
        if (__DEV__) {
          console.log('✅ User ID saved from signup response:', userId);
        }
      }
      
      if (!token) {
        if (__DEV__) {
          console.warn('⚠️ ========== TOKEN NOT FOUND IN SIGNUP RESPONSE ==========');
          console.warn('⚠️ Backend is not returning a token in the signup response.');
          console.warn('⚠️ This is a backend issue - the API should return a JWT token.');
          console.warn('⚠️ Response structure:', JSON.stringify(response, null, 2));
          console.warn('⚠️ =======================================================');
        }
        
        // WORKAROUND: If we have user ID but no token, save user ID and continue
        if (userId && email) {
          if (__DEV__) {
            console.warn('⚠️ WORKAROUND: Proceeding with signup without token.');
            console.warn('⚠️ User ID saved:', userId);
            console.warn('⚠️ Subsequent API calls may fail if token is required.');
          }
          
          // Return success without token - the app can continue
          return {
            email: email,
            token: '', // Empty token - will cause auth to fail on protected routes
            id: userId,
            firstName: '',
            lastName: '',
          };
        }
        
        // If we don't even have user data, this is a real error
        throw new Error('Signup failed: No user data or token received from server.');
      }
      
      // Save token (normal flow)
      await apiClient.setAuthToken(token);
      
      if (__DEV__) {
        console.log('✅ Token saved successfully');
      }
      
      // If we didn't get user ID from response, try to extract from token
      // Note: UUID tokens don't contain user ID, only JWT tokens do
      if (!userId) {
        // Only try to extract from JWT tokens (UUID tokens don't have user ID)
        const isJWT = token.split('.').length === 3;
        if (isJWT) {
          const extractedUserId = extractUserIdFromToken(token);
          if (extractedUserId) {
            await apiClient.setUserId(extractedUserId);
            if (__DEV__) {
              console.log('✅ User ID extracted from JWT token:', extractedUserId);
            }
          } else {
            if (__DEV__) {
              console.warn('⚠️ User ID not found in signup response or JWT token payload.');
              console.warn('⚠️ Backend should return user ID in signup response.');
            }
          }
        } else {
          // Token is UUID format - cannot extract user ID from it
          if (__DEV__) {
            console.warn('⚠️ Token is UUID format - cannot extract user ID from it.');
            console.warn('⚠️ Backend MUST return user ID in signup response.');
            console.warn('⚠️ Expected: response.data.data.id or response.data.data.userId');
          }
        }
      }
      
      // Return the user data in the expected format
      return {
        email: email || payload.email,
        token: token,
        id: userId,
        firstName: '', // API doesn't return firstName in signup response
        lastName: '', // API doesn't return lastName in signup response
      };
    } catch (error: any) {
      if (__DEV__) {
        console.error('❌ Signup Error Details:', {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          details: error.details,
          error: error.error,
        });
      }
      console.error('Error during user signup:', error);
      throw error;
    }
  },

  /**
   * Company Signup
   * POST /api/user/company-signup
   */
  companySignup: async (payload: CompanySignupPayload): Promise<CompanySignupResponse> => {
    try {
      const response = await apiClient.post<{ data: CompanySignupResponse }>(
        '/api/user/company-signup',
        payload,
        { skipAuth: true }
      );
      const { token, ...companyData } = response.data;
      await apiClient.setAuthToken(token);
      if (response.data.id) {
        await apiClient.setUserId(response.data.id);
      }
      return response.data;
    } catch (error: any) {
      console.error('Error during company signup:', error);
      throw error;
    }
  },

  /**
   * User Login
   * POST /api/user/login
   */
  userLogin: async (payload: UserLoginPayload): Promise<UserLoginResponse> => {
    try {
      if (__DEV__) {
        console.log('🔵 ========== LOGIN REQUEST ==========');
        console.log('🔵 Endpoint: POST /api/user/login');
        console.log('🔵 Full URL:', `${API_BASE_URL}/api/user/login`);
        console.log('🔵 Payload:', JSON.stringify(payload, null, 2));
        console.log('🔵 ====================================');
      }
      
      // API response structure can vary:
      // 1. { data: { data: { token, email, id, ... } } }
      // 2. { data: { token, email, id, ... } }
      // 3. { token, email, id, ... }
      // 4. { message: "...", user: { id, email, ... }, token: ... }
      // 5. { message: "...", user: { id, email, ... } } (token might be in header/cookie)
      const response = await apiClient.post<any>(
        '/api/user/login',
        payload,
        { skipAuth: true }
      );
      
      if (__DEV__) {
        console.log('✅ Login Success Response:', JSON.stringify(response, null, 2));
        console.log('🔍 Response structure check:', {
          hasData: !!response.data,
          hasDataData: !!response.data?.data,
          hasToken: !!response.data?.data?.token || !!response.data?.token || !!(response as any).token,
          hasUser: !!(response as any).user,
          responseKeys: Object.keys(response || {}),
          dataKeys: response.data ? Object.keys(response.data) : [],
        });
      }
      
      // Handle multiple possible response structures:
      // Check response headers for token (if available)
      const responseHeaders = (response as any)?.__headers;
      const tokenFromHeader = responseHeaders?.['authorization'] || 
                             responseHeaders?.['Authorization'] ||
                             responseHeaders?.['x-auth-token'] ||
                             responseHeaders?.['X-Auth-Token'];
      
      // Try all possible token locations (body first, then headers)
      const token = 
        response?.data?.data?.token || 
        response?.data?.token || 
        response?.token ||
        (response as any)?.accessToken ||
        (response as any)?.authToken ||
        (tokenFromHeader?.startsWith('Bearer ') ? tokenFromHeader.substring(7) : tokenFromHeader);
      
      // Extract email from various locations
      const email = 
        response?.data?.data?.email || 
        response?.data?.email || 
        response?.user?.email ||
        (response as any)?.email ||
        payload.email;
      
      // Check for user ID in all possible locations
      const id = 
        response?.data?.data?.id || 
        response?.data?.data?.userId || 
        response?.data?.id || 
        response?.data?.userId ||
        response?.user?.id ||
        response?.user?.userId ||
        (response as any)?.id ||
        (response as any)?.userId;
      
      const firstName = 
        response?.data?.data?.firstName || 
        response?.data?.firstName ||
        response?.user?.firstName ||
        (response as any)?.firstName;
      
      const lastName = 
        response?.data?.data?.lastName || 
        response?.data?.lastName ||
        response?.user?.lastName ||
        (response as any)?.lastName;
      
      // Save user ID first (we have it from the response)
      if (id) {
        await apiClient.setUserId(id);
        if (__DEV__) {
          console.log('✅ User ID saved from login response:', id);
        }
      }
      
      if (!token) {
        // Log the full response structure for debugging
        if (__DEV__) {
          console.warn('⚠️ ========== TOKEN NOT FOUND IN LOGIN RESPONSE ==========');
          console.warn('⚠️ Backend is not returning a token in the login response.');
          console.warn('⚠️ This is a backend issue - the API should return a JWT token.');
          console.warn('⚠️ Response structure:', JSON.stringify(response, null, 2));
          console.warn('⚠️ =======================================================');
        }
        
        // WORKAROUND: If we have user data but no token, save user ID and continue
        // The backend might be using session-based auth (cookies) or the token might
        // be returned in a different way. We'll allow login to proceed and see if
        // subsequent API calls work without a token (they might use cookies/sessions)
        if (id && email) {
          if (__DEV__) {
            console.warn('⚠️ WORKAROUND: Proceeding with login without token.');
            console.warn('⚠️ User ID saved:', id);
            console.warn('⚠️ Subsequent API calls may fail if token is required.');
            console.warn('⚠️ If API calls fail with 401, the backend needs to be fixed to return tokens.');
          }
          
          // Return success without token - the app can continue
          // If API calls fail later, we'll know the backend needs fixing
          return {
            email: email,
            token: '', // Empty token - will cause auth to fail on protected routes
            id: id,
            firstName: firstName,
            lastName: lastName,
          };
        }
        
        // If we don't even have user data, this is a real error
        throw new Error('Login failed: No user data or token received from server.');
      }
      
      // Save token (normal flow)
      await apiClient.setAuthToken(token);
      
      // If we didn't get user ID from response, try to extract from token
      if (!id) {
        const extractedUserId = extractUserIdFromToken(token);
        if (extractedUserId) {
          await apiClient.setUserId(extractedUserId);
          if (__DEV__) {
            console.log('✅ User ID extracted from token:', extractedUserId);
          }
        } else {
          if (__DEV__) {
            console.warn('⚠️ User ID not found in login response or token. Some features may not work.');
          }
        }
      }
      
      // Return the user data in the expected format
      return {
        email: email,
        token: token,
        id: id,
        firstName: firstName,
        lastName: lastName,
      };
    } catch (error: any) {
      if (__DEV__) {
        console.error('❌ ========== LOGIN ERROR ==========');
        console.error('❌ Error Message:', error.message);
        console.error('❌ Status:', error.status);
        console.error('❌ Error Details:', JSON.stringify(error.details, null, 2));
        console.error('❌ ====================================');
      }
      console.error('Error during user login:', error);
      throw error;
    }
  },

  login: async (email: string, password: string) => {
    // Legacy method - use userLogin instead
    return authService.userLogin({ email, password });
  },
  logout: async () => {
    await apiClient.clearAuthTokens();
  },
  setAuthToken: (token: string) => apiClient.setAuthToken(token),
  clearAuthTokens: () => apiClient.clearAuthTokens(),
  getUserId: () => apiClient.getUserId(),
  setUserId: (userId: number) => apiClient.setUserId(userId),
};

// ============================================================================
// SERVICE REQUEST / BOOKING SERVICE
// ============================================================================

export interface ServiceCategory {
  name: string; // Use this as categoryName when creating request
  displayName: string; // Display this in UI
  description: string;
  providerCount: number;
  icon?: string;
}

export interface CreateServiceRequestPayload {
  userId: number;
  categoryName: string; // From category selection
  jobTitle?: string; // Optional - don't send if empty
  description?: string; // Optional - don't send if empty
  comment?: string; // Optional - don't send if empty
}

export interface CreateServiceRequestResponse {
  requestId: number; // IMPORTANT: Save this for next steps!
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
  // userId is automatically extracted from token, don't send it
  jobTitle: string; // Required, min 3, max 200 characters
  description: string; // Required, min 10, max 500 characters
  comment?: string; // Optional, max 1000 characters
  location?: LocationData; // Optional - if not provided, uses user's saved location
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
  // userId is automatically extracted from token, don't send it
  scheduledDate: string; // ISO date string (YYYY-MM-DD)
  scheduledTime: string; // Format: "HH:MM AM/PM" (e.g., "10:00 AM", "02:30 PM")
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
}

export const serviceRequestService = {
  /**
   * Get all categories
   * GET /api/request-service/categories
   */
  getCategories: async (): Promise<ServiceCategory[]> => {
    try {
      // API might return: { data: [...] } or { data: { data: [...] } }
      const response = await apiClient.get<{ 
        data?: ServiceCategory[] | { data: ServiceCategory[] };
        success?: boolean;
      }>(
        '/api/request-service/categories',
        { skipAuth: true }
      );
      
      // Handle nested structure
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && typeof response.data === 'object' && 'data' in response.data) {
        const nestedData = (response.data as any).data;
        return Array.isArray(nestedData) ? nestedData : [];
      }
      
      // Fallback
      return [];
    } catch (error: any) {
      console.error('Error getting categories:', error);
      if (__DEV__) {
        console.error('Categories API Error Details:', {
          message: error.message,
          status: error.status,
          details: error.details,
        });
      }
      throw error;
    }
  },

  /**
   * Search categories
   * GET /api/request-service/categories/search?query=plumb
   */
  searchCategories: async (query: string): Promise<ServiceCategory[]> => {
    if (query.length < 2) {
      return [];
    }
    try {
      // API might return: { data: [...] } or { data: { data: [...] } }
      const response = await apiClient.get<{ 
        data?: ServiceCategory[] | { data: ServiceCategory[] };
        success?: boolean;
      }>(
        `/api/request-service/categories/search?query=${encodeURIComponent(query)}`,
        { skipAuth: true }
      );
      
      // Handle nested structure
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && typeof response.data === 'object' && 'data' in response.data) {
        const nestedData = (response.data as any).data;
        return Array.isArray(nestedData) ? nestedData : [];
      }
      
      // Fallback
      return [];
    } catch (error: any) {
      console.error('Error searching categories:', error);
      if (__DEV__) {
        console.error('Category Search API Error Details:', {
          message: error.message,
          status: error.status,
          details: error.details,
          query,
        });
      }
      throw error;
    }
  },

  /**
   * Create service request (Step 1)
   * POST /api/request-service/requests
   */
  createRequest: async (payload: CreateServiceRequestPayload): Promise<CreateServiceRequestResponse> => {
    try {
      // Build payload - user ID is automatically extracted from token, don't send it
      // Only include fields that have values (backend rejects empty strings)
      const requestPayload: any = {
        categoryName: payload.categoryName,
      };
      
      // Only add optional fields if they have non-empty values
      if (payload.jobTitle && payload.jobTitle.trim()) {
        requestPayload.jobTitle = payload.jobTitle.trim();
      }
      if (payload.description && payload.description.trim()) {
        requestPayload.description = payload.description.trim();
      }
      if (payload.comment && payload.comment.trim()) {
        requestPayload.comment = payload.comment.trim();
      }
      
      if (__DEV__) {
        console.log('📤 Creating service request with payload:', JSON.stringify(requestPayload, null, 2));
        console.log('📤 Note: userId is extracted from token automatically');
      }
      
      const response = await apiClient.post<any>(
        '/api/request-service/requests',
        requestPayload
      );
      
      if (__DEV__) {
        console.log('📥 Create Request API Response:', JSON.stringify(response, null, 2));
      }
      
      // Handle nested response structure: { data: { data: { requestId, ... } } } or { data: { requestId, ... } }
      const responseData = response.data?.data || response.data || response;
      
      // Extract requestId from various possible locations
      const requestId = responseData.requestId || responseData.id || responseData.data?.requestId;
      
      if (!requestId) {
        if (__DEV__) {
          console.error('❌ No requestId found in response:', JSON.stringify(response, null, 2));
        }
        throw new Error('Invalid response from API: requestId not found');
      }
      
      // Return normalized response
      return {
        requestId: typeof requestId === 'number' ? requestId : parseInt(requestId, 10),
        categoryName: responseData.categoryName || payload.categoryName,
        status: responseData.status || 'pending',
        message: responseData.message || 'Service request created successfully',
      };
    } catch (error) {
      console.error('Error creating service request:', error);
      throw error;
    }
  },

  /**
   * Update job details (Step 2)
   * PUT /api/request-service/requests/:requestId/details
   */
  updateJobDetails: async (
    requestId: number,
    payload: UpdateJobDetailsPayload
  ): Promise<UpdateJobDetailsResponse> => {
    try {
      const response = await apiClient.put<{ data: UpdateJobDetailsResponse }>(
        `/api/request-service/requests/${requestId}/details`,
        payload
      );
      return response.data;
    } catch (error) {
      console.error('Error updating job details:', error);
      throw error;
    }
  },

  /**
   * Update date & time (Step 3)
   * PUT /api/request-service/requests/:requestId/date-time
   */
  updateDateTime: async (
    requestId: number,
    payload: UpdateDateTimePayload
  ): Promise<UpdateDateTimeResponse> => {
    try {
      const response = await apiClient.put<{ data: UpdateDateTimeResponse }>(
        `/api/request-service/requests/${requestId}/date-time`,
        payload
      );
      return response.data;
    } catch (error) {
      console.error('Error updating date/time:', error);
      throw error;
    }
  },

  /**
   * Get service request details
   * GET /api/request-service/requests/:requestId
   * Note: User ID is automatically extracted from token
   */
  getRequestDetails: async (requestId: number): Promise<ServiceRequest> => {
    try {
      const response = await apiClient.get<{ data: ServiceRequest }>(
        `/api/request-service/requests/${requestId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error getting request details:', error);
      throw error;
    }
  },

  /**
   * Get user's service requests
   * GET /api/request-service/requests?status=pending
   * Note: User ID is automatically extracted from token
   */
  getUserRequests: async (
    status?: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
  ): Promise<ServiceRequest[]> => {
    try {
      const url = status
        ? `/api/request-service/requests?status=${status}`
        : `/api/request-service/requests`;
      const response = await apiClient.get<{ data: ServiceRequest[] }>(url);
      return response.data || [];
    } catch (error) {
      console.error('Error getting user requests:', error);
      throw error;
    }
  },

  /**
   * Cancel service request
   * DELETE /api/request-service/requests/:requestId
   * Note: User ID is automatically extracted from token
   */
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

  /**
   * Get accepted providers for request
   * GET /api/request-service/requests/:requestId/accepted-providers
   * Note: User ID is automatically extracted from token
   */
  getAcceptedProviders: async (requestId: number): Promise<Array<{
    provider: {
      id: number;
      name: string;
      verified: boolean;
      age: number;
      phoneNumber: string;
      email: string;
      location: {
        address: string;
        city: string;
        state: string;
      };
    };
    acceptance: {
      id: number;
      acceptedAt: string;
    };
    distanceKm: number;
    minutesAway: number;
  }>> => {
    try {
      const response = await apiClient.get<{ data: Array<{
        provider: {
          id: number;
          name: string;
          verified: boolean;
          age: number;
          phoneNumber: string;
          email: string;
          location: {
            address: string;
            city: string;
            state: string;
          };
        };
        acceptance: {
          id: number;
          acceptedAt: string;
        };
        distanceKm: number;
        minutesAway: number;
      }> }>(
        `/api/request-service/requests/${requestId}/accepted-providers`
      );
      return response.data || [];
    } catch (error) {
      console.error('Error getting accepted providers:', error);
      throw error;
    }
  },

  /**
   * Select provider for request
   * POST /api/request-service/requests/:requestId/select-provider
   * Note: User ID is automatically extracted from token
   */
  selectProvider: async (
    requestId: number,
    providerId: number
  ): Promise<{
    requestId: number;
    status: string;
    provider: {
      id: number;
      name: string;
      phoneNumber: string;
      email: string;
    };
    message: string;
  }> => {
    try {
      const response = await apiClient.post<{ data: {
        requestId: number;
        status: string;
        provider: {
          id: number;
          name: string;
          phoneNumber: string;
          email: string;
        };
        message: string;
      } }>(
        `/api/request-service/requests/${requestId}/select-provider`,
        { providerId }
      );
      return response.data;
    } catch (error) {
      console.error('Error selecting provider:', error);
      throw error;
    }
  },
};

// ============================================================================
// PROVIDER SERVICE
// ============================================================================

export interface ProviderSignupPayload {
  name: string; // Required, min 2, max 100 characters
  email: string; // Required, valid email
  password: string; // Required, minimum 6 characters
  phoneNumber?: string; // Optional, exactly 11 characters
  age: number; // Required, integer, min 18, max 100
  verified?: boolean; // Optional, boolean (default: false)
  location?: LocationData; // Optional - can be added later
  categories?: string[]; // Optional - service categories provider offers
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
  placeId?: string;
  address?: string;
  formattedAddress?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  country?: string;
}

export interface AvailableRequest extends ServiceRequest {
  distanceKm: number; // Distance from provider to request location
  minutesAway: number; // Estimated travel time
}

export const providerService = {
  /**
   * Provider Signup
   * POST /api/provider/signup
   */
  signup: async (payload: ProviderSignupPayload): Promise<ProviderSignupResponse> => {
    try {
      const response = await apiClient.post<{ data: ProviderSignupResponse }>(
        '/api/provider/signup',
        payload,
        { skipAuth: true }
      );
      const { token, ...providerData } = response.data;
      await apiClient.setAuthToken(token);
      if (response.data.id) {
        await apiClient.setUserId(response.data.id);
      }
      return response.data;
    } catch (error) {
      console.error('Error during provider signup:', error);
      throw error;
    }
  },

  /**
   * Provider Login
   * POST /api/provider/login
   */
  login: async (payload: ProviderLoginPayload): Promise<ProviderLoginResponse> => {
    try {
      const response = await apiClient.post<{ data: ProviderLoginResponse }>(
        '/api/provider/login',
        payload,
        { skipAuth: true }
      );
      const { token, ...providerData } = response.data;
      await apiClient.setAuthToken(token);
      if (response.data.id) {
        await apiClient.setUserId(response.data.id);
      }
      return response.data;
    } catch (error) {
      console.error('Error during provider login:', error);
      throw error;
    }
  },

  /**
   * Get provider details
   * GET /api/provider/:providerId
   */
  getProvider: async (providerId: number): Promise<Provider> => {
    try {
      const response = await apiClient.get<{ data: Provider }>(
        `/api/provider/${providerId}`,
        { skipAuth: true }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting provider:', error);
      throw error;
    }
  },

  /**
   * Update provider location
   * PUT /api/provider/:providerId/location
   */
  updateLocation: async (
    providerId: number,
    payload: ProviderLocationPayload
  ): Promise<{ providerId: number; location: SavedLocation; message: string }> => {
    try {
      const response = await apiClient.put<{ data: { providerId: number; location: SavedLocation; message: string } }>(
        `/api/provider/${providerId}/location`,
        payload
      );
      return response.data;
    } catch (error) {
      console.error('Error updating provider location:', error);
      throw error;
    }
  },

  /**
   * Add service categories to provider
   * POST /api/provider/:providerId/categories
   */
  addCategories: async (
    providerId: number,
    categories: string[]
  ): Promise<{ providerId: number; categories: string[]; message: string }> => {
    try {
      const response = await apiClient.post<{ data: { providerId: number; categories: string[]; message: string } }>(
        `/api/provider/${providerId}/categories`,
        { categories }
      );
      return response.data;
    } catch (error) {
      console.error('Error adding categories:', error);
      throw error;
    }
  },

  /**
   * Get provider services/categories
   * GET /api/provider/:providerId/services
   */
  getServices: async (providerId: number): Promise<{ id: number; categoryName: string }[]> => {
    try {
      const response = await apiClient.get<{ data: { id: number; categoryName: string }[] }>(
        `/api/provider/${providerId}/services`,
        { skipAuth: true }
      );
      return response.data || [];
    } catch (error) {
      console.error('Error getting provider services:', error);
      throw error;
    }
  },

  /**
   * Get nearby providers (Public)
   * GET /api/provider/nearby?categoryName=plumbing&latitude=6.5244&longitude=3.3792&maxDistanceKm=50
   */
  getNearbyProviders: async (
    categoryName: string,
    latitude: number,
    longitude: number,
    maxDistanceKm: number = 50
  ): Promise<NearbyProvider[]> => {
    try {
      const response = await apiClient.get<{ data: NearbyProvider[] }>(
        `/api/provider/nearby?categoryName=${encodeURIComponent(categoryName)}&latitude=${latitude}&longitude=${longitude}&maxDistanceKm=${maxDistanceKm}`,
        { skipAuth: true }
      );
      return response.data || [];
    } catch (error) {
      console.error('Error getting nearby providers:', error);
      throw error;
    }
  },

  /**
   * Get available requests for provider
   * GET /api/provider/:providerId/requests/available?maxDistanceKm=50
   */
  getAvailableRequests: async (
    providerId: number,
    maxDistanceKm: number = 50
  ): Promise<AvailableRequest[]> => {
    try {
      const response = await apiClient.get<{ data: AvailableRequest[] }>(
        `/api/provider/${providerId}/requests/available?maxDistanceKm=${maxDistanceKm}`
      );
      return response.data || [];
    } catch (error) {
      console.error('Error getting available requests:', error);
      throw error;
    }
  },

  /**
   * Accept service request
   * POST /api/provider/:providerId/requests/:requestId/accept
   */
  acceptRequest: async (
    providerId: number,
    requestId: number
  ): Promise<{
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
      }>(`/api/provider/${providerId}/requests/${requestId}/accept`);
      return response.data;
    } catch (error) {
      console.error('Error accepting request:', error);
      throw error;
    }
  },

  /**
   * Get provider accepted requests
   * GET /api/provider/:providerId/requests/accepted
   */
  getAcceptedRequests: async (providerId: number): Promise<ServiceRequest[]> => {
    try {
      const response = await apiClient.get<{ data: ServiceRequest[] }>(
        `/api/provider/${providerId}/requests/accepted`
      );
      return response.data || [];
    } catch (error) {
      console.error('Error getting accepted requests:', error);
      throw error;
    }
  },
};