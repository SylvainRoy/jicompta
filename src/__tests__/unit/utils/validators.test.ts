import { describe, it, expect, vi } from 'vitest'
import {
  isValidEmail,
  isValidSIRET,
  isValidPhone,
  isValidAmount,
  isValidPaiementID,
  generatePaiementID,
  isRequired,
  hasMinLength,
  hasMaxLength,
} from '@/utils/validators'

describe('isValidEmail', () => {
  it('accepts valid emails', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
    expect(isValidEmail('first.last@domain.fr')).toBe(true)
    expect(isValidEmail('user+tag@example.co.uk')).toBe(true)
  })

  it('rejects empty string', () => {
    expect(isValidEmail('')).toBe(false)
  })

  it('rejects missing @', () => {
    expect(isValidEmail('userexample.com')).toBe(false)
  })

  it('rejects missing domain', () => {
    expect(isValidEmail('user@')).toBe(false)
  })

  it('rejects missing TLD', () => {
    expect(isValidEmail('user@example')).toBe(false)
  })

  it('rejects spaces', () => {
    expect(isValidEmail('user @example.com')).toBe(false)
  })
})

describe('isValidSIRET', () => {
  it('accepts valid 14-digit SIRET', () => {
    expect(isValidSIRET('12345678901234')).toBe(true)
  })

  it('accepts empty string (SIRET is optional)', () => {
    expect(isValidSIRET('')).toBe(true)
  })

  it('accepts SIRET with spaces (cleaned)', () => {
    expect(isValidSIRET('123 456 789 01234')).toBe(true)
  })

  it('rejects too short', () => {
    expect(isValidSIRET('1234567890')).toBe(false)
  })

  it('rejects too long', () => {
    expect(isValidSIRET('123456789012345')).toBe(false)
  })

  it('rejects non-digit characters', () => {
    expect(isValidSIRET('1234567890ABCD')).toBe(false)
  })

  it('validates with Luhn when enabled', () => {
    // 73282932000074 is a known valid SIRET (La Poste)
    expect(isValidSIRET('73282932000074', true)).toBe(true)
  })

  it('rejects invalid Luhn when enabled', () => {
    expect(isValidSIRET('12345678901234', true)).toBe(false)
  })
})

describe('isValidPhone', () => {
  it('accepts empty string (phone is optional)', () => {
    expect(isValidPhone('')).toBe(true)
  })

  it('accepts French mobile number', () => {
    expect(isValidPhone('0612345678')).toBe(true)
  })

  it('accepts French number with spaces', () => {
    expect(isValidPhone('06 12 34 56 78')).toBe(true)
  })

  it('accepts French number with dots', () => {
    expect(isValidPhone('06.12.34.56.78')).toBe(true)
  })

  it('accepts French number with dashes', () => {
    expect(isValidPhone('06-12-34-56-78')).toBe(true)
  })

  it('accepts French landline number', () => {
    expect(isValidPhone('0112345678')).toBe(true)
  })

  it('rejects number starting with 00', () => {
    expect(isValidPhone('0012345678')).toBe(false)
  })

  it('rejects too short', () => {
    expect(isValidPhone('06123')).toBe(false)
  })
})

describe('isValidAmount', () => {
  it('accepts positive numbers', () => {
    expect(isValidAmount(100)).toBe(true)
    expect(isValidAmount(0.01)).toBe(true)
  })

  it('accepts positive string numbers', () => {
    expect(isValidAmount('500')).toBe(true)
    expect(isValidAmount('99.99')).toBe(true)
  })

  it('rejects zero', () => {
    expect(isValidAmount(0)).toBe(false)
  })

  it('rejects negative numbers', () => {
    expect(isValidAmount(-100)).toBe(false)
  })

  it('rejects NaN', () => {
    expect(isValidAmount(NaN)).toBe(false)
    expect(isValidAmount('abc')).toBe(false)
  })
})

