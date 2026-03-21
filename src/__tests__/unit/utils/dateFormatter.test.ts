import { describe, it, expect, vi } from 'vitest'
import {
  formatDateForDisplay,
  formatDateForStorage,
  getTodayISO,
  getTodayDisplay,
  parseISODate,
  getYearFromISO,
  getMonthFromISO,
  isValidISODate,
  formatDateForInput,
} from '@/utils/dateFormatter'

describe('formatDateForDisplay', () => {
  it('converts ISO date to French display format', () => {
    expect(formatDateForDisplay('2026-03-20')).toBe('20/03/2026')
  })

  it('handles single-digit day and month', () => {
    expect(formatDateForDisplay('2026-01-05')).toBe('05/01/2026')
  })

  it('returns empty string for empty input', () => {
    expect(formatDateForDisplay('')).toBe('')
  })

  it('handles end-of-year date', () => {
    expect(formatDateForDisplay('2026-12-31')).toBe('31/12/2026')
  })

  it('handles start-of-year date', () => {
    expect(formatDateForDisplay('2026-01-01')).toBe('01/01/2026')
  })
})

describe('formatDateForStorage', () => {
  it('converts French display format to ISO', () => {
    expect(formatDateForStorage('20/03/2026')).toBe('2026-03-20')
  })

  it('pads single-digit day and month', () => {
    expect(formatDateForStorage('5/1/2026')).toBe('2026-01-05')
  })

  it('returns empty string for empty input', () => {
    expect(formatDateForStorage('')).toBe('')
  })

  it('roundtrips with formatDateForDisplay', () => {
    const iso = '2026-07-14'
    expect(formatDateForStorage(formatDateForDisplay(iso))).toBe(iso)
  })
})

describe('getTodayISO', () => {
  it('returns today in YYYY-MM-DD format', () => {
    const result = getTodayISO()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('returns the correct date', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 2, 20)) // March 20, 2026
    expect(getTodayISO()).toBe('2026-03-20')
    vi.useRealTimers()
  })
})

describe('getTodayDisplay', () => {
  it('returns today in DD/MM/YYYY format', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 2, 20))
    expect(getTodayDisplay()).toBe('20/03/2026')
    vi.useRealTimers()
  })
})

describe('parseISODate', () => {
  it('parses a valid ISO date string', () => {
    const result = parseISODate('2026-03-20')
    expect(result).toBeInstanceOf(Date)
    expect(result!.getFullYear()).toBe(2026)
    expect(result!.getMonth()).toBe(2) // 0-indexed
    expect(result!.getDate()).toBe(20)
  })

  it('returns null for empty string', () => {
    expect(parseISODate('')).toBeNull()
  })

  it('returns null for invalid date string', () => {
    expect(parseISODate('not-a-date')).toBeNull()
  })

  it('parses leap year date', () => {
    const result = parseISODate('2024-02-29')
    expect(result).toBeInstanceOf(Date)
    expect(result!.getDate()).toBe(29)
  })
})

describe('getYearFromISO', () => {
  it('extracts year from ISO date', () => {
    expect(getYearFromISO('2026-03-20')).toBe(2026)
  })

  it('returns null for empty string', () => {
    expect(getYearFromISO('')).toBeNull()
  })

  it('returns null for non-numeric year', () => {
    expect(getYearFromISO('abcd-03-20')).toBeNull()
  })

  it('handles different years', () => {
    expect(getYearFromISO('1999-12-31')).toBe(1999)
    expect(getYearFromISO('2030-01-01')).toBe(2030)
  })
})

describe('getMonthFromISO', () => {
  it('extracts month from ISO date (1-based)', () => {
    expect(getMonthFromISO('2026-03-20')).toBe(3)
  })

  it('returns January as 1', () => {
    expect(getMonthFromISO('2026-01-15')).toBe(1)
  })

  it('returns December as 12', () => {
    expect(getMonthFromISO('2026-12-25')).toBe(12)
  })

  it('returns null for empty string', () => {
    expect(getMonthFromISO('')).toBeNull()
  })

  it('returns null for non-numeric month', () => {
    expect(getMonthFromISO('2026-xx-20')).toBeNull()
  })
})

describe('isValidISODate', () => {
  it('accepts valid ISO dates', () => {
    expect(isValidISODate('2026-03-20')).toBe(true)
    expect(isValidISODate('2024-02-29')).toBe(true) // leap year
    expect(isValidISODate('2000-01-01')).toBe(true)
  })

  it('rejects empty string', () => {
    expect(isValidISODate('')).toBe(false)
  })

  it('rejects non-date strings', () => {
    expect(isValidISODate('not-a-date')).toBe(false)
    expect(isValidISODate('hello')).toBe(false)
  })
})

describe('formatDateForInput', () => {
  it('returns string input as-is', () => {
    expect(formatDateForInput('2026-03-20')).toBe('2026-03-20')
  })

  it('formats Date object to YYYY-MM-DD', () => {
    const date = new Date(2026, 2, 20) // March 20, 2026
    expect(formatDateForInput(date)).toBe('2026-03-20')
  })

  it('pads single-digit month and day from Date', () => {
    const date = new Date(2026, 0, 5) // January 5, 2026
    expect(formatDateForInput(date)).toBe('2026-01-05')
  })
})
