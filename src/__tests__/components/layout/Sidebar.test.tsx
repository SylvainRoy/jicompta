import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'

function renderSidebar(onNavigate?: () => void) {
  return render(
    <MemoryRouter>
      <Sidebar onNavigate={onNavigate} />
    </MemoryRouter>
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Sidebar', () => {
  const navLinks = [
    { label: 'Tableau de bord', href: '/dashboard' },
    { label: 'Prestations', href: '/prestations' },
    { label: 'Paiements', href: '/paiements' },
    { label: 'Dépenses', href: '/depenses' },
    { label: 'Clients', href: '/clients' },
    { label: 'Types de Prestations', href: '/types-prestation' },
  ]

  it('renders all navigation links', () => {
    renderSidebar()

    for (const { label } of navLinks) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('renders settings link "Paramètres"', () => {
    renderSidebar()
    expect(screen.getByText('Paramètres')).toBeInTheDocument()
  })

  it('navigation links have correct href paths', () => {
    renderSidebar()

    for (const { label, href } of navLinks) {
      const link = screen.getByText(label).closest('a')!
      expect(link).toHaveAttribute('href', href)
    }
  })

  it('settings link has correct href path', () => {
    renderSidebar()
    const link = screen.getByText('Paramètres').closest('a')!
    expect(link).toHaveAttribute('href', '/settings')
  })

  it('calls onNavigate when a navigation link is clicked', async () => {
    const onNavigate = vi.fn()
    const user = userEvent.setup()
    renderSidebar(onNavigate)

    await user.click(screen.getByText('Prestations'))
    expect(onNavigate).toHaveBeenCalledTimes(1)
  })

  it('calls onNavigate when settings link is clicked', async () => {
    const onNavigate = vi.fn()
    const user = userEvent.setup()
    renderSidebar(onNavigate)

    await user.click(screen.getByText('Paramètres'))
    expect(onNavigate).toHaveBeenCalledTimes(1)
  })
})
