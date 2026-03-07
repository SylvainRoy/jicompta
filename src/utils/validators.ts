/**
 * Validation utilities
 */

/**
 * Validate email format (RFC 5322 basic validation)
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Validate SIRET number (14 digits)
 * Optionally validates with Luhn algorithm
 */
export function isValidSIRET(siret: string, useLuhn: boolean = false): boolean {
  if (!siret) return true; // SIRET is optional

  // Remove spaces and check length
  const cleaned = siret.replace(/\s/g, '');
  if (cleaned.length !== 14) return false;

  // Check if all characters are digits
  if (!/^\d{14}$/.test(cleaned)) return false;

  // Optional: Luhn algorithm validation
  if (useLuhn) {
    return validateLuhn(cleaned);
  }

  return true;
}

/**
 * Luhn algorithm validation (used for SIRET)
 */
function validateLuhn(number: string): boolean {
  let sum = 0;
  let isEven = false;

  // Loop through values starting from the rightmost digit
  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number.charAt(i), 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Validate phone number (basic French format)
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return true; // Phone is optional

  // Remove spaces, dots, and dashes
  const cleaned = phone.replace(/[\s.-]/g, '');

  // French phone: 10 digits starting with 0, or international format
  return /^(?:0[1-9]|\\+33[1-9])\d{8}$/.test(cleaned);
}

/**
 * Validate amount (must be positive number)
 */
export function isValidAmount(amount: number | string): boolean {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(num) && num > 0;
}

/**
 * Validate payment ID format (yymmddnnnn)
 */
export function isValidPaiementID(id: string): boolean {
  if (!id) return false;

  // Must be 10 digits
  if (!/^\d{10}$/.test(id)) return false;

  const yy = parseInt(id.substring(0, 2), 10);
  const mm = parseInt(id.substring(2, 4), 10);
  const dd = parseInt(id.substring(4, 6), 10);

  // Basic validation
  return mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31;
}

/**
 * Generate payment ID (yymmddnnnn)
 * @param existingIds - Array of existing payment IDs for the same date
 * @param date - Date in ISO format (YYYY-MM-DD), defaults to today
 */
export function generatePaiementID(existingIds: string[] = [], date?: string): string {
  const targetDate = date ? new Date(date) : new Date();

  const yy = String(targetDate.getFullYear()).slice(-2);
  const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
  const dd = String(targetDate.getDate()).padStart(2, '0');

  const datePrefix = `${yy}${mm}${dd}`;

  // Find all IDs for this date
  const todayIds = existingIds.filter(id => id.startsWith(datePrefix));

  // Get the highest sequence number
  let maxSequence = 0;
  todayIds.forEach(id => {
    const sequence = parseInt(id.substring(6), 10);
    if (sequence > maxSequence) {
      maxSequence = sequence;
    }
  });

  // Increment and pad to 4 digits
  const newSequence = String(maxSequence + 1).padStart(4, '0');

  return `${datePrefix}${newSequence}`;
}

/**
 * Validate required field
 */
export function isRequired(value: string): boolean {
  return value !== null && value !== undefined && value.trim().length > 0;
}

/**
 * Validate minimum length
 */
export function hasMinLength(value: string, minLength: number): boolean {
  return !!(value && value.length >= minLength);
}

/**
 * Validate maximum length
 */
export function hasMaxLength(value: string, maxLength: number): boolean {
  return !value || value.length <= maxLength;
}
