/**
 * Utility functions for user-friendly error messages
 */

export interface ApiError {
  message?: string;
  details?: {
    data?: {
      error?: string;
      message?: string;
    };
    error?: string;
    message?: string;
  };
  status?: number;
  statusText?: string;
  isNetworkError?: boolean;
}

/**
 * Extracts a user-friendly error message from API error
 */
export const getErrorMessage = (error: ApiError | Error | any, defaultMessage: string = 'Something went wrong. Please try again.'): string => {
  // If it's already a string, return it
  if (typeof error === 'string') {
    return formatApiErrorMessage(error);
  }

  // Check if it's a network error first
  if (error?.isNetworkError || error?.message?.includes('Network') || error?.message?.includes('Failed to fetch')) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }

  // Check nested error structure (API format)
  if (error?.details?.data?.error) {
    return formatApiErrorMessage(error.details.data.error);
  }

  if (error?.details?.data?.message) {
    return formatApiErrorMessage(error.details.data.message);
  }

  if (error?.details?.error) {
    return formatApiErrorMessage(error.details.error);
  }

  if (error?.details?.message) {
    return formatApiErrorMessage(error.details.message);
  }

  // Check top-level error message
  if (error?.message && error.message !== 'Failed' && error.message !== 'Request failed') {
    return formatApiErrorMessage(error.message);
  }

  // Check status codes for common errors
  if (error?.status) {
    return getStatusErrorMessage(error.status);
  }

  // Fallback to default message
  return defaultMessage;
};

/**
 * Formats API error messages to be more user-friendly
 */
const formatApiErrorMessage = (message: string): string => {
  if (!message) return 'Something went wrong. Please try again.';

  // Common API error patterns to make more user-friendly
  const errorMappings: { [key: string]: string } = {
    'User already Exists. Sign In instead.': 'An account with this email or phone number already exists. Please sign in instead.',
    'Invalid email or password': 'The email or password you entered is incorrect. Please try again.',
    'User not found': 'No account found with these details. Please check and try again.',
    'Invalid token': 'Your session has expired. Please sign in again.',
    'Token expired': 'Your session has expired. Please sign in again.',
    'Unauthorized': 'Please sign in to continue.',
    'Forbidden': 'You don\'t have permission to perform this action.',
    'Not found': 'The requested item could not be found.',
    'Network request failed': 'Unable to connect to the server. Please check your internet connection and try again.',
    'Network connection failed': 'Unable to connect to the server. Please check your internet connection and try again.',
    'Failed to fetch': 'Unable to connect to the server. Please check your internet connection and try again.',
    'TypeError: Network request failed': 'Unable to connect to the server. Please check your internet connection and try again.',
    'timeout': 'The request took too long. Please check your connection and try again.',
  };

  // Check for exact matches first
  if (errorMappings[message]) {
    return errorMappings[message];
  }

  // Check for partial matches (case-insensitive)
  const lowerMessage = message.toLowerCase();
  for (const [key, value] of Object.entries(errorMappings)) {
    if (lowerMessage.includes(key.toLowerCase())) {
      return value;
    }
  }

  // If message is too technical, provide a generic friendly message
  if (message.includes('ECONNREFUSED') || message.includes('ENOTFOUND')) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }

  if (message.includes('500') || message.includes('Internal Server Error')) {
    return 'The server encountered an error. Please try again in a moment.';
  }

  if (message.includes('400') || message.includes('Bad Request')) {
    return 'Invalid information provided. Please check your input and try again.';
  }

  if (message.includes('401') || message.includes('Unauthorized')) {
    return 'Please sign in to continue.';
  }

  if (message.includes('403') || message.includes('Forbidden')) {
    return 'You don\'t have permission to perform this action.';
  }

  if (message.includes('404') || message.includes('Not Found')) {
    return 'The requested item could not be found.';
  }

  if (message.includes('429') || message.includes('Too Many Requests')) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  // Return the original message if it's already user-friendly
  // Otherwise, return a generic message
  if (message.length < 100 && !message.includes('Error:') && !message.includes('Exception')) {
    return message;
  }

  return 'Something went wrong. Please try again.';
};

/**
 * Gets user-friendly error message based on HTTP status code
 */
const getStatusErrorMessage = (status: number): string => {
  const statusMessages: { [key: number]: string } = {
    400: 'Invalid information provided. Please check your input and try again.',
    401: 'Please sign in to continue.',
    403: 'You don\'t have permission to perform this action.',
    404: 'The requested item could not be found.',
    408: 'The request took too long. Please try again.',
    409: 'This action conflicts with existing data. Please check and try again.',
    422: 'Invalid information provided. Please check your input and try again.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'The server encountered an error. Please try again in a moment.',
    502: 'The server is temporarily unavailable. Please try again later.',
    503: 'The service is temporarily unavailable. Please try again later.',
    504: 'The request took too long. Please try again.',
  };

  return statusMessages[status] || 'Something went wrong. Please try again.';
};

/**
 * Gets a user-friendly error message for specific error types
 */
export const getSpecificErrorMessage = (error: ApiError | Error | any, context: string): string => {
  const defaultMessages: { [key: string]: string } = {
    'create_request': 'Failed to create service request. Please try again.',
    'update_job_details': 'Failed to update job details. Please check your information and try again.',
    'update_date_time': 'Failed to update date and time. Please try again.',
    'get_requests': 'Failed to load your requests. Please pull down to refresh.',
    'cancel_request': 'Failed to cancel request. Please try again.',
    'get_categories': 'Failed to load categories. Please try again.',
    'search_categories': 'Failed to search categories. Please try again.',
    'save_location': 'Failed to save location. Please try again.',
    'get_location': 'Failed to load location. Please try again.',
    'search_location': 'Location search is temporarily unavailable. Please enter your location manually.',
  };

  const defaultMessage = defaultMessages[context] || 'Something went wrong. Please try again.';
  return getErrorMessage(error, defaultMessage);
};
