import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import React from 'react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import * as authService from '@/services/googleAuth'

vi.mock('@/services/googleAuth')

const mockAuthService = vi.mocked(authService)

const mockUser = {
  email: 'test@example.com',
  name: 'Test User',
  picture: 'https://example.com/photo.jpg',
  accessToken: 'mock-token-123',
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws when used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const onError = (e: Event) => e.preventDefault()
    window.addEventListener('error', onError)
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within an AuthProvider'
    )
    window.removeEventListener('error', onError)
    spy.mockRestore()
  })

  it('resolves to unauthenticated when no stored data', async () => {
    mockAuthService.loadAuthData.mockReturnValue(null)
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('authenticates from stored data with valid token', async () => {
    mockAuthService.loadAuthData.mockReturnValue(mockUser)
    mockAuthService.validateToken.mockResolvedValue(true)
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toEqual(mockUser)
  })

  it('clears auth data when stored token is invalid', async () => {
    mockAuthService.loadAuthData.mockReturnValue(mockUser)
    mockAuthService.validateToken.mockResolvedValue(false)
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(mockAuthService.clearAuthData).toHaveBeenCalled()
  })

  it('handles initialization error gracefully', async () => {
    mockAuthService.loadAuthData.mockReturnValue(mockUser)
    mockAuthService.validateToken.mockRejectedValue(new Error('Network error'))
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.error).toBe('Failed to initialize authentication')
    spy.mockRestore()
  })

  it('handleGoogleSuccess authenticates with valid token', async () => {
    mockAuthService.loadAuthData.mockReturnValue(null)
    mockAuthService.getUserInfo.mockResolvedValue(mockUser)
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let success: boolean = false
    await act(async () => {
      success = await result.current.handleGoogleSuccess('new-token')
    })
    expect(success).toBe(true)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toEqual(mockUser)
    expect(mockAuthService.saveAuthData).toHaveBeenCalledWith(mockUser)
  })

  it('handleGoogleSuccess fails when getUserInfo returns null', async () => {
    mockAuthService.loadAuthData.mockReturnValue(null)
    mockAuthService.getUserInfo.mockResolvedValue(null)
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let success: boolean = true
    await act(async () => {
      success = await result.current.handleGoogleSuccess('bad-token')
    })
    expect(success).toBe(false)
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.error).toBe('Failed to fetch user information')
  })

  it('handleGoogleSuccess handles thrown error', async () => {
    mockAuthService.loadAuthData.mockReturnValue(null)
    mockAuthService.getUserInfo.mockRejectedValue(new Error('API down'))
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let success: boolean = true
    await act(async () => {
      success = await result.current.handleGoogleSuccess('token')
    })
    expect(success).toBe(false)
    expect(result.current.error).toBe('Authentication failed')
    spy.mockRestore()
  })

  it('logout clears state and calls service logout', async () => {
    mockAuthService.loadAuthData.mockReturnValue(mockUser)
    mockAuthService.validateToken.mockResolvedValue(true)
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true))

    act(() => { result.current.logout() })
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(mockAuthService.logout).toHaveBeenCalled()
  })
})
