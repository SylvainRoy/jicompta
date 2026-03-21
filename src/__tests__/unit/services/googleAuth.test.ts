import { describe, it, expect, vi, beforeEach } from 'vitest'
import { server } from '../../mocks/server'
import { http, HttpResponse } from 'msw'
import { STORAGE_KEYS } from '@/constants'
import {
  getUserInfo,
  saveAuthData,
  loadAuthData,
  clearAuthData,
  isAuthenticated,
  getAccessToken,
  logout,
  validateToken,
} from '@/services/googleAuth'

const mockUser = {
  email: 'test@example.com',
  name: 'Test User',
  picture: 'https://example.com/photo.jpg',
  accessToken: 'mock-token-123',
}

function seedAuth() {
  localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(mockUser))
  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, mockUser.accessToken)
  localStorage.setItem('jicompta_token_expires_at', String(Date.now() + 3600_000))
}

describe('googleAuth service', () => {
  beforeEach(() => {
    // localStorage is cleared globally in setup.ts afterEach
  })

  // ==================== getUserInfo ====================

  describe('getUserInfo', () => {
    it('returns AuthUser on success', async () => {
      const result = await getUserInfo('valid-token')
      expect(result).toEqual({
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/photo.jpg',
        accessToken: 'valid-token',
      })
    })

    it('returns null on API error', async () => {
      server.use(
        http.get('https://www.googleapis.com/oauth2/v2/userinfo', () => {
          return new HttpResponse(null, { status: 401 })
        })
      )
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const result = await getUserInfo('bad-token')
      expect(result).toBeNull()
      spy.mockRestore()
    })

    it('returns null on network failure', async () => {
      server.use(
        http.get('https://www.googleapis.com/oauth2/v2/userinfo', () => {
          return HttpResponse.error()
        })
      )
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const result = await getUserInfo('token')
      expect(result).toBeNull()
      spy.mockRestore()
    })
  })

  // ==================== saveAuthData ====================

  describe('saveAuthData', () => {
    it('persists user, token, and expiry to localStorage', () => {
      saveAuthData(mockUser)
      expect(localStorage.getItem(STORAGE_KEYS.AUTH_USER)).toContain('test@example.com')
      expect(localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)).toBe('mock-token-123')
      const expiresAt = Number(localStorage.getItem('jicompta_token_expires_at'))
      expect(expiresAt).toBeGreaterThan(Date.now())
    })
  })

  // ==================== loadAuthData ====================

  describe('loadAuthData', () => {
    it('returns null when nothing stored', () => {
      expect(loadAuthData()).toBeNull()
    })

    it('returns user when valid data exists', () => {
      seedAuth()
      const result = loadAuthData()
      expect(result).not.toBeNull()
      expect(result!.email).toBe('test@example.com')
      expect(result!.accessToken).toBe('mock-token-123')
    })

    it('returns null and clears when token is expired', () => {
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(mockUser))
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, mockUser.accessToken)
      localStorage.setItem('jicompta_token_expires_at', String(Date.now() - 1000))

      expect(loadAuthData()).toBeNull()
      expect(localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)).toBeNull()
    })

    it('returns null when user string is missing', () => {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'token')
      localStorage.setItem('jicompta_token_expires_at', String(Date.now() + 3600_000))
      expect(loadAuthData()).toBeNull()
    })

    it('returns null on corrupt JSON', () => {
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, '{bad')
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'token')
      localStorage.setItem('jicompta_token_expires_at', String(Date.now() + 3600_000))
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      expect(loadAuthData()).toBeNull()
      spy.mockRestore()
    })
  })

  // ==================== clearAuthData ====================

  describe('clearAuthData', () => {
    it('removes all auth keys from localStorage', () => {
      seedAuth()
      clearAuthData()
      expect(localStorage.getItem(STORAGE_KEYS.AUTH_USER)).toBeNull()
      expect(localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)).toBeNull()
      expect(localStorage.getItem('jicompta_token_expires_at')).toBeNull()
    })
  })

  // ==================== isAuthenticated ====================

  describe('isAuthenticated', () => {
    it('returns false when no auth data', () => {
      expect(isAuthenticated()).toBe(false)
    })

    it('returns true when valid auth data exists', () => {
      seedAuth()
      expect(isAuthenticated()).toBe(true)
    })
  })

  // ==================== getAccessToken ====================

  describe('getAccessToken', () => {
    it('returns null when not authenticated', () => {
      expect(getAccessToken()).toBeNull()
    })

    it('returns token when authenticated', () => {
      seedAuth()
      expect(getAccessToken()).toBe('mock-token-123')
    })
  })

  // ==================== validateToken ====================

  describe('validateToken', () => {
    it('returns true for a valid token', async () => {
      expect(await validateToken('valid-token')).toBe(true)
    })

    it('returns false for an invalid token', async () => {
      expect(await validateToken('invalid-token')).toBe(false)
    })

    it('returns false on network error', async () => {
      server.use(
        http.get('https://www.googleapis.com/oauth2/v1/tokeninfo', () => {
          return HttpResponse.error()
        })
      )
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      expect(await validateToken('token')).toBe(false)
      spy.mockRestore()
    })
  })

  // ==================== logout ====================

  describe('logout', () => {
    it('clears auth data', () => {
      seedAuth()
      logout()
      expect(localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)).toBeNull()
    })
  })
})
