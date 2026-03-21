import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  parseCurrency,
  formatForInput,
  isValidCurrency,
  roundCurrency,
  calculateTotal,
} from '@/utils/currencyFormatter'

describe('formatCurrency', () => {
  it('formats a number with euro symbol', () => {
    const result = formatCurrency(1234.56)
    // French locale uses narrow no-break space (U+202F) as thousands separator
    expect(result).toMatch(/1\s?234,56 €/)
  })

  it('formats zero', () => {
    const result = formatCurrency(0)
    expect(result).toMatch(/0,00 €/)
  })

  it('formats a string number', () => {
    const result = formatCurrency('500')
    expect(result).toMatch(/500,00 €/)
  })

  it('returns 0,00 for NaN input', () => {
    expect(formatCurrency('abc')).toBe('0,00 €')
    expect(formatCurrency(NaN)).toBe('0,00 €')
  })

  it('excludes euro symbol when includeCurrency is false', () => {
    const result = formatCurrency(1234.56, false)
    expect(result).not.toContain('€')
    expect(result).toMatch(/1\s?234,56/)
  })

  it('formats negative numbers', () => {
    const result = formatCurrency(-500)
    expect(result).toContain('500,00')
  })

  it('handles large numbers', () => {
    const result = formatCurrency(1000000)
    expect(result).toMatch(/1\s?000\s?000,00 €/)
  })

  it('handles small decimals', () => {
    const result = formatCurrency(0.5)
    expect(result).toMatch(/0,50 €/)
  })
})

describe('parseCurrency', () => {
  it('parses French format with spaces and comma', () => {
    expect(parseCurrency('1 234,56')).toBe(1234.56)
  })

  it('parses French format with euro symbol', () => {
    expect(parseCurrency('1 234,56 €')).toBe(1234.56)
  })

  it('parses standard decimal format', () => {
    expect(parseCurrency('1234.56')).toBe(1234.56)
  })

  it('parses integer string', () => {
    expect(parseCurrency('500')).toBe(500)
  })

  it('returns 0 for empty string', () => {
    expect(parseCurrency('')).toBe(0)
  })

  it('returns 0 for non-numeric string', () => {
    expect(parseCurrency('abc')).toBe(0)
  })

  it('handles just euro symbol', () => {
    expect(parseCurrency('€')).toBe(0)
  })
})

describe('formatForInput', () => {
  it('formats number to 2 decimal places', () => {
    expect(formatForInput(500)).toBe('500.00')
  })

  it('formats string number', () => {
    expect(formatForInput('1234.5')).toBe('1234.50')
  })

  it('returns empty string for NaN', () => {
    expect(formatForInput('abc')).toBe('')
    expect(formatForInput(NaN)).toBe('')
  })

  it('formats zero', () => {
    expect(formatForInput(0)).toBe('0.00')
  })

  it('rounds to 2 decimal places', () => {
    expect(formatForInput(1.999)).toBe('2.00')
  })
})

describe('isValidCurrency', () => {
  it('accepts positive amounts', () => {
    expect(isValidCurrency('100')).toBe(true)
    expect(isValidCurrency('1 234,56 €')).toBe(true)
  })

  it('accepts zero', () => {
    expect(isValidCurrency('0')).toBe(true)
  })

  it('accepts empty string (parseCurrency returns 0)', () => {
    expect(isValidCurrency('')).toBe(true)
  })

  it('rejects negative amounts', () => {
    expect(isValidCurrency('-100')).toBe(false)
  })
})

describe('roundCurrency', () => {
  it('rounds to 2 decimal places', () => {
    // Note: due to IEEE 754, 1.005 * 100 = 100.49999... → rounds to 100 → 1.00
    // and 1.015 * 100 = 101.49999... → rounds to 101 → 1.01
    // This is standard Math.round behavior
    expect(roundCurrency(1.005)).toBe(1)
    expect(roundCurrency(1.015)).toBe(1.01)
    expect(roundCurrency(1.234)).toBe(1.23)
    expect(roundCurrency(1.235)).toBe(1.24)
  })

  it('keeps exact amounts unchanged', () => {
    expect(roundCurrency(100)).toBe(100)
    expect(roundCurrency(99.99)).toBe(99.99)
  })

  it('rounds 3+ decimal places', () => {
    expect(roundCurrency(1.999)).toBe(2)
  })
})

describe('calculateTotal', () => {
  it('sums an array of numbers', () => {
    expect(calculateTotal([100, 200, 300])).toBe(600)
  })

  it('sums mixed numbers and strings', () => {
    expect(calculateTotal([100, '200', 300])).toBe(600)
  })

  it('handles French formatted strings', () => {
    expect(calculateTotal(['1 234,56 €', '765,44 €'])).toBe(2000)
  })

  it('returns 0 for empty array', () => {
    expect(calculateTotal([])).toBe(0)
  })

  it('ignores NaN values', () => {
    expect(calculateTotal([100, 'abc', 200])).toBe(300)
  })

  it('rounds the result', () => {
    expect(calculateTotal([0.1, 0.2])).toBe(0.3)
  })
})
