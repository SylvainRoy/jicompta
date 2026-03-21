import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Header from '@/components/layout/Header'
import type { AuthUser } from '@/types'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockUseAuth = vi.hoisted(() => vi.fn())

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: mockUseAuth,
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockLogout = vi.fn()

const loggedInUser: AuthUser = {
  name: 'Jean Dupont',
  email: 'jean@example.com',
  picture: 'https://example.com/photo.jpg',
  accessToken: 'token-123',
}

function setupAuth(user: AuthUser | null = loggedInUser) {
  mockUseAuth.mockReturnValue({
    user,
    isAuthenticated: !!user,
    isLoading: false,
    error: null,
    logout: mockLogout,
    handleGoogleSuccess: vi.fn(),
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows "JiCompta" title', () => {
    setupAuth()
    render(<Header />)
    expect(screen.getByText('JiCompta')).toBeInTheDocument()
  })

  it('shows menu button when onMenuToggle is provided', () => {
    setupAuth()
    render(<Header onMenuToggle={() => {}} />)
    expect(screen.getByLabelText('Menu')).toBeInTheDocument()
  })

  it('menu button calls onMenuToggle when clicked', async () => {
    setupAuth()
    const onMenuToggle = vi.fn()
    const user = userEvent.setup()
    render(<Header onMenuToggle={onMenuToggle} />)

    await user.click(screen.getByLabelText('Menu'))
    expect(onMenuToggle).toHaveBeenCalledTimes(1)
  })

  it('does not show menu button when onMenuToggle is not provided', () => {
    setupAuth()
    render(<Header />)
    expect(screen.queryByLabelText('Menu')).not.toBeInTheDocument()
  })

  it('shows user name and email when logged in', () => {
    setupAuth()
    render(<Header />)
    expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
    expect(screen.getByText('jean@example.com')).toBeInTheDocument()
  })

  it('shows user photo when picture is available', () => {
    setupAuth()
    render(<Header />)
    const img = screen.getByAltText('Jean Dupont') as HTMLImageElement
    expect(img).toBeInTheDocument()
    expect(img.src).toBe('https://example.com/photo.jpg')
  })

  it('does not show photo when user has no picture', () => {
    const noPictureUser: AuthUser = { ...loggedInUser, picture: undefined }
    setupAuth(noPictureUser)
    render(<Header />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('Déconnexion button calls logout', async () => {
    setupAuth()
    const user = userEvent.setup()
    render(<Header />)

    await user.click(screen.getByText('Déconnexion'))
    expect(mockLogout).toHaveBeenCalledTimes(1)
  })

  it('does not show user info when user is null', () => {
    setupAuth(null)
    render(<Header />)
    expect(screen.queryByText('Jean Dupont')).not.toBeInTheDocument()
    expect(screen.queryByText('jean@example.com')).not.toBeInTheDocument()
    expect(screen.queryByText('Déconnexion')).not.toBeInTheDocument()
  })
})
