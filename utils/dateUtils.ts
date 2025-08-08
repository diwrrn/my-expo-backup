// Date utility functions for formatting and manipulation

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  const today = new Date();
  return formatDateToString(today);
}

/**
 * Format a Date object to YYYY-MM-DD string
 */
export function formatDateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
/**
 * Parse a YYYY-MM-DD string to a Date object
 */
export function parseDateString(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Add or subtract days from a date string (YYYY-MM-DD)
 * @param dateString Date string in YYYY-MM-DD format
 * @param days Number of days to add (positive) or subtract (negative)
 * @returns New date string in YYYY-MM-DD format
 */
export function addDays(dateString: string, days: number): string {
  const date = parseDateString(dateString);
  date.setDate(date.getDate() + days);
  return formatDateToString(date);
}

/**
 * Check if a date string is today
 */
export function isToday(dateString: string): boolean {
  return dateString === getTodayDateString();
}

/**
 * Check if a date string is yesterday
 */
export function isYesterday(dateString: string): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateString === formatDateToString(yesterday);
}

/**
 * Format a date string for display (Today, Yesterday, or DD/MM/YYYY)
 */
export function formatDisplayDate(dateString: string): string {
  if (isToday(dateString)) {
    return 'Today';
  }
  
  if (isYesterday(dateString)) {
    return 'Yesterday';
  }
  
  // Format as DD/MM/YYYY
  const date = parseDateString(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Check if a date is in the future
 */
export function isFutureDate(dateString: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const date = parseDateString(dateString);
  return date > today;
}

/**
 * Get a list of dates for the last N days
 * @param days Number of days to include
 * @returns Array of date strings in YYYY-MM-DD format
 */
export function getLastNDays(days: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(formatDateToString(date));
  }
  
  return dates;
}

/**
 * Get day of week from date string
 */
export function getDayOfWeek(dateString: string): string {
  const date = parseDateString(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}