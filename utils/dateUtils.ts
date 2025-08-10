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
// === Weekly (Fri→Thu) period utilities (timezone-aware) ===

const weekdayToIndex: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

function getLocalYmdInTz(d: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d); // YYYY-MM-DD
}

function getLocalDowInTz(d: Date, tz: string): number {
  const label = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' }).format(d);
  return weekdayToIndex[label];
}

function ymdToUtcDate(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function addDaysUtc(date: Date, days: number): Date {
  const out = new Date(date.getTime());
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}

function toUtcYmd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Returns the last completed Fri→Thu window in the given timezone.
 * Example output: { start: '2025-01-10', end: '2025-01-16' }
 */
export function getLastCompletedFriThuWindow(tz: string): { start: string; end: string } {
  const now = new Date();
  const todayYmdLocal = getLocalYmdInTz(now, tz);
  const dow = getLocalDowInTz(now, tz); // 0..6 (Thu=4)

  // Days since last completed Thursday (if today is Thu, use previous Thu)
  let daysSinceThu = (dow - 4 + 7) % 7;
  if (dow === 4) daysSinceThu = 7;

  const todayUtc = ymdToUtcDate(todayYmdLocal);
  const lastThuUtc = addDaysUtc(todayUtc, -daysSinceThu);
  const startUtc = addDaysUtc(lastThuUtc, -6);

  return { start: toUtcYmd(startUtc), end: toUtcYmd(lastThuUtc) };
}

/**
 * Returns N previous completed Fri→Thu windows (most recent first).
 */
export function getPreviousFriThuWindows(tz: string, count: number): Array<{ start: string; end: string }> {
  const windows: Array<{ start: string; end: string }> = [];
  let current = getLastCompletedFriThuWindow(tz);
  for (let i = 0; i < count; i++) {
    windows.push(current);
    // move one full week back
    const startUtc = ymdToUtcDate(current.start);
    const prevEndUtc = addDaysUtc(startUtc, -1);
    const prevStartUtc = addDaysUtc(prevEndUtc, -6);
    current = { start: toUtcYmd(prevStartUtc), end: toUtcYmd(prevEndUtc) };
  }
  return windows;
}
// === Monthly (last completed calendar month) utilities (timezone-aware) ===

function getLocalPartsInTz(d: Date, tz: string): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);

  const year = Number(parts.find(p => p.type === 'year')?.value);
  const month = Number(parts.find(p => p.type === 'month')?.value);
  const day = Number(parts.find(p => p.type === 'day')?.value);
  return { year, month, day };
}

/**
 * Returns the last completed calendar month in tz.
 * Example on 2025-09-10 local → { start: '2025-08-01', end: '2025-08-31' }
 */
export function getLastCompletedMonthWindow(tz: string): { start: string; end: string } {
  const now = new Date();
  const { year, month } = getLocalPartsInTz(now, tz); // month is 1..12 for current local month

  // Previous month/year
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  // Start = first day of previous month (UTC YMD)
  const startUtc = new Date(Date.UTC(prevYear, prevMonth - 1, 1));
  // End = last day of previous month: day 0 of next month
  const endUtc = new Date(Date.UTC(prevYear, prevMonth, 0));

  return { start: toUtcYmd(startUtc), end: toUtcYmd(endUtc) };
}

/**
 * Returns N previous completed calendar months (most recent first) in tz.
 * First element is the last completed month.
 */
export function getPreviousMonthWindows(
  tz: string,
  count: number
): Array<{ start: string; end: string }> {
  const windows: Array<{ start: string; end: string }> = [];
  // Start from last completed month local year/month
  const now = new Date();
  const nowParts = getLocalPartsInTz(now, tz);
  let y = nowParts.month === 1 ? nowParts.year - 1 : nowParts.year;
  let m = nowParts.month === 1 ? 12 : nowParts.month - 1; // 1..12

  for (let i = 0; i < count; i++) {
    const startUtc = new Date(Date.UTC(y, m - 1, 1));
    const endUtc = new Date(Date.UTC(y, m, 0));
    windows.push({ start: toUtcYmd(startUtc), end: toUtcYmd(endUtc) });

    // Move one month back
    m = m === 1 ? 12 : m - 1;
    y = m === 12 ? y - 1 : y;
  }

  return windows;
}