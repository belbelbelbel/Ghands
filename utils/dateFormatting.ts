/**
 * Robust date/time formatting for timeline timestamps.
 * Handles ISO 8601, date-only, unix timestamps (ms/sec), and edge cases.
 */

/**
 * Parse a date value from API (string, number, or Date) into a valid Date.
 * Returns null if unparseable.
 */
function parseDate(value: string | number | Date | null | undefined): Date | null {
  if (value == null || value === '') return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;

  const str = String(value).trim();
  if (!str) return null;

  // Unix timestamp in seconds (10 digits)
  const num = Number(value);
  if (!isNaN(num)) {
    const ms = num < 1e12 ? num * 1000 : num;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }

  // ISO 8601 or other string format
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Format a date as "X minutes/hours/days ago" or "Just now".
 * Safe for any API date format.
 */
export function formatTimeAgo(value: string | number | Date | null | undefined): string {
  const date = parseDate(value);
  if (!date) return 'Recently';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  // Future dates - show relative or "Just now"
  if (diffMs < 0) {
    if (diffMs > -60000) return 'Just now';
    return 'Recently';
  }

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  if (diffHours > 0) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  if (diffMinutes > 0) return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  if (diffSeconds >= 5) return `${diffSeconds} seconds ago`;
  return 'Just now';
}

/**
 * Format date for display (e.g. "Monday January 20, 2026")
 */
export function formatDateLong(value: string | number | Date | null | undefined): string {
  const date = parseDate(value);
  if (!date) return '';

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${days[date.getDay()]} ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/**
 * Format date short (e.g. "January 20, 2026")
 */
export function formatDateShort(value: string | number | Date | null | undefined): string {
  const date = parseDate(value);
  if (!date) return '';

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}