describe('isValidPaiementID', () => {
  it('accepts valid format yymmddnnnn', () => {
    expect(isValidPaiementID('2603200001')).toBe(true)
    expect(isValidPaiementID('2601010001')).toBe(true)
    expect(isValidPaiementID('2612319999')).toBe(true)
  })

  it('rejects empty string', () => {
    expect(isValidPaiementID('')).toBe(false)
  })

  it('rejects non-10-digit strings', () => {
    expect(isValidPaiementID('260320001')).toBe(false) // 9 digits
    expect(isValidPaiementID('26032000011')).toBe(false) // 11 digits
  })

  it('rejects invalid month', () => {
    expect(isValidPaiementID('2600200001')).toBe(false) // month 00
    expect(isValidPaiementID('2613200001')).toBe(false) // month 13
  })

  it('rejects invalid day', () => {
    expect(isValidPaiementID('2603000001')).toBe(false) // day 00
    expect(isValidPaiementID('2603320001')).toBe(false) // day 32
  })

  it('rejects non-numeric characters', () => {
    expect(isValidPaiementID('26032a0001')).toBe(false)
  })
})

describe('generatePaiementID', () => {
  it('generates ID with correct date prefix', () => {
    const id = generatePaiementID([], '2026-03-20')
    expect(id).toBe('2603200001')
  })

  it('starts sequence at 0001', () => {
    const id = generatePaiementID([], '2026-03-20')
    expect(id.substring(6)).toBe('0001')
  })

  it('increments sequence from existing IDs', () => {
    const existing = ['2603200001', '2603200002']
    const id = generatePaiementID(existing, '2026-03-20')
    expect(id).toBe('2603200003')
  })

  it('only considers IDs for the same date', () => {
    const existing = ['2603190005', '2603200001'] // different dates
    const id = generatePaiementID(existing, '2026-03-20')
    expect(id).toBe('2603200002')
  })

  it('handles gaps in sequence', () => {
    const existing = ['2603200001', '2603200005']
    const id = generatePaiementID(existing, '2026-03-20')
    // Uses max + 1, not fills gaps
    expect(id).toBe('2603200006')
  })

  it('uses today when no date provided', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 2, 20))
    const id = generatePaiementID([])
    expect(id).toBe('2603200001')
    vi.useRealTimers()
  })

  it('handles single-digit month and day', () => {
    const id = generatePaiementID([], '2026-01-05')
    expect(id).toBe('2601050001')
  })

  it('generated ID passes isValidPaiementID', () => {
    const id = generatePaiementID([], '2026-03-20')
    expect(isValidPaiementID(id)).toBe(true)
  })
})

describe('isRequired', () => {
  it('accepts non-empty string', () => {
    expect(isRequired('hello')).toBe(true)
  })

  it('rejects empty string', () => {
    expect(isRequired('')).toBe(false)
  })

  it('rejects whitespace-only string', () => {
    expect(isRequired('   ')).toBe(false)
    expect(isRequired('\t\n')).toBe(false)
  })
})

describe('hasMinLength', () => {
  it('accepts string at minimum length', () => {
    expect(hasMinLength('abc', 3)).toBe(true)
  })

  it('accepts string above minimum', () => {
    expect(hasMinLength('abcdef', 3)).toBe(true)
  })

  it('rejects string below minimum', () => {
    expect(hasMinLength('ab', 3)).toBe(false)
  })

  it('rejects empty string', () => {
    expect(hasMinLength('', 1)).toBe(false)
  })
})

describe('hasMaxLength', () => {
  it('accepts string at maximum length', () => {
    expect(hasMaxLength('abc', 3)).toBe(true)
  })

  it('accepts string below maximum', () => {
    expect(hasMaxLength('ab', 3)).toBe(true)
  })

  it('rejects string above maximum', () => {
    expect(hasMaxLength('abcd', 3)).toBe(false)
  })

  it('accepts empty string', () => {
    expect(hasMaxLength('', 3)).toBe(true)
  })

  it('accepts undefined/empty (no value means no violation)', () => {
    expect(hasMaxLength('', 0)).toBe(true)
  })
})
