import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

/**
 * Date Formatting Utilities
 * Following Single Responsibility Principle - each function handles one date format
 */

/**
 * Format date for display
 */
export const formatDate = (date: string | Date): string => {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsedDate)) {
    return 'Invalid date';
  }
  return format(parsedDate, 'PPP');
};

/**
 * Format date and time for display
 */
export const formatDateTime = (date: string | Date): string => {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsedDate)) {
    return 'Invalid date';
  }
  return format(parsedDate, 'PPp');
};

/**
 * Format time only
 */
export const formatTime = (date: string | Date): string => {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsedDate)) {
    return 'Invalid time';
  }
  return format(parsedDate, 'p');
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: string | Date): string => {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsedDate)) {
    return 'Invalid date';
  }
  return formatDistanceToNow(parsedDate, { addSuffix: true });
};

/**
 * Format date for API requests (ISO format)
 */
export const formatDateForApi = (date: Date): string => {
  return date.toISOString();
};

/**
 * Format short date (e.g., "Jan 15")
 */
export const formatShortDate = (date: string | Date): string => {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsedDate)) {
    return 'Invalid date';
  }
  return format(parsedDate, 'MMM d');
};

/**
 * Format date for forms (YYYY-MM-DD)
 */
export const formatDateForInput = (date: string | Date): string => {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsedDate)) {
    return '';
  }
  return format(parsedDate, 'yyyy-MM-dd');
};

/**
 * Check if date is today
 */
export const isToday = (date: string | Date): boolean => {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsedDate)) {
    return false;
  }
  const today = new Date();
  return (
    parsedDate.getDate() === today.getDate() &&
    parsedDate.getMonth() === today.getMonth() &&
    parsedDate.getFullYear() === today.getFullYear()
  );
};