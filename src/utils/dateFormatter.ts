/**
 * Date formatting utilities
 * Display format: DD/MM/YYYY
 * Storage format: YYYY-MM-DD (ISO 8601)
 */

/**
 * Convert from storage format (YYYY-MM-DD) to display format (DD/MM/YYYY)
 */
export function formatDateForDisplay(isoDate: string): string {
  if (!isoDate) return '';

  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Convert from display format (DD/MM/YYYY) to storage format (YYYY-MM-DD)
 */
export function formatDateForStorage(displayDate: string): string {
  if (!displayDate) return '';

  const [day, month, year] = displayDate.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/**
 * Get today's date in storage format (YYYY-MM-DD)
 */
export function getTodayISO(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date in display format (DD/MM/YYYY)
 */
export function getTodayDisplay(): string {
  return formatDateForDisplay(getTodayISO());
}

/**
 * Parse a date string and return a Date object
 */
export function parseISODate(isoDate: string): Date | null {
  if (!isoDate) return null;
  const date = new Date(isoDate);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Get the year from an ISO date string
 */
export function getYearFromISO(isoDate: string): number | null {
  if (!isoDate) return null;
  const year = parseInt(isoDate.split('-')[0], 10);
  return isNaN(year) ? null : year;
}

/**
 * Get the month from an ISO date string (1-12)
 */
export function getMonthFromISO(isoDate: string): number | null {
  if (!isoDate) return null;
  const month = parseInt(isoDate.split('-')[1], 10);
  return isNaN(month) ? null : month;
}

/**
 * Check if a date string is valid ISO format
 */
export function isValidISODate(isoDate: string): boolean {
  if (!isoDate) return false;
  const date = parseISODate(isoDate);
  return date !== null;
}

/**
 * Format date for input[type="date"] (YYYY-MM-DD)
 */
export function formatDateForInput(date: Date | string): string {
  if (typeof date === 'string') {
    return date; // Already in correct format
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
