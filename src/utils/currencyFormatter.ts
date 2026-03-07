/**
 * Currency formatting utilities
 * Display format: 1 234,56 € (French format with space separator and comma for decimals)
 * Storage format: 1234.56 (decimal number)
 */

/**
 * Format a number as currency for display
 * @param amount - The amount to format (can be string or number)
 * @param includeCurrency - Whether to include the € symbol (default: true)
 */
export function formatCurrency(amount: number | string, includeCurrency: boolean = true): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) return '0,00 €';

  // Format with French locale
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);

  return includeCurrency ? `${formatted} €` : formatted;
}

/**
 * Parse a currency string to a number
 * Handles both French format (1 234,56) and standard (1234.56)
 */
export function parseCurrency(value: string): number {
  if (!value) return 0;

  // Remove € symbol and extra spaces
  let cleaned = value.replace(/€/g, '').trim();

  // If it contains a comma, assume French format
  if (cleaned.includes(',')) {
    // Remove spaces (thousands separator) and replace comma with dot
    cleaned = cleaned.replace(/\s/g, '').replace(',', '.');
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format a number for input fields
 * Returns a string with proper decimal notation for input[type="number"]
 */
export function formatForInput(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) return '';

  return numAmount.toFixed(2);
}

/**
 * Validate if a string is a valid currency amount
 */
export function isValidCurrency(value: string): boolean {
  const amount = parseCurrency(value);
  return !isNaN(amount) && amount >= 0;
}

/**
 * Round to 2 decimal places
 */
export function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Calculate total from an array of amounts
 */
export function calculateTotal(amounts: (number | string)[]): number {
  const total = amounts.reduce((sum, amount) => {
    const num = typeof amount === 'string' ? parseCurrency(amount) : amount;
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  return roundCurrency(total);
}
