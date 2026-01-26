/**
 * Input formatting utilities for better UX
 */

/**
 * Formats phone number as user types (e.g., 08012345678 -> 0801 234 5678)
 */
export const formatPhoneNumber = (value: string): string => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Limit to 11 digits (Nigerian phone numbers)
  const limited = digits.slice(0, 11);
  
  // Format: 0801 234 5678
  if (limited.length <= 4) {
    return limited;
  } else if (limited.length <= 7) {
    return `${limited.slice(0, 4)} ${limited.slice(4)}`;
  } else {
    return `${limited.slice(0, 4)} ${limited.slice(4, 7)} ${limited.slice(7)}`;
  }
};

/**
 * Formats currency input (removes non-numeric characters except decimal point)
 */
export const formatCurrencyInput = (value: string): string => {
  // Remove all characters except digits and decimal point
  const cleaned = value.replace(/[^\d.]/g, '');
  
  // Ensure only one decimal point
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    return `${parts[0]}.${parts.slice(1).join('')}`;
  }
  
  // Limit to 2 decimal places
  if (parts[1] && parts[1].length > 2) {
    return `${parts[0]}.${parts[1].slice(0, 2)}`;
  }
  
  return cleaned;
};

/**
 * Formats currency for display (e.g., 5000 -> ₦5,000.00)
 */
export const formatCurrencyDisplay = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
};

/**
 * Formats name input (capitalizes first letter of each word)
 */
export const formatNameInput = (value: string): string => {
  // Remove special characters except spaces, hyphens, and apostrophes
  const cleaned = value.replace(/[^a-zA-Z\s'-]/g, '');
  
  // Capitalize first letter of each word
  return cleaned
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates phone number (Nigerian format: 11 digits)
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 11;
};

/**
 * Validates password strength
 */
export const getPasswordStrength = (password: string): {
  strength: 'weak' | 'medium' | 'strong';
  message: string;
  score: number;
} => {
  let score = 0;
  
  if (password.length >= 6) score += 1;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  
  if (score <= 2) {
    return { strength: 'weak', message: 'Weak password', score };
  } else if (score <= 4) {
    return { strength: 'medium', message: 'Medium strength', score };
  } else {
    return { strength: 'strong', message: 'Strong password', score };
  }
};

/**
 * Trims and normalizes text input
 */
export const normalizeText = (text: string): string => {
  return text.trim().replace(/\s+/g, ' ');
};
