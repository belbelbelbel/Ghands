import AsyncStorage from '@react-native-async-storage/async-storage';
import { UpdateProfilePayload, UserProfile } from '../types';
import { extractUserIdFromToken } from '../utils/tokenUtils';

// ============================================================================
// CONFIGURATION
// ============================================================================
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://bamibuildit-backend-v1.onrender.com';
const AUTH_TOKEN_KEY = '@ghands:auth_token';
const REFRESH_TOKEN_KEY = '@ghands:refresh_token';
const USER_ID_KEY = '@ghands:user_id';
const COMPANY_ID_KEY = '@ghands:company_id'; // Provider/Company ID

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
class ApiClient {
  private baseUrl: string;
  private requestInterceptors: Array<(config: RequestConfig) => RequestConfig | Promise<RequestConfig>> = [];
  private responseInterceptors: Array<(response: Response) => Response | Promise<Response>> = [];
  private errorInterceptors: Array<(error: Error) => Error | Promise<Error>> = [];
  private authErrorHandler: ((route: string) => void) | null = null;
  private isHandlingAuthError: boolean = false; // Prevent duplicate handling

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.setupDefaultInterceptors();
  }

  /**
   * Automatically adds Bearer token to all requests (unless skipAuth is true)
   */
  private setupDefaultInterceptors() {
    // Add token to all requests automatically
    this.addRequestInterceptor(async (config) => {
      if (!config.skipAuth) {
        const token = await this.getAuthToken();
        if (token && this.isValidToken(token)) {
          const existingHeaders = config.headers || {};
          const headersObj: Record<string, string> = existingHeaders instanceof Headers 
            ? Object.fromEntries(existingHeaders.entries())
            : { ...(existingHeaders as Record<string, string>) };
          
          const contentType = headersObj['Content-Type'] || headersObj['content-type'] || 'application/json';
          config.headers = {
            ...headersObj,
            'Content-Type': contentType,
            Authorization: `Bearer ${token}`,
          } as HeadersInit;
        } else if (token && !this.isValidToken(token)) {
          await this.clearAuthTokens();
        }
      }
      return config;
    });

    // Handle 401 errors (try to refresh token)
    // If refresh fails, the error will be caught in retryRequest and handled there
    this.addResponseInterceptor(async (response) => {
      if (response.status === 401) {
        const refreshed = await this.refreshAuthToken();
        if (!refreshed) {
          // Token refresh failed - clear tokens
          // The error will be thrown and handled in retryRequest
          await this.clearAuthTokens();
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
   * Sets up global error handling for token expiration
   * This will be called automatically when 401 errors occur
   */
  setupAuthErrorHandler(onTokenExpired: (route: string) => void) {
    this.authErrorHandler = onTokenExpired;
  }

  /**
   * Checks if an error is an authentication error (401 or token-related)
   */
  private isAuthError(error: any): boolean {
    const status = error?.status || error?.response?.status;
    const message = (error?.message || error?.details?.data?.error || '').toLowerCase();
    
    return (
      status === 401 ||
      message.includes('unauthorized') ||
      message.includes('invalid token') ||
      message.includes('token expired') ||
      message.includes('not authenticated') ||
      message.includes('no authorization token') ||
      message.includes('authentication required')
    );
  }

  /**
   * Validates token format (JWT or UUID)
   */
  private isValidToken(token: string | null | undefined): boolean {
    if (token === null || token === undefined) return false;
    if (typeof token !== 'string') return false;
    
    const trimmed = String(token).trim();
    if (!trimmed || trimmed.length < 10) return false;
    
    // Check JWT format (3 parts separated by dots)
    const parts = trimmed.split('.');
    if (parts.length === 3) {
      return parts.every(part => part.length > 0);
    }
    
    // Check UUID format
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidPattern.test(trimmed)) {
      return true;
    }
    
    return trimmed.length >= 10;
  }

  /**
   * Get auth token from storage
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (!token || token === 'null' || token === 'undefined' || (typeof token === 'string' && token.trim() === '')) {
        return null;
      }
      
      if (!this.isValidToken(token)) {
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

  async getAuthTokenPublic(): Promise<string | null> {
    return this.getAuthToken();
  }

  async setAuthToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Error setting auth token:', error);
    }
  }

  async getUserId(): Promise<number | null> {
    try {
      const userId = await AsyncStorage.getItem(USER_ID_KEY);
      if (userId) {
        const parsed = parseInt(userId, 10);
        if (!isNaN(parsed)) {
          return parsed;
        }
      }
      
      const token = await this.getAuthToken();
      if (token && this.isValidToken(token)) {
        const extractedUserId = extractUserIdFromToken(token);
        if (extractedUserId) {
          await this.setUserId(extractedUserId);
          return extractedUserId;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  }

  async setUserId(userId: number): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_ID_KEY, userId.toString());
    } catch (error) {
      console.error('Error setting user ID:', error);
    }
  }

  async getCompanyId(): Promise<number | null> {
    try {
      const companyId = await AsyncStorage.getItem(COMPANY_ID_KEY);
      if (companyId) {
        const parsed = parseInt(companyId, 10);
        if (!isNaN(parsed)) {
          return parsed;
        }
      }
      
      const token = await this.getAuthToken();
      if (token && this.isValidToken(token)) {
        const extractedUserId = extractUserIdFromToken(token);
        if (extractedUserId) {
          await AsyncStorage.setItem(COMPANY_ID_KEY, extractedUserId.toString());
          return extractedUserId;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting company ID:', error);
      return null;
    }
  }

  async clearAuthTokens(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_ID_KEY, COMPANY_ID_KEY]);
    } catch (error) {
      console.error('Error clearing auth tokens:', error);
    }
  }

  private async refreshAuthToken(): Promise<boolean> {
    try {
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
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
    const errorMessage = error.message || error.toString() || '';
    return errorMessage.includes('Network request failed') ||
           errorMessage.includes('Failed to fetch') ||
           errorMessage.includes('NetworkError') ||
           error.name === 'TypeError' ||
           error.name === 'NetworkError';
  }

  /**
   * Retry request with exponential backoff
   */
  private async retryRequest<T>(url: string, config: RequestConfig, retries: number, retryDelay: number): Promise<T> {
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
          const errorMessage = isNetworkErr 
            ? 'Network connection failed. Please check your internet connection.'
            : (error instanceof Error ? error.message : 'Request failed');
          
          const errorObj = error instanceof Error 
            ? Object.assign(new Error(errorMessage), { 
                message: errorMessage, 
                isNetworkError: isNetworkErr,
                originalError: error,
                status: (error as any)?.status,
                details: (error as any)?.details
              })
            : new Error(errorMessage);
          
          // Check if this is an auth error and handle it (only once)
          if (this.isAuthError(errorObj) && this.authErrorHandler && !this.isHandlingAuthError) {
            this.isHandlingAuthError = true;
            
            try {
              // Import and use the token expiration handler
              const { handleTokenExpiration } = await import('../utils/tokenExpirationHandler');
              const route = await handleTokenExpiration();
              
              if (route) {
                // Use setTimeout to avoid navigation during render
                // This ensures navigation happens after the error is thrown
                setTimeout(() => {
                  this.authErrorHandler!(route);
                  // Reset flag after a delay to allow for future auth errors
                  setTimeout(() => {
                    this.isHandlingAuthError = false;
                  }, 1000);
                }, 100);
              } else {
                this.isHandlingAuthError = false;
              }
            } catch (handlerError) {
              console.error('Error in auth error handler:', handlerError);
              this.isHandlingAuthError = false;
            }
          }
          
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

    const config = await this.applyRequestInterceptors(defaultConfig);
    const { retries = 0, retryDelay = 1000, ...fetchOptions } = config;
    const effectiveRetries = retries > 0 ? retries : DEFAULT_RETRY_OPTIONS.maxRetries || 2;
    
    return this.retryRequest<T>(url, fetchOptions as RequestInit, effectiveRetries, retryDelay);
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
   */
  searchLocations: async (query: string): Promise<LocationSearchResult[]> => {
    if (query.length < 2) return [];
    
    try {
      const response = await apiClient.get<any>(
        `/api/user/location/search?query=${encodeURIComponent(query)}`,
        { skipAuth: true }
      );
      
      return extractResponseData<LocationSearchResult[]>(response) || [];
    } catch (error: any) {
      console.error('Error searching locations:', error.message || error);
      throw error;
    }
  },

  /**
   * Get location details from placeId
   */
  getLocationDetails: async (placeId: string): Promise<LocationDetails> => {
    try {
      const response = await apiClient.get<any>(
        `/api/user/location/details?placeId=${encodeURIComponent(placeId)}`,
        { skipAuth: true }
      );
      
      const locationDetails = extractResponseData<LocationDetails>(response);
      
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
   */
  getCurrentLocation: async (latitude: number, longitude: number): Promise<LocationDetails> => {
    try {
      const response = await apiClient.get<any>(
        `/api/user/location/current?latitude=${latitude}&longitude=${longitude}`,
        { skipAuth: true }
      );
      
      const locationDetails = extractResponseData<any>(response);
      
      if (!locationDetails) {
        throw new Error('Invalid response from location API');
      }
      
      const formattedAddress = locationDetails.formattedAddress || locationDetails.fullAddress;
      
      if (!formattedAddress) {
        throw new Error('Invalid response - missing address');
      }
      
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
      
      // Generate temporary placeId from coordinates if missing
      if (!normalizedDetails.placeId && normalizedDetails.latitude && normalizedDetails.longitude) {
        normalizedDetails.placeId = `lat_${normalizedDetails.latitude}_${normalizedDetails.longitude}`;
      }
      
      return normalizedDetails;
    } catch (error: any) {
      console.error('Error getting current location:', error.message || error);
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
      const token = await apiClient.getAuthTokenPublic();
      if (!token) {
        throw new Error('Authentication required. Please sign in again.');
      }

      const body: { placeId?: string; latitude?: number; longitude?: number } = {};

      if (options.placeId) {
        body.placeId = options.placeId;
      } else if (options.latitude !== undefined && options.longitude !== undefined) {
        body.latitude = options.latitude;
        body.longitude = options.longitude;
      } else {
        throw new Error('Either placeId or latitude/longitude must be provided');
      }

      const response = await apiClient.post<any>('/api/user/update-location', body);
      const location = response?.data?.location || response?.data?.data?.location || response?.location;

      if (!location) {
        throw new Error('Invalid response from server: location data not found');
      }

      return location;
    } catch (error: any) {
      let status = error?.status || 500;
      let errorMessage = error.message || 'Failed to save location';
      
      const extractedError = error?.details?.data?.error || error?.details?.error || error?.details?.message || error.message;
      
      if (status === 500) {
        errorMessage = extractedError && typeof extractedError === 'string' && extractedError !== 'Request failed with status 500'
          ? `Server error: ${extractedError}`
          : 'Server error: The server encountered an internal error. Please try again later.';
      } else if (status === 401) {
        errorMessage = 'Authentication required. Please sign in again.';
      } else if (status === 400) {
        errorMessage = extractedError || 'Invalid request. Please check your location data.';
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
      const response = await apiClient.get<{ data: SavedLocation }>('/api/user/location');
      return response.data;
    } catch (error: any) {
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
        await apiClient.setUserId(userId);
      }
      
      if (!token) {
        if (userId && email) {
          return { email, token: '', id: userId, firstName: '', lastName: '' };
        }
        throw new Error('Signup failed: No user data or token received from server.');
      }
      
      await apiClient.setAuthToken(token);
      
      if (!userId) {
        const isJWT = token.split('.').length === 3;
        if (isJWT) {
          const extractedUserId = extractUserIdFromToken(token);
          if (extractedUserId) {
            await apiClient.setUserId(extractedUserId);
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

      await apiClient.setAuthToken(token);

      let finalCompanyId: number | undefined = undefined;
      
      if (companyId) {
        finalCompanyId = typeof companyId === 'number' ? companyId : parseInt(companyId.toString(), 10);
        await AsyncStorage.setItem(COMPANY_ID_KEY, finalCompanyId.toString());
      } else if (token) {
        const extractedUserId = extractUserIdFromToken(token);
        if (extractedUserId) {
          finalCompanyId = extractedUserId;
          await AsyncStorage.setItem(COMPANY_ID_KEY, finalCompanyId.toString());
        }
      }
      
      if (finalCompanyId) {
        await apiClient.setUserId(finalCompanyId);
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
        await apiClient.setUserId(id);
      }
      
      if (!token) {
        if (id && email) {
          return { email, token: '', id, firstName, lastName };
        }
        throw new Error('Login failed: No user data or token received from server.');
      }
      
      await apiClient.setAuthToken(token);
      
      if (!id) {
        const extractedUserId = extractUserIdFromToken(token);
        if (extractedUserId) {
          await apiClient.setUserId(extractedUserId);
        }
      }
      
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
      console.error('Error creating service request:', error);
      throw error;
    }
  },

  updateJobDetails: async (requestId: number, payload: UpdateJobDetailsPayload): Promise<UpdateJobDetailsResponse> => {
    try {
      const response = await apiClient.put<any>(`/api/request-service/requests/${requestId}/details`, payload);
      const responseData = response.data?.data || response.data || response;
      
      if (responseData.nearbyProviders && !Array.isArray(responseData.nearbyProviders)) {
        responseData.nearbyProviders = [];
      }
      
      return responseData;
    } catch (error) {
      console.error('Error updating job details:', error);
      throw error;
    }
  },

  updateDateTime: async (requestId: number, payload: UpdateDateTimePayload): Promise<UpdateDateTimeResponse> => {
    try {
      const response = await apiClient.put<any>(`/api/request-service/requests/${requestId}/date-time`, payload);
      return extractResponseData<UpdateDateTimeResponse>(response);
    } catch (error) {
      console.error('Error updating date/time:', error);
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
      console.error('Error getting request details:', error);
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
      console.error('Error getting user requests:', error);
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
  address: string;
}

export interface AvailableRequest extends ServiceRequest {
  distanceKm: number;
  minutesAway: number;
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
        await apiClient.setAuthToken(token);
      }

      if (providerId) {
        await apiClient.setUserId(providerId);
      } else if (token) {
        const extractedId = extractUserIdFromToken(token);
        if (extractedId) {
          await apiClient.setUserId(extractedId);
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

  /**
   * Provider Login
   */
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

      await apiClient.setAuthToken(token);

      let finalProviderId: number | undefined = undefined;
      
      if (providerId) {
        finalProviderId = typeof providerId === 'number' ? providerId : parseInt(providerId.toString(), 10);
        await AsyncStorage.setItem(COMPANY_ID_KEY, finalProviderId.toString());
      } else if (token) {
        const extractedUserId = extractUserIdFromToken(token);
        if (extractedUserId) {
          finalProviderId = extractedUserId;
          await AsyncStorage.setItem(COMPANY_ID_KEY, finalProviderId.toString());
        }
      }
      
      if (finalProviderId) {
        await apiClient.setUserId(finalProviderId);
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

  getProvider: async (providerId: number): Promise<Provider> => {
    try {
      const response = await apiClient.get<any>(`/api/provider/${providerId}`, { skipAuth: true });
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
   */
  updateLocation: async (payload: ProviderLocationPayload): Promise<{ providerId: number; location: SavedLocation; message: string }> => {
    try {
      const token = await apiClient.getAuthTokenPublic();
      if (!token) {
        throw new Error('Authentication required. Please sign in again.');
      }
      
      if (!payload.address || typeof payload.address !== 'string') {
        throw new Error('Address is required and must be a string');
      }
      
      const cleanAddress = payload.address.trim().replace(/[\n\r\t]+/g, ' ').replace(/\s+/g, ' ').trim();
      
      if (!cleanAddress || cleanAddress.length === 0) {
        throw new Error('Address is required and cannot be empty');
      }
      
      const response = await apiClient.put<{ data: { providerId: number; location: SavedLocation; message: string } }>(
        `/api/provider/location`,
        { address: cleanAddress }
      );
      
      return response.data;
    } catch (error) {
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

  getServices: async (providerId: number): Promise<{ id: number; categoryName: string }[]> => {
    try {
      const response = await apiClient.get<any>(`/api/provider/${providerId}/services`, { skipAuth: true });
      return extractResponseData<{ id: number; categoryName: string }[]>(response) || [];
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
      const response = await apiClient.get<any>(
        `/api/provider/nearby?categoryName=${encodeURIComponent(categoryName)}&latitude=${latitude}&longitude=${longitude}&maxDistanceKm=${maxDistanceKm}`,
        { skipAuth: true }
      );

      return extractResponseData<NearbyProvider[]>(response) || [];
    } catch (error) {
      console.error('Error getting nearby providers:', error);
      return [];
    }
  },

  /**
   * Get available requests (providerId extracted from token automatically)
   */
  getAvailableRequests: async (maxDistanceKm: number = 50): Promise<AvailableRequest[]> => {
    try {
      const response = await apiClient.get<any>(
        `/api/provider/requests/available?maxDistanceKm=${maxDistanceKm}`
      );
      
      return extractResponseData<AvailableRequest[]>(response) || [];
    } catch (error) {
      console.error('Error getting available requests:', error);
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
    } catch (error) {
      console.error('Error getting accepted requests:', error);
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
};
